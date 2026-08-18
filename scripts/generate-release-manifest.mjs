import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { validateImageReference, validateReleaseManifest } from './lib/release-contract.mjs';

const image = process.argv[2] ?? 'microlearning-platform:phase-07-local';
const outputPath = resolve(process.argv[3] ?? 'artifacts/phase-07/release-manifest.local.json');
const registryDigest = process.argv[4] ?? null;
const scanReport = 'artifacts/phase-07/scan/microlearning-production-trivy.json';
const sbomReport = 'artifacts/phase-07/sbom/microlearning-production.cdx.json';
const scanPath = resolve(scanReport);
const sbomPath = resolve(sbomReport);
const result = spawnSync('docker', ['image', 'inspect', image], {
  encoding: 'utf8',
  maxBuffer: 10 * 1024 * 1024,
});

if (result.error) throw result.error;
if (result.status !== 0) throw new Error(result.stderr || `Unable to inspect ${image}`);

const inspection = JSON.parse(result.stdout)[0];
const labels = inspection.Config?.Labels ?? {};
const digest = (path) =>
  existsSync(path) ? createHash('sha256').update(readFileSync(path)).digest('hex') : null;
if (registryDigest) validateImageReference(registryDigest);

const evidenceScope = registryDigest ? 'REGISTRY_DIGEST' : 'LOCAL_ONLY';
const manifest = {
  schemaVersion: 1,
  evidenceScope,
  image,
  localImageId: inspection.Id,
  localContentDigest: inspection.RepoDigests?.[0] ?? null,
  immutableImageRef: registryDigest,
  registryDigest,
  sizeBytes: inspection.Size,
  runtimeUser: inspection.Config?.User,
  appVersion: labels['org.opencontainers.image.version'],
  commitSha: labels['org.opencontainers.image.revision'],
  buildTime: labels['org.opencontainers.image.created'],
  source: labels['org.opencontainers.image.source'],
  generatedAt: new Date().toISOString(),
  evidence: {
    scanReport: existsSync(scanPath) ? scanReport : null,
    scanReportSha256: digest(scanPath),
    sbom: existsSync(sbomPath) ? sbomReport : null,
    sbomSha256: digest(sbomPath),
    bundleName: registryDigest ? 'phase-07-release-candidate' : null,
    retentionDays: registryDigest ? 30 : null,
  },
  provenance: {
    repository: process.env.RELEASE_REPOSITORY ?? null,
    trustedRef: process.env.RELEASE_TRUSTED_REF ?? null,
    sourceWorkflow: process.env.RELEASE_SOURCE_WORKFLOW ?? null,
    sourceRunId: process.env.RELEASE_SOURCE_CI_RUN_ID ?? null,
    sourceRunUrl: process.env.RELEASE_SOURCE_CI_RUN_URL ?? null,
    buildWorkflow: process.env.RELEASE_BUILD_WORKFLOW ?? null,
    buildRunId: process.env.RELEASE_BUILD_RUN_ID ?? null,
    buildRunUrl: process.env.RELEASE_BUILD_RUN_URL ?? null,
  },
  promotionEligible: false,
  promotionBlockReason: registryDigest
    ? 'Registry digest exists, but Staging deployment and smoke evidence are not complete.'
    : 'Local image IDs are not registry digests; Part 09 must publish exactly once.',
};

const validationErrors = validateReleaseManifest(manifest);
if (validationErrors.length > 0) {
  throw new Error(`Generated release manifest is invalid:\n- ${validationErrors.join('\n- ')}`);
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
process.stdout.write(
  `${JSON.stringify({ event: 'release.manifest.generated', outputPath, evidenceScope })}\n`,
);
