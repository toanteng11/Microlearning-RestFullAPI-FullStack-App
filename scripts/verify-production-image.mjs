import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

import { chromium } from '@playwright/test';

const image = process.argv[2] ?? 'microlearning-platform:phase-07-local';
const hostPort = Number(process.env.PRODUCTION_SMOKE_PORT ?? 18080);
const containerName = `microlearning-p07-${process.pid}`;
const bootstrapContainerName = `${containerName}-bootstrap`;
const stagingGuardContainerName = `${containerName}-staging-guard`;
const composeProject = 'microlearning-local';
const network = `${composeProject}_microlearning_network`;
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'microlearning-p07-'));
const envFile = join(temporaryDirectory, 'runtime.env');
const evidenceFile = resolve(
  process.env.PRODUCTION_SMOKE_REPORT ?? 'artifacts/phase-07/smoke/production-image-smoke.json',
);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    ...options,
  });
  if (result.status !== 0 && !options.allowFailure) {
    throw new Error(`${command} ${args.join(' ')} failed:\n${result.stderr || result.stdout}`);
  }
  return result;
}

function parseEnvironmentTemplate() {
  const values = new Map();
  const source = readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
  for (const line of source.split(/\r?\n/u)) {
    if (!line || line.trimStart().startsWith('#') || !line.includes('=')) continue;
    const separator = line.indexOf('=');
    values.set(line.slice(0, separator), line.slice(separator + 1));
  }
  return values;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitFor(url, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      lastError = new Error(`${url} returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw lastError ?? new Error(`Timed out waiting for ${url}`);
}

async function expectResponse(path, status, contentType) {
  const response = await fetch(`http://127.0.0.1:${hostPort}${path}`, {
    redirect: 'follow',
    headers: { Accept: path.startsWith('/api/') ? 'application/json' : 'text/html' },
  });
  assert(response.status === status, `${path} returned ${response.status}, expected ${status}`);
  assert(
    response.headers.get('content-type')?.includes(contentType),
    `${path} did not return ${contentType}`,
  );
  return response;
}

async function verifyBrowserRuntime() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    for (const path of ['/', '/student/todo']) {
      const response = await page.goto(`http://127.0.0.1:${hostPort}${path}`, {
        waitUntil: 'networkidle',
      });
      assert(response?.status() === 200, `Browser navigation ${path} did not return 200`);
      const root = page.locator('#root');
      await root.waitFor({ state: 'visible' });
      assert(
        (await root.innerText()).trim().length > 0,
        `Browser navigation ${path} rendered blank`,
      );
    }

    assert(pageErrors.length === 0, `Browser runtime errors:\n${pageErrors.join('\n')}`);
  } finally {
    await browser.close();
  }
}

try {
  const inspection = JSON.parse(run('docker', ['image', 'inspect', image]).stdout)[0];
  const user = String(inspection.Config?.User ?? '');
  assert(user !== '' && user !== '0' && user !== 'root', 'Production image must run as non-root');
  assert(inspection.Size <= 500 * 1024 * 1024, 'Production image exceeds the 500 MiB baseline');
  for (const label of [
    'org.opencontainers.image.title',
    'org.opencontainers.image.version',
    'org.opencontainers.image.revision',
    'org.opencontainers.image.created',
    'org.opencontainers.image.source',
  ]) {
    assert(inspection.Config?.Labels?.[label], `Missing OCI label ${label}`);
  }

  const environment = parseEnvironmentTemplate();
  const commitSha = inspection.Config.Labels['org.opencontainers.image.revision'];
  environment.set('NODE_ENV', 'production');
  environment.set('APP_ENV', 'staging');
  environment.set('APP_VERSION', inspection.Config.Labels['org.opencontainers.image.version']);
  environment.set('COMMIT_SHA', commitSha);
  environment.set('IMAGE_DIGEST', `sha256:${'d'.repeat(64)}`);
  environment.set('BUILD_TIME', inspection.Config.Labels['org.opencontainers.image.created']);
  environment.set('PORT', '8080');
  environment.set('MONGODB_URI', 'mongodb://mongodb:27017/microlearning-p07?replicaSet=rs0');
  environment.set('PUBLIC_WEB_URL', 'https://microlearning-smoke.example.test');
  environment.set('ALLOWED_ORIGINS', 'https://microlearning-smoke.example.test');
  environment.set('ACCESS_TOKEN_SECRET', '1'.repeat(64));
  environment.set('AUTH_IDENTITY_PEPPER', '2'.repeat(64));
  environment.set('CLASSROOM_CODE_PEPPER', '3'.repeat(64));
  environment.set('REFRESH_COOKIE_SECURE', 'true');
  environment.set('QUESTION_MEDIA_ALLOWED_HOSTS', 'media.example.edu');
  environment.set('LOG_LEVEL', 'info');
  environment.set('TRUST_PROXY_HOPS', '1');
  environment.delete('VITE_API_BASE_URL');
  environment.delete('MONGODB_DATABASE');

  run('docker', ['compose', '-p', composeProject, 'up', '-d', 'mongodb', 'mongodb-init'], {
    stdio: 'inherit',
  });

  writeFileSync(envFile, [...environment].map(([key, value]) => `${key}=${value}`).join('\n'));
  const stagingGuard = run(
    'docker',
    [
      'run',
      '--name',
      stagingGuardContainerName,
      '--network',
      network,
      '--env-file',
      envFile,
      image,
    ],
    { allowFailure: true },
  );
  const stagingGuardOutput = `${stagingGuard.stdout}\n${stagingGuard.stderr}`;
  assert(stagingGuard.status !== 0, 'Staging must reject a non-Atlas MongoDB URI');
  assert(
    stagingGuardOutput.includes('MONGODB_URI must use mongodb+srv:// in staging and production'),
    'Staging MongoDB boundary did not fail with the expected diagnostic',
  );
  run('docker', ['rm', stagingGuardContainerName]);

  environment.set('APP_ENV', 'test');
  writeFileSync(envFile, [...environment].map(([key, value]) => `${key}=${value}`).join('\n'));
  run('docker', [
    'run',
    '--detach',
    '--name',
    bootstrapContainerName,
    '--network',
    network,
    '--env-file',
    envFile,
    '--publish',
    `127.0.0.1:${hostPort + 1}:8080`,
    image,
  ]);
  await waitFor(`http://127.0.0.1:${hostPort + 1}/ready`);
  run('docker', ['stop', '--time', '9', bootstrapContainerName]);
  run('docker', ['rm', bootstrapContainerName]);

  writeFileSync(envFile, [...environment].map(([key, value]) => `${key}=${value}`).join('\n'));
  run('docker', [
    'run',
    '--detach',
    '--name',
    containerName,
    '--network',
    network,
    '--env-file',
    envFile,
    '--publish',
    `127.0.0.1:${hostPort}:8080`,
    image,
  ]);

  await waitFor(`http://127.0.0.1:${hostPort}/ready`);
  const health = await expectResponse('/health', 200, 'application/json');
  assert(health.headers.get('cache-control')?.includes('no-store'), '/health must be no-store');
  await expectResponse('/', 200, 'text/html');
  await expectResponse('/student/todo', 200, 'text/html');
  await expectResponse('/api-docs/', 200, 'text/html');
  await expectResponse('/api/v1/openapi.json', 200, 'application/json');
  await expectResponse('/api/v1/unknown', 404, 'application/json');
  await expectResponse('/assets/missing.js', 404, 'application/json');

  const version = await (
    await expectResponse('/api/v1/system/version', 200, 'application/json')
  ).json();
  assert(version.data.commitSha === commitSha, 'Version commit does not match the OCI revision');
  assert(version.data.imageDigest === `sha256:${'d'.repeat(64)}`, 'Version digest is incorrect');
  await verifyBrowserRuntime();

  const forbiddenPaths = run('docker', [
    'run',
    '--rm',
    '--entrypoint',
    'sh',
    image,
    '-c',
    "find /app -type f \\( -name '.env' -o -name '*.map' \\) -o -path '/app/apps/*' -type f -name '*.ts' -o -path '/app/apps/*' -type d \\( -name test -o -name tests -o -name coverage \\)",
  ]).stdout.trim();
  assert(!forbiddenPaths, `Forbidden runtime artifacts found:\n${forbiddenPaths}`);

  run('docker', ['stop', '--time', '9', containerName]);
  const exitCode = run('docker', [
    'inspect',
    '--format',
    '{{.State.ExitCode}}',
    containerName,
  ]).stdout.trim();
  const logs = run('docker', ['logs', containerName]).stdout;
  assert(exitCode === '0', `Container stopped with exit code ${exitCode}`);
  assert(
    logs.includes('application.shutdown_completed'),
    'Graceful shutdown completion was not logged',
  );

  const evidence = {
    event: 'production.image.verified',
    image,
    imageId: inspection.Id,
    revision: commitSha,
    sizeBytes: inspection.Size,
    user,
    routes: 'pass',
    browserSmoke: 'pass',
    gracefulShutdown: 'pass',
    contentAudit: 'pass',
    stagingAtlasBoundary: 'pass',
    verifiedAt: new Date().toISOString(),
  };
  mkdirSync(dirname(evidenceFile), { recursive: true });
  writeFileSync(evidenceFile, `${JSON.stringify(evidence, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(evidence)}\n`);
} catch (error) {
  const diagnostics = run('docker', ['logs', containerName], { allowFailure: true });
  if (diagnostics.stdout) process.stderr.write(diagnostics.stdout);
  if (diagnostics.stderr) process.stderr.write(diagnostics.stderr);
  throw error;
} finally {
  run('docker', ['rm', '--force', stagingGuardContainerName], { allowFailure: true });
  run('docker', ['rm', '--force', bootstrapContainerName], { allowFailure: true });
  run('docker', ['rm', '--force', containerName], { allowFailure: true });
  rmSync(temporaryDirectory, { force: true, recursive: true });
}
