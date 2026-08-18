import { validateImageReference } from './release-contract.mjs';

function isIsoTimestamp(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function requireString(value, field, errors) {
  if (typeof value !== 'string' || value.trim() === '')
    errors.push(`${field} must be a non-empty string.`);
}

export function validateRollbackRecord(record, options = {}) {
  const errors = [];
  const repository = options.repository;
  const expectedDecision = options.expectedDecision ?? 'ROLLED_BACK';

  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return ['Rollback record must be a JSON object.'];
  }
  if (record.schemaVersion !== 1) errors.push('schemaVersion must equal 1.');
  if (record.kind !== 'STAGING_ROLLBACK_INCIDENT')
    errors.push('kind must equal STAGING_ROLLBACK_INCIDENT.');
  if (record.environment !== 'staging') errors.push('environment must equal staging.');
  if (record.decision !== expectedDecision) errors.push(`decision must equal ${expectedDecision}.`);
  if (repository && record.repository !== repository)
    errors.push('repository does not match the trusted repository.');

  for (const field of ['repository', 'incidentId', 'workflowRunId', 'serviceUrl', 'reason']) {
    requireString(record[field], field, errors);
  }
  if (!/^p07-incident-[a-z0-9-]+$/u.test(record.incidentId ?? '')) {
    errors.push('incidentId must use the p07-incident-<id> format.');
  }
  if (!/^[1-9][0-9]*$/u.test(record.workflowRunId ?? ''))
    errors.push('workflowRunId must be numeric.');

  try {
    const url = new URL(record.serviceUrl);
    if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash) {
      errors.push('serviceUrl must be an HTTPS origin without path/query/hash.');
    }
  } catch {
    errors.push('serviceUrl must be a valid URL.');
  }

  for (const [section, value] of [
    ['failed', record.failed],
    ['restored', record.restored],
  ]) {
    if (!value || typeof value !== 'object') {
      errors.push(`${section} must be an object.`);
      continue;
    }
    requireString(value.revision, `${section}.revision`, errors);
    requireString(value.imageRef, `${section}.imageRef`, errors);
    try {
      validateImageReference(value.imageRef);
    } catch (error) {
      errors.push(`${section}.imageRef: ${error.message}`);
    }
  }
  if (record.failed?.revision === record.restored?.revision)
    errors.push('failed and restored revisions must differ.');
  if (record.failed?.imageRef === record.restored?.imageRef)
    errors.push('failed and restored image refs must differ.');

  for (const field of ['detectedAt', 'decidedAt', 'recoveredAt']) {
    if (!isIsoTimestamp(record[field])) errors.push(`${field} must be an ISO timestamp.`);
  }
  if (typeof record.metrics !== 'object' || !record.metrics) {
    errors.push('metrics must be an object.');
  } else {
    for (const field of ['detectionSeconds', 'decisionSeconds', 'recoverySeconds']) {
      if (!Number.isFinite(record.metrics[field]) || record.metrics[field] < 0) {
        errors.push(`metrics.${field} must be a non-negative number.`);
      }
    }
  }
  if (typeof record.evidence !== 'object' || !record.evidence)
    errors.push('evidence must be an object.');
  if (record.dataMode !== 'SYNTHETIC_ONLY') errors.push('dataMode must equal SYNTHETIC_ONLY.');
  if (record.nextAction !== 'NORMAL_PIPELINE_RESTORE_AFTER_FIX') {
    errors.push('nextAction must require a normal pipeline restore after the fix.');
  }

  return errors;
}

export function assertValidRollbackRecord(record, options = {}) {
  const errors = validateRollbackRecord(record, options);
  if (errors.length) throw new Error(`Rollback record contract failed:\n- ${errors.join('\n- ')}`);
  return record;
}
