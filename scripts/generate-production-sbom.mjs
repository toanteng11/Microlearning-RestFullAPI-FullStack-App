import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const image = process.argv[2] ?? 'microlearning-platform:phase-07-local';
const outputPath = resolve(
  process.argv[3] ?? 'artifacts/phase-07/sbom/microlearning-production.cdx.json',
);
const trivyImage =
  'aquasec/trivy:0.69.2@sha256:e6846d706815d40452f5eaccf6b12be6941c2527adb6677b69514bee13d6c203';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
    ...options,
  });
  if (result.error) throw result.error;
  return result;
}

function commandAvailable(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  return !result.error && result.status === 0;
}

const inspection = run('docker', ['image', 'inspect', image]);
if (inspection.status !== 0) {
  throw new Error(inspection.stderr || `Unable to inspect ${image}`);
}

const imageDetails = JSON.parse(inspection.stdout)[0];
const scanArguments = ['image', '--format', 'cyclonedx', image];
const result = commandAvailable('trivy', ['--version'])
  ? run('trivy', scanArguments)
  : run('docker', [
      'run',
      '--rm',
      '--volume',
      '/var/run/docker.sock:/var/run/docker.sock',
      '--volume',
      'microlearning-trivy-cache:/root/.cache/trivy',
      trivyImage,
      ...scanArguments,
    ]);

if (result.status !== 0) {
  throw new Error(result.stderr || result.stdout || 'Trivy SBOM generation failed');
}

const sbom = JSON.parse(result.stdout);
if (sbom.bomFormat !== 'CycloneDX' || !Array.isArray(sbom.components)) {
  throw new Error('Generated SBOM does not satisfy the CycloneDX contract');
}

sbom.metadata ??= {};
sbom.metadata.properties ??= [];
sbom.metadata.properties.push(
  { name: 'microlearning.image.reference', value: image },
  { name: 'microlearning.image.id', value: imageDetails.Id },
  {
    name: 'microlearning.commit.sha',
    value: imageDetails.Config?.Labels?.['org.opencontainers.image.revision'] ?? 'unknown',
  },
);

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(sbom, null, 2)}\n`);
process.stdout.write(
  `${JSON.stringify({
    event: 'production.image.sbom_generated',
    image,
    imageId: imageDetails.Id,
    format: sbom.bomFormat,
    components: sbom.components.length,
    report: outputPath,
  })}\n`,
);
