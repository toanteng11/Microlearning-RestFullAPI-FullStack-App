import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const [serviceUrlValue, appVersion, commitSha, imageRef, revision, outputPathValue] =
  process.argv.slice(2);
if (!serviceUrlValue || !appVersion || !commitSha || !imageRef || !revision || !outputPathValue) {
  throw new Error(
    'Usage: node scripts/verify-cloud-security.mjs <url> <version> <commit> <image-ref> <revision> <output>',
  );
}

const serviceUrl = new URL(serviceUrlValue);
if (serviceUrl.protocol !== 'https:' || serviceUrl.pathname !== '/') {
  throw new Error('Cloud smoke requires an HTTPS origin.');
}
const digest = imageRef.split('@').at(-1);
if (!/^sha256:[a-f0-9]{64}$/u.test(digest ?? '')) throw new Error('Cloud image digest is invalid.');
if (!/^[a-f0-9]{40}$/u.test(commitSha)) throw new Error('Cloud commit must be a full Git SHA.');

const checks = [];
function pass(name, detail) {
  checks.push({ name, status: 'PASS', detail });
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
async function request(path, options = {}) {
  return fetch(new URL(path, serviceUrl), {
    redirect: 'manual',
    signal: AbortSignal.timeout(20_000),
    ...options,
  });
}

async function expectOk(path, contentType) {
  const response = await request(path);
  assert(response.status === 200, `${path} returned ${response.status}.`);
  assert(
    (response.headers.get('content-type') ?? '').includes(contentType),
    `${path} content type is invalid.`,
  );
  return response;
}

async function main() {
  const health = await expectOk('/health', 'application/json');
  await expectOk('/ready', 'application/json');
  pass('health-readiness', 'health and readiness returned HTTP 200');

  for (const [name, header] of [
    ['hsts', 'strict-transport-security'],
    ['content-security-policy', 'content-security-policy'],
    ['nosniff', 'x-content-type-options'],
    ['referrer-policy', 'referrer-policy'],
  ]) {
    assert(health.headers.has(header), `${header} is missing.`);
    pass(name, `${header} present`);
  }

  const versionResponse = await expectOk('/api/v1/system/version', 'application/json');
  const version = (await versionResponse.json())?.data;
  assert(version?.version === appVersion, 'Cloud app version does not match release manifest.');
  assert(version?.commitSha === commitSha, 'Cloud commit does not match release manifest.');
  assert(version?.imageDigest === digest, 'Cloud digest does not match release manifest.');
  assert(version?.environment === 'staging', 'Cloud environment must be staging.');
  pass('release-identity', 'version, commit, digest and environment match');

  for (const path of ['/', '/login', '/student/todo', '/teacher/dashboard', '/admin/dashboard']) {
    await expectOk(path, 'text/html');
  }
  pass('spa-routing', 'root and protected deep links return the React shell');

  await expectOk('/api-docs/', 'text/html');
  const openApi = await (await expectOk('/api/v1/openapi.json', 'application/json')).json();
  assert(openApi?.openapi === '3.0.3' && openApi?.paths, 'OpenAPI contract is incomplete.');
  pass('swagger-openapi', 'Swagger and OpenAPI are same-origin and complete');

  const unknownApi = await request('/api/v1/phase-07-cloud-unknown');
  assert(unknownApi.status === 404, 'Unknown API route must return 404.');
  assert(
    (unknownApi.headers.get('content-type') ?? '').includes('application/json'),
    'Unknown API route must return JSON.',
  );
  const missingAsset = await request('/assets/phase-07-missing.js');
  assert(missingAsset.status === 404, 'Missing asset must return 404 instead of SPA HTML.');
  pass('not-found-routing', 'API and asset 404 contracts pass');

  const allowedOrigin = await request('/health', {
    headers: { Origin: serviceUrl.origin },
  });
  assert(
    allowedOrigin.headers.get('access-control-allow-origin') === serviceUrl.origin,
    'Allowed CORS origin was not echoed exactly.',
  );
  assert(
    allowedOrigin.headers.get('access-control-allow-credentials') === 'true',
    'Credentialed CORS header is missing.',
  );
  const deniedOrigin = await request('/health', {
    headers: { Origin: 'https://untrusted.example.test' },
  });
  assert(
    !deniedOrigin.headers.has('access-control-allow-origin'),
    'Untrusted CORS origin allowed.',
  );
  pass('cors', 'exact origin allowed and untrusted origin omitted');

  const rateProbe = await request('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', Origin: serviceUrl.origin },
    body: JSON.stringify({
      email: `phase07-rate-probe-${Date.now()}@example.test`,
      password: 'Cloud-Probe-Password-Not-A-Secret-123!',
    }),
  });
  assert([401, 429].includes(rateProbe.status), 'Rate-limit probe returned an unexpected status.');
  assert(
    rateProbe.headers.has('ratelimit') || rateProbe.headers.has('ratelimit-policy'),
    'Standard rate-limit headers are missing behind the Cloud proxy.',
  );
  assert(!rateProbe.headers.has('x-powered-by'), 'x-powered-by must remain disabled.');
  pass('proxy-rate-limit', 'standard rate-limit headers survive the trusted proxy path');

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    serviceUrl: serviceUrl.origin,
    appVersion,
    commitSha,
    imageRef,
    revision,
    status: 'PASS',
    checks,
  };
  const outputPath = resolve(outputPathValue);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(
    `${JSON.stringify({ event: 'cloud.security_smoke.passed', revision, checks: checks.length })}\n`,
  );
}

await main();
