import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { readJson } from './lib/phase-08-cli.mjs';
import { buildPhase08IdentityReport, releaseIdentityFrom } from './lib/phase-08-system-test.mjs';

const [identityPath, providerPath, outputPathValue] = process.argv.slice(2);
if (!identityPath || !providerPath || !outputPathValue) {
  throw new Error(
    'Usage: node scripts/verify-phase-08-staging-identity.mjs <identity.json> <provider.json> <output.json>',
  );
}

const { value: identityRecord } = readJson(identityPath, 'Phase 08 release identity');
const { value: provider } = readJson(providerPath, 'Cloud Run provider observation');
const identity = releaseIdentityFrom(identityRecord);
const actor = process.env.PHASE08_ACTOR ?? 'Phase 08 System Test workflow';

async function expectJson(path) {
  const response = await fetch(new URL(path, identity.stagingUrl), {
    redirect: 'manual',
    signal: AbortSignal.timeout(20_000),
  });
  if (response.status !== 200) throw new Error(`${path} returned HTTP ${response.status}.`);
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error(`${path} did not return application/json.`);
  }
  return response.json();
}

await expectJson('/health');
await expectJson('/ready');
const version = (await expectJson('/api/v1/system/version'))?.data;
const openApi = await expectJson('/api/v1/openapi.json');
if (openApi?.openapi !== '3.0.3' || !openApi?.paths) {
  throw new Error('Staging OpenAPI contract is missing or invalid.');
}

const report = buildPhase08IdentityReport({
  releaseIdentity: identityRecord,
  provider,
  runtimeVersion: version,
  observedAtUtc: new Date().toISOString(),
  actor,
  sources: {
    provider: 'gcloud run services describe',
    runtime: '/api/v1/system/version',
    health: '/health and /ready',
    openApi: '/api/v1/openapi.json',
  },
});
const outputPath = resolve(outputPathValue);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
process.stdout.write(
  `${JSON.stringify({ event: 'phase-08.staging_identity.verified', releaseId: identity.releaseId })}\n`,
);
