import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateReleaseManifest } from './lib/release-contract.mjs';

const manifestPath = resolve(process.argv[2] ?? 'artifacts/phase-07/release-manifest.local.json');
const verifyFiles = process.argv.includes('--verify-files');

if (!existsSync(manifestPath)) throw new Error(`Release manifest not found: ${manifestPath}`);

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const errors = validateReleaseManifest(manifest);

if (verifyFiles && manifest.evidence && typeof manifest.evidence === 'object') {
  for (const field of ['scanReport', 'sbom']) {
    const path = manifest.evidence[field];
    if (path && !existsSync(resolve(path))) errors.push(`Evidence file does not exist: ${path}`);
  }
}

if (errors.length > 0) {
  throw new Error(`Release manifest validation failed:\n- ${errors.join('\n- ')}`);
}

process.stdout.write(
  `${JSON.stringify({ event: 'release.manifest.validated', manifestPath, scope: manifest.evidenceScope })}\n`,
);
