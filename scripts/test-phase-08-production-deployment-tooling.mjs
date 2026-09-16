import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { validatePhase08ProductionDeployment } from './lib/phase-08-production-deployment.mjs';

const commit = 'a'.repeat(40);
const image = `asia-southeast1-docker.pkg.dev/microlearning-platform-502716/microlearning/microlearning-app@sha256:${'b'.repeat(64)}`;
const valid = {
  schemaVersion: 1,
  phase: '08',
  recordType: 'PRODUCTION_DEPLOYMENT',
  status: 'ACTUAL',
  applyMode: 'APPLY',
  protectedEnvironment: true,
  redactionReviewed: true,
  releaseId: 'P08-RC-20260916-aaaaaaa',
  actor: 'Tran Duc Toan / GitHub Actions',
  recordedAtUtc: '2026-09-16T10:00:00.000Z',
  releaseIdentity: {
    releaseId: 'P08-RC-20260916-aaaaaaa',
    commitSha: commit,
    imageDigest: image,
    stagingRevision: 'microlearning-staging-00028-wgq',
    stagingUrl: 'https://microlearning-staging.example.run.app',
    productionRevision: 'microlearning-production-00001-abc',
    productionUrl: 'https://microlearning-production.example.run.app',
  },
  approval: {
    decision: 'GO',
    decisionId: 'P08-G5-20260916-01',
    decisionRecordSha256: `sha256:${'c'.repeat(64)}`,
    sourceG5RunId: '123456',
  },
  terraform: {
    planStatus: 'PASS',
    policyStatus: 'PASS',
    applyStatus: 'PASS',
    postApplyDriftStatus: 'PASS',
    planHash: `sha256:${'d'.repeat(64)}`,
    destroyCount: 0,
  },
  cloudRun: {
    serviceName: 'microlearning-production',
    revision: 'microlearning-production-00001-abc',
    url: 'https://microlearning-production.example.run.app',
    trafficPercent: 100,
    observedImageDigest: image,
    observedCommitSha: commit,
    previousRevision: null,
    previousImageDigest: null,
  },
  smoke: {
    status: 'PASS',
    report: 'artifacts/phase-08/P08-RC-20260916-aaaaaaa/deployment/production-smoke.json',
    reportSha256: `sha256:${'e'.repeat(64)}`,
  },
  roleSmoke: {
    status: 'PASS',
    personas: 4,
    report:
      'artifacts/phase-08/P08-RC-20260916-aaaaaaa/deployment/role-smoke/playwright-results.json',
    reportSha256: `sha256:${'f'.repeat(64)}`,
  },
  evidenceIds: ['P08-EV-031', 'P08-EV-037'],
};

assert.deepEqual(validatePhase08ProductionDeployment(valid), []);

const mutations = [
  ['plan only', { applyMode: 'PLAN_ONLY' }, 'APPLY'],
  ['unprotected', { protectedEnvironment: false }, 'protectedEnvironment'],
  [
    'mutable image',
    { releaseIdentity: { ...valid.releaseIdentity, imageDigest: 'example/app:latest' } },
    'immutable',
  ],
  ['missing G5', { approval: { ...valid.approval, sourceG5RunId: '' } }, 'sourceG5RunId'],
  ['destroy', { terraform: { ...valid.terraform, destroyCount: 1 } }, 'destroyCount'],
  ['partial traffic', { cloudRun: { ...valid.cloudRun, trafficPercent: 50 } }, 'trafficPercent'],
  [
    'digest mismatch',
    { cloudRun: { ...valid.cloudRun, observedImageDigest: `${image.slice(0, -1)}c` } },
    'observedImageDigest',
  ],
  ['failed smoke', { smoke: { ...valid.smoke, status: 'FAIL' } }, 'smoke.status'],
  ['missing role', { roleSmoke: { ...valid.roleSmoke, personas: 3 } }, 'roleSmoke.personas'],
  ['secret field', { notes: { password: 'forbidden' } }, 'Secret-like field'],
  ['connection URI', { notes: 'mongodb+srv://example.invalid/db' }, 'connection URI'],
];

for (const [name, mutation, expected] of mutations) {
  const errors = validatePhase08ProductionDeployment({ ...valid, ...mutation });
  assert.ok(
    errors.some((error) => error.includes(expected)),
    `${name}: ${errors.join('; ')}`,
  );
}

const workflow = readFileSync('.github/workflows/promote-production.yml', 'utf8');
assert.match(workflow, /name: Phase 08 Production Promotion/u);
assert.match(workflow, /environment: production/u);
assert.match(workflow, /Phase 08 Pre-release G5/u);
assert.match(workflow, /phase-08:pre-release:verify/u);
assert.match(workflow, /echo "commit_sha=\$candidate_commit" >> "\$GITHUB_OUTPUT"/u);
assert.match(workflow, /terraform apply -input=false -auto-approve production-promotion\.tfplan/u);
assert.match(workflow, /E2E_DEMO_PASSWORD_PRODUCTION/u);
assert.match(workflow, /test:e2e:phase-08:production/u);
assert.match(workflow, /phase-08:production-deployment:validate/u);
assert.match(workflow, /Roll back after a post-apply failure/u);
assert.match(workflow, /retention-days: 90/u);

process.stdout.write(
  `${JSON.stringify({ event: 'phase-08.production_deployment_tooling.tests_passed', cases: 23 })}\n`,
);
