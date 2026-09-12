import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { readJson } from './lib/phase-08-cli.mjs';
import { buildPhase08UatReadiness, buildPhase08UatSummary } from './lib/phase-08-uat.mjs';

const [identityPath, observationsPath, outputPathValue, readinessPathValue] = process.argv.slice(2);
if (!identityPath || !observationsPath || !outputPathValue || !readinessPathValue) {
  throw new Error(
    'Usage: node scripts/generate-phase-08-uat-summary.mjs <identity.json> <observations.json> <summary.json> <readiness.json>',
  );
}

const identity = readJson(identityPath, 'Phase 08 release identity').value;
const observations = readJson(observationsPath, 'Phase 08 UAT observations').value;
const actor = process.env.PHASE08_ACTOR ?? 'Phase 08 UAT workflow';
const recordedAtUtc = new Date().toISOString();
const readiness = buildPhase08UatReadiness({
  releaseIdentity: identity,
  observations,
  actor,
  recordedAtUtc,
});
const summary = buildPhase08UatSummary({
  releaseIdentity: identity,
  observations,
  actor,
  recordedAtUtc,
  workflowUrl: process.env.PHASE08_WORKFLOW_URL ?? 'https://github.com/actions/phase-08-uat',
  signoff: {
    confirmation: process.env.PHASE08_UAT_CONFIRMATION,
    decisionId: process.env.PHASE08_UAT_RUN_ID,
    rationale:
      'The solo owner executed each synthetic persona and accepted the recorded row-level outcomes.',
    governance: { soloProject: true, independentReview: false, actor },
    recommendations: { qa: 'GO', business: 'GO', technical: 'GO' },
  },
});

for (const [pathValue, record] of [
  [readinessPathValue, readiness],
  [outputPathValue, summary],
]) {
  const outputPath = resolve(pathValue);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
}
process.stdout.write(
  `${JSON.stringify({ event: 'phase-08.uat_summary.created', status: summary.status, mustPassed: summary.summary.mustPassed, mustTotal: summary.summary.mustTotal })}\n`,
);
if (summary.status !== 'PASS') process.exitCode = 1;
