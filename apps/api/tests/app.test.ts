import SwaggerParser from '@apidevtools/swagger-parser';
import pino from 'pino';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { createOpenApiDocument, PHASE_TWO_OPENAPI_OPERATIONS } from '../src/docs/openapi.js';
import { testConfig, testRuntimeInfo } from './test-fixtures.js';

function buildTestApp(databaseStatus: 'UP' | 'DOWN' | 'CONNECTING' = 'UP') {
  return createApp({
    config: testConfig,
    logger: pino({ level: 'silent' }),
    runtimeInfo: testRuntimeInfo,
    dependencies: { getDatabaseStatus: async () => databaseStatus },
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

  it('keeps every Phase 02 route covered by a secure, testable OpenAPI operation', () => {
    const document = createOpenApiDocument(testRuntimeInfo);
    const expectedRoutes = new Map([
      ['POST /api/v1/auth/register', 'registerStudent'],
      ['POST /api/v1/auth/login', 'loginUser'],
      ['POST /api/v1/auth/refresh-token', 'refreshSession'],
      ['POST /api/v1/auth/logout', 'logoutUser'],
      ['GET /api/v1/users/me', 'getCurrentUser'],
      ['PATCH /api/v1/users/me', 'updateCurrentUser'],
      ['GET /api/v1/admin/users/students', 'listStudents'],
      ['GET /api/v1/admin/users/teachers', 'listTeachers'],
      ['GET /api/v1/admin/users/admins', 'listAdmins'],
      ['GET /api/v1/admin/users/{userId}', 'getAdminUserDetail'],
      ['PATCH /api/v1/admin/users/{userId}/status', 'changeAdminUserStatus'],
      ['PATCH /api/v1/admin/users/{userId}/role', 'changeAdminUserRole'],
      ['POST /api/v1/admin/teacher-invitations', 'createTeacherInvitation'],
      ['GET /api/v1/admin/teacher-invitations', 'listTeacherInvitations'],
      ['GET /api/v1/admin/teacher-invitations/{invitationId}', 'getTeacherInvitation'],
      [
        'POST /api/v1/admin/teacher-invitations/{invitationId}/copy-events',
        'recordTeacherInvitationCopy',
      ],
      ['POST /api/v1/admin/teacher-invitations/{invitationId}/revoke', 'revokeTeacherInvitation'],
      ['POST /api/v1/teacher/invitations/preview', 'previewTeacherInvitation'],
      ['POST /api/v1/teacher/invitations/accept', 'acceptTeacherInvitation'],
    ]);
    const documentedOperations = new Map<string, string>();

    for (const [path, pathItem] of Object.entries(document.paths)) {
      if (!pathItem) continue;
      for (const method of ['get', 'post', 'patch', 'put', 'delete'] as const) {
        const operation = pathItem[method];
        if (
          !operation?.operationId ||
          !PHASE_TWO_OPENAPI_OPERATIONS.includes(
            operation.operationId as (typeof PHASE_TWO_OPENAPI_OPERATIONS)[number],
          )
        ) {
          continue;
        }

        const routeKey = `${method.toUpperCase()} ${path}`;
        documentedOperations.set(routeKey, operation.operationId);
        expect(operation.security, `${routeKey} security`).toBeDefined();

        const responseCodes = Object.keys(operation.responses);
        const successCode = responseCodes.find((code) => /^2\d\d$/u.test(code));
        expect(successCode, `${routeKey} success response`).toBeDefined();
        expect(
          responseCodes.some((code) => /^4\d\d$/u.test(code)),
          `${routeKey} error response`,
        ).toBe(true);

        const successResponse = successCode ? operation.responses[successCode] : undefined;
        const responseExample =
          successResponse && 'content' in successResponse
            ? successResponse.content?.['application/json']?.example
            : undefined;
        const bodyExample =
          operation.requestBody && 'content' in operation.requestBody
            ? operation.requestBody.content['application/json']?.example
            : undefined;
        expect(
          operation.operationId === 'logoutUser' || responseExample || bodyExample,
          `${routeKey} example`,
        ).toBeTruthy();

        if (operation.operationId !== 'logoutUser') {
          expect(
            successResponse && 'content' in successResponse,
            `${routeKey} success schema`,
          ).toBe(true);
        }
      }
    }

    expect(documentedOperations).toEqual(expectedRoutes);
    expect([...documentedOperations.values()].sort()).toEqual(
      [...PHASE_TWO_OPENAPI_OPERATIONS].sort(),
    );
  });
});
