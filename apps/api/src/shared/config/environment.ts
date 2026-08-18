import { z } from 'zod';

const booleanString = z.preprocess(
  (value) => value ?? 'false',
  z.enum(['true', 'false']).transform((value) => value === 'true'),
);
const enabledByDefaultBooleanString = z.preprocess(
  (value) => value ?? 'true',
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

const phaseFiveExplicitProductionFields = [
  'QUESTION_IMAGE_URL_ENABLED',
  'QUESTION_VIDEO_URL_ENABLED',
  'QUESTION_MEDIA_ALLOWED_HOSTS',
  'ASSIGNMENT_LINK_SUBMISSION_ENABLED',
  'ASSIGNMENT_MARK_DONE_ENABLED',
  'ASSESSMENT_FILE_UPLOAD_ENABLED',
  'QUIZ_ATTEMPT_START_IP_LIMIT',
  'QUIZ_ATTEMPT_IDENTITY_LIMIT',
  'QUIZ_ANSWER_SAVE_LIMIT',
  'ASSESSMENT_MUTATION_WINDOW_SECONDS',
  'ASSESSMENT_MUTATION_IDENTITY_LIMIT',
] as const;

const phaseSixExplicitProductionFields = [
  'REPORTING_ENABLED',
  'REPORTING_TIMEZONE',
  'REPORTING_DUE_SOON_WINDOW_HOURS',
  'REPORTING_PAGE_MAX',
  'REPORTING_DASHBOARD_PREVIEW_LIMIT',
  'REPORTING_GRADEBOOK_ACTIVITY_MAX',
  'REPORTING_STALE_AFTER_SECONDS',
  'REPORTING_INLINE_REFRESH_MAX_STUDENTS',
  'REPORTING_ON_DEMAND_COURSE_REFRESH_MAX_STUDENTS',
  'REPORTING_REFRESH_REQUEST_BUDGET_MS',
  'REPORTING_REBUILD_BATCH_SIZE',
  'REPORTING_REBUILD_MAX_ATTEMPTS',
  'REPORTING_CLASSROOM_EXPANSION_BATCH_SIZE',
  'REPORTING_INVALIDATION_LOCK_SECONDS',
  'REPORTING_INVALIDATION_MAX_ATTEMPTS',
  'REPORTING_INVALIDATION_RETRY_BASE_SECONDS',
  'REPORTING_INVALIDATION_RETRY_MAX_SECONDS',
  'REPORTING_PRIVACY_MIN_GROUP_SIZE',
  'REPORTING_MAX_DATE_RANGE_DAYS',
  'REPORT_EXPORT_ENABLED',
  'REPORT_EXPORT_MAX_ROWS',
  'REPORT_EXPORT_MAX_DATE_RANGE_DAYS',
  'ANALYTICS_EVENTS_ENABLED',
  'ANALYTICS_EVENT_RETENTION_DAYS',
  'ANALYTICS_EVENT_BODY_MAX_BYTES',
  'ANALYTICS_EVENT_IDENTITY_LIMIT',
  'STUDENT_PROGRESS_TREND_ENABLED',
  'ADMIN_LEARNING_OUTCOMES_ENABLED',
  'WEIGHTED_PROCESS_SCORE_ENABLED',
] as const;

const phaseSevenExplicitProductionFields = [
  'NODE_ENV',
  'APP_VERSION',
  'COMMIT_SHA',
  'IMAGE_DIGEST',
  'BUILD_TIME',
  'PORT',
  'MONGODB_URI',
  'PUBLIC_WEB_URL',
  'ALLOWED_ORIGINS',
  'ACCESS_TOKEN_SECRET',
  'AUTH_IDENTITY_PEPPER',
  'CLASSROOM_CODE_PEPPER',
  'LOG_LEVEL',
  'TRUST_PROXY_HOPS',
  'MONGODB_MAX_POOL_SIZE',
  'MONGODB_MIN_POOL_SIZE',
  'MONGODB_SERVER_SELECTION_TIMEOUT_MS',
  'MONGODB_CONNECT_TIMEOUT_MS',
  'MONGODB_SOCKET_TIMEOUT_MS',
] as const;

const explicitlyEmptyProductionFields = new Set(['QUESTION_MEDIA_ALLOWED_HOSTS']);

const localImageDigest = `sha256:${'0'.repeat(64)}`;

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  APP_VERSION: z.string().trim().min(1).default('0.1.0'),
  COMMIT_SHA: z.string().trim().min(1).default('local'),
  IMAGE_DIGEST: z.string().trim().min(1).default(localImageDigest),
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
  QUESTION_IMAGE_URL_ENABLED: booleanString,
  QUESTION_VIDEO_URL_ENABLED: booleanString,
  QUESTION_MEDIA_ALLOWED_HOSTS: z.string().default(''),
  ASSIGNMENT_LINK_SUBMISSION_ENABLED: booleanString,
  ASSIGNMENT_MARK_DONE_ENABLED: booleanString,
  ASSESSMENT_FILE_UPLOAD_ENABLED: booleanString,
  QUIZ_ATTEMPT_START_IP_LIMIT: z.coerce.number().int().min(1).max(10_000).default(300),
  QUIZ_ATTEMPT_IDENTITY_LIMIT: z.coerce.number().int().min(1).max(1_000).default(20),
  QUIZ_ANSWER_SAVE_LIMIT: z.coerce.number().int().min(1).max(10_000).default(180),
  ASSESSMENT_MUTATION_WINDOW_SECONDS: z.coerce.number().int().min(1).max(3_600).default(60),
  ASSESSMENT_MUTATION_IDENTITY_LIMIT: z.coerce.number().int().min(1).max(10_000).default(120),
  REPORTING_ENABLED: enabledByDefaultBooleanString,
  REPORTING_TIMEZONE: z.string().trim().min(1).max(100).default('Asia/Ho_Chi_Minh'),
  REPORTING_DUE_SOON_WINDOW_HOURS: z.coerce.number().int().min(1).max(720).default(72),
  REPORTING_PAGE_MAX: z.coerce.number().int().min(1).max(100).default(50),
  REPORTING_DASHBOARD_PREVIEW_LIMIT: z.coerce.number().int().min(1).max(10).default(5),
  REPORTING_GRADEBOOK_ACTIVITY_MAX: z.coerce.number().int().min(1).max(100).default(50),
  REPORTING_STALE_AFTER_SECONDS: z.coerce.number().int().min(1).max(86_400).default(300),
  REPORTING_INLINE_REFRESH_MAX_STUDENTS: z.coerce.number().int().min(1).max(20).default(5),
  REPORTING_ON_DEMAND_COURSE_REFRESH_MAX_STUDENTS: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(100),
  REPORTING_REFRESH_REQUEST_BUDGET_MS: z.coerce.number().int().min(100).max(1_500).default(900),
  REPORTING_REBUILD_BATCH_SIZE: z.coerce.number().int().min(1).max(500).default(50),
  REPORTING_REBUILD_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(3),
  REPORTING_CLASSROOM_EXPANSION_BATCH_SIZE: z.coerce.number().int().min(1).max(100).default(50),
  REPORTING_INVALIDATION_LOCK_SECONDS: z.coerce.number().int().min(1).max(3_600).default(120),
  REPORTING_INVALIDATION_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(3),
  REPORTING_INVALIDATION_RETRY_BASE_SECONDS: z.coerce.number().int().min(1).max(3_600).default(30),
  REPORTING_INVALIDATION_RETRY_MAX_SECONDS: z.coerce.number().int().min(1).max(3_600).default(300),
  REPORTING_PRIVACY_MIN_GROUP_SIZE: z.coerce.number().int().min(2).max(100).default(5),
  REPORTING_MAX_DATE_RANGE_DAYS: z.coerce.number().int().min(1).max(3_650).default(365),
  REPORT_EXPORT_ENABLED: booleanString,
  REPORT_EXPORT_MAX_ROWS: z.coerce.number().int().min(1).max(100_000).default(5_000),
  REPORT_EXPORT_MAX_DATE_RANGE_DAYS: z.coerce.number().int().min(1).max(3_650).default(365),
  ANALYTICS_EVENTS_ENABLED: booleanString,
  ANALYTICS_EVENT_RETENTION_DAYS: z.coerce.number().int().min(1).max(365).default(90),
  ANALYTICS_EVENT_BODY_MAX_BYTES: z.coerce.number().int().min(1_024).max(65_536).default(16_384),
  ANALYTICS_EVENT_IDENTITY_LIMIT: z.coerce.number().int().min(1).max(10_000).default(120),
  STUDENT_PROGRESS_TREND_ENABLED: booleanString,
  ADMIN_LEARNING_OUTCOMES_ENABLED: booleanString,
  WEIGHTED_PROCESS_SCORE_ENABLED: booleanString,
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
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(0),
  MONGODB_MAX_POOL_SIZE: z.coerce.number().int().min(1).max(100).default(10),
  MONGODB_MIN_POOL_SIZE: z.coerce.number().int().min(0).max(100).default(0),
  MONGODB_SERVER_SELECTION_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1_000)
    .max(60_000)
    .default(10_000),
  MONGODB_CONNECT_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(60_000).default(10_000),
  MONGODB_SOCKET_TIMEOUT_MS: z.coerce.number().int().min(5_000).max(300_000).default(30_000),
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

export interface AssessmentFeatureFlagConfig {
  questionImageUrlEnabled: boolean;
  questionVideoUrlEnabled: boolean;
  questionMediaAllowedHosts: readonly string[];
  assignmentLinkSubmissionEnabled: boolean;
  assignmentMarkDoneEnabled: boolean;
  assessmentFileUploadEnabled: false;
}

export interface AssessmentRateLimitConfig {
  mutationWindowSeconds: number;
  mutationIdentityMax: number;
  attemptStartIpMax: number;
  attemptStartIdentityMax: number;
  answerSaveIdentityMax: number;
}

export interface ReportingConfig {
  enabled: boolean;
  timezone: string;
  dueSoonWindowHours: number;
  pageMax: number;
  dashboardPreviewLimit: number;
  gradebookActivityMax: number;
  staleAfterSeconds: number;
  inlineRefreshMaxStudents: number;
  onDemandCourseRefreshMaxStudents: number;
  refreshRequestBudgetMs: number;
  rebuildBatchSize: number;
  rebuildMaxAttempts: number;
  classroomExpansionBatchSize: number;
  invalidationLockSeconds: number;
  invalidationMaxAttempts: number;
  invalidationRetryBaseSeconds: number;
  invalidationRetryMaxSeconds: number;
  privacyMinGroupSize: number;
  maxDateRangeDays: number;
  exportEnabled: boolean;
  exportMaxRows: number;
  exportMaxDateRangeDays: number;
  analyticsEventsEnabled: boolean;
  analyticsEventRetentionDays: number;
  analyticsEventBodyMaxBytes: number;
  analyticsEventIdentityLimit: number;
  studentProgressTrendEnabled: boolean;
  adminLearningOutcomesEnabled: boolean;
  weightedProcessScoreEnabled: boolean;
}

export interface AppConfig {
  nodeEnvironment: 'development' | 'test' | 'production';
  appEnvironment: AppEnvironment;
  appVersion: string;
  commitSha: string;
  imageDigest: string;
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
  assessmentFeatures: AssessmentFeatureFlagConfig;
  assessmentRateLimits: AssessmentRateLimitConfig;
  reporting: ReportingConfig;
  rateLimits: RateLimitConfig;
  bootstrapAdminEnabled: boolean;
  logLevel: LogLevel;
  trustProxyHops: number;
  mongodbPool: {
    maxSize: number;
    minSize: number;
    serverSelectionTimeoutMs: number;
    connectTimeoutMs: number;
    socketTimeoutMs: number;
  };
}

function configurationError(message: string): never {
  throw new Error(`Invalid application configuration: ${message}`);
}

function isValidIanaTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
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
  if (['staging', 'production'].includes(appEnvironment)) {
    if (!uri.startsWith('mongodb+srv://')) {
      configurationError('MONGODB_URI must use mongodb+srv:// in staging and production');
    }

    let parsed: URL;
    try {
      parsed = new URL(uri);
    } catch {
      return configurationError('MONGODB_URI must be a valid MongoDB connection string');
    }

    const expectedDatabase =
      appEnvironment === 'staging' ? 'microlearning_staging' : 'microlearning_production';
    if (decodeURIComponent(parsed.pathname.replace(/^\//u, '')) !== expectedDatabase) {
      configurationError(`MONGODB_URI must select database ${expectedDatabase}`);
    }
    if (!parsed.username || !parsed.password) {
      configurationError('MONGODB_URI must include a dedicated application credential');
    }
    if (
      ['false', '0'].includes(parsed.searchParams.get('tls')?.toLowerCase() ?? '') ||
      ['false', '0'].includes(parsed.searchParams.get('ssl')?.toLowerCase() ?? '')
    ) {
      configurationError('MONGODB_URI must not disable TLS');
    }
    return;
  }

  if (uri.startsWith('mongodb+srv://')) return;

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

function normalizeHostnameList(value: string): readonly string[] {
  const hostnames = value
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .map((entry) => {
      if (entry.includes('://') || /[/@?#]/u.test(entry)) {
        return configurationError(
          'QUESTION_MEDIA_ALLOWED_HOSTS must contain hostnames without scheme, credentials or path',
        );
      }
      try {
        const parsed = new URL(`https://${entry}`);
        if (parsed.hostname !== entry || parsed.port) throw new Error('not a hostname');
        return parsed.hostname;
      } catch {
        return configurationError(
          `QUESTION_MEDIA_ALLOWED_HOSTS contains invalid hostname ${entry}`,
        );
      }
    });
  return Object.freeze([...new Set(hostnames)]);
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
    const missingFields = [
      ...phaseFourExplicitProductionFields,
      ...phaseFiveExplicitProductionFields,
      ...phaseSixExplicitProductionFields,
      ...phaseSevenExplicitProductionFields,
    ].filter((field) => {
      const value = input[field];
      return value === undefined || (!explicitlyEmptyProductionFields.has(field) && !value.trim());
    });
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
    if (parsed.data.NODE_ENV !== 'production') {
      configurationError('NODE_ENV must be production in staging and production');
    }
    if (!/^[a-f0-9]{40}$/u.test(parsed.data.COMMIT_SHA)) {
      configurationError('COMMIT_SHA must be a full 40-character Git SHA');
    }
    if (!/^sha256:[a-f0-9]{64}$/u.test(parsed.data.IMAGE_DIGEST)) {
      configurationError('IMAGE_DIGEST must use sha256:<64-hex>');
    }
    if (Number.isNaN(Date.parse(parsed.data.BUILD_TIME)) || !parsed.data.BUILD_TIME.endsWith('Z')) {
      configurationError('BUILD_TIME must be an ISO-8601 UTC timestamp');
    }
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
    if (!allowedOrigins.includes(publicWebUrl)) {
      configurationError('ALLOWED_ORIGINS must include PUBLIC_WEB_URL in staging and production');
    }
    if (parsed.data.TRUST_PROXY_HOPS !== 1) {
      configurationError('TRUST_PROXY_HOPS must be 1 in staging and production');
    }
    if (['debug', 'trace'].includes(parsed.data.LOG_LEVEL)) {
      configurationError('LOG_LEVEL must not be debug or trace in staging and production');
    }
  }

  if (parsed.data.MONGODB_MIN_POOL_SIZE > parsed.data.MONGODB_MAX_POOL_SIZE) {
    configurationError('MONGODB_MIN_POOL_SIZE must not exceed MONGODB_MAX_POOL_SIZE');
  }

  if (['staging', 'production'].includes(parsed.data.APP_ENV)) {
    if (parsed.data.MONGODB_MAX_POOL_SIZE !== 10 || parsed.data.MONGODB_MIN_POOL_SIZE !== 0) {
      configurationError(
        'Production-like MongoDB pool must use MONGODB_MAX_POOL_SIZE=10 and MONGODB_MIN_POOL_SIZE=0',
      );
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

  const questionMediaAllowedHosts = normalizeHostnameList(parsed.data.QUESTION_MEDIA_ALLOWED_HOSTS);
  const assessmentFeatures = Object.freeze({
    questionImageUrlEnabled: parsed.data.QUESTION_IMAGE_URL_ENABLED,
    questionVideoUrlEnabled: parsed.data.QUESTION_VIDEO_URL_ENABLED,
    questionMediaAllowedHosts,
    assignmentLinkSubmissionEnabled: parsed.data.ASSIGNMENT_LINK_SUBMISSION_ENABLED,
    assignmentMarkDoneEnabled: parsed.data.ASSIGNMENT_MARK_DONE_ENABLED,
    assessmentFileUploadEnabled: false as const,
  });
  const assessmentRateLimits = Object.freeze({
    mutationWindowSeconds: parsed.data.ASSESSMENT_MUTATION_WINDOW_SECONDS,
    mutationIdentityMax: parsed.data.ASSESSMENT_MUTATION_IDENTITY_LIMIT,
    attemptStartIpMax: parsed.data.QUIZ_ATTEMPT_START_IP_LIMIT,
    attemptStartIdentityMax: parsed.data.QUIZ_ATTEMPT_IDENTITY_LIMIT,
    answerSaveIdentityMax: parsed.data.QUIZ_ANSWER_SAVE_LIMIT,
  });
  const reporting = Object.freeze({
    enabled: parsed.data.REPORTING_ENABLED,
    timezone: parsed.data.REPORTING_TIMEZONE,
    dueSoonWindowHours: parsed.data.REPORTING_DUE_SOON_WINDOW_HOURS,
    pageMax: parsed.data.REPORTING_PAGE_MAX,
    dashboardPreviewLimit: parsed.data.REPORTING_DASHBOARD_PREVIEW_LIMIT,
    gradebookActivityMax: parsed.data.REPORTING_GRADEBOOK_ACTIVITY_MAX,
    staleAfterSeconds: parsed.data.REPORTING_STALE_AFTER_SECONDS,
    inlineRefreshMaxStudents: parsed.data.REPORTING_INLINE_REFRESH_MAX_STUDENTS,
    onDemandCourseRefreshMaxStudents: parsed.data.REPORTING_ON_DEMAND_COURSE_REFRESH_MAX_STUDENTS,
    refreshRequestBudgetMs: parsed.data.REPORTING_REFRESH_REQUEST_BUDGET_MS,
    rebuildBatchSize: parsed.data.REPORTING_REBUILD_BATCH_SIZE,
    rebuildMaxAttempts: parsed.data.REPORTING_REBUILD_MAX_ATTEMPTS,
    classroomExpansionBatchSize: parsed.data.REPORTING_CLASSROOM_EXPANSION_BATCH_SIZE,
    invalidationLockSeconds: parsed.data.REPORTING_INVALIDATION_LOCK_SECONDS,
    invalidationMaxAttempts: parsed.data.REPORTING_INVALIDATION_MAX_ATTEMPTS,
    invalidationRetryBaseSeconds: parsed.data.REPORTING_INVALIDATION_RETRY_BASE_SECONDS,
    invalidationRetryMaxSeconds: parsed.data.REPORTING_INVALIDATION_RETRY_MAX_SECONDS,
    privacyMinGroupSize: parsed.data.REPORTING_PRIVACY_MIN_GROUP_SIZE,
    maxDateRangeDays: parsed.data.REPORTING_MAX_DATE_RANGE_DAYS,
    exportEnabled: parsed.data.REPORT_EXPORT_ENABLED,
    exportMaxRows: parsed.data.REPORT_EXPORT_MAX_ROWS,
    exportMaxDateRangeDays: parsed.data.REPORT_EXPORT_MAX_DATE_RANGE_DAYS,
    analyticsEventsEnabled: parsed.data.ANALYTICS_EVENTS_ENABLED,
    analyticsEventRetentionDays: parsed.data.ANALYTICS_EVENT_RETENTION_DAYS,
    analyticsEventBodyMaxBytes: parsed.data.ANALYTICS_EVENT_BODY_MAX_BYTES,
    analyticsEventIdentityLimit: parsed.data.ANALYTICS_EVENT_IDENTITY_LIMIT,
    studentProgressTrendEnabled: parsed.data.STUDENT_PROGRESS_TREND_ENABLED,
    adminLearningOutcomesEnabled: parsed.data.ADMIN_LEARNING_OUTCOMES_ENABLED,
    weightedProcessScoreEnabled: parsed.data.WEIGHTED_PROCESS_SCORE_ENABLED,
  });

  if (featureFlags.gcsUploadsEnabled && !featureFlags.learningResourcesEnabled) {
    configurationError('GCS_UPLOADS_ENABLED requires LEARNING_RESOURCES_ENABLED=true');
  }
  if (parsed.data.ASSESSMENT_FILE_UPLOAD_ENABLED) {
    configurationError('ASSESSMENT_FILE_UPLOAD_ENABLED must remain false in Phase 05');
  }
  if (
    (assessmentFeatures.questionImageUrlEnabled || assessmentFeatures.questionVideoUrlEnabled) &&
    assessmentFeatures.questionMediaAllowedHosts.length === 0
  ) {
    configurationError(
      'QUESTION_MEDIA_ALLOWED_HOSTS is required when Question URL media is enabled',
    );
  }
  if (!isValidIanaTimezone(reporting.timezone)) {
    configurationError('REPORTING_TIMEZONE must be a valid IANA timezone');
  }
  if (reporting.pageMax > contentLimits.dashboardPageMax) {
    configurationError('REPORTING_PAGE_MAX must not exceed DASHBOARD_PAGE_MAX');
  }
  if (reporting.invalidationRetryBaseSeconds > reporting.invalidationRetryMaxSeconds) {
    configurationError(
      'REPORTING_INVALIDATION_RETRY_BASE_SECONDS must not exceed REPORTING_INVALIDATION_RETRY_MAX_SECONDS',
    );
  }

  return Object.freeze({
    nodeEnvironment: parsed.data.NODE_ENV,
    appEnvironment: parsed.data.APP_ENV,
    appVersion: parsed.data.APP_VERSION,
    commitSha: parsed.data.COMMIT_SHA,
    imageDigest: parsed.data.IMAGE_DIGEST,
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
    assessmentFeatures,
    assessmentRateLimits,
    reporting,
    rateLimits,
    bootstrapAdminEnabled: parsed.data.BOOTSTRAP_ADMIN_ENABLED,
    logLevel: parsed.data.LOG_LEVEL,
    trustProxyHops: parsed.data.TRUST_PROXY_HOPS,
    mongodbPool: Object.freeze({
      maxSize: parsed.data.MONGODB_MAX_POOL_SIZE,
      minSize: parsed.data.MONGODB_MIN_POOL_SIZE,
      serverSelectionTimeoutMs: parsed.data.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
      connectTimeoutMs: parsed.data.MONGODB_CONNECT_TIMEOUT_MS,
      socketTimeoutMs: parsed.data.MONGODB_SOCKET_TIMEOUT_MS,
    }),
  });
}
