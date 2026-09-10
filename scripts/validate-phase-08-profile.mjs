import { assertValidPhase08Record, validatePhase08Profile } from './lib/phase-08-contract.mjs';
import { emitValidationEvent, readJson, writeValidationReport } from './lib/phase-08-cli.mjs';

const [recordPath, outputPath] = process.argv.slice(2);
const { value: record } = readJson(recordPath, 'Phase 08 release profile');
assertValidPhase08Record(record, validatePhase08Profile);
writeValidationReport(outputPath, 'RELEASE_PROFILE', record);
emitValidationEvent('phase-08.profile.validated', {
  releaseId: record.releaseId,
  releaseProfile: record.releaseProfile,
  status: record.status,
});
