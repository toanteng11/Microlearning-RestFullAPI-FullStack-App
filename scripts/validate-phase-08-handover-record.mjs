import { assertValidPhase08Handover } from './lib/phase-08-handover.mjs';
import { emitValidationEvent, readJson, writeValidationReport } from './lib/phase-08-cli.mjs';

const [recordPath, outputPath] = process.argv.slice(2);
const { value: record } = readJson(recordPath, 'Phase 08 operations handover record');
assertValidPhase08Handover(record);
writeValidationReport(outputPath, 'OPERATIONS_HANDOVER', record);
emitValidationEvent('phase-08.handover_record.validated', {
  status: record.status,
  releaseId: record.releaseIdentity.releaseId,
  audiences: record.materials.length,
});
