import { assertValidPhase08Record, validatePhase08Exit } from './lib/phase-08-contract.mjs';
import { emitValidationEvent, readJson, writeValidationReport } from './lib/phase-08-cli.mjs';

const [recordPath, outputPath] = process.argv.slice(2);
const { value: record } = readJson(recordPath, 'Phase 08 final exit record');
assertValidPhase08Record(record, validatePhase08Exit);
writeValidationReport(outputPath, 'FINAL_EXIT', record);
emitValidationEvent('phase-08.exit.validated', {
  decision: record.decision,
  productionStatus: record.production?.status,
});
