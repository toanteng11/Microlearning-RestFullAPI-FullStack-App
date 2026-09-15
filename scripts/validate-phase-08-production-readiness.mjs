import { assertValidPhase08ProductionReadiness } from './lib/phase-08-production-readiness.mjs';
import { emitValidationEvent, readJson, writeValidationReport } from './lib/phase-08-cli.mjs';

const [recordPath, outputPath] = process.argv.slice(2);
const { value: record } = readJson(recordPath, 'Phase 08 Production readiness record');
assertValidPhase08ProductionReadiness(record);
writeValidationReport(outputPath, 'PRODUCTION_READINESS', record);
emitValidationEvent('phase-08.production_readiness.validated', {
  releaseId: record.releaseIdentity.releaseId,
  applyMode: record.applyMode,
  evidenceIds: record.evidenceIds,
});
