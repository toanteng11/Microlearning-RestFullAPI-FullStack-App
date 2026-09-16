import { emitValidationEvent, readJson } from './lib/phase-08-cli.mjs';
import {
  createPhase08PreReleasePackage,
  writePhase08PreReleasePackage,
} from './lib/phase-08-pre-release.mjs';

const [
  identityPath,
  systemTestPath,
  uatPath,
  productionReadinessPath,
  evidenceIndexPath,
  decisionRequestPath,
  outputDirectory,
] = process.argv.slice(2);

if (!outputDirectory) {
  throw new Error(
    'Usage: node scripts/generate-phase-08-pre-release.mjs <identity.json> <system-test.json> <uat.json> <production-readiness.json> <evidence-index.json> <decision-request.json> <output-directory>',
  );
}

const records = createPhase08PreReleasePackage({
  releaseIdentity: readJson(identityPath, 'release identity').value,
  systemTest: readJson(systemTestPath, 'System Test summary').value,
  uat: readJson(uatPath, 'UAT summary').value,
  productionReadiness: readJson(productionReadinessPath, 'Production readiness').value,
  evidenceIndex: readJson(evidenceIndexPath, 'pre-release evidence index').value,
  decisionRequest: readJson(decisionRequestPath, 'G5 decision request').value,
});

const target = writePhase08PreReleasePackage(outputDirectory, records);
emitValidationEvent('phase-08.pre-release.generated', {
  releaseId: records.decision.releaseId,
  decisionId: records.decision.decisionId,
  decision: records.decision.decision,
  outputDirectory: target,
  decisionRecordSha256: records.lock.decisionRecordSha256,
});
