import { randomUUID } from 'node:crypto';
import { loadEnvFile } from 'node:process';

import { AuditLogRepository } from '../modules/audit/audit-log.repository.js';
import { AdminBootstrapService } from '../modules/bootstrap/admin-bootstrap.service.js';
import { SystemGuardRepository } from '../modules/system-guards/system-guard.repository.js';
import { UserRepository } from '../modules/users/user.repository.js';
import { loadEnvironment } from '../shared/config/environment.js';
import { connectToMongoDB, disconnectFromMongoDB } from '../shared/database/mongodb.js';
import { createLogger } from '../shared/logging/logger.js';
import { parseBootstrapArguments } from './cli-arguments.js';
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
  const arguments_ = parseBootstrapArguments(process.argv.slice(2));
  const password = await readSecurePassword({
    passwordStdin: arguments_.passwordStdin || !process.stdin.isTTY,
  });
  loadLocalEnvironmentFile();
  const config = loadEnvironment(process.env);
  const logger = createLogger(config.logLevel);
  await connectToMongoDB(config.mongodbUri, logger);

  try {
    const service = new AdminBootstrapService(
      config.bootstrapAdminEnabled,
      new UserRepository(),
      new AuditLogRepository(),
      new SystemGuardRepository(),
    );
    const result = await service.execute({
      email: arguments_.email,
      fullName: arguments_.fullName,
      password,
      requestId: `bootstrap:${randomUUID()}`,
    });
    process.stdout.write(`${JSON.stringify({ event: 'admin.bootstrap.completed', ...result })}\n`);
  } finally {
    await disconnectFromMongoDB(logger);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown bootstrap error';
  process.stderr.write(`${JSON.stringify({ event: 'admin.bootstrap.failed', message })}\n`);
  process.exitCode = 1;
});
