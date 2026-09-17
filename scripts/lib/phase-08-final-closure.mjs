import {
  PHASE08_EVIDENCE,
  validatePhase08Acceptance,
  validatePhase08Decision,
  validatePhase08Exit,
  validatePhase08IdentityConsistency,
} from './phase-08-contract.mjs';
import {
  FULL_SHA,
  HTTPS_URL,
  isObject,
  rejectSecrets,
  requireSha256,
  requireString,
  requireUtc,
  validateEnvelope,
  validateExactEvidenceIds,
} from './phase-08-evidence-utils.mjs';
import { validatePhase08Handover } from './phase-08-handover.mjs';
import { validatePhase08PostRelease } from './phase-08-post-release.mjs';
import { validatePhase08ProductionDeployment } from './phase-08-production-deployment.mjs';

const GATES = Object.freeze(Array.from({ length: 9 }, (_, index) => `G${index}`));
const SOURCE_RECORDS = Object.freeze([
  'productionDeployment',
  'postReleaseObservation',
  'handover',
  'finalAcceptance',
  'g5Decision',
  'exit',
]);
const SOLO_ROLES = Object.freeze(['productBusiness', 'technical', 'quality', 'devOpsOperations']);

function validateManifest(manifest, errors) {
  if (!validateEnvelope(manifest, 'FINAL_CLOSURE_PACKAGE', errors)) return;
  if (!['GO', 'CONDITIONAL_GO'].includes(manifest.finalDecision)) {
    errors.push('finalDecision must be GO or CONDITIONAL_GO.');
  }
  requireUtc(manifest, 'closedAtUtc', errors);

  if (!Array.isArray(manifest.gates) || manifest.gates.length !== GATES.length) {
    errors.push('gates must contain G0 through G8 exactly once.');
  } else {
    const ids = manifest.gates.map((gate) => gate?.id);
    if (new Set(ids).size !== GATES.length || GATES.some((id) => !ids.includes(id))) {
      errors.push('gates must contain G0 through G8 exactly once.');
    }
    manifest.gates.forEach((gate, index) => {
      if (gate?.status !== 'PASS') errors.push(`gates[${index}].status must equal PASS.`);
      if (!Array.isArray(gate?.evidenceIds) || gate.evidenceIds.length === 0) {
        errors.push(`gates[${index}].evidenceIds must not be empty.`);
      }
    });
  }

  if (
    !Array.isArray(manifest.evidenceRegister) ||
    manifest.evidenceRegister.length !== PHASE08_EVIDENCE.length
  ) {
    errors.push('evidenceRegister must contain every Phase 08 evidence item.');
  } else {
    const ids = manifest.evidenceRegister.map((entry) => entry?.id);
    if (
      new Set(ids).size !== PHASE08_EVIDENCE.length ||
      PHASE08_EVIDENCE.some((id) => !ids.includes(id))
    ) {
      errors.push('evidenceRegister must contain every Phase 08 evidence ID exactly once.');
    }
    manifest.evidenceRegister.forEach((entry, index) => {
      const path = `evidenceRegister[${index}]`;
      if (entry?.status !== 'PASS') errors.push(`${path}.status must equal PASS.`);
      requireString(entry, 'path', errors, `${path}.path`);
      requireSha256(entry, 'sha256', errors, `${path}.sha256`);
    });
  }

  if (!isObject(manifest.sourceRecords)) {
    errors.push('sourceRecords must be an object.');
  } else {
    const keys = Object.keys(manifest.sourceRecords);
    if (
      keys.length !== SOURCE_RECORDS.length ||
      SOURCE_RECORDS.some((key) => !keys.includes(key))
    ) {
      errors.push(`sourceRecords must contain exactly: ${SOURCE_RECORDS.join(', ')}.`);
    }
    SOURCE_RECORDS.forEach((key) => {
      const source = manifest.sourceRecords[key];
      if (!isObject(source)) {
        errors.push(`sourceRecords.${key} must be an object.`);
        return;
      }
      requireString(source, 'path', errors, `sourceRecords.${key}.path`);
      requireSha256(source, 'sha256', errors, `sourceRecords.${key}.sha256`);
    });
  }

  const clean = manifest.cleanCheckoutVerification;
  if (!isObject(clean)) {
    errors.push('cleanCheckoutVerification must be an object.');
  } else {
    if (clean.status !== 'PASS') errors.push('cleanCheckoutVerification.status must equal PASS.');
    if (
      clean.commitSha !== manifest.releaseIdentity?.commitSha ||
      !FULL_SHA.test(clean.commitSha ?? '')
    ) {
      errors.push('cleanCheckoutVerification.commitSha must match the release identity.');
    }
    if (!/^[1-9][0-9]*$/u.test(String(clean.workflowRunId ?? ''))) {
      errors.push('cleanCheckoutVerification.workflowRunId must be a positive run ID.');
    }
    if (!HTTPS_URL.test(clean.runUrl ?? '')) {
      errors.push('cleanCheckoutVerification.runUrl must be an HTTPS URL.');
    }
    requireUtc(clean, 'verifiedAtUtc', errors, 'cleanCheckoutVerification.verifiedAtUtc');
  }

  const governance = manifest.soloGovernance;
  if (!isObject(governance)) {
    errors.push('soloGovernance must be an object.');
  } else {
    if (governance.soloProject !== true || governance.independentReview !== false) {
      errors.push('soloGovernance must declare soloProject=true and independentReview=false.');
    }
    requireString(governance, 'actor', errors, 'soloGovernance.actor');
    for (const role of SOLO_ROLES) {
      if (governance.recommendations?.[role] !== manifest.finalDecision) {
        errors.push(`soloGovernance.recommendations.${role} must match finalDecision.`);
      }
    }
  }

  if (!Array.isArray(manifest.residualFollowUps)) {
    errors.push('residualFollowUps must be an array.');
  } else {
    manifest.residualFollowUps.forEach((item, index) => {
      const path = `residualFollowUps[${index}]`;
      requireString(item, 'id', errors, `${path}.id`);
      requireString(item, 'owner', errors, `${path}.owner`);
      requireString(item, 'acceptanceCondition', errors, `${path}.acceptanceCondition`);
      requireUtc(item, 'targetUtc', errors, `${path}.targetUtc`);
      if (!['MEDIUM', 'LOW'].includes(item?.severity)) {
        errors.push(`${path}.severity must be MEDIUM or LOW.`);
      }
      if (!['ACCEPTED', 'CLOSED'].includes(item?.status)) {
        errors.push(`${path}.status must be ACCEPTED or CLOSED.`);
      }
    });
  }

  validateExactEvidenceIds(manifest.evidenceIds, ['P08-EV-050', 'P08-EV-055'], errors);
  rejectSecrets(manifest, errors);
}

function validateSourceRecords(manifest, records, errors) {
  if (!records) return;
  for (const key of SOURCE_RECORDS) {
    if (!isObject(records[key])) errors.push(`Actual source record ${key} is required.`);
  }
  if (errors.length > 0) return;

  errors.push(
    ...validatePhase08ProductionDeployment(records.productionDeployment).map(
      (error) => `productionDeployment: ${error}`,
    ),
    ...validatePhase08PostRelease(records.postReleaseObservation).map(
      (error) => `postReleaseObservation: ${error}`,
    ),
    ...validatePhase08Handover(records.handover).map((error) => `handover: ${error}`),
    ...validatePhase08Acceptance(records.finalAcceptance).map(
      (error) => `finalAcceptance: ${error}`,
    ),
    ...validatePhase08Decision(records.g5Decision).map((error) => `g5Decision: ${error}`),
    ...validatePhase08Exit(records.exit).map((error) => `exit: ${error}`),
  );

  if (
    records.finalAcceptance.acceptanceStage !== 'FINAL' ||
    records.finalAcceptance.status !== 'PASS'
  ) {
    errors.push('finalAcceptance must be a FINAL PASS record.');
  }
  if (
    records.exit.finalAcceptanceStatus !== 'PASS' ||
    records.exit.decision !== manifest.finalDecision
  ) {
    errors.push('exit must reference FINAL PASS and match finalDecision.');
  }
  if (records.exit.production?.goNoGoDecisionId !== records.g5Decision.decisionId) {
    errors.push('exit Production decision ID must match the G5 decision.');
  }
  if (records.exit.production?.approvedDecision !== records.g5Decision.decision) {
    errors.push('exit Production approved decision must match the G5 decision.');
  }

  const identityErrors = validatePhase08IdentityConsistency([
    manifest,
    records.productionDeployment,
    records.postReleaseObservation,
    records.handover,
    records.finalAcceptance,
    records.g5Decision,
    records.exit,
  ]);
  errors.push(...identityErrors.map((error) => `identity: ${error}`));
}

export function validatePhase08FinalClosure(manifest, records) {
  const errors = [];
  validateManifest(manifest, errors);
  validateSourceRecords(manifest, records, errors);
  return errors;
}

export function assertValidPhase08FinalClosure(manifest, records) {
  const errors = validatePhase08FinalClosure(manifest, records);
  if (errors.length > 0)
    throw new Error(`Phase 08 final closure failed:\n- ${errors.join('\n- ')}`);
  return manifest;
}

export const PHASE08_FINAL_CLOSURE = Object.freeze({ GATES, SOURCE_RECORDS, SOLO_ROLES });
