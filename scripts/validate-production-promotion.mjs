import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { assertValidProductionPromotionInput } from './lib/promotion-contract.mjs';

const [stableRecordPathValue, repository, outputPathValue] = process.argv.slice(2);
if (!stableRecordPathValue || !repository || !outputPathValue) {
  throw new Error(
    'Usage: node scripts/validate-production-promotion.mjs <stable-record.json> <repository> <report.json>',
  );
}
const stableRecord = JSON.parse(readFileSync(resolve(stableRecordPathValue), 'utf8'));
const input = {
  schemaVersion: 1,
  environment: 'production',
  applyMode: process.env.PROMOTION_APPLY_MODE ?? 'PLAN_ONLY',
  confirmation: process.env.PROMOTION_CONFIRMATION,
  repository,
  sourceCloudE2eRunId: process.env.SOURCE_CLOUD_E2E_RUN_ID,
  sourceG5RunId: process.env.SOURCE_G5_RUN_ID,
  protectedEnvironment: process.env.GITHUB_ACTIONS === 'true',
  uatStatus: process.env.UAT_STATUS,
  uatDecisionId: process.env.UAT_DECISION_ID,
  goNoGoDecision: process.env.GO_NO_GO_DECISION,
  goNoGoDecisionId: process.env.GO_NO_GO_DECISION_ID,
  stableRecord,
};
assertValidProductionPromotionInput(input, { repository });
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  environment: 'production',
  applyMode: input.applyMode,
  repository,
  sourceCloudE2eRunId: input.sourceCloudE2eRunId,
  sourceG5RunId: input.sourceG5RunId ?? null,
  stableCommitSha: stableRecord.commitSha,
  stableImageRef: stableRecord.imageRef,
  stableRevision: stableRecord.revision,
  uatDecisionId: input.uatDecisionId,
  goNoGoDecisionId: input.goNoGoDecisionId,
  goNoGoDecision: input.goNoGoDecision,
  uatStatus: input.uatStatus,
  status: input.applyMode === 'APPLY' ? 'VALIDATED_APPLY_PREREQUISITES' : 'VALIDATED_PLAN_ONLY',
  promotionAuthorized:
    ['GO', 'CONDITIONAL_GO'].includes(input.goNoGoDecision) && input.uatStatus === 'PASS',
  productionApplyExecuted: false,
};
const outputPath = resolve(outputPathValue);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
process.stdout.write(
  `${JSON.stringify({ event: 'production.promotion.validated', applyMode: input.applyMode, stableRevision: stableRecord.revision })}\n`,
);
