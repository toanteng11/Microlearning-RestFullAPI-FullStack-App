const FULL_SHA = /^[a-f0-9]{40}$/iu;
const IMAGE_DIGEST = /^[^\s@]+(?:\/[^\s@]+)*@sha256:[a-f0-9]{64}$/iu;
const HTTPS_URL = /^https:\/\/[^\s]+$/iu;
const RELEASE_ID = /^P08-RC-\d{8}-[a-f0-9]{7,12}$/iu;
const PLACEHOLDER =
  /pending-value|replace-me|example-only|<[^>]+>|\btodo\b|\btbd\b|\bplaceholder\b/iu;
const SECRET_KEY = /password|token|secret|private[_-]?key|authorization|mongodb(?:uri|_uri)?/iu;

export const PHASE08_RELEASE_PROFILES = Object.freeze([
  'ACADEMIC_DEMO_RELEASE',
  'ORGANIZATION_PRODUCTION',
]);
export const PHASE08_ACCEPTANCE_STAGES = Object.freeze(['PRE_RELEASE', 'FINAL']);
export const PHASE08_CRITERIA = Object.freeze(
  Array.from({ length: 14 }, (_, index) => `P08-AC-${String(index + 1).padStart(3, '0')}`),
);
export const PHASE08_UAT_SCENARIOS = Object.freeze(
  Array.from({ length: 32 }, (_, index) => `P08-UT-${String(index + 1).padStart(3, '0')}`),
);
const PHASE08_UAT_PERSONAS = Object.freeze([
  'GUEST',
  'STUDENT_A',
  'STUDENT_B',
  'TEACHER_A',
  'TEACHER_B',
  'ADMIN',
  'SUPER_ADMIN',
  'QA_DEVOPS',
]);
export const PHASE08_PRE_RELEASE_CRITERIA = Object.freeze(PHASE08_CRITERIA.slice(0, 10));
export const PHASE08_EVIDENCE = Object.freeze([
  'P08-EV-001',
  'P08-EV-002',
  'P08-EV-003',
  'P08-EV-004',
  'P08-EV-005',
  'P08-EV-006',
  'P08-EV-007',
  'P08-EV-008',
  'P08-EV-010',
  'P08-EV-015',
  'P08-EV-016',
  'P08-EV-020',
  'P08-EV-025',
  'P08-EV-026',
  'P08-EV-030',
  'P08-EV-031',
  'P08-EV-037',
  'P08-EV-038',
  'P08-EV-039',
  'P08-EV-040',
  'P08-EV-044',
  'P08-EV-050',
  'P08-EV-055',
]);
const POST_RELEASE_EVIDENCE = new Set([
  'P08-EV-030',
  'P08-EV-031',
  'P08-EV-037',
  'P08-EV-038',
  'P08-EV-039',
  'P08-EV-040',
  'P08-EV-044',
  'P08-EV-050',
  'P08-EV-055',
]);
export const PHASE08_PRE_RELEASE_EVIDENCE = Object.freeze(
  PHASE08_EVIDENCE.filter((id) => !POST_RELEASE_EVIDENCE.has(id)),
);

const RESULT_STATUSES = new Set([
  'PASS',
  'FAIL',
  'BLOCKED',
  'NOT RUN',
  'WAIVED',
  'APPROVED_NA',
  'PENDING',
]);
const DECISIONS = new Set(['GO', 'CONDITIONAL_GO', 'NO_GO', 'ROLLED_BACK', 'PENDING']);
const RECOMMENDATIONS = new Set(['GO', 'CONDITIONAL_GO', 'NO_GO', 'PENDING']);
const PRODUCTION_STATUSES = new Set(['ACTUAL', 'NOT_RUN', 'BLOCKED', 'ROLLED_BACK', 'PENDING']);
const PROFILE_STATUSES = new Set(['CONFIRMED', 'PENDING']);
const ROLE_FIELDS = ['productOwner', 'businessAnalyst', 'technicalLead', 'qa', 'devOps', 'support'];

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasPlaceholder(value) {
  return typeof value === 'string' && PLACEHOLDER.test(value);
}

function addRequiredString(input, field, errors, { actual = false, path = field } = {}) {
  const value = input?.[field];
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string.`);
    return false;
  }
  if (actual && hasPlaceholder(value)) errors.push(`${path} contains a placeholder.`);
  return true;
}

function addHttps(input, field, errors, { actual = false, path = field } = {}) {
  if (addRequiredString(input, field, errors, { actual, path }) && !HTTPS_URL.test(input[field])) {
    errors.push(`${path} must be an HTTPS URL.`);
  }
}

function addUtcTimestamp(input, field, errors, { actual = false, path = field } = {}) {
  if (!addRequiredString(input, field, errors, { actual, path })) return;
  const value = input[field];
  if (Number.isNaN(Date.parse(value)) || !value.endsWith('Z')) {
    errors.push(`${path} must be a valid UTC ISO-8601 timestamp ending in Z.`);
  }
}

function addStringArray(input, field, errors, { allowEmpty = false, actual = false } = {}) {
  const value = input?.[field];
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    errors.push(`${field} must be ${allowEmpty ? 'an' : 'a non-empty'} array.`);
    return;
  }
  value.forEach((entry, index) => {
    if (typeof entry !== 'string' || entry.trim() === '') {
      errors.push(`${field}[${index}] must be a non-empty string.`);
    } else if (actual && hasPlaceholder(entry)) {
      errors.push(`${field}[${index}] contains a placeholder.`);
    }
  });
}

function validateIdentityShape(identity, errors, { actual = false } = {}) {
  if (!isObject(identity)) {
    errors.push('releaseIdentity must be a JSON object.');
    return;
  }
  for (const field of ['releaseId', 'commitSha', 'imageDigest', 'stagingRevision']) {
    addRequiredString(identity, field, errors, {
      actual,
      path: `releaseIdentity.${field}`,
    });
  }
  if (!RELEASE_ID.test(identity.releaseId ?? '')) {
    errors.push('releaseIdentity.releaseId must match P08-RC-<UTC-date>-<short-sha>.');
  }
  if (!FULL_SHA.test(identity.commitSha ?? '')) {
    errors.push('releaseIdentity.commitSha must be a full Git SHA.');
  }
  if (!IMAGE_DIGEST.test(identity.imageDigest ?? '')) {
    errors.push('releaseIdentity.imageDigest must be an immutable image digest.');
  }
  addHttps(identity, 'stagingUrl', errors, {
    actual,
    path: 'releaseIdentity.stagingUrl',
  });
  if (identity.productionRevision !== undefined && identity.productionRevision !== null) {
    if (identity.productionRevision !== 'NOT_RUN') {
      addRequiredString(identity, 'productionRevision', errors, {
        actual,
        path: 'releaseIdentity.productionRevision',
      });
    }
  }
  if (identity.productionUrl !== undefined && identity.productionUrl !== null) {
    if (identity.productionUrl !== 'NOT_RUN') {
      addHttps(identity, 'productionUrl', errors, {
        actual,
        path: 'releaseIdentity.productionUrl',
      });
    }
  }
}

function validateEnvelope(input, kind, errors) {
  if (!isObject(input)) {
    errors.push(`${kind} record must be a JSON object.`);
    return false;
  }
  if (input.schemaVersion !== 1) errors.push('schemaVersion must equal 1.');
  if (input.phase !== '08') errors.push('phase must equal 08.');
  return true;
}

function validateEvidenceEntries(entries, errors) {
  if (!Array.isArray(entries) || entries.length !== PHASE08_EVIDENCE.length) {
    errors.push(`evidence must contain exactly ${PHASE08_EVIDENCE.length} entries.`);
    return;
  }
  const ids = new Set();
  for (const [index, entry] of entries.entries()) {
    const field = `evidence[${index}]`;
    if (!isObject(entry)) {
      errors.push(`${field} must be an object.`);
      continue;
    }
    addRequiredString(entry, 'id', errors, { path: `${field}.id` });
    if (ids.has(entry.id)) errors.push(`${field}.id must be unique.`);
    ids.add(entry.id);
    if (!PHASE08_EVIDENCE.includes(entry.id)) {
      errors.push(`${field}.id is not a Phase 08 evidence ID.`);
    }
    if (!RESULT_STATUSES.has(entry.status)) errors.push(`${field}.status is invalid.`);
    if (entry.status === 'PASS') {
      addRequiredString(entry, 'artifact', errors, { actual: true, path: `${field}.artifact` });
      addUtcTimestamp(entry, 'recordedAtUtc', errors, {
        actual: true,
        path: `${field}.recordedAtUtc`,
      });
      addRequiredString(entry, 'actor', errors, { actual: true, path: `${field}.actor` });
      addRequiredString(entry, 'expectedResult', errors, {
        actual: true,
        path: `${field}.expectedResult`,
      });
      addRequiredString(entry, 'actualResult', errors, {
        actual: true,
        path: `${field}.actualResult`,
      });
      if (entry.redactionReviewed !== true) {
        errors.push(`${field}.redactionReviewed must be true for PASS evidence.`);
      }
    } else if (entry.status !== 'PENDING') {
      addRequiredString(entry, 'disposition', errors, {
        actual: true,
        path: `${field}.disposition`,
      });
    }
  }
  if (ids.size !== PHASE08_EVIDENCE.length || PHASE08_EVIDENCE.some((id) => !ids.has(id))) {
    errors.push('evidence must contain every Phase 08 evidence ID exactly once.');
  }
}

function validateCriteriaEntries(entries, errors) {
  if (!Array.isArray(entries) || entries.length !== PHASE08_CRITERIA.length) {
    errors.push(`acceptanceCriteria must contain exactly ${PHASE08_CRITERIA.length} entries.`);
    return;
  }
  const ids = new Set();
  for (const [index, entry] of entries.entries()) {
    const field = `acceptanceCriteria[${index}]`;
    if (!isObject(entry)) {
      errors.push(`${field} must be an object.`);
      continue;
    }
    addRequiredString(entry, 'id', errors, { path: `${field}.id` });
    if (ids.has(entry.id)) errors.push(`${field}.id must be unique.`);
    ids.add(entry.id);
    if (!PHASE08_CRITERIA.includes(entry.id)) {
      errors.push(`${field}.id is not a Phase 08 acceptance ID.`);
    }
    if (!RESULT_STATUSES.has(entry.status)) errors.push(`${field}.status is invalid.`);
    if (entry.status === 'PASS') {
      if (!Array.isArray(entry.evidenceIds) || entry.evidenceIds.length === 0) {
        errors.push(`${field}.evidenceIds is required for PASS.`);
      }
      if (entry.evidenceIds?.some((id) => !PHASE08_EVIDENCE.includes(id))) {
        errors.push(`${field}.evidenceIds contains an unknown evidence ID.`);
      }
    } else if (entry.status !== 'PENDING') {
      addRequiredString(entry, 'disposition', errors, {
        actual: true,
        path: `${field}.disposition`,
      });
    }
  }
  if (ids.size !== PHASE08_CRITERIA.length || PHASE08_CRITERIA.some((id) => !ids.has(id))) {
    errors.push('acceptanceCriteria must contain every Phase 08 criterion exactly once.');
  }
}

function validateAcceptanceEvidenceLinks(input, errors) {
  if (!Array.isArray(input.acceptanceCriteria) || !Array.isArray(input.evidence)) return;
  const statusById = new Map(input.evidence.map((entry) => [entry?.id, entry?.status]));
  input.acceptanceCriteria.forEach((criterion, index) => {
    if (criterion?.status !== 'PASS' || !Array.isArray(criterion.evidenceIds)) return;
    criterion.evidenceIds.forEach((id) => {
      if (statusById.get(id) !== 'PASS') {
        errors.push(`acceptanceCriteria[${index}] references evidence ${id} that is not PASS.`);
      }
    });
  });
}

function validateCounts(input, errors, field = 'summary') {
  if (!isObject(input)) {
    errors.push(`${field} must be an object.`);
    return;
  }
  const countFields = [
    'mustTotal',
    'mustPassed',
    'passCount',
    'failCount',
    'blockedCount',
    'notRunCount',
    'waivedCount',
  ];
  for (const key of countFields) {
    if (!Number.isInteger(input[key]) || input[key] < 0) {
      errors.push(`${field}.${key} must be a non-negative integer.`);
    }
  }
  if (input.mustPassed !== input.passCount) {
    errors.push(`${field}.mustPassed must equal ${field}.passCount.`);
  }
  const total =
    input.passCount + input.failCount + input.blockedCount + input.notRunCount + input.waivedCount;
  if (Number.isInteger(input.mustTotal) && total !== input.mustTotal) {
    errors.push(`${field} status counts must equal ${field}.mustTotal.`);
  }
}

function rejectPlaceholderFinal(input, errors, path = '$') {
  if (typeof input === 'string') {
    if (hasPlaceholder(input)) errors.push(`${path} contains a placeholder in a final record.`);
    return;
  }
  if (Array.isArray(input)) {
    input.forEach((value, index) => rejectPlaceholderFinal(value, errors, `${path}[${index}]`));
    return;
  }
  if (isObject(input)) {
    Object.entries(input).forEach(([key, value]) =>
      rejectPlaceholderFinal(value, errors, `${path}.${key}`),
    );
  }
}

function validateGovernance(governance, errors, { recommendations = false } = {}) {
  if (!isObject(governance)) {
    errors.push('governance must be an object.');
    return;
  }
  if (typeof governance.soloProject !== 'boolean') {
    errors.push('governance.soloProject must be a boolean.');
  }
  if (typeof governance.independentReview !== 'boolean') {
    errors.push('governance.independentReview must be a boolean.');
  }
  if (governance.soloProject === true && governance.independentReview !== false) {
    errors.push('A solo project must set governance.independentReview to false.');
  }
  addRequiredString(governance, 'actor', errors, {
    actual: true,
    path: 'governance.actor',
  });
  if (!recommendations) {
    if (!isObject(governance.roleAssignments)) {
      errors.push('governance.roleAssignments must be an object.');
    } else {
      ROLE_FIELDS.forEach((field) =>
        addRequiredString(governance.roleAssignments, field, errors, {
          actual: true,
          path: `governance.roleAssignments.${field}`,
        }),
      );
    }
  }
}

function validateActualRecordMetadata(input, errors, actual) {
  if (!actual) return;
  addRequiredString(input, 'releaseId', errors, { actual: true });
  if (input.releaseId !== input.releaseIdentity?.releaseId) {
    errors.push('releaseId must match releaseIdentity.releaseId.');
  }
  addRequiredString(input, 'actor', errors, { actual: true });
  addUtcTimestamp(input, 'recordedAtUtc', errors, { actual: true });
  if (input.redactionReviewed !== true) {
    errors.push('redactionReviewed must be true for an actual release record.');
  }
}

export function validatePhase08Profile(input) {
  const errors = [];
  if (!validateEnvelope(input, 'Phase 08 release profile', errors)) return errors;
  if (!PROFILE_STATUSES.has(input.status)) errors.push('status is invalid.');
  if (!PHASE08_RELEASE_PROFILES.includes(input.releaseProfile)) {
    errors.push(`releaseProfile must be one of: ${PHASE08_RELEASE_PROFILES.join(', ')}.`);
  }
  addRequiredString(input, 'releaseId', errors, { actual: input.status === 'CONFIRMED' });
  if (!RELEASE_ID.test(input.releaseId ?? '')) {
    errors.push('releaseId must match P08-RC-<UTC-date>-<short-sha>.');
  }
  addRequiredString(input, 'rationale', errors, { actual: input.status === 'CONFIRMED' });
  addRequiredString(input, 'owner', errors, { actual: input.status === 'CONFIRMED' });
  addRequiredString(input, 'studentId', errors, { actual: input.status === 'CONFIRMED' });
  addUtcTimestamp(input, 'confirmedAtUtc', errors, { actual: input.status === 'CONFIRMED' });
  addStringArray(input, 'includedScope', errors, { actual: input.status === 'CONFIRMED' });
  addStringArray(input, 'conditionalCapabilities', errors, {
    allowEmpty: true,
    actual: input.status === 'CONFIRMED',
  });
  addStringArray(input, 'excludedScope', errors, { actual: input.status === 'CONFIRMED' });
  addStringArray(input, 'residualRiskIds', errors, { actual: input.status === 'CONFIRMED' });
  addStringArray(input, 'stopConditions', errors, { actual: input.status === 'CONFIRMED' });
  validateGovernance(input.governance, errors);

  if (!isObject(input.artifactRetention)) {
    errors.push('artifactRetention must be an object.');
  } else {
    addRequiredString(input.artifactRetention, 'root', errors, {
      actual: input.status === 'CONFIRMED',
      path: 'artifactRetention.root',
    });
    if (
      !Number.isInteger(input.artifactRetention.retentionDays) ||
      input.artifactRetention.retentionDays <= 0
    ) {
      errors.push('artifactRetention.retentionDays must be a positive integer.');
    }
  }

  if (input.releaseProfile === 'ACADEMIC_DEMO_RELEASE') {
    if (input.dataMode !== 'SYNTHETIC_ONLY') {
      errors.push('ACADEMIC_DEMO_RELEASE requires dataMode SYNTHETIC_ONLY.');
    }
    if (input.productionClaim !== 'PRODUCTION_LIKE_ACADEMIC_DEMO') {
      errors.push('ACADEMIC_DEMO_RELEASE requires productionClaim PRODUCTION_LIKE_ACADEMIC_DEMO.');
    }
  }
  if (
    input.releaseProfile === 'ORGANIZATION_PRODUCTION' &&
    input.productionClaim !== 'ORGANIZATION_PRODUCTION'
  ) {
    errors.push('ORGANIZATION_PRODUCTION requires matching productionClaim.');
  }
  if (input.status === 'CONFIRMED') rejectPlaceholderFinal(input, errors);
  return errors;
}

export function validatePhase08Identity(input, { actual = false } = {}) {
  const errors = [];
  if (!validateEnvelope(input, 'Phase 08 identity', errors)) return errors;
  validateIdentityShape(input.releaseIdentity ?? input, errors, { actual });
  return errors;
}

export function validatePhase08Acceptance(input) {
  const errors = [];
  if (!validateEnvelope(input, 'Phase 08 acceptance/evidence', errors)) return errors;
  if (!PHASE08_ACCEPTANCE_STAGES.includes(input.acceptanceStage)) {
    errors.push(`acceptanceStage must be one of: ${PHASE08_ACCEPTANCE_STAGES.join(', ')}.`);
  }
  if (!RESULT_STATUSES.has(input.status)) errors.push('status is invalid.');
  validateIdentityShape(input.releaseIdentity, errors, { actual: input.status === 'PASS' });
  if (input.status !== 'PASS') {
    addRequiredString(input, 'releaseId', errors);
    if (input.releaseId !== undefined && input.releaseId !== input.releaseIdentity?.releaseId) {
      errors.push('releaseId must match releaseIdentity.releaseId.');
    }
  }
  validateActualRecordMetadata(input, errors, input.status === 'PASS');
  validateCriteriaEntries(input.acceptanceCriteria, errors);
  validateEvidenceEntries(input.evidence, errors);
  validateAcceptanceEvidenceLinks(input, errors);

  if (input.status === 'PASS' && input.acceptanceStage === 'PRE_RELEASE') {
    const criterionStatus = new Map(
      input.acceptanceCriteria?.map((entry) => [entry.id, entry.status]),
    );
    const evidenceStatus = new Map(input.evidence?.map((entry) => [entry.id, entry.status]));
    if (PHASE08_PRE_RELEASE_CRITERIA.some((id) => criterionStatus.get(id) !== 'PASS')) {
      errors.push('PRE_RELEASE PASS requires P08-AC-001 through P08-AC-010 to be PASS.');
    }
    if (PHASE08_CRITERIA.slice(10).some((id) => criterionStatus.get(id) !== 'PENDING')) {
      errors.push(
        'PRE_RELEASE PASS requires post-deployment criteria P08-AC-011 through 014 to be PENDING.',
      );
    }
    if (PHASE08_PRE_RELEASE_EVIDENCE.some((id) => evidenceStatus.get(id) !== 'PASS')) {
      errors.push('PRE_RELEASE PASS requires all G0-G4 evidence to be PASS.');
    }
    const futureEvidence = PHASE08_EVIDENCE.filter(
      (id) => !PHASE08_PRE_RELEASE_EVIDENCE.includes(id),
    );
    if (futureEvidence.some((id) => evidenceStatus.get(id) !== 'PENDING')) {
      errors.push('PRE_RELEASE PASS requires G5-G8 evidence to remain PENDING.');
    }
    rejectPlaceholderFinal(input, errors);
  }

  if (input.status === 'PASS' && input.acceptanceStage === 'FINAL') {
    if (input.acceptanceCriteria?.some((entry) => entry.status !== 'PASS')) {
      errors.push('FINAL PASS requires every criterion to be PASS.');
    }
    if (input.evidence?.some((entry) => entry.status !== 'PASS')) {
      errors.push('FINAL PASS requires every evidence entry to be PASS.');
    }
    rejectPlaceholderFinal(input, errors);
  }
  return errors;
}

export function validatePhase08SystemTest(input) {
  const errors = [];
  if (!validateEnvelope(input, 'Phase 08 System Test summary', errors)) return errors;
  validateIdentityShape(input.releaseIdentity, errors, { actual: input.status === 'PASS' });
  validateActualRecordMetadata(input, errors, input.status === 'PASS');
  validateCounts(input.summary, errors);
  for (const field of ['criticalDefects', 'highDefects']) {
    if (!Number.isInteger(input[field]) || input[field] < 0) {
      errors.push(`${field} must be a non-negative integer.`);
    }
  }
  addStringArray(input, 'evidenceIds', errors);
  if (input.evidenceIds?.some((id) => !PHASE08_EVIDENCE.includes(id))) {
    errors.push('evidenceIds contains an unknown Phase 08 evidence ID.');
  }
  if (!['PASS', 'FAIL', 'BLOCKED', 'NOT RUN', 'PENDING'].includes(input.status)) {
    errors.push('status is invalid.');
  }
  if (input.status === 'PASS') {
    if (input.summary?.mustPassed !== input.summary?.mustTotal) {
      errors.push('System Test PASS requires all Must tests to pass.');
    }
    if (input.criticalDefects !== 0 || input.highDefects !== 0) {
      errors.push('System Test PASS requires Critical and High defects to equal zero.');
    }
    rejectPlaceholderFinal(input, errors);
  }
  return errors;
}

export function validatePhase08Uat(input) {
  const errors = [];
  if (!validateEnvelope(input, 'Phase 08 UAT summary', errors)) return errors;
  validateIdentityShape(input.releaseIdentity, errors, { actual: input.status === 'PASS' });
  validateActualRecordMetadata(input, errors, input.status === 'PASS');
  validateCounts(input.summary, errors);
  for (const field of ['criticalDefects', 'highDefects']) {
    if (!Number.isInteger(input[field]) || input[field] < 0) {
      errors.push(`${field} must be a non-negative integer.`);
    }
  }
  addStringArray(input, 'evidenceIds', errors);
  if (input.evidenceIds?.some((id) => !PHASE08_EVIDENCE.includes(id))) {
    errors.push('evidenceIds contains an unknown Phase 08 evidence ID.');
  }
  if (!['PASS', 'FAIL', 'BLOCKED', 'NOT RUN', 'WAIVED', 'PENDING'].includes(input.status)) {
    errors.push('status is invalid.');
  }
  if (input.status === 'PASS') {
    addRequiredString(input, 'uatRunId', errors, { actual: true });
    addUtcTimestamp(input, 'startedAtUtc', errors, { actual: true });
    addUtcTimestamp(input, 'endedAtUtc', errors, { actual: true });
    if (input.dataMode !== 'SYNTHETIC') errors.push('UAT PASS requires dataMode SYNTHETIC.');
    if (input.executionModel !== 'SOLO_ROLE_SIMULATION') {
      errors.push('UAT PASS requires executionModel SOLO_ROLE_SIMULATION.');
    }
    validateGovernance(input.governance, errors, { recommendations: true });
    if (!isObject(input.recommendations)) {
      errors.push('recommendations must be an object.');
    } else {
      for (const role of ['qa', 'business', 'technical']) {
        if (input.recommendations[role] !== 'GO') {
          errors.push(`recommendations.${role} must be GO for UAT PASS.`);
        }
      }
    }
    if (
      !Array.isArray(input.scenarios) ||
      input.scenarios.length !== PHASE08_UAT_SCENARIOS.length
    ) {
      errors.push(`UAT PASS requires exactly ${PHASE08_UAT_SCENARIOS.length} scenarios.`);
    } else {
      const ids = new Set();
      input.scenarios.forEach((scenario, index) => {
        const field = `scenarios[${index}]`;
        if (!isObject(scenario)) {
          errors.push(`${field} must be an object.`);
          return;
        }
        addRequiredString(scenario, 'id', errors, { path: `${field}.id` });
        if (!PHASE08_UAT_SCENARIOS.includes(scenario.id)) {
          errors.push(`${field}.id is not a Phase 08 UAT scenario.`);
        }
        if (ids.has(scenario.id)) errors.push(`${field}.id must be unique.`);
        ids.add(scenario.id);
        const expectedPriority = scenario.id === 'P08-UT-027' ? 'CONDITIONAL' : 'MUST';
        if (scenario.priority !== expectedPriority) {
          errors.push(`${field}.priority must be ${expectedPriority}.`);
        }
        addRequiredString(scenario, 'persona', errors, { actual: true, path: `${field}.persona` });
        addRequiredString(scenario, 'expected', errors, {
          actual: true,
          path: `${field}.expected`,
        });
        addRequiredString(scenario, 'actual', errors, { actual: true, path: `${field}.actual` });
        addRequiredString(scenario, 'evidence', errors, {
          actual: true,
          path: `${field}.evidence`,
        });
        addUtcTimestamp(scenario, 'testedAtUtc', errors, {
          actual: true,
          path: `${field}.testedAtUtc`,
        });
        if (scenario.priority === 'MUST' && scenario.status !== 'PASS') {
          errors.push(`${field} is Must and must PASS.`);
        }
        if (
          scenario.priority === 'CONDITIONAL' &&
          !['PASS', 'APPROVED_NA'].includes(scenario.status)
        ) {
          errors.push(`${field} conditional status must be PASS or APPROVED_NA.`);
        }
        if (scenario.status === 'APPROVED_NA') {
          addRequiredString(scenario, 'decisionId', errors, {
            actual: true,
            path: `${field}.decisionId`,
          });
        }
      });
      if (PHASE08_UAT_SCENARIOS.some((id) => !ids.has(id))) {
        errors.push('UAT PASS must contain every P08-UT-001..032 scenario exactly once.');
      }
    }
    if (!Array.isArray(input.personas) || input.personas.length !== PHASE08_UAT_PERSONAS.length) {
      errors.push(`UAT PASS requires exactly ${PHASE08_UAT_PERSONAS.length} personas.`);
    } else {
      const personaIds = new Set();
      input.personas.forEach((persona, index) => {
        const field = `personas[${index}]`;
        if (!isObject(persona)) {
          errors.push(`${field} must be an object.`);
          return;
        }
        if (!PHASE08_UAT_PERSONAS.includes(persona.id)) {
          errors.push(`${field}.id is not a required Phase 08 persona.`);
        }
        if (personaIds.has(persona.id)) errors.push(`${field}.id must be unique.`);
        personaIds.add(persona.id);
        addRequiredString(persona, 'role', errors, { actual: true, path: `${field}.role` });
        if (persona.sessionIsolation !== 'SEPARATE_CONTEXT') {
          errors.push(`${field}.sessionIsolation must be SEPARATE_CONTEXT.`);
        }
        if (persona.synthetic !== true) errors.push(`${field}.synthetic must be true.`);
        if (persona.loginVerified !== true) errors.push(`${field}.loginVerified must be true.`);
      });
      if (PHASE08_UAT_PERSONAS.some((id) => !personaIds.has(id))) {
        errors.push('UAT PASS must contain every required persona exactly once.');
      }
    }
    if (!Array.isArray(input.defects)) {
      errors.push(
        'UAT PASS requires a defect register array, including an empty array when clean.',
      );
    } else {
      const openCritical = input.defects.filter(
        (defect) => defect?.severity === 'CRITICAL' && ['OPEN', 'FIXED'].includes(defect?.status),
      ).length;
      const openHigh = input.defects.filter(
        (defect) => defect?.severity === 'HIGH' && ['OPEN', 'FIXED'].includes(defect?.status),
      ).length;
      if (openCritical !== input.criticalDefects || openHigh !== input.highDefects) {
        errors.push('UAT defect counts must match the row-level defect register.');
      }
    }
    for (const evidenceId of ['P08-EV-020', 'P08-EV-025', 'P08-EV-026']) {
      if (!input.evidenceIds?.includes(evidenceId)) {
        errors.push(`UAT PASS requires evidence ${evidenceId}.`);
      }
    }
    if (input.summary?.mustPassed !== input.summary?.mustTotal) {
      errors.push('UAT PASS requires all Must scenarios to pass.');
    }
    if (input.criticalDefects !== 0 || input.highDefects !== 0) {
      errors.push('UAT PASS requires Critical and High defects to equal zero.');
    }
    rejectPlaceholderFinal(input, errors);
  }
  return errors;
}

export function validatePhase08Decision(input) {
  const errors = [];
  if (!validateEnvelope(input, 'Phase 08 Go/No-Go decision', errors)) return errors;
  validateIdentityShape(input.releaseIdentity, errors, { actual: input.decision !== 'PENDING' });
  validateActualRecordMetadata(input, errors, input.decision !== 'PENDING');
  if (!DECISIONS.has(input.decision)) errors.push('decision is invalid.');
  addRequiredString(input, 'decisionId', errors, { actual: input.decision !== 'PENDING' });
  addRequiredString(input, 'rationale', errors, { actual: input.decision !== 'PENDING' });
  if (input.decision !== 'PENDING') {
    addUtcTimestamp(input, 'decidedAtUtc', errors, { actual: true });
  }
  validateGovernance(input.governance, errors, { recommendations: true });
  if (!isObject(input.recommendations)) {
    errors.push('recommendations must be an object.');
  } else {
    for (const field of ['technicalLead', 'qa', 'devOps']) {
      if (!RECOMMENDATIONS.has(input.recommendations[field])) {
        errors.push(`recommendations.${field} is invalid.`);
      }
    }
  }
  addStringArray(input, 'evidenceIds', errors);
  if (input.evidenceIds?.some((id) => !PHASE08_EVIDENCE.includes(id))) {
    errors.push('evidenceIds contains an unknown Phase 08 evidence ID.');
  }
  if (input.acceptanceStatus !== undefined) {
    errors.push('acceptanceStatus is deprecated; use preReleaseAcceptanceStatus.');
  }
  for (const field of ['systemTestStatus', 'uatStatus', 'preReleaseAcceptanceStatus']) {
    if (!RESULT_STATUSES.has(input[field])) errors.push(`${field} is invalid.`);
  }
  for (const field of ['criticalDefects', 'highDefects']) {
    if (!Number.isInteger(input[field]) || input[field] < 0) {
      errors.push(`${field} must be a non-negative integer.`);
    }
  }
  if (input.productionApplyMode !== 'PLAN_ONLY') {
    errors.push('G5 decision productionApplyMode must be PLAN_ONLY.');
  }
  if (input.decision === 'GO') {
    if (
      input.systemTestStatus !== 'PASS' ||
      input.uatStatus !== 'PASS' ||
      input.preReleaseAcceptanceStatus !== 'PASS'
    ) {
      errors.push('GO requires System Test, UAT and PRE_RELEASE acceptance status PASS.');
    }
    if (input.criticalDefects !== 0 || input.highDefects !== 0) {
      errors.push('GO requires Critical and High defects to equal zero.');
    }
    if (!Array.isArray(input.conditions) || input.conditions.length !== 0) {
      errors.push('GO cannot contain conditions.');
    }
    if (
      ['technicalLead', 'qa', 'devOps'].some((field) => input.recommendations?.[field] !== 'GO')
    ) {
      errors.push('GO requires GO recommendations from Technical Lead, QA and DevOps roles.');
    }
    rejectPlaceholderFinal(input, errors);
  }
  if (input.decision === 'CONDITIONAL_GO') {
    if (!Array.isArray(input.conditions) || input.conditions.length === 0) {
      errors.push('CONDITIONAL_GO requires explicit conditions.');
    }
    for (const [index, condition] of (input.conditions ?? []).entries()) {
      if (!isObject(condition)) {
        errors.push(`conditions[${index}] must be an object.`);
        continue;
      }
      for (const field of ['owner', 'expiryUtc', 'mitigation', 'communication']) {
        addRequiredString(condition, field, errors, {
          actual: true,
          path: `conditions[${index}].${field}`,
        });
      }
    }
    if (input.criticalDefects > 0 || input.highDefects > 0) {
      errors.push('CONDITIONAL_GO cannot contain Critical or High defects.');
    }
    rejectPlaceholderFinal(input, errors);
  }
  if (input.decision === 'NO_GO' && hasPlaceholder(input.rationale)) {
    errors.push('NO_GO rationale cannot be a placeholder.');
  }
  return errors;
}

export function validatePhase08Exit(input) {
  const errors = [];
  if (!validateEnvelope(input, 'Phase 08 final exit', errors)) return errors;
  validateIdentityShape(input.releaseIdentity, errors, {
    actual: ['GO', 'CONDITIONAL_GO', 'ROLLED_BACK'].includes(input.decision),
  });
  validateActualRecordMetadata(input, errors, input.decision !== 'PENDING');
  if (!DECISIONS.has(input.decision)) errors.push('decision is invalid.');
  addRequiredString(input, 'exitId', errors, {
    actual: ['GO', 'CONDITIONAL_GO', 'ROLLED_BACK'].includes(input.decision),
  });
  addRequiredString(input, 'rationale', errors, { actual: input.decision !== 'PENDING' });
  if (input.decision !== 'PENDING') {
    addUtcTimestamp(input, 'decidedAtUtc', errors, { actual: true });
  }
  if (!RESULT_STATUSES.has(input.finalAcceptanceStatus)) {
    errors.push('finalAcceptanceStatus is invalid.');
  }
  addStringArray(input, 'evidenceIds', errors);
  if (input.evidenceIds?.some((id) => !PHASE08_EVIDENCE.includes(id))) {
    errors.push('evidenceIds contains an unknown Phase 08 evidence ID.');
  }

  if (!isObject(input.production)) {
    errors.push('production result is required.');
  } else {
    const production = input.production;
    if (!PRODUCTION_STATUSES.has(production.status)) {
      errors.push('production.status is invalid.');
    }
    if (!['PLAN_ONLY', 'APPLY'].includes(production.applyMode)) {
      errors.push('production.applyMode must be PLAN_ONLY or APPLY.');
    }
    if (production.status === 'ACTUAL') {
      if (production.applyMode !== 'APPLY') {
        errors.push('ACTUAL production requires production.applyMode APPLY.');
      }
      if (production.protectedEnvironment !== true) {
        errors.push('ACTUAL production requires a protected execution environment.');
      }
      if (!['GO', 'CONDITIONAL_GO'].includes(production.approvedDecision)) {
        errors.push('ACTUAL production requires an approved GO or CONDITIONAL_GO decision.');
      }
      addRequiredString(production, 'goNoGoDecisionId', errors, {
        actual: true,
        path: 'production.goNoGoDecisionId',
      });
      addRequiredString(production, 'revision', errors, {
        actual: true,
        path: 'production.revision',
      });
      addHttps(production, 'url', errors, { actual: true, path: 'production.url' });
      if (production.revision !== input.releaseIdentity?.productionRevision) {
        errors.push('production.revision must match releaseIdentity.productionRevision.');
      }
      if (production.url !== input.releaseIdentity?.productionUrl) {
        errors.push('production.url must match releaseIdentity.productionUrl.');
      }
    }
    if (['NOT_RUN', 'BLOCKED', 'PENDING'].includes(production.status)) {
      if (production.applyMode !== 'PLAN_ONLY') {
        errors.push(`${production.status} production requires PLAN_ONLY apply mode.`);
      }
    }
    if (production.status === 'ROLLED_BACK') {
      if (production.applyMode !== 'APPLY') {
        errors.push('ROLLED_BACK production requires APPLY mode.');
      }
      if (input.decision !== 'ROLLED_BACK') {
        errors.push('ROLLED_BACK production requires a ROLLED_BACK exit decision.');
      }
    }
  }

  if (['GO', 'CONDITIONAL_GO'].includes(input.decision)) {
    if (input.finalAcceptanceStatus !== 'PASS') {
      errors.push(`Final ${input.decision} requires FINAL acceptance status PASS.`);
    }
    if (input.production?.status !== 'ACTUAL') {
      errors.push(`Final ${input.decision} requires an ACTUAL production result.`);
    }
    rejectPlaceholderFinal(input, errors);
  }
  return errors;
}

export function validatePhase08Readiness(input) {
  const errors = [];
  if (!validateEnvelope(input, 'Phase 08 readiness pack', errors)) return errors;
  if (!PHASE08_ACCEPTANCE_STAGES.includes(input.stage)) {
    errors.push(`stage must be one of: ${PHASE08_ACCEPTANCE_STAGES.join(', ')}.`);
  }
  const records = [
    ['acceptance', validatePhase08Acceptance],
    ['systemTest', validatePhase08SystemTest],
    ['uat', validatePhase08Uat],
    ['decision', validatePhase08Decision],
  ];
  const identityRecords = [];
  for (const [field, validator] of records) {
    if (!isObject(input[field])) {
      errors.push(`${field} record is required.`);
      continue;
    }
    errors.push(...validator(input[field]).map((error) => `${field}: ${error}`));
    identityRecords.push(input[field]);
  }
  if (input.acceptance?.acceptanceStage !== input.stage) {
    errors.push('acceptance.acceptanceStage must match readiness stage.');
  }
  if (input.stage === 'FINAL' && !isObject(input.exit)) {
    errors.push('exit record is required for FINAL readiness.');
  }
  if (input.exit !== undefined && !isObject(input.exit)) {
    errors.push('exit record must be an object when provided.');
  } else if (isObject(input.exit)) {
    errors.push(...validatePhase08Exit(input.exit).map((error) => `exit: ${error}`));
    identityRecords.push(input.exit);
  }
  if (input.exit?.production?.status === 'ACTUAL') {
    if (input.exit.production.goNoGoDecisionId !== input.decision?.decisionId) {
      errors.push('exit production decision ID must match decision.decisionId.');
    }
    if (input.exit.production.approvedDecision !== input.decision?.decision) {
      errors.push('exit production approved decision must match decision.decision.');
    }
  }
  if (identityRecords.length >= 2) {
    errors.push(
      ...validatePhase08IdentityConsistency(identityRecords).map((error) => `identity: ${error}`),
    );
  }
  return errors;
}

export function validatePhase08IdentityConsistency(records) {
  const errors = [];
  if (!Array.isArray(records) || records.length < 2) {
    return ['At least two Phase 08 records are required for identity consistency.'];
  }
  const identities = records.map((record) => record?.releaseIdentity ?? record);
  identities.forEach((identity) => validateIdentityShape(identity, errors, { actual: true }));
  const first = identities[0];
  for (const [index, identity] of identities.entries()) {
    for (const field of [
      'releaseId',
      'commitSha',
      'imageDigest',
      'stagingRevision',
      'stagingUrl',
    ]) {
      if (first?.[field] !== identity?.[field]) {
        errors.push(`record[${index}] ${field} does not match the release identity.`);
      }
    }
  }
  const productionIdentities = identities.filter(
    (identity) =>
      identity?.productionRevision &&
      identity.productionRevision !== 'NOT_RUN' &&
      identity?.productionUrl &&
      identity.productionUrl !== 'NOT_RUN',
  );
  if (productionIdentities.length >= 2) {
    const productionFirst = productionIdentities[0];
    productionIdentities.forEach((identity, index) => {
      for (const field of ['productionRevision', 'productionUrl']) {
        if (productionFirst[field] !== identity[field]) {
          errors.push(`production record[${index}] ${field} does not match the release identity.`);
        }
      }
    });
  }
  return errors;
}

export function redactPhase08Report(value) {
  if (Array.isArray(value)) return value.map((item) => redactPhase08Report(item));
  if (isObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        SECRET_KEY.test(key) ? '[REDACTED]' : redactPhase08Report(item),
      ]),
    );
  }
  if (typeof value !== 'string') return value;
  return value
    .replace(/mongodb(?:\+srv)?:\/\/[^\s"'<>]+/giu, '[REDACTED_MONGODB_URI]')
    .replace(/bearer\s+[a-z0-9._~-]+/giu, 'Bearer [REDACTED]')
    .replace(/-----BEGIN [^-]+-----[\s\S]*?-----END [^-]+-----/gu, '[REDACTED_PRIVATE_KEY]');
}

export function assertValidPhase08Record(input, validator) {
  const errors = validator(input);
  if (errors.length) throw new Error(`Phase 08 contract failed:\n- ${errors.join('\n- ')}`);
  return input;
}

export const PHASE08_CONTRACT = Object.freeze({
  FULL_SHA,
  IMAGE_DIGEST,
  RELEASE_ID,
  PHASE08_RELEASE_PROFILES,
  PHASE08_ACCEPTANCE_STAGES,
  PHASE08_CRITERIA,
  PHASE08_PRE_RELEASE_CRITERIA,
  PHASE08_EVIDENCE,
  PHASE08_PRE_RELEASE_EVIDENCE,
});
