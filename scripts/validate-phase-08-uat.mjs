import { assertValidPhase08Record, validatePhase08Uat } from './lib/phase-08-contract.mjs';
import { emitValidationEvent, readJson, writeValidationReport } from './lib/phase-08-cli.mjs';

const [recordPath, outputPath] = process.argv.slice(2);
const { value: record } = readJson(recordPath, 'Phase 08 UAT summary');
assertValidPhase08Record(record, validatePhase08Uat);
writeValidationReport(outputPath, 'UAT_SUMMARY', record);
emitValidationEvent('phase-08.uat.validated', { status: record.status });
