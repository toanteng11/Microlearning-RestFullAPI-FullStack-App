import { assertValidPhase08Record, validatePhase08Decision } from './lib/phase-08-contract.mjs';
import { emitValidationEvent, readJson, writeValidationReport } from './lib/phase-08-cli.mjs';

const [recordPath, outputPath] = process.argv.slice(2);
const { value: record } = readJson(recordPath, 'Phase 08 Go/No-Go decision');
assertValidPhase08Record(record, validatePhase08Decision);
writeValidationReport(outputPath, 'GO_NO_GO_DECISION', record);
emitValidationEvent('phase-08.decision.validated', { decision: record.decision });
