import SwaggerParser from '@apidevtools/swagger-parser';
import pino from 'pino';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { createOpenApiDocument } from '../src/docs/openapi.js';
import { testConfig, testRuntimeInfo } from './test-fixtures.js';

function buildTestApp(databaseStatus: 'UP' | 'DOWN' | 'CONNECTING' = 'UP') {
  return createApp({
    config: testConfig,
    logger: pino({ level: 'silent' }),
    runtimeInfo: testRuntimeInfo,
    dependencies: { getDatabaseStatus: () => databaseStatus },
  });
}

describe('system API', () => {
  it('returns a public-safe basic health response and request ID', async () => {
    const response = await request(buildTestApp()).get('/health').expect(200);

    expect(response.headers['x-request-id']).toBeTruthy();
    expect(response.body).toMatchObject({
      success: true,
      data: { status: 'UP', service: 'microlearning-api' },
    });
    expect(JSON.stringify(response.body)).not.toContain('mongodb://');
  });

  it('reports readiness only when MongoDB is available', async () => {
    const readyResponse = await request(buildTestApp('UP')).get('/ready').expect(200);
    const unavailableResponse = await request(buildTestApp('DOWN')).get('/ready').expect(503);

    expect(readyResponse.body.data.status).toBe('UP');
    expect(unavailableResponse.body.data).toMatchObject({
      status: 'DOWN',
      dependencies: { mongodb: 'DOWN' },
    });
  });

  it('returns artifact identity from the version endpoint', async () => {
    const response = await request(buildTestApp()).get('/api/v1/system/version').expect(200);

    expect(response.body.data).toEqual(testRuntimeInfo);
  });

  it('returns the standard error envelope for unknown routes', async () => {
    const response = await request(buildTestApp()).get('/api/v1/unknown').expect(404);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'RESOURCE_NOT_FOUND' },
      meta: { path: '/api/v1/unknown' },
    });
    expect(response.body.error.stack).toBeUndefined();
  });

  it('publishes a valid OpenAPI document through the documented route', async () => {
    const document = createOpenApiDocument(testRuntimeInfo);
    await expect(SwaggerParser.validate(document)).resolves.toBeTruthy();

    const response = await request(buildTestApp()).get('/api/v1/openapi.json').expect(200);
    expect(response.body.openapi).toBe('3.0.3');
    expect(response.body.paths['/health']).toBeDefined();
  });
});
