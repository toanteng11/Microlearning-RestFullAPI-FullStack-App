import type { AppConfig } from '../src/shared/config/environment.js';
import type { RuntimeInfo } from '../src/modules/system/system.types.js';

export const testConfig: AppConfig = {
  appEnvironment: 'test',
  appVersion: '0.1.0',
  commitSha: 'test-sha',
  buildTime: '2026-07-12T10:00:00.000Z',
  port: 4000,
  mongodbUri: 'mongodb://localhost:27017/microlearning-test',
  allowedOrigins: ['http://localhost:5173'],
  logLevel: 'silent',
};

export const testRuntimeInfo: RuntimeInfo = {
  appName: 'Microlearning Classroom LMS API',
  version: testConfig.appVersion,
  environment: testConfig.appEnvironment,
  commitSha: testConfig.commitSha,
  buildTime: testConfig.buildTime,
};
