import assert from 'node:assert/strict';

import { validateProductionPromotionInput } from './lib/promotion-contract.mjs';

const repository = 'toanteng11/Microlearning-RestFullAPI-FullStack-App';
const image = `asia-southeast1-docker.pkg.dev/microlearning-platform-502716/microlearning/microlearning-app@sha256:${'a'.repeat(64)}`;
const stableRecord = {
  environment: 'staging',
  repository,
  decision: 'PASS',
  stable: true,
  status: 'STABLE',
  commitSha: 'a'.repeat(40),
  imageRef: image,
  revision: 'microlearning-staging-00001-good',
  serviceUrl: 'https://microlearning-staging-abc.a.run.app',
};
const valid = {
  schemaVersion: 1,
  environment: 'production',
  applyMode: 'PLAN_ONLY',
  confirmation: 'PROMOTE_PRODUCTION',
  repository,
  sourceCloudE2eRunId: '12345',
  uatStatus: 'PASS',
  uatDecisionId: 'uat-20260817',
  goNoGoDecision: 'GO',
  goNoGoDecisionId: 'go-20260817',
  stableRecord,
};

assert.deepEqual(validateProductionPromotionInput(valid, { repository }), []);
for (const mutation of [
  { confirmation: 'PROMOTE', message: 'confirmation' },
  { applyMode: 'APPLY', message: 'PLAN_ONLY' },
  { goNoGoDecision: 'NO_GO', message: 'goNoGoDecision' },
  {
    stableRecord: { ...stableRecord, imageRef: `${image.split('@')[0]}:latest` },
    message: 'imageRef',
  },
]) {
  const errors = validateProductionPromotionInput({ ...valid, ...mutation }, { repository });
  assert.ok(
    errors.some((error) => error.includes(mutation.message)),
    mutation.message,
  );
}
process.stdout.write(`${JSON.stringify({ event: 'promotion.contract.tests_passed', cases: 5 })}\n`);
