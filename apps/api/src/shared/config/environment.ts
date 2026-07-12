import { z } from 'zod';

const environmentSchema = z.object({
  APP_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  APP_VERSION: z.string().trim().min(1).default('0.1.0'),
  COMMIT_SHA: z.string().trim().min(1).default('local'),
  BUILD_TIME: z.string().trim().min(1).default('local'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  MONGODB_URI: z
    .string()
    .trim()
    .refine((value) => value.startsWith('mongodb://') || value.startsWith('mongodb+srv://'), {
      message: 'MONGODB_URI must use mongodb:// or mongodb+srv://',
    }),
  ALLOWED_ORIGINS: z.string().trim().min(1),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

export interface AppConfig {
  appEnvironment: z.infer<typeof environmentSchema>['APP_ENV'];
  appVersion: string;
  commitSha: string;
  buildTime: string;
  port: number;
  mongodbUri: string;
  allowedOrigins: string[];
  logLevel: z.infer<typeof environmentSchema>['LOG_LEVEL'];
}

export function loadEnvironment(input: NodeJS.ProcessEnv): AppConfig {
  const parsed = environmentSchema.safeParse(input);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid application configuration: ${issues}`);
  }

  const allowedOrigins = parsed.data.ALLOWED_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (allowedOrigins.length === 0) {
    throw new Error('Invalid application configuration: ALLOWED_ORIGINS must contain an origin');
  }

  return Object.freeze({
    appEnvironment: parsed.data.APP_ENV,
    appVersion: parsed.data.APP_VERSION,
    commitSha: parsed.data.COMMIT_SHA,
    buildTime: parsed.data.BUILD_TIME,
    port: parsed.data.PORT,
    mongodbUri: parsed.data.MONGODB_URI,
    allowedOrigins,
    logLevel: parsed.data.LOG_LEVEL,
  });
}
