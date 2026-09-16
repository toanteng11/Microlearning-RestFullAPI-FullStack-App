import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { validatePhase08ProductionReadiness } from './lib/phase-08-production-readiness.mjs';

const commit = 'a'.repeat(40);
const image = `asia-southeast1-docker.pkg.dev/microlearning-platform-502716/microlearning/microlearning-app@sha256:${'b'.repeat(64)}`;
const at = '2026-09-15T08:00:00.000Z';
const valid = {
  schemaVersion: 1,
  phase: '08',
  recordType: 'PRODUCTION_READINESS',
  status: 'PASS',
  releaseProfile: 'ACADEMIC_DEMO_RELEASE',
  actor: 'Trần Đức Toàn / GitHub Actions',
  recordedAtUtc: at,
  soloProject: true,
  independentReview: false,
  applyMode: 'PLAN_ONLY',
  productionApplyExecuted: false,
  redactionReviewed: true,
  releaseIdentity: {
    releaseId: 'P08-RC-20260915-aaaaaaa',
    commitSha: commit,
    imageDigest: image,
    stagingRevision: 'microlearning-staging-00042-abc',
    stagingUrl: 'https://microlearning-staging.example.run.app',
    productionRevision: 'NOT_RUN',
    productionUrl: 'NOT_RUN',
  },
  terraform: {
    status: 'PASS',
    formatStatus: 'PASS',
    validateStatus: 'PASS',
    planStatus: 'PASS',
    policyStatus: 'PASS',
    planHash: `sha256:${'c'.repeat(64)}`,
    backendPrefix: 'phase-08/production',
    destroyCount: 0,
    policyViolationCount: 0,
    imageRef: image,
    applyExecuted: false,
  },
  separation: {
    status: 'PASS',
    statePrefix: 'gs://microlearning-tfstate-759791798260/phase-08/production',
    runtimeServiceAccount:
      'ml-runtime-production@microlearning-platform-502716.iam.gserviceaccount.com',
    deployerServiceAccount:
      'ml-github-production@microlearning-platform-502716.iam.gserviceaccount.com',
    workloadIdentityProvider:
      'projects/759791798260/locations/global/workloadIdentityPools/github-production/providers/production-promote',
    serviceName: 'microlearning-production',
    secretIds: [
      'ml-production-access-token-secret',
      'ml-production-auth-identity-pepper',
      'ml-production-classroom-code-pepper',
      'ml-production-mongodb-uri',
    ],
    databaseName: 'microlearning_production',
    databaseUser: 'ml-production-app',
    secretValuesRead: false,
    longLivedServiceAccountKeys: false,
  },
  atlas: {
    status: 'PASS',
    syntheticOnly: true,
    tls: true,
    databaseName: 'microlearning_production',
    databaseUser: 'ml-production-app',
    applicationRole: 'readWrite@microlearning_production',
    networkPolicy: 'TEMPORARY_PUBLIC_WITH_EXPIRY',
    networkReviewExpiresAtUtc: '2026-10-15T08:00:00.000Z',
    logicalBackup: { status: 'PASS', operationId: 'backup-p08-001', completedAtUtc: at },
    isolatedRestore: {
      status: 'PASS',
      operationId: 'restore-p08-001',
      targetDatabase: 'microlearning_p08_restore_001',
      integrityStatus: 'PASS',
      cleanupStatus: 'PASS',
      startedAtUtc: at,
      completedAtUtc: '2026-09-15T08:12:00.000Z',
    },
    managedPitr: { status: 'APPROVED_NA', decisionId: 'P08-DEC-PITR-001' },
    rpo: { targetMinutes: 60, measuredMinutes: 10 },
    rto: { targetMinutes: 30, measuredMinutes: 12 },
  },
  recovery: {
    status: 'PASS',
    priorReleaseStatus: 'FIRST_DEPLOY_APPROVED',
    firstDeployDecisionId: 'P08-DEC-FIRST-DEPLOY-001',
    schemaCompatibilityStatus: 'PASS',
    rollbackOwner: 'Trần Đức Toàn',
    runbook: 'docs/implementation/phase-08/rollback-and-incident-response-final.md',
  },
  operations: {
    status: 'PASS',
    budgetAlertId: 'budget-p08-001',
    quotaReviewId: 'quota-p08-001',
    dashboardId: 'dashboard-p08-001',
    uptimeCheckId: 'uptime-p08-001',
    alertRouteTestId: 'alert-route-p08-001',
    incidentOwner: 'Trần Đức Toàn',
    runbook: 'docs/implementation/phase-08/observability-and-operations-handover.md',
  },
  evidenceIds: ['P08-EV-004', 'P08-EV-006', 'P08-EV-007', 'P08-EV-008'],
};

assert.deepEqual(validatePhase08ProductionReadiness(valid), []);

const mutations = [
  ['apply before G5', { applyMode: 'APPLY' }, 'PLAN_ONLY'],
  [
    'mutable image',
    { releaseIdentity: { ...valid.releaseIdentity, imageDigest: `${image.split('@')[0]}:latest` } },
    'immutable',
  ],
  [
    'staging database',
    { separation: { ...valid.separation, databaseName: 'microlearning_staging' } },
    'databaseName',
  ],
  [
    'overprivileged database role',
    { atlas: { ...valid.atlas, applicationRole: 'atlasAdmin@admin' } },
    'applicationRole',
  ],
  [
    'missing isolated restore',
    { atlas: { ...valid.atlas, isolatedRestore: { status: 'PENDING' } } },
    'isolatedRestore.status',
  ],
  [
    'restore overwrites production',
    {
      atlas: {
        ...valid.atlas,
        isolatedRestore: {
          ...valid.atlas.isolatedRestore,
          targetDatabase: 'microlearning_production',
        },
      },
    },
    'isolated',
  ],
  [
    'rto exceeds target',
    { atlas: { ...valid.atlas, rto: { targetMinutes: 10, measuredMinutes: 12 } } },
    'must not exceed',
  ],
  [
    'missing alert owner',
    { operations: { ...valid.operations, incidentOwner: '' } },
    'incidentOwner',
  ],
  ['secret URI leaked', { notes: 'mongodb+srv://cluster.invalid/example' }, 'connection URI'],
  ['nested password field', { notes: { password: 'must-not-exist' } }, 'Secret-like field'],
];

for (const [name, mutation, expected] of mutations) {
  const errors = validatePhase08ProductionReadiness({ ...valid, ...mutation });
  assert.ok(
    errors.some((error) => error.includes(expected)),
    `${name}: ${errors.join('; ')}`,
  );
}

const workflow = readFileSync('.github/workflows/promote-production.yml', 'utf8');
assert.match(workflow, /EXPECTED_TERRAFORM_ENV=production/u);
assert.match(workflow, /ALLOW_PUBLIC_CLOUD_RUN_INVOKER=true/u);
assert.match(workflow, /terraform init -input=false -reconfigure/u);
assert.match(workflow, /if: inputs\.apply_mode == 'APPLY'/u);
assert.match(workflow, /phase-08:pre-release:verify/u);
assert.match(workflow, /APPLY_PHASE_08_PRODUCTION/u);
assert.match(workflow, /productionApplyExecuted:false/u);
assert.match(workflow, /retention-days: 90/u);
assert.match(workflow, /artifacts\/phase-08\/\$\{\{ inputs\.release_id \}\}/u);

process.stdout.write(
  `${JSON.stringify({ event: 'phase-08.production_readiness_tooling.tests_passed', cases: 11 })}\n`,
);
