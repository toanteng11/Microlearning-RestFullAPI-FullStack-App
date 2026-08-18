import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const image = process.argv[2] ?? 'microlearning-platform:phase-07-local';
const rootPackage = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const git = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' });

if (git.status !== 0) throw new Error(git.stderr || 'Unable to resolve the current Git commit');

const commitSha = git.stdout.trim();
const buildTime = new Date().toISOString();
const args = [
  'build',
  '--file',
  'Dockerfile',
  '--tag',
  image,
  '--build-arg',
  `APP_VERSION=${rootPackage.version}`,
  '--build-arg',
  `COMMIT_SHA=${commitSha}`,
  '--build-arg',
  `BUILD_TIME=${buildTime}`,
  '.',
];
const result = spawnSync('docker', args, { stdio: 'inherit' });

if (result.status !== 0)
  throw new Error(`Production image build failed with code ${result.status}`);
process.stdout.write(
  `${JSON.stringify({ event: 'production.image.built', image, commitSha, buildTime })}\n`,
);
