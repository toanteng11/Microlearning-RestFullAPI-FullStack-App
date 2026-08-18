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
  applyMode: 'PLAN_ONLY',
  repository,
  sourceCloudE2eRunId: input.sourceCloudE2eRunId,
  stableCommitSha: stableRecord.commitSha,
  stableImageRef: stableRecord.imageRef,
  stableRevision: stableRecord.revision,
  uatDecisionId: input.uatDecisionId,
  goNoGoDecisionId: input.goNoGoDecisionId,
  status: 'VALIDATED_PLAN_ONLY',
  productionApplyExecuted: false,
};
const outputPath = resolve(outputPathValue);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
process.stdout.write(
  `${JSON.stringify({ event: 'production.promotion.validated_plan_only', stableRevision: stableRecord.revision })}\n`,
);
