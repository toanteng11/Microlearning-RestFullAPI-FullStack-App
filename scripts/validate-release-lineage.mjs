import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { validateReleaseLineage } from './lib/cd-contract.mjs';

const [manifestPathValue, runContractPathValue, repository] = process.argv.slice(2);
if (!manifestPathValue || !runContractPathValue || !repository) {
  throw new Error(
    'Usage: node scripts/validate-release-lineage.mjs <manifest.json> <run-contract.json> <repository>',
  );
}

const manifestPath = resolve(manifestPathValue);
const runContractPath = resolve(runContractPathValue);
for (const path of [manifestPath, runContractPath]) {
  if (!existsSync(path)) throw new Error(`Required lineage file not found: ${path}`);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const runContract = JSON.parse(readFileSync(runContractPath, 'utf8'));
validateReleaseLineage(manifest, {
  repository,
  buildRunId: runContract.runId,
});

if (process.env.GITHUB_OUTPUT) {
  writeFileSync(
    process.env.GITHUB_OUTPUT,
    [
      `image_ref=${manifest.immutableImageRef}`,
      `app_version=${manifest.appVersion}`,
      `commit_sha=${manifest.commitSha}`,
      `build_time=${manifest.buildTime}`,
      `build_run_id=${manifest.provenance.buildRunId}`,
      `source_ci_run_id=${manifest.provenance.sourceRunId}`,
      '',
    ].join('\n'),
    { flag: 'a' },
  );
}

process.stdout.write(
  `${JSON.stringify({ event: 'release.lineage.validated', commitSha: manifest.commitSha, buildRunId: manifest.provenance.buildRunId })}\n`,
);
