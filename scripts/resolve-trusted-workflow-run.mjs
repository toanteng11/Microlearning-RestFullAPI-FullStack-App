import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { validateTrustedWorkflowRun } from './lib/cd-contract.mjs';

const [inputPathValue, workflowName, repository, allowedEventsValue, outputPathValue] =
  process.argv.slice(2);
if (!inputPathValue || !workflowName || !repository || !allowedEventsValue || !outputPathValue) {
  throw new Error(
    'Usage: node scripts/resolve-trusted-workflow-run.mjs <input.json> <workflow> <repository> <events-csv> <output.json>',
  );
}

const inputPath = resolve(inputPathValue);
if (!existsSync(inputPath)) throw new Error(`Workflow run input not found: ${inputPath}`);
const payload = JSON.parse(readFileSync(inputPath, 'utf8'));
const run = payload.workflow_run ?? payload;
const contract = validateTrustedWorkflowRun(run, {
  workflowName,
  repository,
  allowedEvents: allowedEventsValue.split(',').map((value) => value.trim()),
  expectedCommit: process.env.EXPECTED_RELEASE_COMMIT || undefined,
});

writeFileSync(resolve(outputPathValue), `${JSON.stringify(contract, null, 2)}\n`);
if (process.env.GITHUB_OUTPUT) {
  writeFileSync(
    process.env.GITHUB_OUTPUT,
    [
      `commit_sha=${contract.commitSha}`,
      `source_run_id=${contract.runId}`,
      `source_run_url=${contract.runUrl}`,
      `source_event=${contract.workflowEvent}`,
      '',
    ].join('\n'),
    { flag: 'a' },
  );
}
process.stdout.write(
  `${JSON.stringify({ event: 'cd.workflow_run.trusted', workflowName, runId: contract.runId })}\n`,
);
