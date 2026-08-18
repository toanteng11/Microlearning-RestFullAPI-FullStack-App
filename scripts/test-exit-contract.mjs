import assert from 'node:assert/strict';

import { assertValidPhase07Exit, validatePhase07Exit } from './lib/exit-contract.mjs';

const exitRecord = {
  schemaVersion: 1,
  phase: '07',
  decision: 'PASS',
  mustPassed: 66,
  mustTotal: 66,
  criticalDefects: 0,
  highDefects: 0,
  productionDecision: 'NO_GO_PHASE_08',
  handoffAccepted: true,
  releaseCommit: 'a'.repeat(40),
  imageDigest:
    'asia-southeast1-docker.pkg.dev/microlearning-platform-502716/microlearning/app@sha256:' +
    'b'.repeat(64),
  cloudRunRevision: 'microlearning-staging-00001-abc',
  stagingUrl: 'https://microlearning-staging-abc-uc.a.run.app',
  evidenceUrls: Object.fromEntries(
    [
      'releasePr',
      'mainCi',
      'stagingCd',
      'cloudE2e',
      'monitoring',
      'backupRestore',
      'rollback',
      'hardening',
      'handoff',
    ].map((key) => [
      key,
      `https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/${key}`,
    ]),
  ),
};

assert.doesNotThrow(() => assertValidPhase07Exit(exitRecord));
assert.ok(
  validatePhase07Exit({ ...exitRecord, mustPassed: 65 }).some((message) => message.includes('66')),
);
assert.ok(
  validatePhase07Exit({ ...exitRecord, stagingUrl: 'Pending' }).some((message) =>
    message.includes('placeholder'),
  ),
);
assert.ok(
  validatePhase07Exit({ ...exitRecord, imageDigest: 'latest' }).some((message) =>
    message.includes('immutable'),
  ),
);

process.stdout.write(`${JSON.stringify({ event: 'phase-07.exit.contract', tests_passed: 4 })}\n`);
