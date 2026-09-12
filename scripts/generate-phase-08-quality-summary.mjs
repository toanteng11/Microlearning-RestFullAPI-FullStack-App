import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { readJson } from './lib/phase-08-cli.mjs';
import { buildPhase08QualitySummary } from './lib/phase-08-quality.mjs';

const [identityPath, observationsPath, outputPathValue] = process.argv.slice(2);
if (!identityPath || !observationsPath || !outputPathValue) {
  throw new Error(
    'Usage: node scripts/generate-phase-08-quality-summary.mjs <identity.json> <observations.json> <output.json>',
  );
}

const summary = buildPhase08QualitySummary({
  releaseIdentity: readJson(identityPath, 'Phase 08 release identity').value,
  observations: readJson(observationsPath, 'Phase 08 quality observations').value,
  actor: process.env.PHASE08_ACTOR ?? 'Phase 08 quality workflow',
  recordedAtUtc: new Date().toISOString(),
  workflowUrl: process.env.PHASE08_WORKFLOW_URL ?? 'https://github.com/actions/phase-08-quality',
});
const outputPath = resolve(outputPathValue);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
process.stdout.write(
  `${JSON.stringify({ event: 'phase-08.quality_summary.created', status: summary.status })}\n`,
);
if (summary.status !== 'PASS') process.exitCode = 1;
