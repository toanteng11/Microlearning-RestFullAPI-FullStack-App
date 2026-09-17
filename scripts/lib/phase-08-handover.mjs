import {
  isObject,
  rejectSecrets,
  requireSha256,
  requireString,
  requireUtc,
  validateEnvelope,
  validateExactEvidenceIds,
} from './phase-08-evidence-utils.mjs';

const AUDIENCES = Object.freeze([
  'STUDENT',
  'TEACHER',
  'ADMIN',
  'SUPER_ADMIN_OPERATIONS',
  'SUPPORT',
]);
const OPERATIONS_CHECKS = Object.freeze([
  'CURRENT_RELEASE_IDENTITY',
  'HEALTH_AND_READINESS',
  'LOGS_AND_ALERTS',
  'SECRET_ROTATION',
  'BACKUP_AND_RESTORE',
  'ROLLBACK_AND_ESCALATION',
]);
const COMMUNICATIONS = Object.freeze(['RELEASE_NOTE', 'SUPPORT_ROUTE', 'HYPERCARE_CLOSURE']);

function validateExactNamedEntries(entries, expected, field, errors, validateEntry) {
  if (!Array.isArray(entries) || entries.length !== expected.length) {
    errors.push(`${field} must contain exactly ${expected.length} entries.`);
    return;
  }
  const identifier =
    field === 'materials' ? 'audience' : field === 'communications' ? 'type' : 'id';
  const names = entries.map((entry) => entry?.[identifier]);
  if (new Set(names).size !== expected.length || expected.some((name) => !names.includes(name))) {
    errors.push(`${field} must contain exactly: ${expected.join(', ')}.`);
  }
  entries.forEach((entry, index) => validateEntry(entry, index));
}

export function validatePhase08Handover(record) {
  const errors = [];
  if (!validateEnvelope(record, 'OPERATIONS_HANDOVER', errors)) return errors;
  if (record.releaseProfile !== 'ACADEMIC_DEMO_RELEASE') {
    errors.push('releaseProfile must equal ACADEMIC_DEMO_RELEASE.');
  }
  requireSha256(record, 'postReleaseObservationSha256', errors);

  const support = record.supportModel;
  if (!isObject(support)) {
    errors.push('supportModel must be an object.');
  } else {
    requireString(support, 'ownerName', errors, 'supportModel.ownerName');
    requireString(support, 'contactChannel', errors, 'supportModel.contactChannel');
    requireString(support, 'supportWindow', errors, 'supportModel.supportWindow');
    requireString(support, 'responseExpectation', errors, 'supportModel.responseExpectation');
    if (/24\s*\/\s*7/iu.test(support.supportWindow ?? '')) {
      errors.push('supportModel.supportWindow must not claim a 24/7 organizational SLA.');
    }
    if (support.coverage !== 'OWNER_MANAGED_ACADEMIC_DEMO') {
      errors.push('supportModel.coverage must equal OWNER_MANAGED_ACADEMIC_DEMO.');
    }
    if (support.noOrganizationalSla !== true) {
      errors.push('supportModel.noOrganizationalSla must be true.');
    }
  }

  validateExactNamedEntries(record.materials, AUDIENCES, 'materials', errors, (entry, index) => {
    const path = `materials[${index}]`;
    if (!isObject(entry)) {
      errors.push(`${path} must be an object.`);
      return;
    }
    if (entry.status !== 'ACKNOWLEDGED') errors.push(`${path}.status must equal ACKNOWLEDGED.`);
    requireString(entry, 'materialPath', errors, `${path}.materialPath`);
    requireSha256(entry, 'materialSha256', errors, `${path}.materialSha256`);
    requireUtc(entry, 'acknowledgedAtUtc', errors, `${path}.acknowledgedAtUtc`);
  });

  validateExactNamedEntries(
    record.operationsChecks,
    OPERATIONS_CHECKS,
    'operationsChecks',
    errors,
    (entry, index) => {
      const path = `operationsChecks[${index}]`;
      if (!isObject(entry)) {
        errors.push(`${path} must be an object.`);
        return;
      }
      if (entry.status !== 'PASS') errors.push(`${path}.status must equal PASS.`);
      requireString(entry, 'evidence', errors, `${path}.evidence`);
    },
  );

  validateExactNamedEntries(
    record.communications,
    COMMUNICATIONS,
    'communications',
    errors,
    (entry, index) => {
      const path = `communications[${index}]`;
      if (!isObject(entry)) {
        errors.push(`${path} must be an object.`);
        return;
      }
      if (entry.status !== 'PUBLISHED') errors.push(`${path}.status must equal PUBLISHED.`);
      requireString(entry, 'audience', errors, `${path}.audience`);
      requireString(entry, 'channel', errors, `${path}.channel`);
      requireUtc(entry, 'publishedAtUtc', errors, `${path}.publishedAtUtc`);
      requireString(entry, 'evidence', errors, `${path}.evidence`);
    },
  );

  if (!Array.isArray(record.knownIssues)) {
    errors.push('knownIssues must be an array.');
  } else {
    record.knownIssues.forEach((issue, index) => {
      const path = `knownIssues[${index}]`;
      if (!isObject(issue)) {
        errors.push(`${path} must be an object.`);
        return;
      }
      requireString(issue, 'id', errors, `${path}.id`);
      requireString(issue, 'owner', errors, `${path}.owner`);
      requireString(issue, 'workaround', errors, `${path}.workaround`);
      requireUtc(issue, 'targetUtc', errors, `${path}.targetUtc`);
      if (!['OPEN_ACCEPTED', 'CLOSED'].includes(issue.status)) {
        errors.push(`${path}.status must be OPEN_ACCEPTED or CLOSED.`);
      }
      if (['CRITICAL', 'HIGH'].includes(issue.severity) && issue.status !== 'CLOSED') {
        errors.push(`${path} Critical/High issue must be CLOSED.`);
      }
    });
  }

  requireUtc(record, 'acceptedAtUtc', errors);
  validateExactEvidenceIds(record.evidenceIds, ['P08-EV-044'], errors);
  rejectSecrets(record, errors);
  return errors;
}

export function assertValidPhase08Handover(record) {
  const errors = validatePhase08Handover(record);
  if (errors.length > 0)
    throw new Error(`Phase 08 handover evidence failed:\n- ${errors.join('\n- ')}`);
  return record;
}

export const PHASE08_HANDOVER = Object.freeze({ AUDIENCES, OPERATIONS_CHECKS, COMMUNICATIONS });
