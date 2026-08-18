import assert from 'node:assert/strict';

import { assertValidPhase08Handoff, validatePhase08Handoff } from './lib/handoff-contract.mjs';

const handoff = {
  schemaVersion: 1,
  phase: '08',
  phase07ExitDecision: 'PASS',
  productionDecision: 'NO_GO',
  accepted: true,
  releaseId: 'phase-07-release-20260817',
  verifiedStagingDigest:
    'asia-southeast1-docker.pkg.dev/microlearning-platform-502716/microlearning/app@sha256:' +
    'c'.repeat(64),
  stagingDeploymentRecord: 'artifacts/phase-07/staging/deployment-record.json',
  systemTestResult: 'phase-08/system-test-result.json',
  uatSignoff: 'phase-08/uat-signoff.md',
  goNoGoDecision: 'phase-08/go-no-go.md',
  productionTerraformPlan: 'phase-08/production/terraform-plan.json',
  productionAtlasReadiness: 'phase-08/production/atlas-readiness.md',
  rollbackRevisionDigest: 'phase-07/rollback/prior-revision.json',
};

assert.doesNotThrow(() => assertValidPhase08Handoff(handoff));
assert.ok(
  validatePhase08Handoff({ ...handoff, accepted: false }).some((message) =>
    message.includes('accepted'),
  ),
);
assert.ok(
  validatePhase08Handoff({ ...handoff, productionDecision: 'GO' }).some((message) =>
    message.includes('NO_GO'),
  ),
);
assert.ok(
  validatePhase08Handoff({ ...handoff, verifiedStagingDigest: 'latest' }).some((message) =>
    message.includes('immutable'),
  ),
);

process.stdout.write(
  `${JSON.stringify({ event: 'phase-08.handoff.contract', tests_passed: 4 })}\n`,
);
