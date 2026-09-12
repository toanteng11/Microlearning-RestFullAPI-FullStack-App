import assert from 'node:assert/strict';

import {
  buildPhase08QualitySummary,
  percentile95,
  validatePhase08QualitySummary,
} from './lib/phase-08-quality.mjs';

const identity = {
  schemaVersion: 1,
  phase: '08',
  releaseId: 'P08-RC-20260912-a1b2c3d',
  commitSha: 'a'.repeat(40),
  imageDigest: `asia-southeast1-docker.pkg.dev/project/repository/app@sha256:${'b'.repeat(64)}`,
  stagingRevision: 'microlearning-staging-00042-abc',
  stagingUrl: 'https://microlearning-staging.example.run.app',
  productionRevision: 'NOT_RUN',
  productionUrl: 'NOT_RUN',
};
const securityIds = [
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
];
const observations = {
  schemaVersion: 1,
  phase: '08',
  releaseId: identity.releaseId,
  commitSha: identity.commitSha,
  stagingRevision: identity.stagingRevision,
  methodology: {
    environment: 'staging',
    concurrency: 1,
    warmupSamples: 1,
    region: 'asia-southeast1',
    network: 'GitHub-hosted runner to Cloud Run',
    dataset: 'deterministic synthetic Phase 03-06 seed',
  },
  securityChecks: securityIds.map((id) => ({ id, status: 'PASS', actual: 'verified' })),
  performanceMeasurements: [
    ['simple-read', '/health', 800],
    ['list-report', '/api/v1/students/me/progress/courses', 1_000],
    ['mutation', '/api/v1/analytics/events', 1_200],
    ['dashboard', '/api/v1/students/me/dashboard', 1_500],
    ['frontend-load', '/login', 3_000],
  ].map(([category, endpoint, threshold]) => ({
    category,
    endpoint,
    samplesMs: [10, 20, 30, 40, Number(threshold) - 1],
    errorCount: 0,
  })),
  uiChecks: [
    'public-login',
    'student-dashboard',
    'teacher-gradebook',
    'admin-governance',
    'student-progress-states',
  ].map((id) => ({
    id,
    viewport: '390x844',
    seriousOrCriticalViolations: 0,
    horizontalOverflow: false,
    keyboardFocus: 'PASS',
    states: 'PASS',
  })),
};

assert.equal(percentile95([4, 1, 5, 2, 3]), 5);
const summary = buildPhase08QualitySummary({
  observations,
  releaseIdentity: identity,
  actor: 'tooling test',
  recordedAtUtc: '2026-09-12T00:00:00.000Z',
  workflowUrl: 'https://github.com/example/repository/actions/runs/1',
});
assert.equal(summary.status, 'PASS');
assert.equal(validatePhase08QualitySummary(summary), true);

const slow = structuredClone(observations);
slow.performanceMeasurements[0].samplesMs = [1, 2, 3, 4, 801];
assert.equal(
  buildPhase08QualitySummary({ observations: slow, releaseIdentity: identity }).status,
  'FAIL',
);
assert.throws(
  () =>
    buildPhase08QualitySummary({
      observations: { ...observations, securityChecks: [] },
      releaseIdentity: identity,
    }),
  /Missing required security/u,
);
assert.throws(() => percentile95([1, 2, 3, 4]), /at least 5/u);
assert.throws(() => validatePhase08QualitySummary({ ...summary, status: 'FAIL' }), /must be PASS/u);

process.stdout.write(
  `${JSON.stringify({ event: 'phase-08.quality_tooling.tests_passed', cases: 6 })}\n`,
);
