import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const runId = `P08-LOCAL-${new Date().toISOString().replace(/[-:]/gu, '').replace(/\..+/u, 'Z')}-${randomBytes(3).toString('hex')}`;
const artifactRoot = resolve(root, 'artifacts/phase-08/local-acceptance', runId);
const project = `microlearning-phase08-${randomBytes(4).toString('hex')}`;
const ports = {
  web: Number(process.env.PHASE08_LOCAL_WEB_PORT ?? 3300),
  api: Number(process.env.PHASE08_LOCAL_API_PORT ?? 4300),
  mongo: Number(process.env.PHASE08_LOCAL_MONGO_PORT ?? 27019),
};
const composeFiles = [
  '-f',
  'docker-compose.yml',
  '-f',
  'infrastructure/ci/docker-compose.integration.yml',
  '-f',
  'infrastructure/ci/docker-compose.e2e.yml',
];
const composeArgs = ['compose', '-p', project, ...composeFiles];
const checks = {};
const startedAtUtc = new Date().toISOString();
let stackStarted = false;
let errorMessage = null;
let playwrightStats = null;
let sourceDirty = true;
let composeEnv;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    ...options,
  });
  if (result.error) throw new Error(`${command} could not start: ${result.error.message}`);
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.slice(0, 3).join(' ')} failed with exit code ${result.status}.`,
    );
  }
  return result;
}

function step(name, command, args, options = {}) {
  process.stdout.write(`[${name}] starting\n`);
  try {
    run(command, args, { stdio: 'inherit', ...options });
  } catch (error) {
    checks[name] = 'FAIL';
    throw error;
  }
  checks[name] = 'PASS';
  process.stdout.write(`[${name}] passed\n`);
}

async function waitForReadiness(webUrl, apiUrl) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const [web, api] = await Promise.all([
        fetch(`${webUrl}/health`, { signal: AbortSignal.timeout(4_000) }),
        fetch(`${apiUrl}/ready`, { signal: AbortSignal.timeout(4_000) }),
      ]);
      if (web.ok && api.ok) return;
    } catch {
      // The containers can be healthy before their host ports accept connections.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 2_000));
  }
  throw new Error('The isolated local Web/API stack did not become ready within two minutes.');
}

function parsePlaywrightStats() {
  const report = JSON.parse(readFileSync(resolve(artifactRoot, 'playwright-results.json'), 'utf8'));
  const stats = report.stats ?? {};
  return {
    expected: stats.expected ?? 0,
    unexpected: stats.unexpected ?? 0,
    flaky: stats.flaky ?? 0,
    skipped: stats.skipped ?? 0,
  };
}

mkdirSync(artifactRoot, { recursive: true });

try {
  if (
    new Set(Object.values(ports)).size !== 3 ||
    Object.values(ports).some((port) => !Number.isInteger(port) || port < 1024 || port > 65535)
  ) {
    throw new Error('Local acceptance ports must be distinct integers from 1024 to 65535.');
  }

  const commitSha = run('git', ['rev-parse', 'HEAD']).stdout.trim();
  sourceDirty = run('git', ['status', '--porcelain']).stdout.trim() !== '';
  checks.cleanSource = sourceDirty ? 'FAIL' : 'PASS';
  step('dockerDaemon', 'docker', ['info', '--format', '{{.ServerVersion}}'], { timeout: 15_000 });
  const webUrl = `http://localhost:${ports.web}`;
  const apiUrl = `http://localhost:${ports.api}`;
  const password = `${randomBytes(24).toString('hex')}Aa1!`;
  composeEnv = {
    ...process.env,
    NODE_ENV: 'test',
    APP_ENV: 'test',
    APP_VERSION: '0.2.0',
    COMMIT_SHA: commitSha,
    BUILD_TIME: startedAtUtc,
    LOCAL_WEB_PORT: String(ports.web),
    LOCAL_API_PORT: String(ports.api),
    LOCAL_MONGO_PORT: String(ports.mongo),
    E2E_DATABASE_NAME: 'microlearning-phase08-local',
    ACCESS_TOKEN_SECRET: randomBytes(32).toString('hex'),
    AUTH_IDENTITY_PEPPER: randomBytes(32).toString('hex'),
    CLASSROOM_CODE_PEPPER: randomBytes(32).toString('hex'),
    LOG_LEVEL: 'silent',
  };

  step('quality', process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'check'], {
    shell: process.platform === 'win32',
  });

  const config = JSON.parse(
    run('docker', [...composeArgs, 'config', '--format', 'json'], { env: composeEnv }).stdout,
  );
  const seedEnv = {
    ...composeEnv,
    ...config.services.api.environment,
    MONGODB_URI: `mongodb://127.0.0.1:${ports.mongo}/microlearning-phase08-local?replicaSet=rs0&directConnection=true`,
    E2E_DEMO_PASSWORD: password,
    E2E_WEB_URL: webUrl,
    E2E_API_URL: apiUrl,
    E2E_EXPECTED_COMMIT: commitSha,
    E2E_PHASE08_LOCAL_MODE: 'true',
    PHASE08_LOCAL_ARTIFACT_ROOT: artifactRoot,
  };
  checks.composeConfiguration = 'PASS';

  step('build', 'docker', [...composeArgs, 'build', 'api', 'web'], { env: composeEnv });
  stackStarted = true;
  step('start', 'docker', [...composeArgs, 'up', '-d', '--no-build'], { env: composeEnv });

  await waitForReadiness(webUrl, apiUrl);
  checks.readiness = 'PASS';
  const versionResponse = await fetch(`${apiUrl}/api/v1/system/version`);
  const version = (await versionResponse.json())?.data;
  if (!versionResponse.ok || version?.commitSha !== commitSha || version?.environment !== 'test') {
    throw new Error('Local API version identity does not match the tested source commit.');
  }
  checks.versionIdentity = 'PASS';

  const seed = run(
    process.execPath,
    ['node_modules/tsx/dist/cli.mjs', 'apps/api/src/scripts/seed-demo.ts'],
    { env: seedEnv, input: password },
  );
  if (!seed.stdout.includes('demo.seed.completed')) {
    throw new Error('Synthetic demo seed did not confirm completion.');
  }
  checks.syntheticSeed = 'PASS';

  const browser = spawnSync(
    process.execPath,
    [
      'node_modules/@playwright/test/cli.js',
      'test',
      '--config',
      'playwright.phase-08-local.config.ts',
    ],
    { cwd: root, env: seedEnv, stdio: 'inherit' },
  );
  playwrightStats = parsePlaywrightStats();
  if (
    browser.error ||
    browser.status !== 0 ||
    playwrightStats.expected === 0 ||
    playwrightStats.unexpected > 0 ||
    playwrightStats.flaky > 0
  ) {
    throw new Error(
      'Local browser journeys did not pass cleanly; review the retained Playwright report.',
    );
  }
  checks.browserE2E = 'PASS';
} catch (error) {
  errorMessage = error instanceof Error ? error.message : String(error);
} finally {
  if (stackStarted) {
    try {
      run('docker', [...composeArgs, 'down', '--volumes', '--remove-orphans'], {
        stdio: 'inherit',
        env: composeEnv,
        timeout: 30_000,
      });
      checks.cleanup = 'PASS';
    } catch {
      checks.cleanup = 'FAIL';
      errorMessage ??= `The isolated Compose project ${project} requires manual cleanup.`;
    }
  }

  const summary = {
    schemaVersion: 1,
    phase: '08',
    profile: 'LOCAL_ACADEMIC_ACCEPTANCE',
    runId,
    startedAtUtc,
    completedAtUtc: new Date().toISOString(),
    sourceCommit: run('git', ['rev-parse', 'HEAD']).stdout.trim(),
    sourceDirty,
    composeProject: project,
    urls: { web: `http://localhost:${ports.web}`, api: `http://localhost:${ports.api}` },
    checks,
    playwright: playwrightStats,
    productionDeployment: 'NOT_RUN',
    secretValuesRecorded: false,
    status:
      errorMessage === null && Object.values(checks).every((value) => value === 'PASS')
        ? 'PASS'
        : 'FAIL',
    error: errorMessage,
  };
  writeFileSync(resolve(artifactRoot, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  process.stdout.write(
    `${JSON.stringify({ event: 'phase-08.local_acceptance.completed', summaryPath: resolve(artifactRoot, 'summary.json'), status: summary.status, playwright: playwrightStats })}\n`,
  );
  if (summary.status !== 'PASS') process.exitCode = 1;
}
