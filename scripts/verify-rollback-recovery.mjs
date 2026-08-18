import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { validateImageReference } from './lib/release-contract.mjs';

const [serviceUrlInput, expectedImageRef, reportInput] = process.argv.slice(2);
if (!serviceUrlInput || !expectedImageRef) {
  throw new Error(
    'Usage: node scripts/verify-rollback-recovery.mjs <https-service-url> <sha256-image-ref> [report.json]',
  );
}
const serviceUrl = new URL(serviceUrlInput);
if (
  serviceUrl.protocol !== 'https:' ||
  serviceUrl.pathname !== '/' ||
  serviceUrl.search ||
  serviceUrl.hash
) {
  throw new Error('Rollback service URL must be an HTTPS origin.');
}
validateImageReference(expectedImageRef);
const expectedDigest = expectedImageRef.split('@').at(-1);
const reportPath = resolve(reportInput ?? 'artifacts/phase-07/rollback/recovery-report.json');
const checks = [];

async function request(path) {
  const response = await fetch(new URL(path, serviceUrl), {
    headers: { 'user-agent': 'microlearning-phase-07-rollback-check' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}.`);
  return response;
}

async function main() {
  const health = await request('/health');
  checks.push({ name: 'health', status: 'PASS', detail: `HTTP ${health.status}` });
  const ready = await request('/ready');
  const readyBody = await ready.json();
  if (readyBody?.success !== true) throw new Error('Rollback target is not ready.');
  checks.push({ name: 'readiness', status: 'PASS', detail: 'ready response is successful' });
  const version = await request('/api/v1/system/version');
  const versionBody = await version.json();
  if (
    versionBody?.data?.environment !== 'staging' ||
    versionBody?.data?.imageDigest !== expectedDigest
  ) {
    throw new Error('Rollback target does not expose the restored exact image digest.');
  }
  checks.push({ name: 'exact-digest', status: 'PASS', detail: expectedDigest });
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    serviceOrigin: serviceUrl.origin,
    expectedImageRef,
    status: 'PASS',
    checks,
  };
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  process.stdout.write(
    `${JSON.stringify({ event: 'staging.rollback.recovery_verified', reportPath })}\n`,
  );
}

main().catch((error) => {
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    serviceOrigin: serviceUrl.origin,
    expectedImageRef,
    status: 'FAIL',
    checks,
    error: error instanceof Error ? error.message.slice(0, 500) : 'Unknown recovery error',
  };
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  process.stderr.write(
    `${JSON.stringify({ event: 'staging.rollback.recovery_failed', reportPath })}\n`,
  );
  process.exitCode = 1;
});
