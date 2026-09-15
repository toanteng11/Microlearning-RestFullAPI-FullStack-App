const FULL_SHA = /^[a-f0-9]{40}$/u;
const IMMUTABLE_IMAGE = /^[^\s@]+@sha256:[a-f0-9]{64}$/u;
const SHA256 = /^sha256:[a-f0-9]{64}$/u;
const RELEASE_ID = /^P08-RC-[0-9]{8}-[a-f0-9]{7,12}$/u;
const UTC_TIMESTAMP = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]+)?Z$/u;
const SECRET_KEY = /(password|secret.?value|token|private.?key|mongodb.?uri|connection.?string)/iu;
const PLACEHOLDER = /^(?:pending|tbd|todo|n\/?a|not[_ -]?run|unknown|placeholder)$/iu;
const SAFE_SECRET_METADATA_FIELDS = new Set(['secretIds', 'secretValuesRead']);
const REQUIRED_EVIDENCE = ['P08-EV-004', 'P08-EV-006', 'P08-EV-007', 'P08-EV-008'];
const PRODUCTION_SECRET_IDS = [
  'ml-production-access-token-secret',
  'ml-production-auth-identity-pepper',
  'ml-production-classroom-code-pepper',
  'ml-production-mongodb-uri',
];

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireObject(parent, field, errors) {
  if (!isObject(parent?.[field])) {
    errors.push(`${field} must be an object.`);
    return null;
  }
  return parent[field];
}

function requireString(parent, field, errors, path = field) {
  if (typeof parent?.[field] !== 'string' || parent[field].trim() === '') {
    errors.push(`${path} must be a non-empty string.`);
    return null;
  }
  if (PLACEHOLDER.test(parent[field].trim())) {
    errors.push(`${path} must not be a placeholder.`);
  }
  return parent[field];
}

function requireUtc(parent, field, errors, path = field) {
  const value = requireString(parent, field, errors, path);
  if (value && (!UTC_TIMESTAMP.test(value) || Number.isNaN(Date.parse(value)))) {
    errors.push(`${path} must be an ISO-8601 UTC timestamp.`);
  }
}

function requirePass(parent, field, errors, path = field) {
  if (parent?.[field] !== 'PASS') errors.push(`${path} must be PASS.`);
}

function rejectEnvironmentReference(value, environment, path, errors) {
  if (typeof value === 'string' && value.toLowerCase().includes(environment)) {
    errors.push(`${path} must not reference ${environment}.`);
  }
}

function rejectSecretFields(value, errors, path = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => rejectSecretFields(entry, errors, [...path, String(index)]));
    return;
  }
  if (!isObject(value)) return;
  for (const [key, entry] of Object.entries(value)) {
    if (SECRET_KEY.test(key) && !SAFE_SECRET_METADATA_FIELDS.has(key)) {
      errors.push(`Secret-like field is forbidden: ${[...path, key].join('.')}.`);
    }
    rejectSecretFields(entry, errors, [...path, key]);
  }
}

function validateReleaseIdentity(identity, errors) {
  if (!isObject(identity)) {
    errors.push('releaseIdentity must be an object.');
    return;
  }
  if (!RELEASE_ID.test(identity.releaseId ?? ''))
    errors.push('releaseIdentity.releaseId is invalid.');
  if (!FULL_SHA.test(identity.commitSha ?? ''))
    errors.push('releaseIdentity.commitSha is invalid.');
  if (!IMMUTABLE_IMAGE.test(identity.imageDigest ?? '')) {
    errors.push('releaseIdentity.imageDigest must be an immutable image reference.');
  }
  requireString(identity, 'stagingRevision', errors, 'releaseIdentity.stagingRevision');
  if (!/^https:\/\/[^\s/]+$/u.test(identity.stagingUrl ?? '')) {
    errors.push('releaseIdentity.stagingUrl must be a canonical HTTPS origin.');
  }
  if (identity.productionRevision !== 'NOT_RUN' || identity.productionUrl !== 'NOT_RUN') {
    errors.push('Part 08 readiness requires Production identity to remain NOT_RUN.');
  }
  const shortSha = identity.releaseId?.split('-').at(-1);
  if (shortSha && !identity.commitSha?.startsWith(shortSha)) {
    errors.push('releaseIdentity release ID suffix must match commitSha.');
  }
}

function validateTerraform(record, identity, errors) {
  const terraform = requireObject(record, 'terraform', errors);
  if (!terraform) return;
  requirePass(terraform, 'status', errors, 'terraform.status');
  requirePass(terraform, 'formatStatus', errors, 'terraform.formatStatus');
  requirePass(terraform, 'validateStatus', errors, 'terraform.validateStatus');
  requirePass(terraform, 'planStatus', errors, 'terraform.planStatus');
  requirePass(terraform, 'policyStatus', errors, 'terraform.policyStatus');
  if (!SHA256.test(terraform.planHash ?? '')) errors.push('terraform.planHash is invalid.');
  if (terraform.backendPrefix !== 'phase-08/production') {
    errors.push('terraform.backendPrefix must be phase-08/production.');
  }
  if (terraform.destroyCount !== 0) errors.push('terraform.destroyCount must equal zero.');
  if (terraform.policyViolationCount !== 0) {
    errors.push('terraform.policyViolationCount must equal zero.');
  }
  if (terraform.imageRef !== identity?.imageDigest) {
    errors.push('terraform.imageRef must match releaseIdentity.imageDigest.');
  }
  if (terraform.applyExecuted !== false) errors.push('terraform.applyExecuted must be false.');
}

function validateSeparation(record, errors) {
  const separation = requireObject(record, 'separation', errors);
  if (!separation) return;
  requirePass(separation, 'status', errors, 'separation.status');
  const exactValues = {
    statePrefix: 'gs://microlearning-tfstate-759791798260/phase-08/production',
    runtimeServiceAccount:
      'ml-runtime-production@microlearning-platform-502716.iam.gserviceaccount.com',
    deployerServiceAccount:
      'ml-github-production@microlearning-platform-502716.iam.gserviceaccount.com',
    serviceName: 'microlearning-production',
    databaseName: 'microlearning_production',
  };
  for (const [field, expected] of Object.entries(exactValues)) {
    if (separation[field] !== expected) errors.push(`separation.${field} must equal ${expected}.`);
  }
  requireString(
    separation,
    'workloadIdentityProvider',
    errors,
    'separation.workloadIdentityProvider',
  );
  requireString(separation, 'databaseUser', errors, 'separation.databaseUser');
  for (const field of [
    'statePrefix',
    'runtimeServiceAccount',
    'deployerServiceAccount',
    'workloadIdentityProvider',
    'serviceName',
    'databaseName',
    'databaseUser',
  ]) {
    rejectEnvironmentReference(separation[field], 'staging', `separation.${field}`, errors);
  }
  if (separation.secretValuesRead !== false) {
    errors.push('separation.secretValuesRead must be false.');
  }
  if (separation.longLivedServiceAccountKeys !== false) {
    errors.push('separation.longLivedServiceAccountKeys must be false.');
  }
  if (
    !Array.isArray(separation.secretIds) ||
    separation.secretIds.length !== PRODUCTION_SECRET_IDS.length ||
    PRODUCTION_SECRET_IDS.some((id) => !separation.secretIds.includes(id))
  ) {
    errors.push('separation.secretIds must contain every Production secret ID exactly once.');
  }
}

function validateAtlas(record, errors) {
  const atlas = requireObject(record, 'atlas', errors);
  if (!atlas) return;
  requirePass(atlas, 'status', errors, 'atlas.status');
  if (atlas.syntheticOnly !== true) errors.push('atlas.syntheticOnly must be true.');
  if (atlas.tls !== true) errors.push('atlas.tls must be true.');
  if (atlas.databaseName !== 'microlearning_production') {
    errors.push('atlas.databaseName must be microlearning_production.');
  }
  requireString(atlas, 'databaseUser', errors, 'atlas.databaseUser');
  if (atlas.applicationRole !== 'readWrite@microlearning_production') {
    errors.push('atlas.applicationRole must be readWrite@microlearning_production.');
  }
  if (!['RESTRICTED_EGRESS', 'TEMPORARY_PUBLIC_WITH_EXPIRY'].includes(atlas.networkPolicy)) {
    errors.push('atlas.networkPolicy is invalid.');
  }
  if (atlas.networkPolicy === 'TEMPORARY_PUBLIC_WITH_EXPIRY') {
    requireUtc(atlas, 'networkReviewExpiresAtUtc', errors, 'atlas.networkReviewExpiresAtUtc');
  }
  const backup = requireObject(atlas, 'logicalBackup', errors);
  if (backup) {
    requirePass(backup, 'status', errors, 'atlas.logicalBackup.status');
    requireString(backup, 'operationId', errors, 'atlas.logicalBackup.operationId');
    requireUtc(backup, 'completedAtUtc', errors, 'atlas.logicalBackup.completedAtUtc');
  }
  const restore = requireObject(atlas, 'isolatedRestore', errors);
  if (restore) {
    requirePass(restore, 'status', errors, 'atlas.isolatedRestore.status');
    requireString(restore, 'operationId', errors, 'atlas.isolatedRestore.operationId');
    requireString(restore, 'targetDatabase', errors, 'atlas.isolatedRestore.targetDatabase');
    if (restore.targetDatabase === atlas.databaseName) {
      errors.push('atlas.isolatedRestore.targetDatabase must be isolated from Production.');
    }
    requirePass(restore, 'integrityStatus', errors, 'atlas.isolatedRestore.integrityStatus');
    if (!['PASS', 'QUARANTINED'].includes(restore.cleanupStatus)) {
      errors.push('atlas.isolatedRestore.cleanupStatus must be PASS or QUARANTINED.');
    }
    requireUtc(restore, 'startedAtUtc', errors, 'atlas.isolatedRestore.startedAtUtc');
    requireUtc(restore, 'completedAtUtc', errors, 'atlas.isolatedRestore.completedAtUtc');
  }
  const pitr = requireObject(atlas, 'managedPitr', errors);
  if (pitr) {
    if (!['PASS', 'APPROVED_NA'].includes(pitr.status)) {
      errors.push('atlas.managedPitr.status must be PASS or APPROVED_NA.');
    }
    if (pitr.status === 'APPROVED_NA') {
      requireString(pitr, 'decisionId', errors, 'atlas.managedPitr.decisionId');
      if (record.releaseProfile !== 'ACADEMIC_DEMO_RELEASE') {
        errors.push('Managed PITR APPROVED_NA is allowed only for ACADEMIC_DEMO_RELEASE.');
      }
    }
  }
  for (const metric of ['rpo', 'rto']) {
    const value = requireObject(atlas, metric, errors);
    if (!value) continue;
    if (!(Number.isFinite(value.targetMinutes) && value.targetMinutes >= 0)) {
      errors.push(`atlas.${metric}.targetMinutes must be a non-negative number.`);
    }
    if (!(Number.isFinite(value.measuredMinutes) && value.measuredMinutes >= 0)) {
      errors.push(`atlas.${metric}.measuredMinutes must be a non-negative number.`);
    }
    if (value.measuredMinutes > value.targetMinutes) {
      errors.push(`atlas.${metric}.measuredMinutes must not exceed targetMinutes.`);
    }
  }
}

function validateRecovery(record, errors) {
  const recovery = requireObject(record, 'recovery', errors);
  if (!recovery) return;
  requirePass(recovery, 'status', errors, 'recovery.status');
  requirePass(recovery, 'schemaCompatibilityStatus', errors, 'recovery.schemaCompatibilityStatus');
  requireString(recovery, 'rollbackOwner', errors, 'recovery.rollbackOwner');
  requireString(recovery, 'runbook', errors, 'recovery.runbook');
  if (!['PRIOR_REVISION_CAPTURED', 'FIRST_DEPLOY_APPROVED'].includes(recovery.priorReleaseStatus)) {
    errors.push('recovery.priorReleaseStatus is invalid.');
  }
  if (recovery.priorReleaseStatus === 'PRIOR_REVISION_CAPTURED') {
    requireString(recovery, 'priorRevision', errors, 'recovery.priorRevision');
    if (!IMMUTABLE_IMAGE.test(recovery.priorImageRef ?? '')) {
      errors.push('recovery.priorImageRef must be immutable.');
    }
  } else {
    requireString(recovery, 'firstDeployDecisionId', errors, 'recovery.firstDeployDecisionId');
  }
}

function validateOperations(record, errors) {
  const operations = requireObject(record, 'operations', errors);
  if (!operations) return;
  requirePass(operations, 'status', errors, 'operations.status');
  for (const field of [
    'budgetAlertId',
    'quotaReviewId',
    'dashboardId',
    'uptimeCheckId',
    'alertRouteTestId',
    'incidentOwner',
    'runbook',
  ]) {
    requireString(operations, field, errors, `operations.${field}`);
  }
}

export function validatePhase08ProductionReadiness(record) {
  const errors = [];
  if (!isObject(record)) return ['Production readiness record must be an object.'];
  if (record.schemaVersion !== 1) errors.push('schemaVersion must equal 1.');
  if (record.phase !== '08') errors.push('phase must equal 08.');
  if (record.recordType !== 'PRODUCTION_READINESS') {
    errors.push('recordType must equal PRODUCTION_READINESS.');
  }
  if (record.status !== 'PASS') errors.push('status must be PASS.');
  if (record.releaseProfile !== 'ACADEMIC_DEMO_RELEASE') {
    errors.push('releaseProfile must be ACADEMIC_DEMO_RELEASE.');
  }
  requireString(record, 'actor', errors);
  requireUtc(record, 'recordedAtUtc', errors);
  if (record.soloProject !== true || record.independentReview !== false) {
    errors.push('Solo governance must set soloProject=true and independentReview=false.');
  }
  if (record.applyMode !== 'PLAN_ONLY' || record.productionApplyExecuted !== false) {
    errors.push('Part 08 must remain PLAN_ONLY with productionApplyExecuted=false.');
  }
  if (record.redactionReviewed !== true) errors.push('redactionReviewed must be true.');
  validateReleaseIdentity(record.releaseIdentity, errors);
  validateTerraform(record, record.releaseIdentity, errors);
  validateSeparation(record, errors);
  validateAtlas(record, errors);
  validateRecovery(record, errors);
  validateOperations(record, errors);
  if (
    !Array.isArray(record.evidenceIds) ||
    record.evidenceIds.length !== REQUIRED_EVIDENCE.length ||
    REQUIRED_EVIDENCE.some((id) => !record.evidenceIds.includes(id))
  ) {
    errors.push('evidenceIds must contain P08-EV-004/006/007/008 exactly once.');
  }
  const serialized = JSON.stringify(record);
  if (/mongodb(?:\+srv)?:\/\//iu.test(serialized)) {
    errors.push('Record must not contain a MongoDB connection URI.');
  }
  rejectSecretFields(record, errors);
  return errors;
}

export function assertValidPhase08ProductionReadiness(record) {
  const errors = validatePhase08ProductionReadiness(record);
  if (errors.length > 0) {
    throw new Error(`Phase 08 Production readiness failed:\n- ${errors.join('\n- ')}`);
  }
  return record;
}

export const PHASE08_PRODUCTION_READINESS = Object.freeze({
  REQUIRED_EVIDENCE,
  PRODUCTION_SECRET_IDS,
});
