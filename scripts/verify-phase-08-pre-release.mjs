import { emitValidationEvent, readJson } from './lib/phase-08-cli.mjs';
import { assertValidPhase08PreReleasePackage } from './lib/phase-08-pre-release.mjs';

const [acceptancePath, decisionPath, lockPath] = process.argv.slice(2);
const records = {
  acceptance: readJson(acceptancePath, 'pre-release acceptance').value,
  decision: readJson(decisionPath, 'G5 decision').value,
  lock: readJson(lockPath, 'G5 decision lock').value,
};

assertValidPhase08PreReleasePackage(records);
emitValidationEvent('phase-08.pre-release.verified', {
  releaseId: records.lock.releaseId,
  decisionId: records.lock.decisionId,
  decision: records.lock.decision,
  decisionRecordSha256: records.lock.decisionRecordSha256,
});
