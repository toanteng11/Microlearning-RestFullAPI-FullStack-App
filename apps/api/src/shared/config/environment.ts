import { z } from 'zod';

const booleanString = z.preprocess(
  (value) => value ?? 'false',
  z.enum(['true', 'false']).transform((value) => value === 'true'),
);

const secretSchema = z.string().refine((value) => Buffer.byteLength(value, 'utf8') >= 32, {
  message: 'must contain at least 32 UTF-8 bytes',
});

const phaseFourExplicitProductionFields = [
  'CONTENT_MARKDOWN_MAX_CHARS',
  'COURSE_MAX_PER_CLASSROOM',
  'MODULE_MAX_PER_COURSE',
  'LESSON_MAX_PER_COURSE',
  'FLASHCARD_MAX_PER_LESSON',
  'CONTENT_WRITE_WINDOW_SECONDS',
  'CONTENT_WRITE_IDENTITY_LIMIT',
  'LEARNING_ACTION_WINDOW_SECONDS',
  'LEARNING_ACTION_IDENTITY_LIMIT',
  'DASHBOARD_PAGE_MAX',
  'LEARNING_RESOURCES_ENABLED',
  'GCS_UPLOADS_ENABLED',
] as const;

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
      message: 'must use mongodb:// or mongodb+srv://',
    }),
  PUBLIC_WEB_URL: z.string().trim().url(),
  ALLOWED_ORIGINS: z.string().trim().min(1),
  ACCESS_TOKEN_SECRET: secretSchema,
  ACCESS_TOKEN_ISSUER: z.string().trim().min(1).max(100).default('microlearning-api'),
  ACCESS_TOKEN_AUDIENCE: z.string().trim().min(1).max(100).default('microlearning-web'),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(900),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().min(3600).max(2_592_000).default(604_800),
  REFRESH_REUSE_GRACE_SECONDS: z.coerce.number().int().min(0).max(10).default(5),
  REFRESH_COOKIE_NAME: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{1,64}$/)
    .default('ml_refresh'),
  REFRESH_COOKIE_SECURE: booleanString,
  AUTH_IDENTITY_PEPPER: secretSchema,
  TEACHER_INVITATION_TTL_DAYS: z.coerce.number().int().min(1).max(30).default(7),
  CLASSROOM_CODE_PEPPER: secretSchema,
  CLASSROOM_CODE_LENGTH: z.coerce
    .number()
    .int()
    .refine((value) => value === 8, { message: 'must be exactly 8' }),
  CLASSROOM_INVITE_TOKEN_BYTES: z.coerce.number().int().min(32).max(64),
  CLASSROOM_INVITE_DEFAULT_TTL_DAYS: z.coerce.number().int().min(1).max(90),
  CLASSROOM_JOIN_IP_LIMIT: z.coerce.number().int().min(1).max(1000),
  CLASSROOM_JOIN_IDENTITY_LIMIT: z.coerce.number().int().min(1).max(1000),
  CLASSROOM_JOIN_WINDOW_SECONDS: z.coerce.number().int().min(60).max(3600),
  CLASSROOM_PREVIEW_IP_LIMIT: z.coerce.number().int().min(1).max(1000),
  CONTENT_MARKDOWN_MAX_CHARS: z.coerce.number().int().min(1_000).max(500_000).default(100_000),
  COURSE_MAX_PER_CLASSROOM: z.coerce.number().int().min(1).max(1_000).default(100),
  MODULE_MAX_PER_COURSE: z.coerce.number().int().min(1).max(500).default(100),
  LESSON_MAX_PER_COURSE: z.coerce.number().int().min(1).max(5_000).default(500),
  FLASHCARD_MAX_PER_LESSON: z.coerce.number().int().min(1).max(500).default(100),
  CONTENT_WRITE_WINDOW_SECONDS: z.coerce.number().int().min(1).max(3_600).default(60),
  CONTENT_WRITE_IDENTITY_LIMIT: z.coerce.number().int().min(1).max(10_000).default(120),
  LEARNING_ACTION_WINDOW_SECONDS: z.coerce.number().int().min(1).max(3_600).default(60),
  LEARNING_ACTION_IDENTITY_LIMIT: z.coerce.number().int().min(1).max(10_000).default(180),
  DASHBOARD_PAGE_MAX: z.coerce.number().int().min(20).max(100).default(100),
  LEARNING_RESOURCES_ENABLED: booleanString,
  GCS_UPLOADS_ENABLED: booleanString,
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().min(60).max(3600).default(900),
  REGISTER_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(1000).default(10),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(1000).default(30),
  REFRESH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(1000).default(60),
  PUBLIC_INVITATION_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(1000).default(20),
  ADMIN_INVITATION_RATE_LIMIT_WINDOW_SECONDS: z.coerce
    .number()
    .int()
    .min(60)
    .max(86_400)
    .default(3600),
  ADMIN_INVITATION_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(1000).default(20),
  LOGIN_FAILURE_WINDOW_SECONDS: z.coerce.number().int().min(60).max(86_400).default(900),
  LOGIN_FAILURE_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(100).default(5),
  LOGIN_COOLDOWN_SECONDS: z.coerce.number().int().min(60).max(86_400).default(900),
  BOOTSTRAP_ADMIN_ENABLED: booleanString,
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

type AppEnvironment = z.infer<typeof environmentSchema>['APP_ENV'];
type LogLevel = z.infer<typeof environmentSchema>['LOG_LEVEL'];

export interface RateLimitConfig {
  windowSeconds: number;
  registerMax: number;
  loginMax: number;
  refreshMax: number;
  publicInvitationMax: number;
  adminInvitationWindowSeconds: number;
  adminInvitationMax: number;
  loginFailureWindowSeconds: number;
  loginFailureMaxAttempts: number;
  loginCooldownSeconds: number;
}

export interface ClassroomRateLimitConfig {
  joinIpMax: number;
  joinIdentityMax: number;
  joinWindowSeconds: number;
  previewIpMax: number;
}

export interface ContentLimitConfig {
  markdownMaxChars: number;
  coursesPerClassroom: number;
  modulesPerCourse: number;
  lessonsPerCourse: number;
  flashcardsPerLesson: number;
  dashboardPageMax: number;
}

export interface LearningRateLimitConfig {
  contentWriteWindowSeconds: number;
  contentWriteIdentityMax: number;
  learningActionWindowSeconds: number;
  learningActionIdentityMax: number;
}

export interface FeatureFlagConfig {
  learningResourcesEnabled: boolean;
  gcsUploadsEnabled: boolean;
}

export interface AppConfig {
  appEnvironment: AppEnvironment;
  appVersion: string;
  commitSha: string;
  buildTime: string;
  port: number;
  mongodbUri: string;
  publicWebUrl: string;
  allowedOrigins: string[];
  accessTokenSecret: string;
  accessTokenIssuer: string;
  accessTokenAudience: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
  refreshReuseGraceSeconds: number;
  refreshCookieName: string;
  refreshCookieSecure: boolean;
  authIdentityPepper: string;
  teacherInvitationTtlDays: number;
  classroomCodePepper: string;
  classroomCodeLength: number;
  classroomInviteTokenBytes: number;
  classroomInviteDefaultTtlDays: number;
  classroomRateLimits: ClassroomRateLimitConfig;
  contentLimits: ContentLimitConfig;
  learningRateLimits: LearningRateLimitConfig;
  featureFlags: FeatureFlagConfig;
  rateLimits: RateLimitConfig;
  bootstrapAdminEnabled: boolean;
  logLevel: LogLevel;
}

function configurationError(message: string): never {
  throw new Error(`Invalid application configuration: ${message}`);
}

function normalizeOrigin(value: string, field: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return configurationError(`${field} must be a valid URL origin`);
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    return configurationError(`${field} must use http:// or https://`);
  }

  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    return configurationError(
      `${field} must contain an origin without credentials, path, query or hash`,
    );
  }

  return url.origin;
}

function validateMongoRuntime(uri: string, appEnvironment: AppEnvironment): void {
  if (!['development', 'test'].includes(appEnvironment) || uri.startsWith('mongodb+srv://')) return;

  let replicaSet: string | null;

  try {
    replicaSet = new URL(uri).searchParams.get('replicaSet');
  } catch {
    return configurationError('MONGODB_URI must be a valid MongoDB connection string');
  }

  if (replicaSet !== 'rs0') {
    configurationError('MONGODB_URI must select replicaSet=rs0 in development and test');
  }
}

function isUnsafeSecret(value: string): boolean {
  return /(change[-_ ]?me|replace[-_ ]?with|placeholder|example|local[-_ ]?(only|development)|not[-_ ]?production)/i.test(
    value,
  );
}

export function loadEnvironment(input: NodeJS.ProcessEnv): AppConfig {
  const parsed = environmentSchema.safeParse(input);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`)
      .join('; ');
    configurationError(issues);
  }

  if (['staging', 'production'].includes(parsed.data.APP_ENV)) {
    const missingFields = phaseFourExplicitProductionFields.filter(
      (field) => !input[field]?.trim(),
    );
    if (missingFields.length > 0) {
      configurationError(
        `Production-like environments must explicitly configure ${missingFields.join(', ')}`,
      );
    }
  }

  const publicWebUrl = normalizeOrigin(parsed.data.PUBLIC_WEB_URL, 'PUBLIC_WEB_URL');
  const allowedOrigins = [
    ...new Set(
      parsed.data.ALLOWED_ORIGINS.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
        .map((origin) => normalizeOrigin(origin, 'ALLOWED_ORIGINS')),
    ),
  ];

  if (allowedOrigins.length === 0) {
    configurationError('ALLOWED_ORIGINS must contain at least one exact origin');
  }

  validateMongoRuntime(parsed.data.MONGODB_URI, parsed.data.APP_ENV);

  const distinctSecrets = new Set([
    parsed.data.ACCESS_TOKEN_SECRET,
    parsed.data.AUTH_IDENTITY_PEPPER,
    parsed.data.CLASSROOM_CODE_PEPPER,
  ]);
  if (distinctSecrets.size !== 3) {
    configurationError(
      'ACCESS_TOKEN_SECRET, AUTH_IDENTITY_PEPPER and CLASSROOM_CODE_PEPPER must be different',
    );
  }

  if (['staging', 'production'].includes(parsed.data.APP_ENV)) {
    if (!parsed.data.REFRESH_COOKIE_SECURE) {
      configurationError('REFRESH_COOKIE_SECURE must be true in staging and production');
    }
    if (
      !publicWebUrl.startsWith('https://') ||
      allowedOrigins.some((origin) => !origin.startsWith('https://'))
    ) {
      configurationError(
        'PUBLIC_WEB_URL and ALLOWED_ORIGINS must use https in staging and production',
      );
    }
    if (
      isUnsafeSecret(parsed.data.ACCESS_TOKEN_SECRET) ||
      isUnsafeSecret(parsed.data.AUTH_IDENTITY_PEPPER) ||
      isUnsafeSecret(parsed.data.CLASSROOM_CODE_PEPPER)
    ) {
      configurationError('Production-like environments must not use placeholder secrets');
    }
  }

  const rateLimits = Object.freeze({
    windowSeconds: parsed.data.RATE_LIMIT_WINDOW_SECONDS,
    registerMax: parsed.data.REGISTER_RATE_LIMIT_MAX,
    loginMax: parsed.data.LOGIN_RATE_LIMIT_MAX,
    refreshMax: parsed.data.REFRESH_RATE_LIMIT_MAX,
    publicInvitationMax: parsed.data.PUBLIC_INVITATION_RATE_LIMIT_MAX,
    adminInvitationWindowSeconds: parsed.data.ADMIN_INVITATION_RATE_LIMIT_WINDOW_SECONDS,
    adminInvitationMax: parsed.data.ADMIN_INVITATION_RATE_LIMIT_MAX,
    loginFailureWindowSeconds: parsed.data.LOGIN_FAILURE_WINDOW_SECONDS,
    loginFailureMaxAttempts: parsed.data.LOGIN_FAILURE_MAX_ATTEMPTS,
    loginCooldownSeconds: parsed.data.LOGIN_COOLDOWN_SECONDS,
  });

  const classroomRateLimits = Object.freeze({
    joinIpMax: parsed.data.CLASSROOM_JOIN_IP_LIMIT,
    joinIdentityMax: parsed.data.CLASSROOM_JOIN_IDENTITY_LIMIT,
    joinWindowSeconds: parsed.data.CLASSROOM_JOIN_WINDOW_SECONDS,
    previewIpMax: parsed.data.CLASSROOM_PREVIEW_IP_LIMIT,
  });

  const contentLimits = Object.freeze({
    markdownMaxChars: parsed.data.CONTENT_MARKDOWN_MAX_CHARS,
    coursesPerClassroom: parsed.data.COURSE_MAX_PER_CLASSROOM,
    modulesPerCourse: parsed.data.MODULE_MAX_PER_COURSE,
    lessonsPerCourse: parsed.data.LESSON_MAX_PER_COURSE,
    flashcardsPerLesson: parsed.data.FLASHCARD_MAX_PER_LESSON,
    dashboardPageMax: parsed.data.DASHBOARD_PAGE_MAX,
  });

  const learningRateLimits = Object.freeze({
    contentWriteWindowSeconds: parsed.data.CONTENT_WRITE_WINDOW_SECONDS,
    contentWriteIdentityMax: parsed.data.CONTENT_WRITE_IDENTITY_LIMIT,
    learningActionWindowSeconds: parsed.data.LEARNING_ACTION_WINDOW_SECONDS,
    learningActionIdentityMax: parsed.data.LEARNING_ACTION_IDENTITY_LIMIT,
  });

  const featureFlags = Object.freeze({
    learningResourcesEnabled: parsed.data.LEARNING_RESOURCES_ENABLED,
    gcsUploadsEnabled: parsed.data.GCS_UPLOADS_ENABLED,
  });

  if (featureFlags.gcsUploadsEnabled && !featureFlags.learningResourcesEnabled) {
    configurationError('GCS_UPLOADS_ENABLED requires LEARNING_RESOURCES_ENABLED=true');
  }

  return Object.freeze({
    appEnvironment: parsed.data.APP_ENV,
    appVersion: parsed.data.APP_VERSION,
    commitSha: parsed.data.COMMIT_SHA,
    buildTime: parsed.data.BUILD_TIME,
    port: parsed.data.PORT,
    mongodbUri: parsed.data.MONGODB_URI,
    publicWebUrl,
    allowedOrigins,
    accessTokenSecret: parsed.data.ACCESS_TOKEN_SECRET,
    accessTokenIssuer: parsed.data.ACCESS_TOKEN_ISSUER,
    accessTokenAudience: parsed.data.ACCESS_TOKEN_AUDIENCE,
    accessTokenTtlSeconds: parsed.data.ACCESS_TOKEN_TTL_SECONDS,
    refreshTokenTtlSeconds: parsed.data.REFRESH_TOKEN_TTL_SECONDS,
    refreshReuseGraceSeconds: parsed.data.REFRESH_REUSE_GRACE_SECONDS,
    refreshCookieName: parsed.data.REFRESH_COOKIE_NAME,
    refreshCookieSecure: parsed.data.REFRESH_COOKIE_SECURE,
    authIdentityPepper: parsed.data.AUTH_IDENTITY_PEPPER,
    teacherInvitationTtlDays: parsed.data.TEACHER_INVITATION_TTL_DAYS,
    classroomCodePepper: parsed.data.CLASSROOM_CODE_PEPPER,
    classroomCodeLength: parsed.data.CLASSROOM_CODE_LENGTH,
    classroomInviteTokenBytes: parsed.data.CLASSROOM_INVITE_TOKEN_BYTES,
    classroomInviteDefaultTtlDays: parsed.data.CLASSROOM_INVITE_DEFAULT_TTL_DAYS,
    classroomRateLimits,
    contentLimits,
    learningRateLimits,
    featureFlags,
    rateLimits,
    bootstrapAdminEnabled: parsed.data.BOOTSTRAP_ADMIN_ENABLED,
    logLevel: parsed.data.LOG_LEVEL,
  });
}
