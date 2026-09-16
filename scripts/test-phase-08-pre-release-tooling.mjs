import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { PHASE08_PRE_RELEASE_EVIDENCE } from './lib/phase-08-contract.mjs';
import {
  createPhase08PreReleasePackage,
  sha256Record,
  validatePhase08PreReleasePackage,
  writePhase08PreReleasePackage,
} from './lib/phase-08-pre-release.mjs';

const at = '2026-09-15T08:00:00.000Z';
const actor = 'Trần Đức Toàn / Release Owner';
const commitSha = 'a'.repeat(40);
const imageDigest = `asia-southeast1-docker.pkg.dev/microlearning-platform-502716/microlearning/app@sha256:${'b'.repeat(64)}`;
const identity = {
  releaseId: 'P08-RC-20260915-aaaaaaa',
  commitSha,
  imageDigest,
  stagingRevision: 'microlearning-staging-00042-abc',
  stagingUrl: 'https://microlearning-staging.example.run.app',
  productionRevision: 'NOT_RUN',
  productionUrl: 'NOT_RUN',
};
const metadata = {
  releaseId: identity.releaseId,
  actor,
  recordedAtUtc: at,
  redactionReviewed: true,
};
const systemTest = {
  schemaVersion: 1,
  phase: '08',
  status: 'PASS',
  ...metadata,
  releaseIdentity: identity,
  summary: {
    mustTotal: 6,
    mustPassed: 6,
    passCount: 6,
    failCount: 0,
    blockedCount: 0,
    notRunCount: 0,
    waivedCount: 0,
  },
  criticalDefects: 0,
  highDefects: 0,
  evidenceIds: ['P08-EV-010', 'P08-EV-015', 'P08-EV-016'],
};
const personas = [
  'GUEST',
  'STUDENT_A',
  'STUDENT_B',
  'TEACHER_A',
  'TEACHER_B',
  'ADMIN',
  'SUPER_ADMIN',
  'QA_DEVOPS',
];
const uat = {
  schemaVersion: 1,
  phase: '08',
  status: 'PASS',
  ...metadata,
  releaseIdentity: identity,
  summary: {
    mustTotal: 32,
    mustPassed: 32,
    passCount: 32,
    failCount: 0,
    blockedCount: 0,
    notRunCount: 0,
    waivedCount: 0,
  },
  criticalDefects: 0,
  highDefects: 0,
  uatRunId: 'P08-G3-UAT-20260915-01',
  startedAtUtc: at,
  endedAtUtc: '2026-09-15T08:30:00.000Z',
  dataMode: 'SYNTHETIC',
  executionModel: 'SOLO_ROLE_SIMULATION',
  personas: personas.map((id) => ({
    id,
    role: id,
    sessionIsolation: 'SEPARATE_CONTEXT',
    synthetic: true,
    loginVerified: true,
  })),
  defects: [],
  scenarios: Array.from({ length: 32 }, (_, index) => {
    const id = `P08-UT-${String(index + 1).padStart(3, '0')}`;
    return {
      id,
      priority: id === 'P08-UT-027' ? 'CONDITIONAL' : 'MUST',
      persona: 'QA_DEVOPS',
      expected: `Expected ${id}`,
      actual: `Observed ${id}`,
      evidence: `artifacts/phase-08/${identity.releaseId}/uat/${id}.json`,
      testedAtUtc: at,
      status: 'PASS',
    };
  }),
  governance: { soloProject: true, independentReview: false, actor },
  recommendations: { qa: 'GO', business: 'GO', technical: 'GO' },
  evidenceIds: ['P08-EV-020', 'P08-EV-025', 'P08-EV-026'],
};
const productionReadiness = {
  schemaVersion: 1,
  phase: '08',
  recordType: 'PRODUCTION_READINESS',
  status: 'PASS',
  releaseProfile: 'ACADEMIC_DEMO_RELEASE',
  actor,
  recordedAtUtc: at,
  soloProject: true,
  independentReview: false,
  applyMode: 'PLAN_ONLY',
  productionApplyExecuted: false,
  redactionReviewed: true,
  releaseIdentity: identity,
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
    imageRef: imageDigest,
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
    rollbackOwner: actor,
    runbook: 'docs/implementation/phase-08/rollback-and-incident-response-final.md',
  },
  operations: {
    status: 'PASS',
    budgetAlertId: 'budget-p08-001',
    quotaReviewId: 'quota-p08-001',
    dashboardId: 'dashboard-p08-001',
    uptimeCheckId: 'uptime-p08-001',
    alertRouteTestId: 'alert-route-p08-001',
    incidentOwner: actor,
    runbook: 'docs/implementation/phase-08/observability-and-operations-handover.md',
  },
  evidenceIds: ['P08-EV-004', 'P08-EV-006', 'P08-EV-007', 'P08-EV-008'],
};
const evidenceIndex = PHASE08_PRE_RELEASE_EVIDENCE.map((id) => ({
  id,
  status: 'PASS',
  artifact: `artifacts/phase-08/${identity.releaseId}/evidence/${id}.json`,
  recordedAtUtc: at,
  actor,
  expectedResult: `${id} expected result verified`,
  actualResult: `${id} actual result passed`,
  redactionReviewed: true,
}));
const decisionRequest = {
  actor,
  recordedAtUtc: at,
  decision: 'GO',
  decisionId: 'P08-G5-20260915-01',
  rationale: 'All exact-candidate pre-release gates passed with no blocking defect.',
  decidedAtUtc: at,
  recommendations: { technicalLead: 'GO', qa: 'GO', devOps: 'GO' },
  governance: { soloProject: true, independentReview: false, actor },
  conditions: [],
  approvedDeploymentWindow: {
    startsAtUtc: '2026-09-16T01:00:00.000Z',
    endsAtUtc: '2026-09-16T02:00:00.000Z',
  },
};

const validInput = {
  releaseIdentity: {
    schemaVersion: 1,
    phase: '08',
    releaseIdentity: { schemaVersion: 1, phase: '08', ...identity },
  },
  systemTest,
  uat,
  productionReadiness,
  evidenceIndex,
  decisionRequest,
};
const records = createPhase08PreReleasePackage(validInput);
assert.equal(records.acceptance.status, 'PASS');
assert.equal(records.decision.decision, 'GO');
assert.equal(records.lock.acceptanceRecordSha256, sha256Record(records.acceptance));
assert.equal(records.lock.decisionRecordSha256, sha256Record(records.decision));
assert.equal(
  records.acceptance.acceptanceCriteria.filter(({ status }) => status === 'PASS').length,
  10,
);
assert.equal(records.acceptance.evidence.filter(({ status }) => status === 'PASS').length, 14);
assert.deepEqual(validatePhase08PreReleasePackage(records), []);

assert.throws(
  () =>
    createPhase08PreReleasePackage({
      ...validInput,
      uat: {
        ...uat,
        releaseIdentity: { ...identity, stagingRevision: 'microlearning-staging-99999-wrong' },
      },
    }),
  /does not match the locked candidate/u,
);
assert.throws(
  () => createPhase08PreReleasePackage({ ...validInput, evidenceIndex: evidenceIndex.slice(1) }),
  /Missing pre-release evidence/u,
);

const output = join(mkdtempSync(join(tmpdir(), 'phase-08-g5-')), 'g5');
writePhase08PreReleasePackage(output, records);
assert.throws(() => writePhase08PreReleasePackage(output, records), /Refusing to overwrite/u);
const tampered = structuredClone(records);
tampered.decision.rationale = 'This record was changed after the G5 decision.';
assert.ok(
  validatePhase08PreReleasePackage(tampered).some((error) =>
    error.includes('decisionRecordSha256'),
  ),
);

process.stdout.write(
  `${JSON.stringify({ event: 'phase-08.pre_release_tooling.tests_passed', cases: 10 })}\n`,
);
