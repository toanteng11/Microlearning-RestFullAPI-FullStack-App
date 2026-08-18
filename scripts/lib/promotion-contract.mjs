import { validateImageReference } from './release-contract.mjs';

const FULL_SHA = /^[a-f0-9]{40}$/u;
const SAFE_DECISION_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,99}$/u;

function nonEmpty(value, field, errors) {
  if (typeof value !== 'string' || value.trim() === '')
    errors.push(`${field} must be a non-empty string.`);
}

export function validateProductionPromotionInput(input, { repository } = {}) {
  const errors = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return ['Production promotion input must be a JSON object.'];
  }
  if (input.schemaVersion !== 1) errors.push('schemaVersion must equal 1.');
  if (input.environment !== 'production') errors.push('environment must equal production.');
  if (input.applyMode !== 'PLAN_ONLY') errors.push('applyMode must equal PLAN_ONLY in Phase 07.');
  if (input.confirmation !== 'PROMOTE_PRODUCTION') errors.push('confirmation phrase is invalid.');
  if (input.uatStatus !== 'PASS') errors.push('uatStatus must equal PASS.');
  if (input.goNoGoDecision !== 'GO') errors.push('goNoGoDecision must equal GO.');
  if (repository && input.repository !== repository)
    errors.push('repository does not match the trusted repository.');

  for (const field of ['repository', 'sourceCloudE2eRunId', 'uatDecisionId', 'goNoGoDecisionId']) {
    nonEmpty(input[field], field, errors);
  }
  for (const field of ['uatDecisionId', 'goNoGoDecisionId']) {
    if (!SAFE_DECISION_ID.test(input[field] ?? '')) errors.push(`${field} format is invalid.`);
  }
  if (!/^[1-9][0-9]*$/u.test(String(input.sourceCloudE2eRunId ?? ''))) {
    errors.push('sourceCloudE2eRunId must be a positive workflow run ID.');
  }

  const stable = input.stableRecord;
  if (!stable || typeof stable !== 'object' || Array.isArray(stable)) {
    errors.push('stableRecord is required.');
  } else {
    if (stable.environment !== 'staging' || stable.decision !== 'PASS' || stable.stable !== true) {
      errors.push('stableRecord must be a PASS stable Staging record.');
    }
    if (repository && stable.repository !== repository)
      errors.push('stableRecord repository is not trusted.');
    nonEmpty(stable.commitSha, 'stableRecord.commitSha', errors);
    if (!FULL_SHA.test(stable.commitSha ?? ''))
      errors.push('stableRecord.commitSha must be a full Git SHA.');
    nonEmpty(stable.revision, 'stableRecord.revision', errors);
    nonEmpty(stable.imageRef, 'stableRecord.imageRef', errors);
    try {
      validateImageReference(stable.imageRef);
    } catch (error) {
      errors.push(`stableRecord.imageRef: ${error.message}`);
    }
    try {
      const url = new URL(stable.serviceUrl);
      if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash) {
        errors.push('stableRecord.serviceUrl must be an HTTPS origin.');
      }
    } catch {
      errors.push('stableRecord.serviceUrl must be a valid URL.');
    }
  }
  return errors;
}

export function assertValidProductionPromotionInput(input, options = {}) {
  const errors = validateProductionPromotionInput(input, options);
  if (errors.length)
    throw new Error(`Production promotion contract failed:\n- ${errors.join('\n- ')}`);
  return input;
}
