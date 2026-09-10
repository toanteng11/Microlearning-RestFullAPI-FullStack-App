import { assertValidPhase08Record, validatePhase08Acceptance } from './lib/phase-08-contract.mjs';
import { emitValidationEvent, readJson, writeValidationReport } from './lib/phase-08-cli.mjs';

const [recordPath, outputPath] = process.argv.slice(2);
const { value: record } = readJson(recordPath, 'Phase 08 acceptance/evidence record');
assertValidPhase08Record(record, validatePhase08Acceptance);
writeValidationReport(outputPath, 'ACCEPTANCE_EVIDENCE', record);
emitValidationEvent('phase-08.acceptance.validated', { status: record.status });
