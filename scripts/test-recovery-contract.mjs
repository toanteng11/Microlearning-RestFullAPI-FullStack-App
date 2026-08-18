import assert from 'node:assert/strict';

import { assertValidRollbackRecord, validateRollbackRecord } from './lib/recovery-contract.mjs';

const repository = 'toanteng11/Microlearning-RestFullAPI-FullStack-App';
const image = (hex) =>
  `asia-southeast1-docker.pkg.dev/microlearning-platform-502716/microlearning/microlearning-app@sha256:${hex.repeat(64)}`;
const valid = {
  schemaVersion: 1,
  kind: 'STAGING_ROLLBACK_INCIDENT',
  environment: 'staging',
  repository,
  serviceName: 'microlearning-staging',
  serviceUrl: 'https://microlearning-staging-abc.a.run.app',
  incidentId: 'p07-incident-contract-test',
  workflowRunId: '12345',
  detectedAt: '2026-08-17T00:00:00.000Z',
  decidedAt: '2026-08-17T00:00:10.000Z',
  recoveredAt: '2026-08-17T00:01:10.000Z',
  metrics: { detectionSeconds: 10, decisionSeconds: 5, recoverySeconds: 60 },
  decision: 'ROLLED_BACK',
  reason: 'synthetic contract rehearsal',
  dataMode: 'SYNTHETIC_ONLY',
  failed: { revision: 'microlearning-staging-00002-bad', imageRef: image('a') },
  restored: { revision: 'microlearning-staging-00001-good', imageRef: image('b') },
  evidence: {
    recoveryReport: 'recovery-report.json',
    trafficReport: 'traffic-report.json',
    driftCheck: 'drift-report.json',
  },
  nextAction: 'NORMAL_PIPELINE_RESTORE_AFTER_FIX',
};

assert.doesNotThrow(() => assertValidRollbackRecord(valid, { repository }));
const sameRevision = { ...valid, restored: { ...valid.restored, revision: valid.failed.revision } };
assert.ok(
  validateRollbackRecord(sameRevision, { repository }).some((error) =>
    error.includes('revisions must differ'),
  ),
);
const mutableImage = {
  ...valid,
  failed: {
    ...valid.failed,
    imageRef:
      'asia-southeast1-docker.pkg.dev/microlearning-platform-502716/microlearning/microlearning-app:latest',
  },
};
assert.ok(
  validateRollbackRecord(mutableImage, { repository }).some((error) => error.includes('imageRef')),
);
const productionRecord = { ...valid, environment: 'production' };
assert.ok(
  validateRollbackRecord(productionRecord, { repository }).some((error) =>
    error.includes('environment'),
  ),
);
process.stdout.write(`${JSON.stringify({ event: 'recovery.contract.tests_passed', cases: 4 })}\n`);
