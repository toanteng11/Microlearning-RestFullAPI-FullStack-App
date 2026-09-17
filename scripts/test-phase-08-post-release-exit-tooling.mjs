import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { PHASE08_CRITERIA, PHASE08_EVIDENCE } from './lib/phase-08-contract.mjs';
import { validatePhase08FinalClosure } from './lib/phase-08-final-closure.mjs';
import { validatePhase08Handover } from './lib/phase-08-handover.mjs';
import { validatePhase08PostRelease } from './lib/phase-08-post-release.mjs';
import { validatePhase08ProductionDeployment } from './lib/phase-08-production-deployment.mjs';

const commit = 'a'.repeat(40);
const digest = `asia-southeast1-docker.pkg.dev/project/repository/app@sha256:${'b'.repeat(64)}`;
const at = '2026-09-01T00:00:00.000Z';
const identity = {
  releaseId: 'P08-RC-20260901-aaaaaaa',
  commitSha: commit,
  imageDigest: digest,
  stagingRevision: 'microlearning-staging-00042-abc',
  stagingUrl: 'https://microlearning-staging.example.run.app',
  productionRevision: 'microlearning-production-00001-def',
  productionUrl: 'https://microlearning-production.example.run.app',
};
const hash = (character) => `sha256:${character.repeat(64)}`;
const actor = 'Tran Duc Toan / 2351010210';

const deployment = {
  schemaVersion: 1,
  phase: '08',
  recordType: 'PRODUCTION_DEPLOYMENT',
  status: 'ACTUAL',
  applyMode: 'APPLY',
  protectedEnvironment: true,
  redactionReviewed: true,
  releaseId: identity.releaseId,
  actor,
  recordedAtUtc: at,
  releaseIdentity: identity,
  approval: {
    decision: 'GO',
    decisionId: 'P08-G5-20260901-01',
    decisionRecordSha256: hash('c'),
    sourceG5RunId: '123456',
  },
  terraform: {
    planStatus: 'PASS',
    policyStatus: 'PASS',
    applyStatus: 'PASS',
    postApplyDriftStatus: 'PASS',
    planHash: hash('d'),
    destroyCount: 0,
  },
  cloudRun: {
    serviceName: 'microlearning-production',
    revision: identity.productionRevision,
    url: identity.productionUrl,
    trafficPercent: 100,
    observedImageDigest: digest,
    observedCommitSha: commit,
    previousRevision: null,
    previousImageDigest: null,
  },
  smoke: {
    status: 'PASS',
    report: 'deployment/production-smoke.json',
    reportSha256: hash('e'),
  },
  roleSmoke: {
    status: 'PASS',
    personas: 4,
    report: 'deployment/role-smoke/playwright-results.json',
    reportSha256: hash('f'),
  },
  evidenceIds: ['P08-EV-031', 'P08-EV-037'],
};

const checkpointOffsets = [0, 15, 60, 24 * 60, 72 * 60];
const checkpointLabels = ['T+0', 'T+15m', 'T+1h', 'T+24h', 'T+72h'];
const postRelease = {
  schemaVersion: 1,
  phase: '08',
  recordType: 'POST_RELEASE_OBSERVATION',
  status: 'PASS',
  redactionReviewed: true,
  releaseIdentity: identity,
  productionDeploymentSha256: hash('1'),
  observationWindow: {
    deployedAtUtc: at,
    startedAtUtc: at,
    endedAtUtc: '2026-09-04T00:00:00.000Z',
    checkpoints: checkpointLabels.map((label, index) => ({
      label,
      status: 'PASS',
      recordedAtUtc: new Date(Date.parse(at) + checkpointOffsets[index] * 60_000).toISOString(),
      revision: identity.productionRevision,
      imageDigest: digest,
      source: 'Cloud Run and Cloud Monitoring observation',
      metrics: {
        readyStatus: 200,
        errorRatePercent: 0,
        p95LatencyMs: 120,
        instanceCount: 1,
        restartCount: 0,
        mongoErrorCount: 0,
        authFailureCount: 0,
      },
    })),
  },
  alertTest: {
    status: 'PASS',
    acknowledged: true,
    testedAtUtc: '2026-09-01T00:15:00.000Z',
    destination: 'Named academic project owner',
    actor,
    evidence: 'observation/alert-test.json',
  },
  logReview: {
    status: 'PASS',
    requestIdObserved: true,
    releaseIdentityObserved: true,
    redactionStatus: 'PASS',
    reviewedAtUtc: '2026-09-04T00:00:00.000Z',
  },
  incidents: [],
  recovery: {
    status: 'NOT_REQUIRED',
    strategy: 'NO_ROLLBACK_REQUIRED',
    rationale: 'No production incident met the rollback threshold during hypercare.',
    evidenceSha256: hash('2'),
  },
  hypercare: {
    status: 'CLOSED',
    recommendation: 'GO',
    unresolvedCritical: 0,
    unresolvedHigh: 0,
    owner: actor,
    closedAtUtc: '2026-09-04T00:00:00.000Z',
  },
  evidenceIds: ['P08-EV-038', 'P08-EV-039', 'P08-EV-040'],
};

const audiences = ['STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN_OPERATIONS', 'SUPPORT'];
const handover = {
  schemaVersion: 1,
  phase: '08',
  recordType: 'OPERATIONS_HANDOVER',
  status: 'PASS',
  redactionReviewed: true,
  releaseProfile: 'ACADEMIC_DEMO_RELEASE',
  releaseIdentity: identity,
  postReleaseObservationSha256: hash('3'),
  supportModel: {
    ownerName: 'Tran Duc Toan',
    contactChannel: 'Project support channel',
    supportWindow: '09:00-17:00 ICT through the academic hypercare window',
    responseExpectation: 'Best-effort academic demonstration support',
    coverage: 'OWNER_MANAGED_ACADEMIC_DEMO',
    noOrganizationalSla: true,
  },
  materials: audiences.map((audience, index) => ({
    audience,
    status: 'ACKNOWLEDGED',
    materialPath: `handover/${audience.toLowerCase()}.md`,
    materialSha256: hash(String(index + 4)),
    acknowledgedAtUtc: '2026-09-04T01:00:00.000Z',
  })),
  operationsChecks: [
    'CURRENT_RELEASE_IDENTITY',
    'HEALTH_AND_READINESS',
    'LOGS_AND_ALERTS',
    'SECRET_ROTATION',
    'BACKUP_AND_RESTORE',
    'ROLLBACK_AND_ESCALATION',
  ].map((id) => ({ id, status: 'PASS', evidence: `handover/${id.toLowerCase()}.json` })),
  communications: ['RELEASE_NOTE', 'SUPPORT_ROUTE', 'HYPERCARE_CLOSURE'].map((type) => ({
    type,
    status: 'PUBLISHED',
    audience: 'Academic project stakeholders',
    channel: 'Project repository and demonstration briefing',
    publishedAtUtc: '2026-09-04T01:00:00.000Z',
    evidence: `communications/${type.toLowerCase()}.md`,
  })),
  knownIssues: [],
  acceptedAtUtc: '2026-09-04T01:00:00.000Z',
  evidenceIds: ['P08-EV-044'],
};

const metadata = {
  releaseId: identity.releaseId,
  actor,
  recordedAtUtc: '2026-09-04T01:00:00.000Z',
  redactionReviewed: true,
};
const finalAcceptance = {
  schemaVersion: 1,
  phase: '08',
  acceptanceStage: 'FINAL',
  status: 'PASS',
  ...metadata,
  releaseIdentity: identity,
  acceptanceCriteria: PHASE08_CRITERIA.map((id) => ({
    id,
    status: 'PASS',
    evidenceIds: ['P08-EV-001'],
  })),
  evidence: PHASE08_EVIDENCE.map((id) => ({
    id,
    status: 'PASS',
    artifact: `evidence/${id}.json`,
    recordedAtUtc: metadata.recordedAtUtc,
    actor,
    expectedResult: `Expected ${id} is met.`,
    actualResult: `Actual ${id} is verified.`,
    redactionReviewed: true,
  })),
};
const g5Decision = {
  schemaVersion: 1,
  phase: '08',
  decision: 'GO',
  ...metadata,
  decisionId: 'P08-G5-20260901-01',
  rationale: 'The pre-release acceptance package is complete.',
  decidedAtUtc: '2026-08-31T23:00:00.000Z',
  releaseIdentity: { ...identity, productionRevision: 'NOT_RUN', productionUrl: 'NOT_RUN' },
  systemTestStatus: 'PASS',
  uatStatus: 'PASS',
  preReleaseAcceptanceStatus: 'PASS',
  criticalDefects: 0,
  highDefects: 0,
  recommendations: { technicalLead: 'GO', qa: 'GO', devOps: 'GO' },
  governance: { soloProject: true, independentReview: false, actor },
  evidenceIds: ['P08-EV-030'],
  conditions: [],
  productionApplyMode: 'PLAN_ONLY',
  acceptanceRecordSha256: hash('4'),
  approvedDeploymentWindow: {
    startsAtUtc: '2026-08-31T23:00:00.000Z',
    endsAtUtc: '2026-09-01T01:00:00.000Z',
  },
};
const exit = {
  schemaVersion: 1,
  phase: '08',
  decision: 'GO',
  ...metadata,
  exitId: 'P08-G8-20260904-01',
  rationale: 'Production observation, handover and final acceptance are complete.',
  decidedAtUtc: '2026-09-04T01:00:00.000Z',
  finalAcceptanceStatus: 'PASS',
  releaseIdentity: identity,
  evidenceIds: ['P08-EV-050', 'P08-EV-055'],
  production: {
    status: 'ACTUAL',
    applyMode: 'APPLY',
    protectedEnvironment: true,
    approvedDecision: 'GO',
    goNoGoDecisionId: g5Decision.decisionId,
    revision: identity.productionRevision,
    url: identity.productionUrl,
  },
};
const sourceRecords = Object.fromEntries(
  [
    'productionDeployment',
    'postReleaseObservation',
    'handover',
    'finalAcceptance',
    'g5Decision',
    'exit',
  ].map((key, index) => [key, { path: `records/${key}.json`, sha256: hash('56789a'[index]) }]),
);
const finalClosure = {
  schemaVersion: 1,
  phase: '08',
  recordType: 'FINAL_CLOSURE_PACKAGE',
  status: 'PASS',
  redactionReviewed: true,
  finalDecision: 'GO',
  closedAtUtc: '2026-09-04T01:00:00.000Z',
  releaseIdentity: identity,
  gates: Array.from({ length: 9 }, (_, index) => ({
    id: `G${index}`,
    status: 'PASS',
    evidenceIds: ['P08-EV-001'],
  })),
  evidenceRegister: PHASE08_EVIDENCE.map((id, index) => ({
    id,
    status: 'PASS',
    path: `evidence/${id}.json`,
    sha256: hash(String((index + 1) % 10)),
  })),
  sourceRecords,
  cleanCheckoutVerification: {
    status: 'PASS',
    commitSha: commit,
    workflowRunId: '654321',
    runUrl: 'https://github.com/example/repo/actions/runs/654321',
    verifiedAtUtc: '2026-09-04T01:00:00.000Z',
  },
  soloGovernance: {
    soloProject: true,
    independentReview: false,
    actor,
    recommendations: {
      productBusiness: 'GO',
      technical: 'GO',
      quality: 'GO',
      devOpsOperations: 'GO',
    },
  },
  residualFollowUps: [],
  evidenceIds: ['P08-EV-050', 'P08-EV-055'],
};

function expectError(errors, fragment) {
  assert.ok(
    errors.some((error) => error.includes(fragment)),
    `${fragment}: ${errors.join('; ')}`,
  );
}

assert.deepEqual(validatePhase08ProductionDeployment(deployment), []);
assert.deepEqual(validatePhase08PostRelease(postRelease), []);
assert.deepEqual(validatePhase08Handover(handover), []);
assert.deepEqual(
  validatePhase08FinalClosure(finalClosure, {
    productionDeployment: deployment,
    postReleaseObservation: postRelease,
    handover,
    finalAcceptance,
    g5Decision,
    exit,
  }),
  [],
);

expectError(
  validatePhase08PostRelease({
    ...postRelease,
    observationWindow: {
      ...postRelease.observationWindow,
      checkpoints: postRelease.observationWindow.checkpoints.slice(0, -1),
    },
  }),
  'exactly five',
);
expectError(
  validatePhase08PostRelease({
    ...postRelease,
    alertTest: { ...postRelease.alertTest, acknowledged: false },
  }),
  'acknowledged',
);
expectError(
  validatePhase08Handover({
    ...handover,
    supportModel: { ...handover.supportModel, supportWindow: '24/7 enterprise support' },
  }),
  '24/7',
);
expectError(
  validatePhase08FinalClosure({
    ...finalClosure,
    gates: finalClosure.gates.filter((gate) => gate.id !== 'G8'),
  }),
  'G0 through G8',
);
expectError(
  validatePhase08FinalClosure(finalClosure, {
    productionDeployment: deployment,
    postReleaseObservation: postRelease,
    handover: {
      ...handover,
      releaseIdentity: { ...identity, productionUrl: 'https://other.example.run.app' },
    },
    finalAcceptance,
    g5Decision,
    exit,
  }),
  'productionUrl',
);

const temporaryRoot = mkdtempSync(join(tmpdir(), 'phase-08-final-closure-'));
try {
  const recordsForCli = {
    productionDeployment: deployment,
    postReleaseObservation: postRelease,
    handover,
    finalAcceptance,
    g5Decision,
    exit,
  };
  const sourcePaths = [];
  const closureForCli = structuredClone(finalClosure);
  for (const [key, record] of Object.entries(recordsForCli)) {
    const filePath = join(temporaryRoot, `${key}.json`);
    const serialized = `${JSON.stringify(record, null, 2)}\n`;
    writeFileSync(filePath, serialized, 'utf8');
    closureForCli.sourceRecords[key].sha256 = `sha256:${createHash('sha256')
      .update(serialized)
      .digest('hex')}`;
    sourcePaths.push(filePath);
  }
  const manifestPath = join(temporaryRoot, 'final-closure.json');
  const reportPath = join(temporaryRoot, 'final-closure-validation.json');
  writeFileSync(manifestPath, `${JSON.stringify(closureForCli, null, 2)}\n`, 'utf8');
  execFileSync(
    process.execPath,
    ['scripts/validate-phase-08-final-closure.mjs', manifestPath, ...sourcePaths, reportPath],
    { cwd: process.cwd(), stdio: 'pipe' },
  );
  assert.equal(existsSync(reportPath), true);
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}

process.stdout.write(
  `${JSON.stringify({ event: 'phase-08.post_release_exit_tooling.tests_passed', cases: 11 })}\n`,
);
