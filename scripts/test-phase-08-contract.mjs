import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  PHASE08_CRITERIA,
  PHASE08_EVIDENCE,
  PHASE08_PRE_RELEASE_CRITERIA,
  PHASE08_PRE_RELEASE_EVIDENCE,
  redactPhase08Report,
  validatePhase08Acceptance,
  validatePhase08Decision,
  validatePhase08Exit,
  validatePhase08Identity,
  validatePhase08IdentityConsistency,
  validatePhase08Profile,
  validatePhase08Readiness,
  validatePhase08SystemTest,
  validatePhase08Uat,
} from './lib/phase-08-contract.mjs';
import {
  initializePhase08Workspace,
  PHASE08_WORKSPACE_DIRECTORIES,
} from './lib/phase-08-workspace.mjs';

const RELEASE_ID = 'P08-RC-20260910-a1b2c3d';
const ACTOR = 'Tran Duc Toan / 2351010210';
const RECORDED_AT = '2026-09-10T06:00:00.000Z';
const BASE_IDENTITY = Object.freeze({
  schemaVersion: 1,
  phase: '08',
  releaseId: RELEASE_ID,
  commitSha: 'a'.repeat(40),
  imageDigest:
    'asia-southeast1-docker.pkg.dev/microlearning-platform-502716/microlearning/app@sha256:' +
    'b'.repeat(64),
  stagingRevision: 'microlearning-staging-00042-abc',
  stagingUrl: 'https://microlearning-staging.example.run.app',
  productionRevision: 'NOT_RUN',
  productionUrl: 'NOT_RUN',
});
const FINAL_IDENTITY = Object.freeze({
  ...BASE_IDENTITY,
  productionRevision: 'microlearning-production-00001-def',
  productionUrl: 'https://microlearning-production.example.run.app',
});
const PASS_COUNTS = Object.freeze({
  mustTotal: 2,
  mustPassed: 2,
  passCount: 2,
  failCount: 0,
  blockedCount: 0,
  notRunCount: 0,
  waivedCount: 0,
});

function actualMetadata(identity = BASE_IDENTITY) {
  return {
    releaseId: identity.releaseId,
    actor: ACTOR,
    recordedAtUtc: RECORDED_AT,
    redactionReviewed: true,
  };
}

function createProfile(root = 'artifacts/phase-08') {
  return {
    schemaVersion: 1,
    phase: '08',
    status: 'CONFIRMED',
    releaseProfile: 'ACADEMIC_DEMO_RELEASE',
    releaseId: RELEASE_ID,
    rationale: 'Public academic demonstration with synthetic data and isolated environments.',
    owner: 'Tran Duc Toan',
    studentId: '2351010210',
    confirmedAtUtc: RECORDED_AT,
    dataMode: 'SYNTHETIC_ONLY',
    productionClaim: 'PRODUCTION_LIKE_ACADEMIC_DEMO',
    includedScope: ['BA Must capabilities from Phase 01 through Phase 07'],
    conditionalCapabilities: ['Custom domain'],
    excludedScope: ['Real learner data', 'Organization SLA'],
    residualRiskIds: ['P08-RISK-003'],
    stopConditions: ['Stop when real data is introduced without a profile change'],
    artifactRetention: { root, retentionDays: 90 },
    governance: {
      soloProject: true,
      independentReview: false,
      actor: ACTOR,
      roleAssignments: {
        productOwner: ACTOR,
        businessAnalyst: ACTOR,
        technicalLead: ACTOR,
        qa: ACTOR,
        devOps: ACTOR,
        support: ACTOR,
      },
    },
  };
}

function passEvidence(id) {
  return {
    id,
    status: 'PASS',
    artifact: `artifacts/phase-08/${RELEASE_ID}/${id}.json`,
    recordedAtUtc: RECORDED_AT,
    actor: ACTOR,
    expectedResult: `${id} expected outcome is satisfied`,
    actualResult: `${id} validated against the release candidate`,
    redactionReviewed: true,
  };
}

function createPreReleaseAcceptance() {
  const preReleaseCriteria = new Set(PHASE08_PRE_RELEASE_CRITERIA);
  const preReleaseEvidence = new Set(PHASE08_PRE_RELEASE_EVIDENCE);
  return {
    schemaVersion: 1,
    phase: '08',
    acceptanceStage: 'PRE_RELEASE',
    status: 'PASS',
    ...actualMetadata(),
    releaseIdentity: { ...BASE_IDENTITY },
    acceptanceCriteria: PHASE08_CRITERIA.map((id) =>
      preReleaseCriteria.has(id)
        ? { id, status: 'PASS', evidenceIds: ['P08-EV-001'] }
        : { id, status: 'PENDING' },
    ),
    evidence: PHASE08_EVIDENCE.map((id) =>
      preReleaseEvidence.has(id) ? passEvidence(id) : { id, status: 'PENDING' },
    ),
  };
}

function createFinalAcceptance() {
  return {
    schemaVersion: 1,
    phase: '08',
    acceptanceStage: 'FINAL',
    status: 'PASS',
    ...actualMetadata(FINAL_IDENTITY),
    releaseIdentity: { ...FINAL_IDENTITY },
    acceptanceCriteria: PHASE08_CRITERIA.map((id) => ({
      id,
      status: 'PASS',
      evidenceIds: ['P08-EV-001'],
    })),
    evidence: PHASE08_EVIDENCE.map(passEvidence),
  };
}

function createSystemTest(identity = BASE_IDENTITY) {
  return {
    schemaVersion: 1,
    phase: '08',
    status: 'PASS',
    ...actualMetadata(identity),
    releaseIdentity: { ...identity },
    summary: { ...PASS_COUNTS },
    criticalDefects: 0,
    highDefects: 0,
    evidenceIds: ['P08-EV-010'],
  };
}

function createUat(identity = BASE_IDENTITY) {
  const testedAtUtc = RECORDED_AT;
  return {
    schemaVersion: 1,
    phase: '08',
    status: 'PASS',
    ...actualMetadata(identity),
    releaseIdentity: { ...identity },
    summary: { ...PASS_COUNTS },
    criticalDefects: 0,
    highDefects: 0,
    uatRunId: 'P08-G3-UAT-20260910-01',
    startedAtUtc: testedAtUtc,
    endedAtUtc: testedAtUtc,
    dataMode: 'SYNTHETIC',
    executionModel: 'SOLO_ROLE_SIMULATION',
    personas: [
      'GUEST',
      'STUDENT_A',
      'STUDENT_B',
      'TEACHER_A',
      'TEACHER_B',
      'ADMIN',
      'SUPER_ADMIN',
      'QA_DEVOPS',
    ].map((id) => ({
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
        evidence: `uat/playwright-results.json#${id}`,
        testedAtUtc,
        status: 'PASS',
      };
    }),
    governance: { soloProject: true, independentReview: false, actor: ACTOR },
    recommendations: { qa: 'GO', business: 'GO', technical: 'GO' },
    evidenceIds: ['P08-EV-020', 'P08-EV-025', 'P08-EV-026'],
  };
}

function createDecision(identity = BASE_IDENTITY) {
  return {
    schemaVersion: 1,
    phase: '08',
    decision: 'GO',
    ...actualMetadata(identity),
    decisionId: 'P08-G5-20260910-01',
    rationale: 'All pre-release gates passed for the exact immutable candidate.',
    decidedAtUtc: RECORDED_AT,
    releaseIdentity: { ...identity },
    systemTestStatus: 'PASS',
    uatStatus: 'PASS',
    preReleaseAcceptanceStatus: 'PASS',
    criticalDefects: 0,
    highDefects: 0,
    recommendations: { technicalLead: 'GO', qa: 'GO', devOps: 'GO' },
    governance: { soloProject: true, independentReview: false, actor: ACTOR },
    evidenceIds: ['P08-EV-030'],
    conditions: [],
    productionApplyMode: 'PLAN_ONLY',
  };
}

function createExit() {
  return {
    schemaVersion: 1,
    phase: '08',
    decision: 'GO',
    ...actualMetadata(FINAL_IDENTITY),
    exitId: 'P08-G8-20260910-01',
    rationale: 'Final acceptance, production verification and handover are complete.',
    decidedAtUtc: RECORDED_AT,
    finalAcceptanceStatus: 'PASS',
    releaseIdentity: { ...FINAL_IDENTITY },
    evidenceIds: ['P08-EV-050', 'P08-EV-055'],
    production: {
      status: 'ACTUAL',
      applyMode: 'APPLY',
      protectedEnvironment: true,
      approvedDecision: 'GO',
      goNoGoDecisionId: 'P08-G5-20260910-01',
      revision: FINAL_IDENTITY.productionRevision,
      url: FINAL_IDENTITY.productionUrl,
    },
  };
}

function expectError(errors, fragment) {
  assert.ok(
    errors.some((error) => error.includes(fragment)),
    `Expected an error containing "${fragment}", received: ${errors.join('; ')}`,
  );
}

const cases = [
  [
    'accepts the academic solo release profile',
    () => {
      assert.deepEqual(validatePhase08Profile(createProfile()), []);
    },
  ],
  [
    'rejects real data under the academic profile',
    () => {
      expectError(
        validatePhase08Profile({ ...createProfile(), dataMode: 'REAL_DATA' }),
        'SYNTHETIC_ONLY',
      );
    },
  ],
  [
    'rejects a false independent review claim for a solo project',
    () => {
      const profile = createProfile();
      profile.governance.independentReview = true;
      expectError(validatePhase08Profile(profile), 'independentReview');
    },
  ],
  [
    'accepts an immutable release identity',
    () => {
      assert.deepEqual(validatePhase08Identity({ ...BASE_IDENTITY }, { actual: true }), []);
    },
  ],
  [
    'rejects a mutable image identity',
    () => {
      expectError(
        validatePhase08Identity({ ...BASE_IDENTITY, imageDigest: 'app:latest' }),
        'immutable',
      );
    },
  ],
  [
    'accepts PRE_RELEASE with G0-G4 evidence only',
    () => {
      assert.deepEqual(validatePhase08Acceptance(createPreReleaseAcceptance()), []);
    },
  ],
  [
    'rejects post-deployment criteria passed before deployment',
    () => {
      const acceptance = createPreReleaseAcceptance();
      acceptance.acceptanceCriteria[10] = {
        id: 'P08-AC-011',
        status: 'PASS',
        evidenceIds: ['P08-EV-001'],
      };
      expectError(validatePhase08Acceptance(acceptance), 'post-deployment criteria');
    },
  ],
  [
    'rejects missing pre-release evidence',
    () => {
      const acceptance = createPreReleaseAcceptance();
      acceptance.evidence.find(({ id }) => id === 'P08-EV-026').status = 'PENDING';
      expectError(validatePhase08Acceptance(acceptance), 'G0-G4 evidence');
    },
  ],
  [
    'accepts FINAL only when every criterion and evidence item passes',
    () => {
      assert.deepEqual(validatePhase08Acceptance(createFinalAcceptance()), []);
    },
  ],
  [
    'rejects pending evidence in FINAL acceptance',
    () => {
      const acceptance = createFinalAcceptance();
      acceptance.evidence.at(-1).status = 'PENDING';
      expectError(validatePhase08Acceptance(acceptance), 'every evidence entry');
    },
  ],
  [
    'rejects duplicate evidence IDs',
    () => {
      const acceptance = createFinalAcceptance();
      acceptance.evidence[1].id = acceptance.evidence[0].id;
      expectError(validatePhase08Acceptance(acceptance), 'unique');
    },
  ],
  [
    'rejects placeholders in passed evidence',
    () => {
      const acceptance = createFinalAcceptance();
      acceptance.evidence[0].actualResult = 'TBD';
      expectError(validatePhase08Acceptance(acceptance), 'placeholder');
    },
  ],
  [
    'rejects a passed acceptance record without redaction review',
    () => {
      const acceptance = createFinalAcceptance();
      acceptance.redactionReviewed = false;
      expectError(validatePhase08Acceptance(acceptance), 'redactionReviewed');
    },
  ],
  [
    'accepts passing System Test and UAT summaries',
    () => {
      assert.deepEqual(validatePhase08SystemTest(createSystemTest()), []);
      assert.deepEqual(validatePhase08Uat(createUat()), []);
    },
  ],
  [
    'accepts a solo G5 GO decision with role recommendations',
    () => {
      assert.deepEqual(validatePhase08Decision(createDecision()), []);
    },
  ],
  [
    'rejects the deprecated final acceptance field at G5',
    () => {
      expectError(
        validatePhase08Decision({ ...createDecision(), acceptanceStatus: 'PASS' }),
        'deprecated',
      );
    },
  ],
  [
    'rejects APPLY mode in the G5 decision record',
    () => {
      expectError(
        validatePhase08Decision({ ...createDecision(), productionApplyMode: 'APPLY' }),
        'PLAN_ONLY',
      );
    },
  ],
  [
    'rejects GO when a role recommendation is not GO',
    () => {
      const decision = createDecision();
      decision.recommendations.qa = 'NO_GO';
      expectError(validatePhase08Decision(decision), 'GO recommendations');
    },
  ],
  [
    'accepts protected production APPLY after G5 GO',
    () => {
      assert.deepEqual(validatePhase08Exit(createExit()), []);
    },
  ],
  [
    'rejects ACTUAL production recorded as PLAN_ONLY',
    () => {
      const exit = createExit();
      exit.production.applyMode = 'PLAN_ONLY';
      expectError(validatePhase08Exit(exit), 'requires production.applyMode APPLY');
    },
  ],
  [
    'rejects APPLY outside a protected environment',
    () => {
      const exit = createExit();
      exit.production.protectedEnvironment = false;
      expectError(validatePhase08Exit(exit), 'protected execution environment');
    },
  ],
  [
    'rejects APPLY without an approved G5 decision',
    () => {
      const exit = createExit();
      delete exit.production.approvedDecision;
      expectError(validatePhase08Exit(exit), 'approved GO or CONDITIONAL_GO decision');
    },
  ],
  [
    'rejects final GO without an actual production result',
    () => {
      const exit = createExit();
      exit.production = { status: 'NOT_RUN', applyMode: 'PLAN_ONLY' };
      expectError(validatePhase08Exit(exit), 'ACTUAL production result');
    },
  ],
  [
    'rejects a production revision mismatch',
    () => {
      const exit = createExit();
      exit.production.revision = 'another-production-revision';
      expectError(validatePhase08Exit(exit), 'must match releaseIdentity.productionRevision');
    },
  ],
  [
    'accepts PRE_RELEASE readiness without an exit record',
    () => {
      assert.deepEqual(
        validatePhase08Readiness({
          schemaVersion: 1,
          phase: '08',
          stage: 'PRE_RELEASE',
          acceptance: createPreReleaseAcceptance(),
          systemTest: createSystemTest(),
          uat: createUat(),
          decision: createDecision(),
        }),
        [],
      );
    },
  ],
  [
    'accepts FINAL readiness with final acceptance and exit records',
    () => {
      assert.deepEqual(
        validatePhase08Readiness({
          schemaVersion: 1,
          phase: '08',
          stage: 'FINAL',
          acceptance: createFinalAcceptance(),
          systemTest: createSystemTest(FINAL_IDENTITY),
          uat: createUat(FINAL_IDENTITY),
          decision: createDecision(FINAL_IDENTITY),
          exit: createExit(),
        }),
        [],
      );
    },
  ],
  [
    'rejects FINAL readiness without an exit record',
    () => {
      expectError(
        validatePhase08Readiness({
          schemaVersion: 1,
          phase: '08',
          stage: 'FINAL',
          acceptance: createFinalAcceptance(),
          systemTest: createSystemTest(FINAL_IDENTITY),
          uat: createUat(FINAL_IDENTITY),
          decision: createDecision(FINAL_IDENTITY),
        }),
        'exit record is required',
      );
    },
  ],
  [
    'rejects FINAL readiness linked to another G5 decision',
    () => {
      const exit = createExit();
      exit.production.goNoGoDecisionId = 'P08-G5-20260910-99';
      expectError(
        validatePhase08Readiness({
          schemaVersion: 1,
          phase: '08',
          stage: 'FINAL',
          acceptance: createFinalAcceptance(),
          systemTest: createSystemTest(FINAL_IDENTITY),
          uat: createUat(FINAL_IDENTITY),
          decision: createDecision(FINAL_IDENTITY),
          exit,
        }),
        'decision ID must match',
      );
    },
  ],
  [
    'rejects inconsistent release identities',
    () => {
      expectError(
        validatePhase08IdentityConsistency([
          BASE_IDENTITY,
          { ...BASE_IDENTITY, commitSha: 'c'.repeat(40) },
        ]),
        'commitSha',
      );
    },
  ],
  [
    'redacts secret keys and inline credentials',
    () => {
      const safe = redactPhase08Report({
        password: 'not-for-evidence',
        note: 'Bearer abc.def.ghi',
        nested: { mongodbUri: 'mongodb+srv://user:password@example.test/db' },
      });
      assert.equal(safe.password, '[REDACTED]');
      assert.equal(safe.note, 'Bearer [REDACTED]');
      assert.equal(safe.nested.mongodbUri, '[REDACTED]');
    },
  ],
  [
    'creates an isolated release evidence workspace',
    () => {
      const tempRoot = mkdtempSync(join(tmpdir(), 'phase-08-contract-'));
      try {
        const { releasePath, manifest } = initializePhase08Workspace(createProfile(tempRoot));
        assert.equal(manifest.releaseId, RELEASE_ID);
        assert.deepEqual(manifest.directories, PHASE08_WORKSPACE_DIRECTORIES);
        const storedProfile = JSON.parse(readFileSync(join(releasePath, 'release-profile.json')));
        assert.equal(storedProfile.status, 'CONFIRMED');
        PHASE08_WORKSPACE_DIRECTORIES.forEach((directory) =>
          assert.ok(manifest.directories.includes(directory)),
        );
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  ],
  [
    'refuses to overwrite an existing release workspace',
    () => {
      const tempRoot = mkdtempSync(join(tmpdir(), 'phase-08-contract-'));
      try {
        const profile = createProfile(tempRoot);
        initializePhase08Workspace(profile);
        assert.throws(() => initializePhase08Workspace(profile), /already exists/u);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  ],
];

for (const [name, run] of cases) {
  try {
    run();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

process.stdout.write(
  `${JSON.stringify({ event: 'phase-08.contract.tests_passed', cases: cases.length })}\n`,
);
