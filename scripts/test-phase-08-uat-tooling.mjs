import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  buildPhase08UatReadiness,
  buildPhase08UatSummary,
  PHASE08_UAT_SCENARIO_IDS,
} from './lib/phase-08-uat.mjs';

const identity = {
  schemaVersion: 1,
  phase: '08',
  releaseId: 'P08-RC-20260912-a1b2c3d',
  commitSha: 'a'.repeat(40),
  imageDigest: `registry.example/app@sha256:${'b'.repeat(64)}`,
  stagingRevision: 'microlearning-staging-00042-abc',
  stagingUrl: 'https://microlearning-staging.example.run.app',
  productionRevision: 'NOT_RUN',
  productionUrl: 'NOT_RUN',
};
const actor = 'Trần Đức Toàn / GitHub Actions';
const at = '2026-09-12T16:00:00.000Z';
const personaIds = [
  'GUEST',
  'STUDENT_A',
  'STUDENT_B',
  'TEACHER_A',
  'TEACHER_B',
  'ADMIN',
  'SUPER_ADMIN',
  'QA_DEVOPS',
];
const observations = {
  schemaVersion: 1,
  phase: '08',
  releaseId: identity.releaseId,
  commitSha: identity.commitSha,
  stagingRevision: identity.stagingRevision,
  dataMode: 'SYNTHETIC',
  executionModel: 'SOLO_ROLE_SIMULATION',
  startedAtUtc: at,
  endedAtUtc: at,
  personas: personaIds.map((id) => ({
    id,
    role: id,
    sessionIsolation: 'SEPARATE_CONTEXT',
    synthetic: true,
    loginVerified: true,
  })),
  defects: [],
  scenarios: PHASE08_UAT_SCENARIO_IDS.map((id, index) => ({
    id,
    priority: id === 'P08-UT-027' ? 'CONDITIONAL' : 'MUST',
    persona: personaIds[index % personaIds.length],
    expected: `Expected outcome ${id}`,
    actual: `Observed outcome ${id}`,
    evidence: `uat/playwright-results.json#${id}`,
    testedAtUtc: at,
    status: 'PASS',
  })),
};
const signoff = {
  confirmation: 'ACCEPT_PHASE_08_UAT',
  decisionId: 'P08-G3-UAT-20260912-01',
  rationale: 'All Must scenarios passed for the exact candidate.',
  governance: { soloProject: true, independentReview: false, actor },
  recommendations: { qa: 'GO', business: 'GO', technical: 'GO' },
};

assert.equal(
  buildPhase08UatReadiness({ releaseIdentity: identity, observations, actor, recordedAtUtc: at })
    .status,
  'PASS',
);
const summary = buildPhase08UatSummary({
  releaseIdentity: identity,
  observations,
  signoff,
  actor,
  recordedAtUtc: at,
  workflowUrl: 'https://github.com/example/repository/actions/runs/1',
});
assert.equal(summary.status, 'PASS');
assert.equal(summary.summary.mustTotal, 31);
assert.equal(summary.summary.mustPassed, 31);
assert.deepEqual(summary.evidenceIds, ['P08-EV-020', 'P08-EV-025', 'P08-EV-026']);

assert.throws(
  () =>
    buildPhase08UatReadiness({
      releaseIdentity: identity,
      observations: { ...observations, scenarios: observations.scenarios.slice(1) },
      actor,
      recordedAtUtc: at,
    }),
  /exactly 32/u,
);
assert.throws(
  () =>
    buildPhase08UatReadiness({
      releaseIdentity: identity,
      observations: { ...observations, dataMode: 'REAL' },
      actor,
      recordedAtUtc: at,
    }),
  /SYNTHETIC/u,
);
assert.throws(
  () =>
    buildPhase08UatSummary({
      releaseIdentity: identity,
      observations,
      signoff: { ...signoff, confirmation: 'yes' },
      actor,
      recordedAtUtc: at,
      workflowUrl: 'https://github.com/example/repository/actions/runs/1',
    }),
  /confirmation/u,
);
assert.throws(
  () =>
    buildPhase08UatSummary({
      releaseIdentity: identity,
      observations,
      signoff: { ...signoff, governance: { ...signoff.governance, independentReview: true } },
      actor,
      recordedAtUtc: at,
      workflowUrl: 'https://github.com/example/repository/actions/runs/1',
    }),
  /independent review/u,
);
assert.throws(
  () =>
    buildPhase08UatReadiness({
      releaseIdentity: identity,
      observations: {
        ...observations,
        scenarios: observations.scenarios.map((scenario) =>
          scenario.id === 'P08-UT-001'
            ? { ...scenario, status: 'APPROVED_NA', decisionId: 'P08-DEC-001' }
            : scenario,
        ),
      },
      actor,
      recordedAtUtc: at,
    }),
  /Must/u,
);

const failedObservations = {
  ...observations,
  scenarios: observations.scenarios.map((scenario) =>
    scenario.id === 'P08-UT-012'
      ? { ...scenario, status: 'FAIL', disposition: 'DEF-P08-001 opened.' }
      : scenario,
  ),
  defects: [
    {
      id: 'DEF-P08-001',
      scenarioId: 'P08-UT-012',
      severity: 'HIGH',
      status: 'OPEN',
      summary: 'Assignment submission did not meet the expected result.',
      evidence: 'uat/playwright-results.json#P08-UT-012',
      recordedAtUtc: at,
    },
  ],
};
const failed = buildPhase08UatSummary({
  releaseIdentity: identity,
  observations: failedObservations,
  signoff,
  actor,
  recordedAtUtc: at,
  workflowUrl: 'https://github.com/example/repository/actions/runs/1',
});
assert.equal(failed.status, 'FAIL');
assert.equal(failed.highDefects, 1);

assert.throws(
  () =>
    buildPhase08UatReadiness({
      releaseIdentity: identity,
      observations: {
        ...failedObservations,
        defects: [],
      },
      actor,
      recordedAtUtc: at,
    }),
  /linked defect/u,
);

const workflow = readFileSync('.github/workflows/phase-08-system-test.yml', 'utf8');
assert.match(workflow, /run_uat:/u);
assert.match(workflow, /if: inputs\.run_uat/u);
assert.match(workflow, /test "\$UAT_CONFIRMATION" = "ACCEPT_PHASE_08_UAT"/u);
assert.match(workflow, /test "\$OPERATIONS_EVIDENCE_STATUS" = "PASS"/u);
assert.match(workflow, /test "\$RECOVERY_EVIDENCE_STATUS" = "PASS"/u);

process.stdout.write(
  `${JSON.stringify({ event: 'phase-08.uat_tooling.tests_passed', cases: 14 })}\n`,
);
