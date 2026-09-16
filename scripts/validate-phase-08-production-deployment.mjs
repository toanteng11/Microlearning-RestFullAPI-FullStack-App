import { assertValidPhase08ProductionDeployment } from './lib/phase-08-production-deployment.mjs';
import { emitValidationEvent, readJson, writeValidationReport } from './lib/phase-08-cli.mjs';

const [recordPath, outputPath] = process.argv.slice(2);
const { value: record } = readJson(recordPath, 'Phase 08 Production deployment');
assertValidPhase08ProductionDeployment(record);
writeValidationReport(outputPath, 'PRODUCTION_DEPLOYMENT', record);
emitValidationEvent('phase-08.production-deployment.validated', {
  releaseId: record.releaseId,
  revision: record.releaseIdentity.productionRevision,
  status: record.status,
});
