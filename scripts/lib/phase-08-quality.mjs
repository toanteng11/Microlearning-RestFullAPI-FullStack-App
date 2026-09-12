import { releaseIdentityFrom } from './phase-08-system-test.mjs';

const REQUIRED_SECURITY_CHECKS = new Set([
  'SEC-BLOCKED-STUDENT',
  'SEC-BLOCKED-TEACHER',
  'SEC-STUDENT-ADMIN-RBAC',
  'SEC-TEACHER-ADMIN-RBAC',
  'SEC-STUDENT-OWNERSHIP',
  'SEC-TEACHER-OWNERSHIP',
  'SEC-NOSQL-OPERATOR',
  'PRIV-ERROR-REDACTION',
  'API-PAGINATION-BOUNDS',
  'DATA-IDEMPOTENT-RETRY',
]);

const PERFORMANCE_THRESHOLDS = Object.freeze({
  'simple-read': 800,
  'list-report': 1_000,
  mutation: 1_200,
  dashboard: 1_500,
  'frontend-load': 3_000,
});

const REQUIRED_UI_SURFACES = new Set([
  'public-login',
  'student-dashboard',
  'teacher-gradebook',
  'admin-governance',
  'student-progress-states',
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function percentile95(samples) {
  assert(
    Array.isArray(samples) && samples.length >= 5,
    'Each performance metric needs at least 5 samples.',
  );
  assert(
    samples.every((value) => Number.isFinite(value) && value >= 0),
    'Performance samples must be non-negative numbers.',
  );
  const sorted = [...samples].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)];
}

function duplicateIds(items, label) {
  const ids = items.map((item) => item.id);
  assert(new Set(ids).size === ids.length, `${label} IDs must be unique.`);
  return new Set(ids);
}

export function buildPhase08QualitySummary({
  observations,
  releaseIdentity,
  actor,
  recordedAtUtc,
  workflowUrl,
}) {
  const identity = releaseIdentityFrom(releaseIdentity);
  assert(observations?.schemaVersion === 1, 'Quality observations schemaVersion must equal 1.');
  assert(observations?.phase === '08', 'Quality observations phase must equal 08.');
  assert(
    observations?.releaseId === identity.releaseId,
    'Quality observations releaseId mismatch.',
  );
  assert(observations?.commitSha === identity.commitSha, 'Quality observations commit mismatch.');
  assert(
    observations?.stagingRevision === identity.stagingRevision,
    'Quality observations revision mismatch.',
  );
  assert(
    observations?.methodology?.environment === 'staging',
    'Quality verification must run on Staging.',
  );
  assert(
    observations?.methodology?.concurrency === 1,
    'Quality verification concurrency must remain bounded at 1.',
  );
  assert(
    observations?.methodology?.warmupSamples >= 1,
    'Quality verification needs a warm-up sample.',
  );

  const securityChecks = observations.securityChecks ?? [];
  const securityIds = duplicateIds(securityChecks, 'Security check');
  for (const id of REQUIRED_SECURITY_CHECKS) {
    assert(securityIds.has(id), `Missing required security/data check: ${id}.`);
  }
  const failedSecurity = securityChecks.filter((check) => check.status !== 'PASS');

  const performance = (observations.performanceMeasurements ?? []).map((measurement) => {
    const thresholdMs = PERFORMANCE_THRESHOLDS[measurement.category];
    assert(thresholdMs, `Unsupported performance category: ${measurement.category}.`);
    const p95Ms = percentile95(measurement.samplesMs);
    const errorRate = measurement.errorCount / measurement.samplesMs.length;
    return {
      category: measurement.category,
      endpoint: measurement.endpoint,
      samples: measurement.samplesMs.length,
      p95Ms,
      thresholdMs,
      errorCount: measurement.errorCount,
      errorRate,
      status: p95Ms <= thresholdMs && measurement.errorCount === 0 ? 'PASS' : 'FAIL',
    };
  });
  const performanceIds = new Set(performance.map((item) => item.category));
  for (const category of Object.keys(PERFORMANCE_THRESHOLDS)) {
    assert(performanceIds.has(category), `Missing required performance category: ${category}.`);
  }

  const uiChecks = observations.uiChecks ?? [];
  const uiIds = duplicateIds(uiChecks, 'UI check');
  for (const id of REQUIRED_UI_SURFACES)
    assert(uiIds.has(id), `Missing required UI surface: ${id}.`);
  const failedUi = uiChecks.filter(
    (check) =>
      check.seriousOrCriticalViolations !== 0 ||
      check.horizontalOverflow === true ||
      check.keyboardFocus !== 'PASS' ||
      check.states !== 'PASS',
  );

  const status =
    failedSecurity.length === 0 &&
    performance.every((item) => item.status === 'PASS') &&
    failedUi.length === 0
      ? 'PASS'
      : 'FAIL';

  return {
    schemaVersion: 1,
    phase: '08',
    recordType: 'QUALITY_VERIFICATION_SUMMARY',
    status,
    releaseId: identity.releaseId,
    releaseIdentity: identity,
    actor,
    recordedAtUtc,
    workflowUrl,
    redactionReviewed: true,
    evidenceIds: ['P08-EV-010', 'P08-EV-015', 'P08-EV-016'],
    methodology: observations.methodology,
    security: {
      total: securityChecks.length,
      passed: securityChecks.length - failedSecurity.length,
      failed: failedSecurity.length,
      checks: securityChecks,
    },
    performance,
    accessibilityResponsive: {
      total: uiChecks.length,
      passed: uiChecks.length - failedUi.length,
      failed: failedUi.length,
      checks: uiChecks,
    },
    criticalDefects: 0,
    highDefects: 0,
  };
}

export function validatePhase08QualitySummary(record) {
  assert(
    record?.schemaVersion === 1 && record?.phase === '08',
    'Invalid Phase 08 quality summary envelope.',
  );
  releaseIdentityFrom(record.releaseIdentity);
  assert(
    record.releaseId === record.releaseIdentity.releaseId,
    'Quality summary identity mismatch.',
  );
  assert(record.status === 'PASS', 'Phase 08 quality summary must be PASS.');
  assert(record.redactionReviewed === true, 'Quality summary redaction review is required.');
  assert(
    record.criticalDefects === 0 && record.highDefects === 0,
    'Critical/High defects must equal zero.',
  );
  assert(record.security?.failed === 0, 'Security/data checks contain failures.');
  assert(
    record.performance?.every((item) => item.status === 'PASS'),
    'Performance threshold failed.',
  );
  assert(
    record.accessibilityResponsive?.failed === 0,
    'Accessibility/responsive checks contain failures.',
  );
  return true;
}
