const IMAGE_DIGEST = /^[^\s@]+(?:\/[^\s@]+)*@sha256:[a-f0-9]{64}$/u;
const PLACEHOLDER = /pending|<[^>]+>|todo|tbd|placeholder/iu;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireString(value, field, errors) {
  if (typeof value !== 'string' || value.trim() === '')
    errors.push(`${field} must be a non-empty string.`);
  else if (PLACEHOLDER.test(value))
    errors.push(`${field} contains a placeholder or pending value.`);
}

export function validatePhase08Handoff(input) {
  const errors = [];
  if (!isObject(input)) return ['Phase 08 handoff must be a JSON object.'];
  if (input.schemaVersion !== 1) errors.push('schemaVersion must equal 1.');
  if (input.phase !== '08') errors.push('phase must equal 08.');
  if (input.phase07ExitDecision !== 'PASS') errors.push('phase07ExitDecision must equal PASS.');
  if (input.productionDecision !== 'NO_GO')
    errors.push('productionDecision must equal NO_GO before Phase 08 approval.');
  if (input.accepted !== true) errors.push('handoff accepted must equal true.');

  for (const field of [
    'releaseId',
    'stagingDeploymentRecord',
    'systemTestResult',
    'uatSignoff',
    'goNoGoDecision',
    'productionTerraformPlan',
    'productionAtlasReadiness',
    'rollbackRevisionDigest',
  ]) {
    requireString(input[field], field, errors);
  }
  if (
    typeof input.verifiedStagingDigest !== 'string' ||
    !IMAGE_DIGEST.test(input.verifiedStagingDigest)
  ) {
    errors.push('verifiedStagingDigest must be an immutable registry image digest.');
  }
  return errors;
}

export function assertValidPhase08Handoff(input) {
  const errors = validatePhase08Handoff(input);
  if (errors.length) throw new Error(`Phase 08 handoff contract failed:\n- ${errors.join('\n- ')}`);
  return input;
}
