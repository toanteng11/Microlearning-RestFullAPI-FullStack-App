import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { assertValidRollbackRecord } from './lib/recovery-contract.mjs';

const [
  serviceName,
  serviceUrl,
  failedRevision,
  failedImageRef,
  restoredRevision,
  restoredImageRef,
  reason,
  output,
] = process.argv.slice(2);
if (
  !serviceName ||
  !serviceUrl ||
  !failedRevision ||
  !failedImageRef ||
  !restoredRevision ||
  !restoredImageRef ||
  !reason ||
  !output
) {
  throw new Error(
    'Usage: node scripts/create-rollback-record.mjs <service-name> <https-service-url> <failed-revision> <failed-image-ref> <restored-revision> <restored-image-ref> <reason> <output>',
  );
}

const repository = process.env.GITHUB_REPOSITORY;
const workflowRunId = process.env.GITHUB_RUN_ID;
const incidentId = process.env.ROLLBACK_INCIDENT_ID;
if (!repository || !workflowRunId || !incidentId) {
  throw new Error('GITHUB_REPOSITORY, GITHUB_RUN_ID and ROLLBACK_INCIDENT_ID are required.');
}

const now = new Date();
const detectedAt = process.env.ROLLBACK_DETECTED_AT ?? now.toISOString();
const decidedAt = process.env.ROLLBACK_DECIDED_AT ?? now.toISOString();
const recoveredAt = process.env.ROLLBACK_RECOVERED_AT ?? now.toISOString();
const numberFromEnv = (name) => {
  const value = Number(process.env[name] ?? '0');
  if (!Number.isFinite(value) || value < 0)
    throw new Error(`${name} must be a non-negative number.`);
  return value;
};

const record = {
  schemaVersion: 1,
  kind: 'STAGING_ROLLBACK_INCIDENT',
  environment: 'staging',
  repository,
  serviceName,
  serviceUrl,
  incidentId,
  workflowRunId: String(workflowRunId),
  workflowRunUrl: `${process.env.GITHUB_SERVER_URL ?? 'https://github.com'}/${repository}/actions/runs/${workflowRunId}`,
  detectedAt,
  decidedAt,
  recoveredAt,
  metrics: {
    detectionSeconds: numberFromEnv('ROLLBACK_DETECTION_SECONDS'),
    decisionSeconds: numberFromEnv('ROLLBACK_DECISION_SECONDS'),
    recoverySeconds: numberFromEnv('ROLLBACK_RECOVERY_SECONDS'),
  },
  decision: 'ROLLED_BACK',
  reason,
  dataMode: 'SYNTHETIC_ONLY',
  failed: { revision: failedRevision, imageRef: failedImageRef },
  restored: { revision: restoredRevision, imageRef: restoredImageRef },
  evidence: {
    recoveryReport:
      process.env.ROLLBACK_RECOVERY_REPORT ?? 'artifacts/phase-07/rollback/recovery-report.json',
    trafficReport:
      process.env.ROLLBACK_TRAFFIC_REPORT ?? 'artifacts/phase-07/rollback/traffic-report.json',
    driftCheck: process.env.ROLLBACK_DRIFT_REPORT ?? 'PENDING_MANUAL_TERRAFORM_DRIFT_CHECK',
  },
  correctiveAction:
    'Investigate the failed release, then restore the intended revision only through the normal protected pipeline.',
  nextAction: 'NORMAL_PIPELINE_RESTORE_AFTER_FIX',
  status: 'RECOVERED_PENDING_REVIEW',
};

assertValidRollbackRecord(record, { repository });
const outputPath = resolve(output);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
process.stdout.write(
  `${JSON.stringify({ event: 'staging.rollback.recorded', incidentId, restoredRevision })}\n`,
);
