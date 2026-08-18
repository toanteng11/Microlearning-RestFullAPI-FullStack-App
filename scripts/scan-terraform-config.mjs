import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const repositoryRoot = resolve(new URL('..', import.meta.url).pathname.replace(/^\/(.:\/)/, '$1'));
const targetPath = resolve(repositoryRoot, 'infrastructure/terraform');
const outputPath = resolve(process.argv[2] ?? 'artifacts/phase-07/terraform/terraform-trivy.json');
const trivyImage =
  'aquasec/trivy:0.69.2@sha256:e6846d706815d40452f5eaccf6b12be6941c2527adb6677b69514bee13d6c203';
const scanArguments = [
  'config',
  '--exit-code',
  '1',
  '--severity',
  'CRITICAL,HIGH',
  '--format',
  'json',
];

function commandAvailable(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  return !result.error && result.status === 0;
}

let result;
if (commandAvailable('trivy', ['--version'])) {
  result = spawnSync('trivy', [...scanArguments, targetPath], {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
  });
} else {
  result = spawnSync(
    'docker',
    [
      'run',
      '--rm',
      '--volume',
      `${repositoryRoot}:/workspace:ro`,
      '--volume',
      'microlearning-trivy-cache:/root/.cache/trivy',
      trivyImage,
      ...scanArguments,
      '/workspace/infrastructure/terraform',
    ],
    { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 },
  );
}

if (result.error) throw result.error;
if (!result.stdout.trim())
  throw new Error(result.stderr || 'Trivy did not return an IaC scan report.');

const report = JSON.parse(result.stdout);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

const findings = (report.Results ?? []).flatMap((entry) => entry.Misconfigurations ?? []);
const summary = findings.reduce((counts, finding) => {
  const severity = finding.Severity ?? 'UNKNOWN';
  counts[severity] = (counts[severity] ?? 0) + 1;
  return counts;
}, {});

if (result.status !== 0) {
  throw new Error(
    `Terraform security scan failed (${JSON.stringify(summary)}). Report: ${outputPath}`,
  );
}

process.stdout.write(
  `${JSON.stringify({ event: 'terraform.security.scan_passed', findings: summary, report: outputPath })}\n`,
);
