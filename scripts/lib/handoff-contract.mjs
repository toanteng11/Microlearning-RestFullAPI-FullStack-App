import { PHASE08_RELEASE_PROFILES } from './phase-08-contract.mjs';

const FULL_SHA = /^[a-f0-9]{40}$/i;
const IMAGE_REFERENCE_WITH_DIGEST = /^[a-z0-9][a-z0-9._/-]*@sha256:[a-f0-9]{64}$/i;
const HTTPS_URL = /^https:\/\/[^\s]+$/i;
const RELEASE_ID = /^P08-RC-\d{8}-([a-f0-9]{7,12})$/i;
const SAFE_IDENTIFIER = /^[a-zA-Z0-9][a-zA-Z0-9._-]{2,127}$/;
const PLACEHOLDER = /(?:<[^>]+>|\b(?:todo|tbd|pending-value|replace-me|example-only)\b)/i;

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function requireString(record, key, errors) {
  const value = record[key];

  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`${key} must be a non-empty string`);
    return undefined;
  }

  if (PLACEHOLDER.test(value)) {
    errors.push(`${key} must not contain a placeholder`);
  }

  return value;
}

function validateUtcTimestamp(value, key, errors) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    errors.push(`${key} must be a valid ISO-8601 timestamp`);
    return;
  }

  if (!value.endsWith('Z')) {
    errors.push(`${key} must be expressed in UTC with a trailing Z`);
  }
}

export function validatePhase08Handoff(record) {
  const errors = [];

  if (!isRecord(record)) {
    return ['handoff record must be a JSON object'];
  }

  if (record.schemaVersion !== 1) {
    errors.push('schemaVersion must equal 1');
  }

  if (record.phase !== '08') {
    errors.push('phase must equal 08');
  }

  if (record.phase07ExitDecision !== 'PASS') {
    errors.push('phase07ExitDecision must be PASS');
  }

  if (record.productionDecision !== 'NO_GO') {
    errors.push('productionDecision must be NO_GO at Phase 08 handoff');
  }

  if (record.accepted !== true) {
    errors.push('accepted must be true');
  }

  if (!PHASE08_RELEASE_PROFILES.includes(record.releaseProfile)) {
    errors.push(`releaseProfile must be one of: ${PHASE08_RELEASE_PROFILES.join(', ')}`);
  }

  const releaseId = requireString(record, 'releaseId', errors);
  const commitSha = requireString(record, 'commitSha', errors);
  const stagingDigest = requireString(record, 'verifiedStagingDigest', errors);
  const registryDigest = requireString(record, 'registryImageDigest', errors);
  const deployedDigest = requireString(record, 'deployedImageDigest', errors);
  const stagingRevision = requireString(record, 'stagingRevision', errors);
  const stagingUrl = requireString(record, 'stagingUrl', errors);
  const stableWorkflowRunUrl = requireString(record, 'stableWorkflowRunUrl', errors);
  requireString(record, 'phase07ExitRecord', errors);
  requireString(record, 'stagingDeploymentRecord', errors);
  requireString(record, 'rollbackRecord', errors);
  const rollbackDigest = requireString(record, 'rollbackImageDigest', errors);
  requireString(record, 'acceptedBy', errors);
  const acceptedAtUtc = requireString(record, 'acceptedAtUtc', errors);

  const releaseIdMatch = releaseId?.match(RELEASE_ID);
  if (releaseId && !releaseIdMatch) {
    errors.push('releaseId must match P08-RC-<UTC-date>-<short-sha>');
  }

  if (commitSha && !FULL_SHA.test(commitSha)) {
    errors.push('commitSha must be a full 40-character Git commit SHA');
  }

  if (
    releaseIdMatch &&
    commitSha &&
    !commitSha.toLowerCase().startsWith(releaseIdMatch[1].toLowerCase())
  ) {
    errors.push('releaseId short SHA must match the beginning of commitSha');
  }

  if (stagingDigest && !IMAGE_REFERENCE_WITH_DIGEST.test(stagingDigest)) {
    errors.push('verifiedStagingDigest must be an immutable image reference with sha256 digest');
  }

  if (registryDigest && !IMAGE_REFERENCE_WITH_DIGEST.test(registryDigest)) {
    errors.push('registryImageDigest must be an immutable image reference with sha256 digest');
  }

  if (deployedDigest && !IMAGE_REFERENCE_WITH_DIGEST.test(deployedDigest)) {
    errors.push('deployedImageDigest must be an immutable image reference with sha256 digest');
  }

  if (
    stagingDigest &&
    registryDigest &&
    deployedDigest &&
    (stagingDigest !== registryDigest || stagingDigest !== deployedDigest)
  ) {
    errors.push('registryImageDigest, deployedImageDigest and verifiedStagingDigest must match');
  }

  if (rollbackDigest && !IMAGE_REFERENCE_WITH_DIGEST.test(rollbackDigest)) {
    errors.push('rollbackImageDigest must be an immutable image reference with sha256 digest');
  }

  if (stagingRevision && !SAFE_IDENTIFIER.test(stagingRevision)) {
    errors.push('stagingRevision must be a path-safe revision identifier');
  }

  if (stagingUrl && !HTTPS_URL.test(stagingUrl)) {
    errors.push('stagingUrl must be an HTTPS URL');
  }

  if (stableWorkflowRunUrl && !HTTPS_URL.test(stableWorkflowRunUrl)) {
    errors.push('stableWorkflowRunUrl must be an HTTPS URL');
  }

  if (!Array.isArray(record.residualRisks)) {
    errors.push('residualRisks must be an array');
  } else {
    record.residualRisks.forEach((risk, index) => {
      if (typeof risk !== 'string' || risk.trim().length === 0 || PLACEHOLDER.test(risk)) {
        errors.push(`residualRisks[${index}] must be a non-placeholder string`);
      }
    });
  }

  if (acceptedAtUtc) {
    validateUtcTimestamp(acceptedAtUtc, 'acceptedAtUtc', errors);
  }

  return errors;
}

export function assertPhase08Handoff(record) {
  const errors = validatePhase08Handoff(record);

  if (errors.length > 0) {
    throw new Error(`Invalid Phase 08 handoff:\n- ${errors.join('\n- ')}`);
  }

  return record;
}
