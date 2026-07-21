import { createServer } from 'node:http';
import { loadEnvFile } from 'node:process';

import { createApp } from './app.js';
import { EnrollmentPolicyRepository } from './modules/enrollment-policy/enrollment-policy.repository.js';
import { loadEnvironment } from './shared/config/environment.js';
import {
  connectToMongoDB,
  disconnectFromMongoDB,
  getDatabaseStatus,
} from './shared/database/mongodb.js';
import { initializePhaseThreeIndexes } from './shared/database/phase-three-indexes.js';
import { initializePhaseFourIndexes } from './shared/database/phase-four-indexes.js';
import { createLogger } from './shared/logging/logger.js';

function loadLocalEnvironmentFile() {
  if (process.env.APP_ENV) return;

  try {
    loadEnvFile(new URL('../../../.env', import.meta.url));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

async function bootstrap() {
  loadLocalEnvironmentFile();
  const config = loadEnvironment(process.env);
  const logger = createLogger(config.logLevel);

  const mayCreateIndexes = ['development', 'test'].includes(config.appEnvironment);
  await connectToMongoDB(config.mongodbUri, logger, { autoIndex: mayCreateIndexes });
  await initializePhaseThreeIndexes(config.appEnvironment);
  await initializePhaseFourIndexes(config.appEnvironment);
  const enrollmentPolicy = await new EnrollmentPolicyRepository().ensureEnrollmentPolicy(
    config.classroomInviteDefaultTtlDays,
  );
  if (!enrollmentPolicy) throw new Error('Enrollment Policy bootstrap failed');

  const app = createApp({
    config,
    logger,
    runtimeInfo: {
      appName: 'Microlearning Classroom LMS API',
      version: config.appVersion,
      environment: config.appEnvironment,
      commitSha: config.commitSha,
      buildTime: config.buildTime,
    },
    dependencies: { getDatabaseStatus },
  });
  const server = createServer(app);

  server.listen(config.port, '0.0.0.0', () => {
    logger.info(
      {
        event: 'api.started',
        port: config.port,
        environment: config.appEnvironment,
        version: config.appVersion,
      },
      'Microlearning API started',
    );
  });

  let shuttingDown = false;

  async function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ event: 'api.shutdown.started', signal }, 'Graceful shutdown started');

    const forceExitTimer = setTimeout(() => {
      logger.fatal({ event: 'api.shutdown.timeout' }, 'Graceful shutdown timed out');
      process.exit(1);
    }, 10_000);
    forceExitTimer.unref();

    server.close(async (serverError) => {
      if (serverError) {
        logger.error({ err: serverError }, 'HTTP server failed to close');
      }

      try {
        await disconnectFromMongoDB(logger);
        clearTimeout(forceExitTimer);
        process.exit(serverError ? 1 : 0);
      } catch (error) {
        logger.error({ err: error }, 'MongoDB failed to disconnect');
        process.exit(1);
      }
    });
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown startup error';
  console.error(JSON.stringify({ level: 'fatal', event: 'api.startup.failed', message }));
  process.exit(1);
});
