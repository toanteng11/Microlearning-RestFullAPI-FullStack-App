import { releaseIdentityFrom } from './phase-08-system-test.mjs';

export const PHASE08_UAT_SCENARIO_IDS = Object.freeze(
  Array.from({ length: 32 }, (_, index) => `P08-UT-${String(index + 1).padStart(3, '0')}`),
);

const CONDITIONAL_SCENARIOS = new Set(['P08-UT-027']);
const TERMINAL_STATUSES = new Set(['PASS', 'FAIL', 'BLOCKED', 'NOT RUN', 'APPROVED_NA']);
const PERSONAS = new Set([
  'GUEST',
  'STUDENT_A',
  'STUDENT_B',
  'TEACHER_A',
  'TEACHER_B',
  'ADMIN',
  'SUPER_ADMIN',
  'QA_DEVOPS',
]);
const DEFECT_SEVERITIES = new Set(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);
const DEFECT_STATUSES = new Set(['OPEN', 'FIXED', 'RETEST_PASS', 'ACCEPTED_RISK']);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertActualString(value, label) {
  assert(typeof value === 'string' && value.trim() !== '', `${label} is required.`);
  assert(
    !/<[^>]+>|\b(?:PENDING|TODO|TBD|PLACEHOLDER)\b/iu.test(value),
    `${label} contains a placeholder.`,
  );
}

function assertUtc(value, label) {
  assertActualString(value, label);
  assert(value.endsWith('Z') && !Number.isNaN(Date.parse(value)), `${label} must be UTC ISO-8601.`);
}

function validatePersona(persona, index) {
  const label = `personas[${index}]`;
  assertActualString(persona?.id, `${label}.id`);
  assert(PERSONAS.has(persona.id), `${label}.id is unsupported.`);
  assertActualString(persona?.role, `${label}.role`);
  assert(persona?.sessionIsolation === 'SEPARATE_CONTEXT', `${label} must use a separate context.`);
  assert(persona?.synthetic === true, `${label} must be synthetic.`);
  assert(persona?.loginVerified === true, `${label} login must be verified.`);
}

function validateScenario(scenario, index) {
  const label = `scenarios[${index}]`;
  assert(PHASE08_UAT_SCENARIO_IDS.includes(scenario?.id), `${label}.id is invalid.`);
  const expectedPriority = CONDITIONAL_SCENARIOS.has(scenario.id) ? 'CONDITIONAL' : 'MUST';
  assert(
    scenario.priority === expectedPriority,
    `${scenario.id} priority must be ${expectedPriority}.`,
  );
  assert(PERSONAS.has(scenario.persona), `${scenario.id} persona is invalid.`);
  assertActualString(scenario.expected, `${scenario.id}.expected`);
  assertActualString(scenario.actual, `${scenario.id}.actual`);
  assertActualString(scenario.evidence, `${scenario.id}.evidence`);
  assertUtc(scenario.testedAtUtc, `${scenario.id}.testedAtUtc`);
  assert(TERMINAL_STATUSES.has(scenario.status), `${scenario.id} status is invalid.`);
  if (scenario.priority === 'MUST') {
    assert(scenario.status !== 'APPROVED_NA', `${scenario.id} is Must and cannot be APPROVED_NA.`);
  }
  if (scenario.status === 'APPROVED_NA') {
    assertActualString(scenario.decisionId, `${scenario.id}.decisionId`);
  }
  if (scenario.status !== 'PASS' && scenario.status !== 'APPROVED_NA') {
    assertActualString(scenario.disposition, `${scenario.id}.disposition`);
  }
}

function validateDefect(defect, index) {
  const label = `defects[${index}]`;
  assertActualString(defect?.id, `${label}.id`);
  assert(PHASE08_UAT_SCENARIO_IDS.includes(defect?.scenarioId), `${label}.scenarioId is invalid.`);
  assert(DEFECT_SEVERITIES.has(defect?.severity), `${label}.severity is invalid.`);
  assert(DEFECT_STATUSES.has(defect?.status), `${label}.status is invalid.`);
  assertActualString(defect?.summary, `${label}.summary`);
  assertActualString(defect?.evidence, `${label}.evidence`);
  assertUtc(defect?.recordedAtUtc, `${label}.recordedAtUtc`);
  if (defect.status === 'RETEST_PASS') assertUtc(defect?.retestedAtUtc, `${label}.retestedAtUtc`);
  if (defect.status === 'ACCEPTED_RISK') {
    assertActualString(defect?.decisionId, `${label}.decisionId`);
    assert(
      !['CRITICAL', 'HIGH'].includes(defect.severity),
      `${defect.id} cannot waive a Critical/High defect.`,
    );
  }
}

export function buildPhase08UatReadiness({ releaseIdentity, observations, actor, recordedAtUtc }) {
  const identity = releaseIdentityFrom(releaseIdentity);
  assert(
    observations?.schemaVersion === 1 && observations?.phase === '08',
    'Invalid UAT observations envelope.',
  );
  assert(observations.releaseId === identity.releaseId, 'UAT observations releaseId mismatch.');
  assert(observations.commitSha === identity.commitSha, 'UAT observations commit mismatch.');
  assert(
    observations.stagingRevision === identity.stagingRevision,
    'UAT observations revision mismatch.',
  );
  assert(observations.dataMode === 'SYNTHETIC', 'UAT data mode must be SYNTHETIC.');
  assert(
    observations.executionModel === 'SOLO_ROLE_SIMULATION',
    'UAT execution model must be SOLO_ROLE_SIMULATION.',
  );
  assertUtc(observations.startedAtUtc, 'observations.startedAtUtc');
  assertUtc(observations.endedAtUtc, 'observations.endedAtUtc');

  const personas = observations.personas ?? [];
  assert(personas.length === PERSONAS.size, `UAT requires exactly ${PERSONAS.size} personas.`);
  personas.forEach(validatePersona);
  const personaIds = new Set(personas.map((persona) => persona.id));
  assert(personaIds.size === PERSONAS.size, 'UAT persona IDs must be unique.');
  for (const id of PERSONAS) assert(personaIds.has(id), `Missing UAT persona ${id}.`);

  const scenarios = observations.scenarios ?? [];
  assert(
    scenarios.length === PHASE08_UAT_SCENARIO_IDS.length,
    'UAT must contain exactly 32 scenario records.',
  );
  scenarios.forEach(validateScenario);
  const scenarioIds = new Set(scenarios.map((scenario) => scenario.id));
  assert(scenarioIds.size === scenarios.length, 'UAT scenario IDs must be unique.');
  for (const id of PHASE08_UAT_SCENARIO_IDS)
    assert(scenarioIds.has(id), `Missing UAT scenario ${id}.`);

  const defects = observations.defects ?? [];
  assert(Array.isArray(defects), 'observations.defects must be an array.');
  defects.forEach(validateDefect);
  const defectIds = new Set(defects.map((defect) => defect.id));
  assert(defectIds.size === defects.length, 'UAT defect IDs must be unique.');
  for (const scenario of scenarios.filter(
    (item) => !['PASS', 'APPROVED_NA'].includes(item.status),
  )) {
    assert(
      defects.some((defect) => defect.scenarioId === scenario.id),
      `${scenario.id} requires a linked defect record.`,
    );
  }

  return {
    schemaVersion: 1,
    phase: '08',
    recordType: 'UAT_READINESS',
    status: 'PASS',
    releaseId: identity.releaseId,
    releaseIdentity: identity,
    actor,
    recordedAtUtc,
    redactionReviewed: true,
    dataMode: observations.dataMode,
    executionModel: observations.executionModel,
    personas,
    defects,
    catalog: {
      total: scenarios.length,
      must: scenarios.filter((item) => item.priority === 'MUST').length,
      conditional: scenarios.filter((item) => item.priority === 'CONDITIONAL').length,
    },
    evidenceIds: ['P08-EV-003'],
  };
}

export function buildPhase08UatSummary({
  releaseIdentity,
  observations,
  signoff,
  actor,
  recordedAtUtc,
  workflowUrl,
}) {
  const identity = releaseIdentityFrom(releaseIdentity);
  const readiness = buildPhase08UatReadiness({
    releaseIdentity: identity,
    observations,
    actor,
    recordedAtUtc,
  });
  assert(
    signoff?.confirmation === 'ACCEPT_PHASE_08_UAT',
    'Explicit UAT acceptance confirmation is required.',
  );
  assertActualString(signoff?.decisionId, 'signoff.decisionId');
  assertActualString(signoff?.rationale, 'signoff.rationale');
  assert(signoff?.governance?.soloProject === true, 'UAT sign-off must declare soloProject=true.');
  assert(
    signoff?.governance?.independentReview === false,
    'Solo UAT cannot claim independent review.',
  );
  assert(signoff?.governance?.actor === actor, 'UAT governance actor mismatch.');
  for (const role of ['qa', 'business', 'technical']) {
    assert(
      signoff?.recommendations?.[role] === 'GO',
      `signoff.recommendations.${role} must be GO.`,
    );
  }

  const must = observations.scenarios.filter((scenario) => scenario.priority === 'MUST');
  const counts = {
    mustTotal: must.length,
    mustPassed: must.filter((scenario) => scenario.status === 'PASS').length,
    passCount: must.filter((scenario) => scenario.status === 'PASS').length,
    failCount: must.filter((scenario) => scenario.status === 'FAIL').length,
    blockedCount: must.filter((scenario) => scenario.status === 'BLOCKED').length,
    notRunCount: must.filter((scenario) => scenario.status === 'NOT RUN').length,
    waivedCount: 0,
  };
  const conditional = observations.scenarios.filter(
    (scenario) => scenario.priority === 'CONDITIONAL',
  );
  const openDefects = readiness.defects.filter((defect) =>
    ['OPEN', 'FIXED'].includes(defect.status),
  );
  const criticalDefects = openDefects.filter((defect) => defect.severity === 'CRITICAL').length;
  const highDefects = openDefects.filter((defect) => defect.severity === 'HIGH').length;
  const status =
    counts.mustPassed === counts.mustTotal &&
    conditional.every((scenario) => ['PASS', 'APPROVED_NA'].includes(scenario.status)) &&
    criticalDefects === 0 &&
    highDefects === 0
      ? 'PASS'
      : 'FAIL';

  return {
    schemaVersion: 1,
    phase: '08',
    recordType: 'UAT_SUMMARY',
    status,
    releaseId: identity.releaseId,
    releaseIdentity: identity,
    actor,
    recordedAtUtc,
    redactionReviewed: true,
    uatRunId: signoff.decisionId,
    startedAtUtc: observations.startedAtUtc,
    endedAtUtc: observations.endedAtUtc,
    dataMode: observations.dataMode,
    executionModel: observations.executionModel,
    readinessStatus: readiness.status,
    summary: counts,
    conditionalSummary: {
      total: conditional.length,
      passed: conditional.filter((scenario) => scenario.status === 'PASS').length,
      approvedNa: conditional.filter((scenario) => scenario.status === 'APPROVED_NA').length,
    },
    criticalDefects,
    highDefects,
    scenarios: observations.scenarios,
    personas: observations.personas,
    defects: readiness.defects,
    governance: signoff.governance,
    recommendations: signoff.recommendations,
    rationale: signoff.rationale,
    evidenceIds: ['P08-EV-020', 'P08-EV-025', 'P08-EV-026'],
    workflowUrl,
    sourceReports: {
      observations: 'uat/uat-observations.json',
      playwright: 'uat/playwright-results.json',
    },
  };
}
