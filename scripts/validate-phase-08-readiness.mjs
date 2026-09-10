import { assertValidPhase08Record, validatePhase08Readiness } from './lib/phase-08-contract.mjs';
import { emitValidationEvent, readJson, writeValidationReport } from './lib/phase-08-cli.mjs';

const [recordPath, outputPath] = process.argv.slice(2);
const { value: record } = readJson(recordPath, 'Phase 08 readiness pack');
assertValidPhase08Record(record, validatePhase08Readiness);
writeValidationReport(outputPath, 'READINESS_PACK', record);
emitValidationEvent('phase-08.readiness.validated', {
  stage: record.stage,
  decision: record.decision?.decision,
  hasExit: Boolean(record.exit),
});
