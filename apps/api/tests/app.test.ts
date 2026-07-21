import SwaggerParser from '@apidevtools/swagger-parser';
import pino from 'pino';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import {
  createOpenApiDocument,
  PHASE_FOUR_OPENAPI_OPERATIONS,
  PHASE_THREE_OPENAPI_OPERATIONS,
  PHASE_TWO_OPENAPI_OPERATIONS,
} from '../src/docs/openapi.js';
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

  it('keeps every Phase 03 route covered and excludes stored credential secrets', () => {
    const document = createOpenApiDocument(testRuntimeInfo);
    const expectedRoutes = new Map([
      ['GET /api/v1/classrooms', 'listClassrooms'],
      ['POST /api/v1/classrooms', 'createClassroom'],
      ['GET /api/v1/classrooms/{classroomId}', 'getClassroom'],
      ['PATCH /api/v1/classrooms/{classroomId}', 'updateClassroom'],
      ['DELETE /api/v1/classrooms/{classroomId}', 'archiveClassroom'],
      ['PATCH /api/v1/classrooms/{classroomId}/settings', 'updateClassroomSettings'],
      ['GET /api/v1/classrooms/{classroomId}/students', 'listClassroomStudents'],
      [
        'POST /api/v1/classrooms/{classroomId}/students/{studentId}/remove',
        'removeClassroomStudent',
      ],
      ['GET /api/v1/classrooms/{classroomId}/class-code', 'getClassCode'],
      ['POST /api/v1/classrooms/{classroomId}/class-code/regenerate', 'regenerateClassCode'],
      ['POST /api/v1/classrooms/{classroomId}/class-code/disable', 'disableClassCode'],
      ['GET /api/v1/classrooms/{classroomId}/invite-links', 'listClassroomInviteLinks'],
      ['POST /api/v1/classrooms/{classroomId}/invite-links', 'createClassroomInviteLink'],
      [
        'POST /api/v1/classrooms/{classroomId}/invite-links/{linkId}/regenerate',
        'regenerateClassroomInviteLink',
      ],
      [
        'POST /api/v1/classrooms/{classroomId}/invite-links/{linkId}/disable',
        'disableClassroomInviteLink',
      ],
      ['POST /api/v1/classrooms/invite-links/preview', 'previewClassroomInviteLink'],
      ['POST /api/v1/classrooms/join-by-code', 'joinClassroomByCode'],
      ['POST /api/v1/classrooms/join-by-token', 'joinClassroomByToken'],
      ['GET /api/v1/admin/settings/enrollment-policy', 'getEnrollmentPolicy'],
      ['PATCH /api/v1/admin/settings/enrollment-policy', 'updateEnrollmentPolicy'],
      ['GET /api/v1/admin/classrooms', 'listAdminClassrooms'],
      ['GET /api/v1/admin/classrooms/{classroomId}', 'getAdminClassroom'],
    ]);
    const documentedOperations = new Map<string, string>();

    for (const [path, pathItem] of Object.entries(document.paths)) {
      if (!pathItem) continue;
      for (const method of ['get', 'post', 'patch', 'put', 'delete'] as const) {
        const operation = pathItem[method];
        if (
          !operation?.operationId ||
          !PHASE_THREE_OPENAPI_OPERATIONS.includes(
            operation.operationId as (typeof PHASE_THREE_OPENAPI_OPERATIONS)[number],
          )
        ) {
          continue;
        }

        const routeKey = `${method.toUpperCase()} ${path}`;
        documentedOperations.set(routeKey, operation.operationId);
        expect(operation.security, `${routeKey} security`).toBeDefined();
        const responseCodes = Object.keys(operation.responses);
        expect(responseCodes.some((code) => /^2\d\d$/u.test(code))).toBe(true);
        expect(responseCodes.some((code) => /^4\d\d$/u.test(code))).toBe(true);
      }
    }

    expect(documentedOperations).toEqual(expectedRoutes);
    expect([...documentedOperations.values()].sort()).toEqual(
      [...PHASE_THREE_OPENAPI_OPERATIONS].sort(),
    );
    const serialized = JSON.stringify(document);
    expect(serialized).not.toContain('codeDigest');
    expect(serialized).not.toContain('tokenHash');
    expect(serialized).not.toContain('CLASSROOM_CODE_PEPPER');
  });

  it('keeps every implemented Phase 04 authoring route in OpenAPI', () => {
    const document = createOpenApiDocument(testRuntimeInfo);
    const expectedRoutes = new Map([
      ['GET /api/v1/courses', 'listCourses'],
      ['POST /api/v1/courses', 'createCourse'],
      ['GET /api/v1/courses/{courseId}', 'getCourse'],
      ['PATCH /api/v1/courses/{courseId}', 'updateCourse'],
      ['PATCH /api/v1/courses/{courseId}/status', 'changeCourseStatus'],
      ['DELETE /api/v1/courses/{courseId}', 'archiveCourse'],
      ['GET /api/v1/courses/{courseId}/modules', 'listCourseModules'],
      ['POST /api/v1/courses/{courseId}/modules', 'createCourseModule'],
      ['PATCH /api/v1/modules/{moduleId}', 'updateCourseModule'],
      ['PATCH /api/v1/modules/{moduleId}/status', 'changeCourseModuleStatus'],
      ['DELETE /api/v1/modules/{moduleId}', 'archiveCourseModule'],
      ['PATCH /api/v1/courses/{courseId}/modules/reorder', 'reorderCourseModules'],
      ['GET /api/v1/courses/{courseId}/lessons', 'listCourseLessons'],
      ['POST /api/v1/lessons', 'createLesson'],
      ['GET /api/v1/lessons/{lessonId}', 'getLesson'],
      ['PATCH /api/v1/lessons/{lessonId}', 'updateLesson'],
      ['PATCH /api/v1/lessons/{lessonId}/status', 'changeLessonStatus'],
      ['DELETE /api/v1/lessons/{lessonId}', 'archiveLesson'],
      ['POST /api/v1/lessons/{lessonId}/preview', 'previewLesson'],
      ['PATCH /api/v1/courses/{courseId}/lessons/reorder', 'reorderCourseLessons'],
      ['GET /api/v1/lessons/{lessonId}/flashcards', 'listLessonFlashcards'],
      ['POST /api/v1/lessons/{lessonId}/flashcards', 'createLessonFlashcard'],
      ['PATCH /api/v1/flashcards/{flashcardId}', 'updateFlashcard'],
      ['DELETE /api/v1/flashcards/{flashcardId}', 'archiveFlashcard'],
      ['PATCH /api/v1/lessons/{lessonId}/flashcards/reorder', 'reorderLessonFlashcards'],
      ['PATCH /api/v1/teacher/lessons/{lessonId}/deadline', 'changeLessonDeadline'],
      ['GET /api/v1/teacher/lessons/{lessonId}/deadline-history', 'listLessonDeadlineHistory'],
      ['GET /api/v1/classrooms/{classroomId}/classwork', 'getStudentClasswork'],
      ['POST /api/v1/lessons/{lessonId}/start', 'startLesson'],
      ['POST /api/v1/lessons/{lessonId}/complete', 'completeLesson'],
      ['GET /api/v1/students/me/todo', 'listStudentTodo'],
      ['GET /api/v1/students/me/deadlines', 'listStudentDeadlines'],
      ['GET /api/v1/students/me/progress', 'getOwnCourseProgress'],
      ['GET /api/v1/teacher/courses/{courseId}/dashboard', 'getTeacherCourseDashboard'],
      ['GET /api/v1/teacher/courses/{courseId}/activities', 'listTeacherCourseActivities'],
      ['GET /api/v1/teacher/courses/{courseId}/students', 'listTeacherCourseStudents'],
      ['GET /api/v1/teacher/courses/{courseId}/progress', 'listTeacherCourseProgress'],
      ['GET /api/v1/classrooms/{classroomId}/announcements', 'listClassroomAnnouncements'],
      ['POST /api/v1/classrooms/{classroomId}/announcements', 'createAnnouncement'],
      ['PATCH /api/v1/announcements/{announcementId}', 'updateAnnouncement'],
      ['PATCH /api/v1/announcements/{announcementId}/status', 'changeAnnouncementStatus'],
      ['DELETE /api/v1/announcements/{announcementId}', 'archiveAnnouncement'],
      ['GET /api/v1/admin/courses', 'listAdminCourses'],
      ['GET /api/v1/admin/courses/{courseId}', 'getAdminCourse'],
    ]);
    const documentedOperations = new Map<string, string>();

    for (const [path, pathItem] of Object.entries(document.paths)) {
      if (!pathItem) continue;
      for (const method of ['get', 'post', 'patch', 'put', 'delete'] as const) {
        const operation = pathItem[method];
        if (
          !operation?.operationId ||
          !PHASE_FOUR_OPENAPI_OPERATIONS.includes(
            operation.operationId as (typeof PHASE_FOUR_OPENAPI_OPERATIONS)[number],
          )
        ) {
          continue;
        }
        const routeKey = `${method.toUpperCase()} ${path}`;
        documentedOperations.set(routeKey, operation.operationId);
        expect(operation.security, `${routeKey} security`).toBeDefined();
        const responseCodes = Object.keys(operation.responses);
        expect(responseCodes.some((code) => /^2\d\d$/u.test(code))).toBe(true);
        expect(responseCodes.some((code) => /^4\d\d$/u.test(code))).toBe(true);
      }
    }

    expect(documentedOperations).toEqual(expectedRoutes);
    expect([...documentedOperations.values()].sort()).toEqual(
      [...PHASE_FOUR_OPENAPI_OPERATIONS].sort(),
    );
  });
});
