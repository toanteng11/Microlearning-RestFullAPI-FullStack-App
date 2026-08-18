import { createServer } from 'node:http';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';

import mongoose from 'mongoose';

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
import { initializePhaseFiveIndexes } from './shared/database/phase-five-indexes.js';
import { initializePhaseSixIndexes } from './shared/database/phase-six-indexes.js';
import {
  assertPhaseFiveMigrationPreflight,
  runPhaseFiveMigrationPreflight,
} from './shared/database/phase-five-migration.js';
import {
  assertPhaseSixMigrationPreflight,
  runPhaseSixMigrationPreflight,
} from './shared/database/phase-six-migration.js';
import { createLogger } from './shared/logging/logger.js';
import { shutdownRuntime } from './shared/runtime/graceful-shutdown.js';

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
  await connectToMongoDB(config.mongodbUri, logger, {
    autoIndex: mayCreateIndexes,
    maxPoolSize: config.mongodbPool.maxSize,
    minPoolSize: config.mongodbPool.minSize,
    serverSelectionTimeoutMS: config.mongodbPool.serverSelectionTimeoutMs,
    connectTimeoutMS: config.mongodbPool.connectTimeoutMs,
    socketTimeoutMS: config.mongodbPool.socketTimeoutMs,
  });
  await initializePhaseThreeIndexes(config.appEnvironment);
  await initializePhaseFourIndexes(config.appEnvironment);
  assertPhaseFiveMigrationPreflight(await runPhaseFiveMigrationPreflight(mongoose.connection));
  await initializePhaseFiveIndexes(config.appEnvironment);
  assertPhaseSixMigrationPreflight(await runPhaseSixMigrationPreflight(mongoose.connection));
  await initializePhaseSixIndexes(config.appEnvironment);
  const enrollmentPolicy = await new EnrollmentPolicyRepository().ensureEnrollmentPolicy(
    config.classroomInviteDefaultTtlDays,
  );
  if (!enrollmentPolicy) throw new Error('Enrollment Policy bootstrap failed');

  let applicationReady = false;
  const app = createApp({
    config,
    logger,
    runtimeInfo: {
      appName: 'Microlearning Classroom LMS API',
      version: config.appVersion,
      environment: config.appEnvironment,
      commitSha: config.commitSha,
      imageDigest: config.imageDigest,
      buildTime: config.buildTime,
    },
    dependencies: {
      getDatabaseStatus,
      isApplicationReady: () => applicationReady,
    },
    webDistPath:
      config.nodeEnvironment === 'production'
        ? fileURLToPath(new URL('../../web/dist', import.meta.url))
        : undefined,
  });
  const server = createServer(app);

  server.listen(config.port, '0.0.0.0', () => {
    applicationReady = true;
    logger.info(
      {
        event: 'application.started',
        port: config.port,
        environment: config.appEnvironment,
        version: config.appVersion,
        commitSha: config.commitSha,
        imageDigest: config.imageDigest,
      },
      'Microlearning application started',
    );
  });

  let shuttingDown = false;

  async function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;
    try {
      await shutdownRuntime({
        server,
        disconnect: () => disconnectFromMongoDB(logger),
        markNotReady: () => {
          applicationReady = false;
        },
        logger,
        signal,
      });
      process.exit(0);
    } catch {
      process.exit(1);
    }
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown startup error';
  console.error(JSON.stringify({ level: 'fatal', event: 'api.startup.failed', message }));
  process.exit(1);
});
