import { loadEnvFile } from 'node:process';

import { loadEnvironment } from '../shared/config/environment.js';
import { connectToMongoDB, disconnectFromMongoDB } from '../shared/database/mongodb.js';
import { createLogger } from '../shared/logging/logger.js';

export function loadLocalEnvironmentFile(): void {
  if (process.env.APP_ENV) return;
  try {
    loadEnvFile(new URL('../../../../.env', import.meta.url));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

export function valueArgument(arguments_: readonly string[], name: string): string | undefined {
  const prefix = `--${name}=`;
  const value = arguments_.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
  if (value === '') throw new Error(`--${name} must not be empty`);
  return value;
}

export function positiveIntegerArgument(
  arguments_: readonly string[],
  name: string,
): number | undefined {
  const value = valueArgument(arguments_, name);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`--${name} must be a positive integer`);
  }
  return parsed;
}

export function assertKnownArguments(
  arguments_: readonly string[],
  allowed: readonly string[],
): void {
  for (const argument of arguments_) {
    const [name] = argument.replace(/^--/u, '').split('=', 1);
    if (!argument.startsWith('--') || !name || !allowed.includes(name)) {
      throw new Error(`Unknown reporting CLI argument: ${argument}`);
    }
  }
}

export async function withReportingDatabase<T>(
  run: (context: { config: ReturnType<typeof loadEnvironment> }) => Promise<T>,
): Promise<T> {
  loadLocalEnvironmentFile();
  const config = loadEnvironment(process.env);
  const logger = createLogger(config.logLevel);
  await connectToMongoDB(config.mongodbUri, logger);
  try {
    return await run({ config });
  } finally {
    await disconnectFromMongoDB(logger);
  }
}

export function writeCliSuccess(event: string, data: Record<string, unknown>): void {
  process.stdout.write(`${JSON.stringify({ event, status: 'SUCCESS', ...data })}\n`);
}

export function writeCliFailure(event: string, error: unknown): void {
  const message = error instanceof Error ? error.message : 'Unknown reporting CLI error';
  process.stderr.write(`${JSON.stringify({ event, status: 'FAILED', message })}\n`);
  process.exitCode = 1;
}
