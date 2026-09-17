export const FULL_SHA = /^[a-f0-9]{40}$/u;
export const IMMUTABLE_IMAGE = /^[^\s@]+@sha256:[a-f0-9]{64}$/u;
export const SHA256 = /^sha256:[a-f0-9]{64}$/u;
export const RELEASE_ID = /^P08-RC-[0-9]{8}-[a-f0-9]{7,12}$/u;
export const HTTPS_URL = /^https:\/\/[^\s]+$/u;
export const UTC_TIMESTAMP =
  /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]+)?Z$/u;

const PLACEHOLDER = /<[^>]+>|\btodo\b|\btbd\b|\bpending\b|\bplaceholder\b/iu;
const SECRET_KEY =
  /(password|secret.?value|token|private.?key|authorization|mongodb.?uri|connection.?string)/iu;

export function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function requireString(parent, field, errors, path = field) {
  const value = parent?.[field];
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string.`);
    return null;
  }
  if (PLACEHOLDER.test(value)) errors.push(`${path} must not contain a placeholder.`);
  return value;
}

export function requireUtc(parent, field, errors, path = field) {
  const value = requireString(parent, field, errors, path);
  if (value && (!UTC_TIMESTAMP.test(value) || Number.isNaN(Date.parse(value)))) {
    errors.push(`${path} must be a valid UTC timestamp.`);
    return null;
  }
  return value;
}

export function requireSha256(parent, field, errors, path = field) {
  if (!SHA256.test(parent?.[field] ?? '')) errors.push(`${path} must be a SHA-256 digest.`);
}

export function validateReleaseIdentity(identity, errors) {
  if (!isObject(identity)) {
    errors.push('releaseIdentity must be an object.');
    return;
  }
  if (!RELEASE_ID.test(identity.releaseId ?? '')) {
    errors.push('releaseIdentity.releaseId is invalid.');
  }
  if (!FULL_SHA.test(identity.commitSha ?? '')) {
    errors.push('releaseIdentity.commitSha must be a full Git SHA.');
  }
  if (!IMMUTABLE_IMAGE.test(identity.imageDigest ?? '')) {
    errors.push('releaseIdentity.imageDigest must be immutable.');
  }
  requireString(identity, 'stagingRevision', errors, 'releaseIdentity.stagingRevision');
  if (!HTTPS_URL.test(identity.stagingUrl ?? '')) {
    errors.push('releaseIdentity.stagingUrl must be an HTTPS URL.');
  }
  requireString(identity, 'productionRevision', errors, 'releaseIdentity.productionRevision');
  if (!HTTPS_URL.test(identity.productionUrl ?? '')) {
    errors.push('releaseIdentity.productionUrl must be an HTTPS URL.');
  }
  const suffix = identity.releaseId?.split('-').at(-1);
  if (suffix && !identity.commitSha?.startsWith(suffix)) {
    errors.push('releaseIdentity release ID suffix must match commitSha.');
  }
}

export function validateExactEvidenceIds(actual, expected, errors) {
  if (
    !Array.isArray(actual) ||
    actual.length !== expected.length ||
    new Set(actual).size !== expected.length ||
    expected.some((id) => !actual.includes(id))
  ) {
    errors.push(`evidenceIds must contain exactly: ${expected.join(', ')}.`);
  }
}

export function rejectSecrets(value, errors, path = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => rejectSecrets(entry, errors, [...path, String(index)]));
    return;
  }
  if (!isObject(value)) return;
  for (const [key, entry] of Object.entries(value)) {
    if (SECRET_KEY.test(key)) {
      errors.push(`Secret-like field is forbidden: ${[...path, key].join('.')}.`);
    }
    rejectSecrets(entry, errors, [...path, key]);
  }
}

export function validateEnvelope(record, recordType, errors) {
  if (!isObject(record)) {
    errors.push(`${recordType} record must be an object.`);
    return false;
  }
  if (record.schemaVersion !== 1) errors.push('schemaVersion must equal 1.');
  if (record.phase !== '08') errors.push('phase must equal 08.');
  if (record.recordType !== recordType) errors.push(`recordType must equal ${recordType}.`);
  if (record.status !== 'PASS') errors.push('status must equal PASS.');
  if (record.redactionReviewed !== true) errors.push('redactionReviewed must be true.');
  validateReleaseIdentity(record.releaseIdentity, errors);
  rejectSecrets(record, errors);
  return true;
}
