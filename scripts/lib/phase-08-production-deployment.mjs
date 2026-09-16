const FULL_SHA = /^[a-f0-9]{40}$/u;
const IMMUTABLE_IMAGE = /^[^\s@]+@sha256:[a-f0-9]{64}$/u;
const SHA256 = /^sha256:[a-f0-9]{64}$/u;
const RELEASE_ID = /^P08-RC-[0-9]{8}-[a-f0-9]{7,12}$/u;
const RUN_ID = /^[1-9][0-9]*$/u;
const UTC_TIMESTAMP = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]+)?Z$/u;
const HTTPS_ORIGIN = /^https:\/\/[^\s/]+$/u;
const SECRET_KEY = /(password|secret.?value|token|private.?key|mongodb.?uri|connection.?string)/iu;
const REQUIRED_EVIDENCE = Object.freeze(['P08-EV-031', 'P08-EV-037']);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireString(parent, field, errors, path = field) {
  const value = parent?.[field];
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string.`);
    return null;
  }
  return value;
}

function requireUtc(parent, field, errors, path = field) {
  const value = requireString(parent, field, errors, path);
  if (value && (!UTC_TIMESTAMP.test(value) || Number.isNaN(Date.parse(value)))) {
    errors.push(`${path} must be a valid UTC timestamp.`);
  }
}

function validateIdentity(identity, errors) {
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
  if (!HTTPS_ORIGIN.test(identity.stagingUrl ?? '')) {
    errors.push('releaseIdentity.stagingUrl must be an HTTPS origin.');
  }
  requireString(identity, 'productionRevision', errors, 'releaseIdentity.productionRevision');
  if (!HTTPS_ORIGIN.test(identity.productionUrl ?? '')) {
    errors.push('releaseIdentity.productionUrl must be an HTTPS origin.');
  }
  if (identity.productionRevision === 'NOT_RUN' || identity.productionUrl === 'NOT_RUN') {
    errors.push('Production identity must be actual after APPLY.');
  }
  const suffix = identity.releaseId?.split('-').at(-1);
  if (suffix && !identity.commitSha?.startsWith(suffix)) {
    errors.push('releaseIdentity release ID suffix must match commitSha.');
  }
}

function rejectSecrets(value, errors, path = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => rejectSecrets(entry, errors, [...path, String(index)]));
    return;
  }
  if (!isObject(value)) return;
  for (const [key, entry] of Object.entries(value)) {
    if (SECRET_KEY.test(key))
      errors.push(`Secret-like field is forbidden: ${[...path, key].join('.')}.`);
    rejectSecrets(entry, errors, [...path, key]);
  }
}

export function validatePhase08ProductionDeployment(record) {
  const errors = [];
  if (!isObject(record)) return ['Production deployment record must be an object.'];
  if (record.schemaVersion !== 1) errors.push('schemaVersion must equal 1.');
  if (record.phase !== '08') errors.push('phase must equal 08.');
  if (record.recordType !== 'PRODUCTION_DEPLOYMENT') {
    errors.push('recordType must equal PRODUCTION_DEPLOYMENT.');
  }
  if (record.status !== 'ACTUAL') errors.push('status must equal ACTUAL.');
  if (record.applyMode !== 'APPLY') errors.push('applyMode must equal APPLY.');
  if (record.protectedEnvironment !== true) {
    errors.push('protectedEnvironment must be true.');
  }
  if (record.redactionReviewed !== true) errors.push('redactionReviewed must be true.');
  requireString(record, 'releaseId', errors);
  requireString(record, 'actor', errors);
  requireUtc(record, 'recordedAtUtc', errors);
  validateIdentity(record.releaseIdentity, errors);
  if (record.releaseId !== record.releaseIdentity?.releaseId) {
    errors.push('releaseId must match releaseIdentity.releaseId.');
  }

  const approval = record.approval;
  if (!isObject(approval)) {
    errors.push('approval must be an object.');
  } else {
    if (!['GO', 'CONDITIONAL_GO'].includes(approval.decision)) {
      errors.push('approval.decision must be GO or CONDITIONAL_GO.');
    }
    requireString(approval, 'decisionId', errors, 'approval.decisionId');
    if (!SHA256.test(approval.decisionRecordSha256 ?? '')) {
      errors.push('approval.decisionRecordSha256 is invalid.');
    }
    if (!RUN_ID.test(String(approval.sourceG5RunId ?? ''))) {
      errors.push('approval.sourceG5RunId must be a positive workflow run ID.');
    }
  }

  const terraform = record.terraform;
  if (!isObject(terraform)) {
    errors.push('terraform must be an object.');
  } else {
    if (terraform.planStatus !== 'PASS') errors.push('terraform.planStatus must be PASS.');
    if (terraform.policyStatus !== 'PASS') errors.push('terraform.policyStatus must be PASS.');
    if (terraform.applyStatus !== 'PASS') errors.push('terraform.applyStatus must be PASS.');
    if (terraform.postApplyDriftStatus !== 'PASS') {
      errors.push('terraform.postApplyDriftStatus must be PASS.');
    }
    if (!SHA256.test(terraform.planHash ?? '')) errors.push('terraform.planHash is invalid.');
    if (terraform.destroyCount !== 0) errors.push('terraform.destroyCount must equal zero.');
  }

  const cloudRun = record.cloudRun;
  if (!isObject(cloudRun)) {
    errors.push('cloudRun must be an object.');
  } else {
    if (cloudRun.serviceName !== 'microlearning-production') {
      errors.push('cloudRun.serviceName must equal microlearning-production.');
    }
    requireString(cloudRun, 'revision', errors, 'cloudRun.revision');
    if (!HTTPS_ORIGIN.test(cloudRun.url ?? ''))
      errors.push('cloudRun.url must be an HTTPS origin.');
    if (cloudRun.trafficPercent !== 100) errors.push('cloudRun.trafficPercent must equal 100.');
    if (cloudRun.revision !== record.releaseIdentity?.productionRevision) {
      errors.push('cloudRun.revision must match releaseIdentity.productionRevision.');
    }
    if (cloudRun.url !== record.releaseIdentity?.productionUrl) {
      errors.push('cloudRun.url must match releaseIdentity.productionUrl.');
    }
    if (cloudRun.observedImageDigest !== record.releaseIdentity?.imageDigest) {
      errors.push('cloudRun.observedImageDigest must match releaseIdentity.imageDigest.');
    }
    if (cloudRun.observedCommitSha !== record.releaseIdentity?.commitSha) {
      errors.push('cloudRun.observedCommitSha must match releaseIdentity.commitSha.');
    }
    if (
      cloudRun.previousImageDigest !== null &&
      !IMMUTABLE_IMAGE.test(cloudRun.previousImageDigest ?? '')
    ) {
      errors.push('cloudRun.previousImageDigest must be null or immutable.');
    }
  }

  const smoke = record.smoke;
  if (!isObject(smoke)) {
    errors.push('smoke must be an object.');
  } else {
    if (smoke.status !== 'PASS') errors.push('smoke.status must be PASS.');
    requireString(smoke, 'report', errors, 'smoke.report');
    if (!SHA256.test(smoke.reportSha256 ?? '')) errors.push('smoke.reportSha256 is invalid.');
  }

  const roleSmoke = record.roleSmoke;
  if (!isObject(roleSmoke)) {
    errors.push('roleSmoke must be an object.');
  } else {
    if (roleSmoke.status !== 'PASS') errors.push('roleSmoke.status must be PASS.');
    if (roleSmoke.personas !== 4) errors.push('roleSmoke.personas must equal 4.');
    requireString(roleSmoke, 'report', errors, 'roleSmoke.report');
    if (!SHA256.test(roleSmoke.reportSha256 ?? '')) {
      errors.push('roleSmoke.reportSha256 is invalid.');
    }
  }

  if (
    !Array.isArray(record.evidenceIds) ||
    record.evidenceIds.length !== REQUIRED_EVIDENCE.length ||
    REQUIRED_EVIDENCE.some((id) => !record.evidenceIds.includes(id))
  ) {
    errors.push('evidenceIds must contain P08-EV-031 and P08-EV-037 exactly once.');
  }
  if (/mongodb(?:\+srv)?:\/\//iu.test(JSON.stringify(record))) {
    errors.push('Record must not contain a MongoDB connection URI.');
  }
  rejectSecrets(record, errors);
  return errors;
}

export function assertValidPhase08ProductionDeployment(record) {
  const errors = validatePhase08ProductionDeployment(record);
  if (errors.length > 0) {
    throw new Error(`Phase 08 Production deployment failed:\n- ${errors.join('\n- ')}`);
  }
  return record;
}

export const PHASE08_PRODUCTION_DEPLOYMENT = Object.freeze({ REQUIRED_EVIDENCE });
