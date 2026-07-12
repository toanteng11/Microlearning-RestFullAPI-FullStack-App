import { describe, expect, it } from 'vitest';

import { loadEnvironment } from '../src/shared/config/environment.js';

const validEnvironment = {
  APP_ENV: 'test',
  APP_VERSION: '0.1.0',
  COMMIT_SHA: 'test-sha',
  BUILD_TIME: '2026-07-12T10:00:00.000Z',
  PORT: '4000',
  MONGODB_URI: 'mongodb://localhost:27017/microlearning-test',
  ALLOWED_ORIGINS: 'http://localhost:5173,http://localhost:3000',
  LOG_LEVEL: 'silent',
};

describe('loadEnvironment', () => {
  it('parses and normalizes valid environment values', () => {
    const config = loadEnvironment(validEnvironment);

    expect(config.port).toBe(4000);
    expect(config.allowedOrigins).toEqual(['http://localhost:5173', 'http://localhost:3000']);
  });

  it('fails fast without exposing a connection string when MongoDB config is invalid', () => {
    expect(() => loadEnvironment({ ...validEnvironment, MONGODB_URI: 'invalid-uri' })).toThrow(
      'Invalid application configuration',
    );
  });
});
