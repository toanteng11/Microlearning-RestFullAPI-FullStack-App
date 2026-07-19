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
    expect(Object.isFrozen(config)).toBe(true);
    expect(Object.isFrozen(config.rateLimits)).toBe(true);
    expect(Object.isFrozen(config.classroomRateLimits)).toBe(true);
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
  ])('rejects invalid %s boundaries', (field, value) => {
    expect(() => loadEnvironment({ ...validEnvironment, [field]: value })).toThrow(
      'Invalid application configuration',
    );
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

  it('enforces HTTPS, secure cookies and non-placeholder secrets in production', () => {
    const productionEnvironment = {
      ...validEnvironment,
      APP_ENV: 'production',
      MONGODB_URI: 'mongodb+srv://cluster.example.test/microlearning',
      PUBLIC_WEB_URL: 'https://microlearning.example.test',
      ALLOWED_ORIGINS: 'https://microlearning.example.test',
      ACCESS_TOKEN_SECRET: 'r4nd0m-production-access-token-secret-material',
      AUTH_IDENTITY_PEPPER: 'different-r4nd0m-production-pepper-material',
      CLASSROOM_CODE_PEPPER: 'third-r4nd0m-production-code-pepper-material',
      REFRESH_COOKIE_SECURE: 'true',
    };

    expect(loadEnvironment(productionEnvironment).refreshCookieSecure).toBe(true);
    expect(() =>
      loadEnvironment({ ...productionEnvironment, REFRESH_COOKIE_SECURE: 'false' }),
    ).toThrow('REFRESH_COOKIE_SECURE must be true');
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
  });
});
