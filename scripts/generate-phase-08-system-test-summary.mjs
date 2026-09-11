import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { readJson } from './lib/phase-08-cli.mjs';
import { buildPhase08SystemTestSummary } from './lib/phase-08-system-test.mjs';

const [identityPath, playwrightPath, identityReportPath, scanPath, outputPathValue] =
  process.argv.slice(2);
if (!identityPath || !playwrightPath || !identityReportPath || !scanPath || !outputPathValue) {
  throw new Error(
    'Usage: node scripts/generate-phase-08-system-test-summary.mjs <identity.json> <playwright.json> <identity-report.json> <scan.json> <output.json>',
  );
}

const summary = buildPhase08SystemTestSummary({
  releaseIdentity: readJson(identityPath, 'Phase 08 release identity').value,
  playwrightReport: readJson(playwrightPath, 'Playwright JSON report').value,
  identityReport: readJson(identityReportPath, 'Staging identity report').value,
  scanReport: readJson(scanPath, 'Phase 08 scan report').value,
  actor: process.env.PHASE08_ACTOR ?? 'Phase 08 System Test workflow',
  recordedAtUtc: new Date().toISOString(),
  workflowUrl:
    process.env.PHASE08_WORKFLOW_URL ?? 'https://github.com/actions/phase-08-system-test',
});
const outputPath = resolve(outputPathValue);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
process.stdout.write(
  `${JSON.stringify({ event: 'phase-08.system_test_summary.created', status: summary.status })}\n`,
);
if (summary.status !== 'PASS') process.exitCode = 1;
