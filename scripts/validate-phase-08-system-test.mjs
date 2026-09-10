import { assertValidPhase08Record, validatePhase08SystemTest } from './lib/phase-08-contract.mjs';
import { emitValidationEvent, readJson, writeValidationReport } from './lib/phase-08-cli.mjs';

const [recordPath, outputPath] = process.argv.slice(2);
const { value: record } = readJson(recordPath, 'Phase 08 System Test summary');
assertValidPhase08Record(record, validatePhase08SystemTest);
writeValidationReport(outputPath, 'SYSTEM_TEST_SUMMARY', record);
emitValidationEvent('phase-08.system-test.validated', { status: record.status });
