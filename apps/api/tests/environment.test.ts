import { describe, expect, it } from 'vitest';

import { loadEnvironment } from '../src/shared/config/environment.js';

const validEnvironment = {
  APP_ENV: 'test',
  APP_VERSION: '0.1.0',
  COMMIT_SHA: 'test-sha',
  BUILD_TIME: '2026-07-12T10:00:00.000Z',
  PORT: '4000',
  MONGODB_URI: 'mongodb://localhost:27017/microlearning-test?replicaSet=rs0',
  PUBLIC_WEB_URL: 'http://localhost:3000',
  ALLOWED_ORIGINS: 'http://localhost:5173,http://localhost:3000,http://localhost:5173',
  ACCESS_TOKEN_SECRET: 'synthetic-access-token-secret-for-unit-tests',
  AUTH_IDENTITY_PEPPER: 'synthetic-identity-pepper-for-unit-tests-only',
  CLASSROOM_CODE_PEPPER: 'synthetic-classroom-code-pepper-for-unit-tests',
  CLASSROOM_CODE_LENGTH: '8',
  CLASSROOM_INVITE_TOKEN_BYTES: '32',
  CLASSROOM_INVITE_DEFAULT_TTL_DAYS: '30',
  CLASSROOM_JOIN_IP_LIMIT: '20',
  CLASSROOM_JOIN_IDENTITY_LIMIT: '10',
  CLASSROOM_JOIN_WINDOW_SECONDS: '900',
  CLASSROOM_PREVIEW_IP_LIMIT: '30',
  CONTENT_MARKDOWN_MAX_CHARS: '100000',
  COURSE_MAX_PER_CLASSROOM: '100',
  MODULE_MAX_PER_COURSE: '100',
  LESSON_MAX_PER_COURSE: '500',
  FLASHCARD_MAX_PER_LESSON: '100',
  CONTENT_WRITE_WINDOW_SECONDS: '60',
  CONTENT_WRITE_IDENTITY_LIMIT: '120',
  LEARNING_ACTION_WINDOW_SECONDS: '60',
  LEARNING_ACTION_IDENTITY_LIMIT: '180',
  DASHBOARD_PAGE_MAX: '100',
  LEARNING_RESOURCES_ENABLED: 'false',
  GCS_UPLOADS_ENABLED: 'false',
  QUESTION_IMAGE_URL_ENABLED: 'false',
  QUESTION_VIDEO_URL_ENABLED: 'false',
  QUESTION_MEDIA_ALLOWED_HOSTS: 'media.example.edu,video.example.edu',
  ASSIGNMENT_LINK_SUBMISSION_ENABLED: 'false',
  ASSIGNMENT_MARK_DONE_ENABLED: 'false',
  ASSESSMENT_FILE_UPLOAD_ENABLED: 'false',
  QUIZ_ATTEMPT_START_IP_LIMIT: '300',
  QUIZ_ATTEMPT_IDENTITY_LIMIT: '20',
  QUIZ_ANSWER_SAVE_LIMIT: '180',
  ASSESSMENT_MUTATION_WINDOW_SECONDS: '60',
  ASSESSMENT_MUTATION_IDENTITY_LIMIT: '120',
  REPORTING_ENABLED: 'true',
  REPORTING_TIMEZONE: 'Asia/Ho_Chi_Minh',
  REPORTING_DUE_SOON_WINDOW_HOURS: '72',
  REPORTING_PAGE_MAX: '50',
  REPORTING_DASHBOARD_PREVIEW_LIMIT: '5',
  REPORTING_GRADEBOOK_ACTIVITY_MAX: '50',
  REPORTING_STALE_AFTER_SECONDS: '300',
  REPORTING_INLINE_REFRESH_MAX_STUDENTS: '5',
  REPORTING_ON_DEMAND_COURSE_REFRESH_MAX_STUDENTS: '100',
  REPORTING_REFRESH_REQUEST_BUDGET_MS: '900',
  REPORTING_REBUILD_BATCH_SIZE: '50',
  REPORTING_REBUILD_MAX_ATTEMPTS: '3',
  REPORTING_CLASSROOM_EXPANSION_BATCH_SIZE: '50',
  REPORTING_INVALIDATION_LOCK_SECONDS: '120',
  REPORTING_INVALIDATION_MAX_ATTEMPTS: '3',
  REPORTING_INVALIDATION_RETRY_BASE_SECONDS: '30',
  REPORTING_INVALIDATION_RETRY_MAX_SECONDS: '300',
  REPORTING_PRIVACY_MIN_GROUP_SIZE: '5',
  REPORTING_MAX_DATE_RANGE_DAYS: '365',
  REPORT_EXPORT_ENABLED: 'false',
  REPORT_EXPORT_MAX_ROWS: '5000',
  REPORT_EXPORT_MAX_DATE_RANGE_DAYS: '365',
  ANALYTICS_EVENTS_ENABLED: 'false',
  ANALYTICS_EVENT_RETENTION_DAYS: '90',
  ANALYTICS_EVENT_BODY_MAX_BYTES: '16384',
  ANALYTICS_EVENT_IDENTITY_LIMIT: '120',
  STUDENT_PROGRESS_TREND_ENABLED: 'false',
  ADMIN_LEARNING_OUTCOMES_ENABLED: 'false',
  WEIGHTED_PROCESS_SCORE_ENABLED: 'false',
  LOG_LEVEL: 'silent',
};

describe('loadEnvironment', () => {
  it('parses, normalizes and freezes valid environment values', () => {
    const config = loadEnvironment(validEnvironment);

    expect(config).toMatchObject({
      port: 4000,
      publicWebUrl: 'http://localhost:3000',
      accessTokenTtlSeconds: 900,
      refreshTokenTtlSeconds: 604_800,
      refreshReuseGraceSeconds: 5,
      refreshCookieName: 'ml_refresh',
      refreshCookieSecure: false,
      teacherInvitationTtlDays: 7,
      classroomCodeLength: 8,
      classroomInviteTokenBytes: 32,
      classroomInviteDefaultTtlDays: 30,
      bootstrapAdminEnabled: false,
    });
    expect(config.allowedOrigins).toEqual(['http://localhost:5173', 'http://localhost:3000']);
    expect(config.rateLimits).toEqual({
      windowSeconds: 900,
      registerMax: 10,
      loginMax: 30,
      refreshMax: 60,
      publicInvitationMax: 20,
      adminInvitationWindowSeconds: 3600,
      adminInvitationMax: 20,
      loginFailureWindowSeconds: 900,
      loginFailureMaxAttempts: 5,
      loginCooldownSeconds: 900,
    });
    expect(config.classroomRateLimits).toEqual({
      joinIpMax: 20,
      joinIdentityMax: 10,
      joinWindowSeconds: 900,
      previewIpMax: 30,
    });
    expect(config.contentLimits).toEqual({
      markdownMaxChars: 100_000,
      coursesPerClassroom: 100,
      modulesPerCourse: 100,
      lessonsPerCourse: 500,
      flashcardsPerLesson: 100,
      dashboardPageMax: 100,
    });
    expect(config.learningRateLimits).toEqual({
      contentWriteWindowSeconds: 60,
      contentWriteIdentityMax: 120,
      learningActionWindowSeconds: 60,
      learningActionIdentityMax: 180,
    });
    expect(config.featureFlags).toEqual({
      learningResourcesEnabled: false,
      gcsUploadsEnabled: false,
    });
    expect(config.assessmentFeatures).toEqual({
      questionImageUrlEnabled: false,
      questionVideoUrlEnabled: false,
      questionMediaAllowedHosts: ['media.example.edu', 'video.example.edu'],
      assignmentLinkSubmissionEnabled: false,
      assignmentMarkDoneEnabled: false,
      assessmentFileUploadEnabled: false,
    });
    expect(config.assessmentRateLimits).toEqual({
      mutationWindowSeconds: 60,
      mutationIdentityMax: 120,
      attemptStartIpMax: 300,
      attemptStartIdentityMax: 20,
      answerSaveIdentityMax: 180,
    });
    expect(config.reporting).toMatchObject({
      enabled: true,
      timezone: 'Asia/Ho_Chi_Minh',
      pageMax: 50,
      dashboardPreviewLimit: 5,
      onDemandCourseRefreshMaxStudents: 100,
      rebuildBatchSize: 50,
      invalidationMaxAttempts: 3,
      privacyMinGroupSize: 5,
    });
    expect(Object.isFrozen(config)).toBe(true);
    expect(Object.isFrozen(config.rateLimits)).toBe(true);
    expect(Object.isFrozen(config.classroomRateLimits)).toBe(true);
    expect(Object.isFrozen(config.contentLimits)).toBe(true);
    expect(Object.isFrozen(config.learningRateLimits)).toBe(true);
    expect(Object.isFrozen(config.featureFlags)).toBe(true);
    expect(Object.isFrozen(config.assessmentFeatures)).toBe(true);
    expect(Object.isFrozen(config.assessmentRateLimits)).toBe(true);
    expect(Object.isFrozen(config.reporting)).toBe(true);
  });

  it('fails fast without exposing a connection string when MongoDB config is invalid', () => {
    const invalidUri =
      'mongodb://example.internal/database?replicaSet=wrong&appName=sensitive-marker-should-not-leak';

    expect(() => loadEnvironment({ ...validEnvironment, MONGODB_URI: invalidUri })).toThrow(
      'MONGODB_URI must select replicaSet=rs0',
    );

    try {
      loadEnvironment({ ...validEnvironment, MONGODB_URI: invalidUri });
    } catch (error) {
      expect(String(error)).not.toContain('sensitive-marker-should-not-leak');
    }
  });

  it.each([
    ['ACCESS_TOKEN_SECRET', 'too-short'],
    ['AUTH_IDENTITY_PEPPER', 'too-short'],
    ['ACCESS_TOKEN_TTL_SECONDS', '59'],
    ['REFRESH_REUSE_GRACE_SECONDS', '11'],
    ['TEACHER_INVITATION_TTL_DAYS', '31'],
    ['LOGIN_FAILURE_MAX_ATTEMPTS', '0'],
    ['CLASSROOM_CODE_PEPPER', 'too-short'],
    ['CLASSROOM_CODE_LENGTH', '7'],
    ['CLASSROOM_INVITE_TOKEN_BYTES', '31'],
    ['CLASSROOM_INVITE_DEFAULT_TTL_DAYS', '91'],
    ['CLASSROOM_JOIN_WINDOW_SECONDS', '59'],
    ['CLASSROOM_PREVIEW_IP_LIMIT', '0'],
    ['CONTENT_MARKDOWN_MAX_CHARS', '999'],
    ['COURSE_MAX_PER_CLASSROOM', '1001'],
    ['MODULE_MAX_PER_COURSE', '501'],
    ['LESSON_MAX_PER_COURSE', '5001'],
    ['FLASHCARD_MAX_PER_LESSON', '501'],
    ['CONTENT_WRITE_WINDOW_SECONDS', 'NaN'],
    ['CONTENT_WRITE_IDENTITY_LIMIT', '0'],
    ['LEARNING_ACTION_WINDOW_SECONDS', '0'],
    ['LEARNING_ACTION_IDENTITY_LIMIT', '0'],
    ['DASHBOARD_PAGE_MAX', '19'],
    ['QUIZ_ATTEMPT_START_IP_LIMIT', '0'],
    ['QUIZ_ATTEMPT_IDENTITY_LIMIT', '0'],
    ['QUIZ_ANSWER_SAVE_LIMIT', '0'],
    ['ASSESSMENT_MUTATION_WINDOW_SECONDS', '0'],
    ['ASSESSMENT_MUTATION_IDENTITY_LIMIT', '0'],
    ['REPORTING_PAGE_MAX', '0'],
    ['REPORTING_DASHBOARD_PREVIEW_LIMIT', '11'],
    ['REPORTING_ON_DEMAND_COURSE_REFRESH_MAX_STUDENTS', '501'],
    ['REPORTING_REFRESH_REQUEST_BUDGET_MS', '99'],
    ['REPORTING_REBUILD_BATCH_SIZE', '0'],
    ['REPORTING_PRIVACY_MIN_GROUP_SIZE', '1'],
  ])('rejects invalid %s boundaries', (field, value) => {
    expect(() => loadEnvironment({ ...validEnvironment, [field]: value })).toThrow(
      'Invalid application configuration',
    );
  });

  it('rejects invalid Phase 04 feature combinations', () => {
    expect(() =>
      loadEnvironment({
        ...validEnvironment,
        LEARNING_RESOURCES_ENABLED: 'false',
        GCS_UPLOADS_ENABLED: 'true',
      }),
    ).toThrow('GCS_UPLOADS_ENABLED requires LEARNING_RESOURCES_ENABLED=true');
  });

  it('rejects unsafe Phase 05 feature combinations and malformed media hosts', () => {
    expect(() =>
      loadEnvironment({ ...validEnvironment, ASSESSMENT_FILE_UPLOAD_ENABLED: 'true' }),
    ).toThrow('ASSESSMENT_FILE_UPLOAD_ENABLED must remain false');
    expect(() =>
      loadEnvironment({
        ...validEnvironment,
        QUESTION_IMAGE_URL_ENABLED: 'true',
        QUESTION_MEDIA_ALLOWED_HOSTS: '',
      }),
    ).toThrow('QUESTION_MEDIA_ALLOWED_HOSTS is required');
    expect(() =>
      loadEnvironment({
        ...validEnvironment,
        QUESTION_MEDIA_ALLOWED_HOSTS: 'https://media.example.edu/path',
      }),
    ).toThrow('must contain hostnames without scheme');
  });

  it('rejects malformed origins and secret reuse', () => {
    expect(() =>
      loadEnvironment({ ...validEnvironment, ALLOWED_ORIGINS: 'http://localhost:3000/private' }),
    ).toThrow('ALLOWED_ORIGINS must contain an origin');

    expect(() =>
      loadEnvironment({
        ...validEnvironment,
        AUTH_IDENTITY_PEPPER: validEnvironment.ACCESS_TOKEN_SECRET,
      }),
    ).toThrow('must be different');

    expect(() =>
      loadEnvironment({
        ...validEnvironment,
        CLASSROOM_CODE_PEPPER: validEnvironment.ACCESS_TOKEN_SECRET,
      }),
    ).toThrow('must be different');
  });

  it('rejects inconsistent reporting runtime controls', () => {
    expect(() =>
      loadEnvironment({
        ...validEnvironment,
        REPORTING_PAGE_MAX: '51',
        DASHBOARD_PAGE_MAX: '50',
      }),
    ).toThrow('REPORTING_PAGE_MAX must not exceed DASHBOARD_PAGE_MAX');
    expect(() =>
      loadEnvironment({
        ...validEnvironment,
        REPORTING_INVALIDATION_RETRY_BASE_SECONDS: '301',
        REPORTING_INVALIDATION_RETRY_MAX_SECONDS: '300',
      }),
    ).toThrow('REPORTING_INVALIDATION_RETRY_BASE_SECONDS');
    expect(() =>
      loadEnvironment({ ...validEnvironment, REPORTING_TIMEZONE: 'Not/A-Timezone' }),
    ).toThrow('REPORTING_TIMEZONE must be a valid IANA timezone');
  });

  it('enforces HTTPS, secure cookies and non-placeholder secrets in production', () => {
    const productionEnvironment = {
      ...validEnvironment,
      NODE_ENV: 'production',
      APP_ENV: 'production',
      COMMIT_SHA: 'a'.repeat(40),
      IMAGE_DIGEST: `sha256:${'b'.repeat(64)}`,
      MONGODB_URI:
        'mongodb+srv://microlearning-production-app:synthetic-password@cluster.example.test/microlearning_production',
      PUBLIC_WEB_URL: 'https://microlearning.example.test',
      ALLOWED_ORIGINS: 'https://microlearning.example.test',
      ACCESS_TOKEN_SECRET: 'r4nd0m-production-access-token-secret-material',
      AUTH_IDENTITY_PEPPER: 'different-r4nd0m-production-pepper-material',
      CLASSROOM_CODE_PEPPER: 'third-r4nd0m-production-code-pepper-material',
      REFRESH_COOKIE_SECURE: 'true',
      TRUST_PROXY_HOPS: '1',
      MONGODB_MAX_POOL_SIZE: '10',
      MONGODB_MIN_POOL_SIZE: '0',
      MONGODB_SERVER_SELECTION_TIMEOUT_MS: '10000',
      MONGODB_CONNECT_TIMEOUT_MS: '10000',
      MONGODB_SOCKET_TIMEOUT_MS: '30000',
    };

    expect(loadEnvironment(productionEnvironment).refreshCookieSecure).toBe(true);
    expect(
      loadEnvironment({ ...productionEnvironment, QUESTION_MEDIA_ALLOWED_HOSTS: '' })
        .assessmentFeatures.questionMediaAllowedHosts,
    ).toEqual([]);
    expect(() =>
      loadEnvironment({ ...productionEnvironment, REFRESH_COOKIE_SECURE: 'false' }),
    ).toThrow('REFRESH_COOKIE_SECURE must be true');
    expect(() => loadEnvironment({ ...productionEnvironment, NODE_ENV: 'development' })).toThrow(
      'NODE_ENV must be production',
    );
    expect(() => loadEnvironment({ ...productionEnvironment, IMAGE_DIGEST: 'latest' })).toThrow(
      'IMAGE_DIGEST must use sha256',
    );
    expect(() => loadEnvironment({ ...productionEnvironment, TRUST_PROXY_HOPS: '0' })).toThrow(
      'TRUST_PROXY_HOPS must be 1',
    );
    expect(() =>
      loadEnvironment({
        ...productionEnvironment,
        MONGODB_URI:
          'mongodb://microlearning-production-app:synthetic-password@cluster.example.test/microlearning_production',
      }),
    ).toThrow('must use mongodb+srv://');
    expect(() =>
      loadEnvironment({
        ...productionEnvironment,
        MONGODB_URI:
          'mongodb+srv://microlearning-production-app:synthetic-password@cluster.example.test/admin',
      }),
    ).toThrow('must select database microlearning_production');
    expect(() =>
      loadEnvironment({ ...productionEnvironment, MONGODB_MAX_POOL_SIZE: '11' }),
    ).toThrow('MONGODB_MAX_POOL_SIZE=10');
    expect(() =>
      loadEnvironment({
        ...productionEnvironment,
        ACCESS_TOKEN_SECRET: 'replace-with-production-access-token-secret',
      }),
    ).toThrow('must not use placeholder secrets');
    expect(() =>
      loadEnvironment({
        ...productionEnvironment,
        CLASSROOM_CODE_PEPPER: 'replace-with-production-classroom-code-pepper',
      }),
    ).toThrow('must not use placeholder secrets');

    const missingPhaseFourField = { ...productionEnvironment };
    delete (missingPhaseFourField as Partial<typeof productionEnvironment>)
      .CONTENT_MARKDOWN_MAX_CHARS;
    expect(() => loadEnvironment(missingPhaseFourField)).toThrow(
      'must explicitly configure CONTENT_MARKDOWN_MAX_CHARS',
    );
  });
});
