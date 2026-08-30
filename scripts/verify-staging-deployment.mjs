import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const [serviceUrlInput, expectedVersion, expectedCommit, expectedImageInput, reportInput] =
  process.argv.slice(2);
if (!serviceUrlInput || !expectedVersion || !expectedCommit || !expectedImageInput) {
  throw new Error(
    'Usage: node scripts/verify-staging-deployment.mjs <https-url> <version> <40-char-sha> <sha256:digest> [report.json]',
  );
}

const serviceUrl = new URL(serviceUrlInput);
const expectedDigest = expectedImageInput.includes('@')
  ? expectedImageInput.split('@').at(-1)
  : expectedImageInput;
if (
  serviceUrl.protocol !== 'https:' ||
  serviceUrl.pathname !== '/' ||
  serviceUrl.search ||
  serviceUrl.hash
) {
  throw new Error('Staging service URL must be an HTTPS origin.');
}
if (!/^[a-f0-9]{40}$/u.test(expectedCommit))
  throw new Error('Expected commit must be a full Git SHA.');
if (!/^sha256:[a-f0-9]{64}$/u.test(expectedDigest)) throw new Error('Expected digest is invalid.');

const reportPath = resolve(reportInput ?? 'artifacts/phase-07/staging/first-deploy-smoke.json');
const checks = [];

function record(name, status, detail) {
  checks.push({ name, status, detail });
}

async function request(path, expectedContentType) {
  const response = await fetch(new URL(path, serviceUrl), {
    redirect: 'follow',
    headers: { 'user-agent': 'microlearning-phase-07-smoke' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  const contentType = response.headers.get('content-type') ?? '';
  if (expectedContentType && !contentType.includes(expectedContentType)) {
    throw new Error(`${path} returned unexpected content type ${contentType}`);
  }
  return response;
}

async function waitUntilReady() {
  let lastError = 'not attempted';
  for (let attempt = 1; attempt <= 24; attempt += 1) {
    try {
      const response = await request('/ready', 'application/json');
      const body = await response.json();
      if (body?.success === true) {
        record('readiness', 'PASS', `ready on attempt ${attempt}`);
        return;
      }
      lastError = 'readiness response was not successful';
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'unknown readiness error';
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 5_000));
  }
  throw new Error(`Staging did not become ready: ${lastError}`);
}

async function main() {
  await waitUntilReady();

  await request('/health', 'application/json');
  record('liveness', 'PASS', '/health returned 200');

  let versionMatched = false;
  let versionError = 'not attempted';
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    try {
      const versionResponse = await request('/api/v1/system/version', 'application/json');
      const versionBody = await versionResponse.json();
      const actual = versionBody?.data;
      if (
        actual?.version === expectedVersion &&
        actual?.commitSha === expectedCommit &&
        actual?.imageDigest === expectedDigest &&
        actual?.environment === 'staging'
      ) {
        versionMatched = true;
        break;
      }
      versionError = `Mismatched identity on attempt ${attempt}. Expected ${expectedCommit}, got ${actual?.commitSha}`;
    } catch (error) {
      versionError = error.message;
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  if (!versionMatched) {
    throw new Error(`Version endpoint does not match the approved release identity: ${versionError}`);
  }
  record('release-identity', 'PASS', 'version, commit, digest and environment match');

  await request('/', 'text/html');
  await request('/login', 'text/html');
  record('single-origin-web', 'PASS', 'root and SPA deep link return HTML');

  await request('/api-docs/', 'text/html');
  const openApiResponse = await request('/api/v1/openapi.json', 'application/json');
  const openApi = await openApiResponse.json();
  if (!openApi?.openapi || !openApi?.paths) throw new Error('OpenAPI document is incomplete.');
  record('api-documentation', 'PASS', 'Swagger UI and OpenAPI JSON are reachable');

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    serviceOrigin: serviceUrl.origin,
    expectedRelease: {
      version: expectedVersion,
      commitSha: expectedCommit,
      imageDigest: expectedDigest,
    },
    status: 'PASS',
    checks,
  };
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ event: 'staging.smoke.passed', reportPath })}\n`);
}

main().catch((error) => {
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    serviceOrigin: serviceUrl.origin,
    status: 'FAIL',
    checks,
    error: error instanceof Error ? error.message.slice(0, 500) : 'Unknown smoke error',
  };
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stderr.write(`${JSON.stringify({ event: 'staging.smoke.failed', reportPath })}\n`);
  process.exitCode = 1;
});
