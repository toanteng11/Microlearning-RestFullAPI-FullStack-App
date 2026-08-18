import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { validateDeploymentRecord } from './lib/cd-contract.mjs';

const [recordPathValue, runContractPathValue, repository] = process.argv.slice(2);
if (!recordPathValue || !runContractPathValue || !repository) {
  throw new Error(
    'Usage: node scripts/validate-deployment-record.mjs <record.json> <run-contract.json> <repository>',
  );
}
const recordPath = resolve(recordPathValue);
const runContractPath = resolve(runContractPathValue);
for (const path of [recordPath, runContractPath]) {
  if (!existsSync(path)) throw new Error(`Deployment lineage file not found: ${path}`);
}
const record = JSON.parse(readFileSync(recordPath, 'utf8'));
const runContract = JSON.parse(readFileSync(runContractPath, 'utf8'));
validateDeploymentRecord(record, {
  repository,
  deploymentRunId: runContract.runId,
  expectedDecision: 'CANDIDATE',
});

if (process.env.GITHUB_OUTPUT) {
  writeFileSync(
    process.env.GITHUB_OUTPUT,
    [
      `service_url=${record.serviceUrl}`,
      `app_version=${record.appVersion}`,
      `commit_sha=${record.commitSha}`,
      `image_ref=${record.imageRef}`,
      `revision=${record.revision}`,
      `deployment_run_id=${record.deploymentWorkflowRunId}`,
      '',
    ].join('\n'),
    { flag: 'a' },
  );
}
process.stdout.write(
  `${JSON.stringify({ event: 'staging.deployment.lineage_validated', revision: record.revision })}\n`,
);
