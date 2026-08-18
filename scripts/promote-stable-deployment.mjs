import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { sha256File, validateDeploymentRecord } from './lib/cd-contract.mjs';

const [candidatePathValue, cloudReportPathValue, roleReportPathValue, outputPathValue] =
  process.argv.slice(2);
if (!candidatePathValue || !cloudReportPathValue || !roleReportPathValue || !outputPathValue) {
  throw new Error(
    'Usage: node scripts/promote-stable-deployment.mjs <candidate.json> <cloud-report.json> <role-report.json> <output.json>',
  );
}

const repository = process.env.GITHUB_REPOSITORY;
if (!repository) throw new Error('GITHUB_REPOSITORY is required.');
const candidatePath = resolve(candidatePathValue);
const cloudReportPath = resolve(cloudReportPathValue);
const roleReportPath = resolve(roleReportPathValue);
for (const path of [candidatePath, cloudReportPath, roleReportPath]) {
  if (!existsSync(path)) throw new Error(`Stable promotion evidence not found: ${path}`);
}

const candidate = JSON.parse(readFileSync(candidatePath, 'utf8'));
validateDeploymentRecord(candidate, {
  repository,
  expectedDecision: 'CANDIDATE',
});
const cloudReport = JSON.parse(readFileSync(cloudReportPath, 'utf8'));
if (
  cloudReport.status !== 'PASS' ||
  cloudReport.commitSha !== candidate.commitSha ||
  cloudReport.revision !== candidate.revision ||
  cloudReport.imageRef !== candidate.imageRef
) {
  throw new Error('Cloud report does not prove the exact candidate deployment.');
}
const roleReport = JSON.parse(readFileSync(roleReportPath, 'utf8'));
if (
  roleReport.status !== 'PASS' ||
  roleReport.commitSha !== candidate.commitSha ||
  roleReport.revision !== candidate.revision ||
  roleReport.imageRef !== candidate.imageRef ||
  !['STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN'].every((role) => roleReport.roles?.includes(role))
) {
  throw new Error('Four-role E2E report does not prove the exact candidate deployment.');
}

const stableRecord = {
  ...candidate,
  stableAt: new Date().toISOString(),
  cloudE2EWorkflowRunId: String(process.env.GITHUB_RUN_ID ?? ''),
  cloudE2EWorkflowUrl: `${process.env.GITHUB_SERVER_URL}/${repository}/actions/runs/${process.env.GITHUB_RUN_ID}`,
  evidence: {
    ...candidate.evidence,
    cloudReport: 'artifacts/phase-07/cloud-e2e/cloud-security-report.json',
    cloudReportSha256: sha256File(cloudReportPath),
    roleReport: 'artifacts/phase-07/cloud-e2e/cloud-role-report.json',
    roleReportSha256: sha256File(roleReportPath),
  },
  status: 'STABLE',
  stable: true,
  decision: 'PASS',
};
validateDeploymentRecord(stableRecord, {
  repository,
  expectedCommit: candidate.commitSha,
  expectedDecision: 'PASS',
});

const outputPath = resolve(outputPathValue);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(stableRecord, null, 2)}\n`);
process.stdout.write(
  `${JSON.stringify({ event: 'staging.deployment.marked_stable', revision: candidate.revision })}\n`,
);
