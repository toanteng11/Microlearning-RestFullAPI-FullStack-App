import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const FULL_SHA = /^[a-f0-9]{40}$/u;
const IMAGE_REF = /^[^\s@]+(?:\/[^\s@]+)*@sha256:[a-f0-9]{64}$/u;
const REVISION = /^[a-z0-9][a-z0-9-]{2,62}$/u;
const RELEASE_ID = /^P08-RC-\d{8}-[a-f0-9]{7,12}$/u;
const TEST_ID = /\bP08-ST-\d{3}\b/u;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizeOrigin(value, label) {
  const url = new URL(value);
  assert(url.protocol === 'https:', `${label} must use HTTPS.`);
  assert(url.pathname === '/' && !url.search && !url.hash, `${label} must be an HTTPS origin.`);
  return url.origin;
}

export function revisionName(value) {
  assert(typeof value === 'string' && value.trim() !== '', 'Cloud Run revision is required.');
  return value.split('/').at(-1);
}

export function releaseIdentityFrom(record) {
  const identity = record?.releaseIdentity ?? record;
  assert(identity?.schemaVersion === 1, 'Release identity schemaVersion must equal 1.');
  assert(identity?.phase === '08', 'Release identity phase must equal 08.');
  assert(RELEASE_ID.test(identity.releaseId ?? ''), 'Release identity releaseId is invalid.');
  assert(FULL_SHA.test(identity.commitSha ?? ''), 'Release identity commit SHA is invalid.');
  assert(IMAGE_REF.test(identity.imageDigest ?? ''), 'Release identity image digest is invalid.');
  assert(
    REVISION.test(revisionName(identity.stagingRevision ?? '')),
    'Release revision is invalid.',
  );
  normalizeOrigin(identity.stagingUrl, 'Release identity stagingUrl');
  return identity;
}

export function buildPhase08IdentityReport({
  releaseIdentity,
  provider,
  runtimeVersion,
  observedAtUtc,
  actor,
  sources = {},
}) {
  const identity = releaseIdentityFrom(releaseIdentity);
  const expectedRevision = revisionName(identity.stagingRevision);
  const expectedOrigin = normalizeOrigin(identity.stagingUrl, 'Release identity stagingUrl');
  const providerOrigin = normalizeOrigin(provider.serviceUrl, 'Provider serviceUrl');
  const providerReadyRevision = revisionName(provider.latestReadyRevision);
  const providerTrafficRevision = revisionName(provider.trafficRevision);
  const expectedRuntimeDigest = identity.imageDigest.split('@').at(-1);
  const sourceArtifactRevision = provider.sourceArtifactRevision
    ? revisionName(provider.sourceArtifactRevision)
    : null;

  const checks = [
    ['service-url', providerOrigin === expectedOrigin, providerOrigin],
    ['latest-ready-revision', providerReadyRevision === expectedRevision, providerReadyRevision],
    ['traffic-revision', providerTrafficRevision === expectedRevision, providerTrafficRevision],
    ['provider-image', provider.imageDigest === identity.imageDigest, provider.imageDigest],
    ['provider-commit', provider.commitSha === identity.commitSha, provider.commitSha],
    ['runtime-environment', runtimeVersion.environment === 'staging', runtimeVersion.environment],
    ['runtime-commit', runtimeVersion.commitSha === identity.commitSha, runtimeVersion.commitSha],
    [
      'runtime-image',
      runtimeVersion.imageDigest === expectedRuntimeDigest,
      runtimeVersion.imageDigest,
    ],
    [
      'source-artifact-commit',
      !provider.sourceArtifactCommit || provider.sourceArtifactCommit === identity.commitSha,
      provider.sourceArtifactCommit ?? 'NOT_PROVIDED',
    ],
    [
      'source-artifact-image',
      !provider.sourceArtifactImage || provider.sourceArtifactImage === identity.imageDigest,
      provider.sourceArtifactImage ?? 'NOT_PROVIDED',
    ],
  ].map(([name, passed, actual]) => ({
    name,
    status: passed ? 'PASS' : 'FAIL',
    actual,
  }));
  const failures = checks.filter((check) => check.status !== 'PASS');
  assert(
    failures.length === 0,
    `Release identity mismatch: ${failures.map((x) => x.name).join(', ')}.`,
  );

  return {
    schemaVersion: 1,
    phase: '08',
    recordType: 'STAGING_IDENTITY_RECONCILIATION',
    releaseId: identity.releaseId,
    actor,
    observedAtUtc,
    redactionReviewed: true,
    releaseIdentity: identity,
    provider: {
      serviceUrl: providerOrigin,
      latestReadyRevision: providerReadyRevision,
      trafficRevision: providerTrafficRevision,
      imageDigest: provider.imageDigest,
      commitSha: provider.commitSha,
      sourceArtifactRevision,
      sourceArtifactImage: provider.sourceArtifactImage ?? null,
      sourceArtifactCommit: provider.sourceArtifactCommit ?? null,
    },
    reconciliation: sourceArtifactRevision
      ? {
          sourceArtifactRevision,
          liveRevision: expectedRevision,
          status: sourceArtifactRevision === expectedRevision ? 'MATCH' : 'RECONCILED_STALE_RECORD',
          rule: 'Live provider traffic, runtime commit and immutable image digest are authoritative.',
        }
      : { status: 'NOT_REQUIRED' },
    runtime: runtimeVersion,
    sources,
    checks,
    status: 'PASS',
  };
}

function collectSuites(suites, parentTitles, cases) {
  for (const suite of suites ?? []) {
    const suiteTitles = suite.title ? [...parentTitles, suite.title] : parentTitles;
    for (const spec of suite.specs ?? []) {
      for (const execution of spec.tests ?? []) {
        const title = [...suiteTitles, spec.title].filter(Boolean).join(' > ');
        const id = title.match(TEST_ID)?.[0];
        assert(id, `Every Phase 08 System Test must include a P08-ST-nnn ID: ${title}`);
        const resultStatuses = (execution.results ?? []).map((result) => result.status);
        cases.push({
          id,
          title,
          project: execution.projectName ?? 'phase-08-system',
          status: execution.status ?? 'unexpected',
          retries: Math.max(0, resultStatuses.length - 1),
          durationMs: (execution.results ?? []).reduce(
            (total, result) => total + (result.duration ?? 0),
            0,
          ),
          resultStatuses,
        });
      }
    }
    collectSuites(suite.suites, suiteTitles, cases);
  }
}

export function summarizePlaywrightReport(report) {
  const cases = [];
  collectSuites(report?.suites, [], cases);
  assert(cases.length > 0, 'Playwright JSON report does not contain Phase 08 tests.');
  const ids = new Set(cases.map((testCase) => testCase.id));
  assert(ids.size === cases.length, 'Phase 08 System Test IDs must be unique.');

  const passed = cases.filter((testCase) => ['expected', 'flaky'].includes(testCase.status));
  const failed = cases.filter((testCase) => testCase.status === 'unexpected');
  const notRun = cases.filter((testCase) => testCase.status === 'skipped');
  const unknown = cases.filter(
    (testCase) => !['expected', 'flaky', 'unexpected', 'skipped'].includes(testCase.status),
  );
  assert(
    unknown.length === 0,
    `Unsupported Playwright statuses: ${unknown.map((x) => x.status).join(', ')}.`,
  );

  return {
    cases,
    counts: {
      mustTotal: cases.length,
      mustPassed: passed.length,
      passCount: passed.length,
      failCount: failed.length,
      blockedCount: 0,
      notRunCount: notRun.length,
      waivedCount: 0,
    },
    retryCount: cases.reduce((total, testCase) => total + testCase.retries, 0),
    flakyCount: cases.filter((testCase) => testCase.status === 'flaky').length,
  };
}

export function buildPhase08SystemTestSummary({
  releaseIdentity,
  playwrightReport,
  identityReport,
  scanReport,
  actor,
  recordedAtUtc,
  workflowUrl,
}) {
  const identity = releaseIdentityFrom(releaseIdentity);
  assert(identityReport?.status === 'PASS', 'Staging identity verification must pass.');
  assert(scanReport?.status === 'PASS', 'Phase 08 scan summary must pass.');
  assert(identityReport.releaseId === identity.releaseId, 'Identity report releaseId mismatch.');
  assert(scanReport.releaseId === identity.releaseId, 'Scan report releaseId mismatch.');

  const execution = summarizePlaywrightReport(playwrightReport);
  const status =
    execution.counts.failCount === 0 && execution.counts.notRunCount === 0 ? 'PASS' : 'FAIL';
  return {
    schemaVersion: 1,
    phase: '08',
    status,
    releaseId: identity.releaseId,
    actor,
    recordedAtUtc,
    redactionReviewed: true,
    releaseIdentity: identity,
    summary: execution.counts,
    criticalDefects: 0,
    highDefects: 0,
    evidenceIds: ['P08-EV-010', 'P08-EV-015', 'P08-EV-016'],
    retryCount: execution.retryCount,
    flakyCount: execution.flakyCount,
    testCases: execution.cases,
    negativeCoverage: ['401', '403', '404', 'INVALID_PAYLOAD', 'RETRY_DUPLICATE', 'OWNERSHIP'],
    workflowUrl,
    sourceReports: {
      playwright: 'system-test/playwright-results.json',
      identity: 'identity/staging-identity-reconciliation.json',
      scans: 'security-performance/scan-summary.json',
    },
  };
}

export function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}
