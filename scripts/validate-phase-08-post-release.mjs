import { assertValidPhase08PostRelease } from './lib/phase-08-post-release.mjs';
import { emitValidationEvent, readJson, writeValidationReport } from './lib/phase-08-cli.mjs';

const [recordPath, outputPath] = process.argv.slice(2);
const { value: record } = readJson(recordPath, 'Phase 08 post-release observation record');
assertValidPhase08PostRelease(record);
writeValidationReport(outputPath, 'POST_RELEASE_OBSERVATION', record);
emitValidationEvent('phase-08.post_release.validated', {
  status: record.status,
  releaseId: record.releaseIdentity.releaseId,
  checkpoints: record.observationWindow.checkpoints.length,
});
