import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  buildPhase08IdentityReport,
  buildPhase08SystemTestSummary,
  summarizePlaywrightReport,
} from './lib/phase-08-system-test.mjs';

const workflow = readFileSync('.github/workflows/phase-08-system-test.yml', 'utf8');
const deploymentWorkflow = readFileSync('.github/workflows/deploy-staging.yml', 'utf8');
const terraformSetup = 'hashicorp/setup-terraform@dfe3c3f87815947d99a8997f908cb6525fc44e9e';

assert.match(workflow, new RegExp(terraformSetup));
assert.match(workflow, /terraform_version:\s*1\.15\.8/u);
assert.ok(
  workflow.indexOf(terraformSetup) < workflow.indexOf('name: Check Terraform formatting'),
  'Terraform must be installed before the Phase 08 formatting gate runs.',
);
assert.match(workflow, /E2E_SECRET_CANARY:-PHASE_08_NO_SECRET_RETRIEVED_CANARY/u);
assert.match(deploymentWorkflow, /\.status\.latestReadyRevisionName/u);
assert.match(deploymentWorkflow, /\.status\.traffic\[\]\?/u);
assert.match(
  deploymentWorkflow,
  /test "\$live_image" = "\$\{\{ steps\.release\.outputs\.image_ref \}\}"/u,
);
assert.match(
  deploymentWorkflow,
  /test "\$live_commit" = "\$\{\{ steps\.release\.outputs\.commit_sha \}\}"/u,
);

const identity = {
  schemaVersion: 1,
  phase: '08',
  releaseId: 'P08-RC-20260910-a1b2c3d',
  commitSha: 'a'.repeat(40),
  imageDigest: `asia-southeast1-docker.pkg.dev/project/repository/app@sha256:${'b'.repeat(64)}`,
  stagingRevision: 'microlearning-staging-00042-abc',
  stagingUrl: 'https://microlearning-staging.example.run.app',
  productionRevision: 'NOT_RUN',
  productionUrl: 'NOT_RUN',
};
const runtime = {
  version: '0.1.0',
  environment: 'staging',
  commitSha: identity.commitSha,
  imageDigest: identity.imageDigest.split('@').at(-1),
};
const provider = {
  serviceUrl: identity.stagingUrl,
  latestReadyRevision: identity.stagingRevision,
  trafficRevision: identity.stagingRevision,
  imageDigest: identity.imageDigest,
  commitSha: identity.commitSha,
  sourceArtifactRevision: 'microlearning-staging-00041-old',
  sourceArtifactImage: identity.imageDigest,
  sourceArtifactCommit: identity.commitSha,
};
const report = {
  suites: [
    {
      title: 'Phase 08 release System Test',
      specs: [
        {
          title: '[P08-ST-001] identity',
          tests: [
            {
              projectName: 'phase-08-system-chromium',
              status: 'expected',
              results: [{ status: 'passed', duration: 20 }],
            },
          ],
        },
        {
          title: '[P08-ST-002] retry',
          tests: [
            {
              projectName: 'phase-08-system-chromium',
              status: 'flaky',
              results: [
                { status: 'failed', duration: 10 },
                { status: 'passed', duration: 15 },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const identityReport = buildPhase08IdentityReport({
  releaseIdentity: identity,
  provider,
  runtimeVersion: runtime,
  observedAtUtc: '2026-09-10T16:10:00.000Z',
  actor: 'Phase 08 test',
});
assert.equal(identityReport.status, 'PASS');
assert.equal(identityReport.reconciliation.status, 'RECONCILED_STALE_RECORD');

const execution = summarizePlaywrightReport(report);
assert.deepEqual(execution.counts, {
  mustTotal: 2,
  mustPassed: 2,
  passCount: 2,
  failCount: 0,
  blockedCount: 0,
  notRunCount: 0,
  waivedCount: 0,
});
assert.equal(execution.retryCount, 1);
assert.equal(execution.flakyCount, 1);

const summary = buildPhase08SystemTestSummary({
  releaseIdentity: identity,
  playwrightReport: report,
  identityReport,
  scanReport: { status: 'PASS', releaseId: identity.releaseId },
  actor: 'Phase 08 test',
  recordedAtUtc: '2026-09-10T16:20:00.000Z',
  workflowUrl: 'https://github.com/example/repository/actions/runs/1',
});
assert.equal(summary.status, 'PASS');
assert.deepEqual(summary.evidenceIds, ['P08-EV-010', 'P08-EV-015', 'P08-EV-016']);

assert.throws(
  () =>
    buildPhase08IdentityReport({
      releaseIdentity: identity,
      provider: { ...provider, trafficRevision: 'microlearning-staging-00099-wrong' },
      runtimeVersion: runtime,
      observedAtUtc: '2026-09-10T16:10:00.000Z',
      actor: 'Phase 08 test',
    }),
  /traffic-revision/u,
);
assert.throws(
  () => summarizePlaywrightReport({ suites: [{ specs: [{ title: 'missing id', tests: [{}] }] }] }),
  /P08-ST-nnn/u,
);
assert.throws(
  () =>
    buildPhase08IdentityReport({
      releaseIdentity: { ...identity, releaseId: 'phase-08-local' },
      provider,
      runtimeVersion: runtime,
      observedAtUtc: '2026-09-10T16:10:00.000Z',
      actor: 'Phase 08 test',
    }),
  /releaseId/u,
);

process.stdout.write(
  `${JSON.stringify({ event: 'phase-08.system_test_tooling.tests_passed', cases: 14 })}\n`,
);
