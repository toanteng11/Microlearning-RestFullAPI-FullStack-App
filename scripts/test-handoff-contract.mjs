import assert from 'node:assert/strict';

import { validatePhase08Handoff } from './lib/handoff-contract.mjs';

const IMAGE = `asia-southeast1-docker.pkg.dev/microlearning-platform-502716/microlearning/api@sha256:${'a'.repeat(64)}`;
const ROLLBACK_IMAGE = `asia-southeast1-docker.pkg.dev/microlearning-platform-502716/microlearning/api@sha256:${'b'.repeat(64)}`;

function createValidHandoff() {
  return {
    schemaVersion: 1,
    phase: '08',
    releaseProfile: 'ACADEMIC_DEMO_RELEASE',
    releaseId: 'P08-RC-20260910-a1b2c3d',
    commitSha: 'a1b2c3d4e5f6789012345678901234567890abcd',
    verifiedStagingDigest: IMAGE,
    registryImageDigest: IMAGE,
    deployedImageDigest: IMAGE,
    stagingRevision: 'microlearning-staging-00042-abc',
    stagingUrl: 'https://microlearning-staging.example.run.app',
    stableWorkflowRunUrl: 'https://github.com/example/microlearning/actions/runs/123456',
    phase07ExitRecord: 'docs/implementation/phase-07/exit-report.md',
    stagingDeploymentRecord: 'artifacts/phase-07/staging-deployment-record.json',
    rollbackRecord: 'artifacts/phase-07/rollback-record.json',
    rollbackImageDigest: ROLLBACK_IMAGE,
    residualRisks: ['P07-RISK-003: synthetic academic data only'],
    phase07ExitDecision: 'PASS',
    productionDecision: 'NO_GO',
    accepted: true,
    acceptedBy: 'Trần Đức Toàn / 2351010210',
    acceptedAtUtc: '2026-09-10T06:00:00.000Z',
  };
}

function expectError(record, fragment) {
  const errors = validatePhase08Handoff(record);
  assert.ok(
    errors.some((error) => error.includes(fragment)),
    `Expected an error containing "${fragment}", received: ${errors.join('; ')}`,
  );
}

const cases = [
  [
    'accepts the exact G0 handoff without future Phase 08 outputs',
    () => {
      assert.deepEqual(validatePhase08Handoff(createValidHandoff()), []);
    },
  ],
  [
    'rejects a short commit SHA',
    () => {
      expectError({ ...createValidHandoff(), commitSha: 'a1b2c3d' }, 'full 40-character');
    },
  ],
  [
    'rejects a release ID that points to another commit',
    () => {
      expectError(
        { ...createValidHandoff(), releaseId: 'P08-RC-20260910-b1b2c3d' },
        'short SHA must match',
      );
    },
  ],
  [
    'rejects a mutable staging image reference',
    () => {
      expectError(
        { ...createValidHandoff(), verifiedStagingDigest: 'example/api:latest' },
        'immutable image reference',
      );
    },
  ],
  [
    'rejects a registry and deployed digest mismatch',
    () => {
      expectError({ ...createValidHandoff(), deployedImageDigest: ROLLBACK_IMAGE }, 'must match');
    },
  ],
  [
    'rejects an invalid rollback digest',
    () => {
      expectError(
        { ...createValidHandoff(), rollbackImageDigest: 'example/api:rollback' },
        'rollbackImageDigest',
      );
    },
  ],
  [
    'rejects production GO before Phase 08 validation',
    () => {
      expectError({ ...createValidHandoff(), productionDecision: 'GO' }, 'must be NO_GO');
    },
  ],
  [
    'rejects an unaccepted handoff',
    () => {
      expectError({ ...createValidHandoff(), accepted: false }, 'accepted must be true');
    },
  ],
  [
    'rejects a non-HTTPS staging URL',
    () => {
      expectError({ ...createValidHandoff(), stagingUrl: 'http://localhost:4000' }, 'HTTPS URL');
    },
  ],
  [
    'rejects a non-HTTPS stable workflow URL',
    () => {
      expectError(
        { ...createValidHandoff(), stableWorkflowRunUrl: 'workflow-run-123' },
        'stableWorkflowRunUrl must be an HTTPS URL',
      );
    },
  ],
  [
    'rejects a non-UTC acceptance time',
    () => {
      expectError(
        { ...createValidHandoff(), acceptedAtUtc: '2026-09-10T13:00:00+07:00' },
        'trailing Z',
      );
    },
  ],
  [
    'rejects a missing rollback record',
    () => {
      const record = createValidHandoff();
      delete record.rollbackRecord;
      expectError(record, 'rollbackRecord');
    },
  ],
  [
    'rejects placeholder residual risks',
    () => {
      expectError({ ...createValidHandoff(), residualRisks: ['TBD'] }, 'residualRisks[0]');
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

console.log(`Phase 08 handoff contract tests passed (${cases.length} cases).`);
