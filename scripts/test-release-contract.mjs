import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(new URL('..', import.meta.url).pathname.replace(/^\/(.:\/)/, '$1'));
const temp = mkdtempSync(join(tmpdir(), 'microlearning-release-contract-'));
const prefix =
  'asia-southeast1-docker.pkg.dev/microlearning-platform-502716/microlearning/microlearning-app';
const digestRef = `${prefix}@sha256:${'a'.repeat(64)}`;

function run(script, args, expectedStatus) {
  const result = spawnSync(process.execPath, [resolve(root, script), ...args], {
    encoding: 'utf8',
  });
  if (result.status !== expectedStatus) {
    throw new Error(
      `${script} returned ${result.status}; expected ${expectedStatus}.\n${result.stdout}\n${result.stderr}`,
    );
  }
}

try {
  run('scripts/validate-image-reference.mjs', [digestRef], 0);
  run('scripts/validate-image-reference.mjs', [`${prefix}:latest`], 1);
  run('scripts/validate-image-reference.mjs', [`${prefix}:commit-123`], 1);
  run('scripts/validate-image-reference.mjs', [`${digestRef} `], 1);

  const base = {
    schemaVersion: 1,
    evidenceScope: 'REGISTRY_DIGEST',
    image: 'microlearning-platform:test',
    localImageId: `sha256:${'b'.repeat(64)}`,
    localContentDigest: null,
    immutableImageRef: digestRef,
    registryDigest: digestRef,
    sizeBytes: 1,
    runtimeUser: 'node',
    appVersion: '0.1.0',
    commitSha: 'a'.repeat(40),
    buildTime: '2026-08-16T00:00:00.000Z',
    source: 'https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App',
    generatedAt: '2026-08-16T00:01:00.000Z',
    evidence: {
      scanReport: 'scan.json',
      scanReportSha256: 'c'.repeat(64),
      sbom: 'sbom.json',
      sbomSha256: 'd'.repeat(64),
      bundleName: 'phase-07-release-candidate',
      retentionDays: 30,
    },
    provenance: {
      repository: 'toanteng11/Microlearning-RestFullAPI-FullStack-App',
      trustedRef: 'refs/heads/main',
      sourceWorkflow: 'Continuous Integration',
      sourceRunId: '1001',
      sourceRunUrl: 'https://github.com/example/repository/actions/runs/1001',
      buildWorkflow: 'Build And Publish',
      buildRunId: '1002',
      buildRunUrl: 'https://github.com/example/repository/actions/runs/1002',
    },
    promotionEligible: false,
    promotionBlockReason: 'Staging smoke is pending.',
  };
  const validPath = join(temp, 'valid.json');
  writeFileSync(validPath, JSON.stringify(base));
  run('scripts/validate-release-manifest.mjs', [validPath], 0);

  const invalidPath = join(temp, 'invalid.json');
  writeFileSync(
    invalidPath,
    JSON.stringify({ ...base, registryDigest: `${prefix}:latest`, immutableImageRef: null }),
  );
  run('scripts/validate-release-manifest.mjs', [invalidPath], 1);
} finally {
  rmSync(temp, { recursive: true, force: true });
}

process.stdout.write(`${JSON.stringify({ event: 'release.contract.tests_passed' })}\n`);
