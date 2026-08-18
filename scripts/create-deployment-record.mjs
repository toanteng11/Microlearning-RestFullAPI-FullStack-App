import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import {
  sha256File,
  validateDeploymentRecord,
  validateReleaseLineage,
} from './lib/cd-contract.mjs';

const [
  manifestPathValue,
  serviceUrl,
  revision,
  seedJob,
  previousRevision,
  previousImage,
  outputPathValue,
] = process.argv.slice(2);
if (!manifestPathValue || !serviceUrl || !revision || !seedJob || !outputPathValue) {
  throw new Error(
    'Usage: node scripts/create-deployment-record.mjs <manifest> <service-url> <revision> <seed-job> <previous-revision-or-none> <previous-image-or-none> <output>',
  );
}

const repository = process.env.GITHUB_REPOSITORY;
const deploymentRunId = process.env.GITHUB_RUN_ID;
if (!repository || !deploymentRunId) throw new Error('GitHub deployment metadata is required.');

const manifestPath = resolve(manifestPathValue);
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
validateReleaseLineage(manifest, { repository });

const secretVersions = {
  mongodbUri: process.env.TF_VAR_mongodb_uri_secret_version,
  accessToken: process.env.TF_VAR_access_token_secret_version,
  authIdentityPepper: process.env.TF_VAR_auth_identity_pepper_secret_version,
  classroomCodePepper: process.env.TF_VAR_classroom_code_pepper_secret_version,
  seedDemoPassword: process.env.TF_VAR_seed_demo_password_secret_version,
};
for (const [name, version] of Object.entries(secretVersions)) {
  if (!/^[1-9][0-9]*$/u.test(version ?? '')) {
    throw new Error(`Secret metadata ${name} must be an exact numeric version.`);
  }
}

const smokePath = resolve('artifacts/phase-07/staging/deployment-smoke.json');
const policyPath = resolve('artifacts/phase-07/terraform/staging-deploy-plan-policy.json');
for (const path of [smokePath, policyPath]) {
  if (!existsSync(path)) throw new Error(`Deployment evidence not found: ${path}`);
}

const record = {
  schemaVersion: 1,
  environment: 'staging',
  repository,
  deployedAt: new Date().toISOString(),
  commitSha: manifest.commitSha,
  imageRef: manifest.immutableImageRef,
  appVersion: manifest.appVersion,
  buildTime: manifest.buildTime,
  serviceUrl,
  revision,
  seedJob,
  sourceBuildRunId: manifest.provenance.buildRunId,
  deploymentWorkflowRunId: String(deploymentRunId),
  deploymentWorkflowUrl: `${process.env.GITHUB_SERVER_URL}/${repository}/actions/runs/${deploymentRunId}`,
  secretVersions,
  previousStable: {
    revision: previousRevision && previousRevision !== 'none' ? previousRevision : null,
    imageRef: previousImage && previousImage !== 'none' ? previousImage : null,
  },
  evidence: {
    smokeReport: 'artifacts/phase-07/staging/deployment-smoke.json',
    smokeReportSha256: sha256File(smokePath),
    terraformPolicy: 'artifacts/phase-07/terraform/staging-deploy-plan-policy.json',
    terraformPolicySha256: sha256File(policyPath),
  },
  releaseManifest: manifest,
  status: 'DEPLOYED_PENDING_CLOUD_E2E',
  stable: false,
  decision: 'CANDIDATE',
};
validateDeploymentRecord(record, {
  repository,
  deploymentRunId,
  expectedCommit: manifest.commitSha,
  expectedDecision: 'CANDIDATE',
});

const outputPath = resolve(outputPathValue);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(record, null, 2)}\n`);
process.stdout.write(
  `${JSON.stringify({ event: 'staging.deployment.candidate_recorded', revision, commitSha: manifest.commitSha })}\n`,
);
