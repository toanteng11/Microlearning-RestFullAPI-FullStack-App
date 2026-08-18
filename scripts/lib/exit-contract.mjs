const FULL_SHA = /^[a-f0-9]{40}$/u;
const IMAGE_DIGEST = /^[^\s@]+(?:\/[^\s@]+)*@sha256:[a-f0-9]{64}$/u;
const HTTPS_URL = /^https:\/\//u;
const PLACEHOLDER = /pending|<[^>]+>|todo|tbd|placeholder/iu;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireString(value, field, errors) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${field} must be a non-empty string.`);
    return false;
  }
  if (PLACEHOLDER.test(value)) errors.push(`${field} contains a placeholder or pending value.`);
  return true;
}

function requireHttps(value, field, errors) {
  if (requireString(value, field, errors) && !HTTPS_URL.test(value)) {
    errors.push(`${field} must be an HTTPS URL.`);
  }
}

export function validatePhase07Exit(input) {
  const errors = [];
  if (!isObject(input)) return ['Phase 07 exit record must be a JSON object.'];
  if (input.schemaVersion !== 1) errors.push('schemaVersion must equal 1.');
  if (input.phase !== '07') errors.push('phase must equal 07.');
  if (!['PASS', 'CONDITIONAL_PASS'].includes(input.decision)) errors.push('decision is invalid.');
  if (input.mustPassed !== 66 || input.mustTotal !== 66)
    errors.push('all 66 Must acceptance criteria must pass.');
  if (input.criticalDefects !== 0 || input.highDefects !== 0)
    errors.push('Critical and High defects must both equal 0.');
  if (input.productionDecision !== 'NO_GO_PHASE_08') {
    errors.push('productionDecision must preserve the Phase 08 NO_GO gate.');
  }
  if (input.handoffAccepted !== true) errors.push('Phase 08 handoff must be accepted.');

  for (const field of ['releaseCommit', 'cloudRunRevision'])
    requireString(input[field], field, errors);
  if (typeof input.releaseCommit === 'string' && !FULL_SHA.test(input.releaseCommit)) {
    errors.push('releaseCommit must be a full Git SHA.');
  }
  if (typeof input.imageDigest !== 'string' || !IMAGE_DIGEST.test(input.imageDigest)) {
    errors.push('imageDigest must be an immutable registry image digest.');
  }
  requireHttps(input.stagingUrl, 'stagingUrl', errors);

  const evidence = input.evidenceUrls;
  if (!isObject(evidence)) {
    errors.push('evidenceUrls is required.');
  } else {
    for (const field of [
      'releasePr',
      'mainCi',
      'stagingCd',
      'cloudE2e',
      'monitoring',
      'backupRestore',
      'rollback',
      'hardening',
      'handoff',
    ]) {
      requireHttps(evidence[field], `evidenceUrls.${field}`, errors);
    }
  }

  if (
    input.decision === 'CONDITIONAL_PASS' &&
    (!Array.isArray(input.openRisks) || input.openRisks.length === 0)
  ) {
    errors.push('CONDITIONAL_PASS requires explicit openRisks.');
  }
  return errors;
}

export function assertValidPhase07Exit(input) {
  const errors = validatePhase07Exit(input);
  if (errors.length) throw new Error(`Phase 07 exit contract failed:\n- ${errors.join('\n- ')}`);
  return input;
}
