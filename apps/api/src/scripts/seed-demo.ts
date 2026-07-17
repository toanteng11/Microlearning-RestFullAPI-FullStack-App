import { loadEnvFile } from 'node:process';

import { DemoSeedService } from '../modules/bootstrap/demo-seed.service.js';
import { UserRepository } from '../modules/users/user.repository.js';
import { loadEnvironment } from '../shared/config/environment.js';
import { connectToMongoDB, disconnectFromMongoDB } from '../shared/database/mongodb.js';
import { createLogger } from '../shared/logging/logger.js';
import { parseSeedArguments } from './cli-arguments.js';
import { assertNoPasswordArgument, readSecurePassword } from './secure-password-input.js';

function loadLocalEnvironmentFile() {
  if (process.env.APP_ENV) return;
  try {
    loadEnvFile(new URL('../../../../.env', import.meta.url));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

async function main() {
  assertNoPasswordArgument(process.argv.slice(2));
  const arguments_ = parseSeedArguments(process.argv.slice(2));
  const password = await readSecurePassword({
    passwordStdin: arguments_.passwordStdin || !process.stdin.isTTY,
  });
  loadLocalEnvironmentFile();
  const config = loadEnvironment(process.env);
  const logger = createLogger(config.logLevel);
  await connectToMongoDB(config.mongodbUri, logger);

  try {
    const result = await new DemoSeedService(config.appEnvironment, new UserRepository()).execute(
      password,
    );
    process.stdout.write(`${JSON.stringify({ event: 'demo.seed.completed', ...result })}\n`);
  } finally {
    await disconnectFromMongoDB(logger);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown seed error';
  process.stderr.write(`${JSON.stringify({ event: 'demo.seed.failed', message })}\n`);
  process.exitCode = 1;
});
