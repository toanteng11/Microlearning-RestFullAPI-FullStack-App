import type { OpenAPIV3 } from 'openapi-types';

type Schema = OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject;

const security: OpenAPIV3.SecurityRequirementObject[] = [{ bearerAuth: [] }];
const objectIdPattern = '^[a-fA-F0-9]{24}$';

function content(schema: Schema, example?: unknown) {
  return { 'application/json': { schema, ...(example === undefined ? {} : { example }) } };
}

function ok(description: string, example: unknown): OpenAPIV3.ResponseObject {
  return {
    description,
    content: content({ $ref: '#/components/schemas/PhaseFourSuccessResponse' }, example),
  };
}

function error(description: string, code: string): OpenAPIV3.ResponseObject {
  return {
    description,
    content: content(
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        success: false,
        error: { code, message: description },
        meta: {
          requestId: '019d0000-0000-7000-8000-000000000046',
          timestamp: '2026-07-20T08:00:00.000Z',
          path: '/api/v1/lessons/507f1f77bcf86cd799439044/complete',
        },
      },
    ),
  };
}

const protectedErrors = {
  '401': error('Authentication is required', 'AUTHENTICATION_REQUIRED'),
  '403': error('Access is denied', 'ACCESS_DENIED'),
  '404': error('Resource was not found', 'RESOURCE_NOT_FOUND'),
  '422': error('Request data is invalid', 'VALIDATION_ERROR'),
};

const lessonId: OpenAPIV3.ParameterObject = {
  name: 'lessonId',
  in: 'path',
  required: true,
  schema: { type: 'string', pattern: objectIdPattern },
};
const classroomId: OpenAPIV3.ParameterObject = {
  name: 'classroomId',
  in: 'path',
  required: true,
  schema: { type: 'string', pattern: objectIdPattern },
};
const page: OpenAPIV3.ParameterObject = {
  name: 'page',
  in: 'query',
  schema: { type: 'integer', minimum: 1, default: 1 },
};
const limit: OpenAPIV3.ParameterObject = {
  name: 'limit',
  in: 'query',
  schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
};

const progressExample = {
  status: 'COMPLETED',
  startedAt: '2026-07-20T08:00:00.000Z',
  completedAt: '2026-07-20T08:08:00.000Z',
  lastActiveAt: '2026-07-20T08:08:00.000Z',
  derivedStatus: 'COMPLETED',
};

export const PHASE_FOUR_PROGRESS_OPENAPI_OPERATIONS = [
  'getStudentClasswork',
  'startLesson',
  'completeLesson',
  'listStudentTodo',
  'listStudentDeadlines',
] as const;

export const phaseFourProgressTags: OpenAPIV3.TagObject[] = [
  {
    name: 'Learning Progress',
    description: 'Student Classwork, mixed learning activity progress, deadlines and To-do',
  },
];

export const phaseFourProgressSchemas: Record<string, Schema> = {
  LearningActivityType: {
    type: 'string',
    enum: ['LESSON', 'QUIZ', 'ASSIGNMENT'],
  },
  DerivedLearningStatus: {
    type: 'string',
    enum: ['NOT_STARTED', 'IN_PROGRESS', 'MISSING', 'COMPLETED', 'LATE'],
  },
  LessonProgress: {
    type: 'object',
    additionalProperties: false,
    required: ['status', 'startedAt', 'completedAt', 'lastActiveAt', 'derivedStatus'],
    properties: {
      status: { type: 'string', enum: ['IN_PROGRESS', 'COMPLETED'], nullable: true },
      startedAt: { type: 'string', format: 'date-time', nullable: true },
      completedAt: { type: 'string', format: 'date-time', nullable: true },
      lastActiveAt: { type: 'string', format: 'date-time', nullable: true },
      derivedStatus: { $ref: '#/components/schemas/DerivedLearningStatus' },
    },
  },
  ProgressMetricVersion: {
    type: 'string',
    enum: ['P05_REQUIRED_ACTIVITY_COMPLETION_V1'],
  },
  LearningActivityDescriptorVersion: {
    type: 'string',
    enum: ['P05_ACTIVITY_DESCRIPTOR_V2'],
  },
};

export function createPhaseFourProgressPaths(): OpenAPIV3.PathsObject {
  const todoExample = {
    id: '507f1f77bcf86cd799439044',
    activityId: '507f1f77bcf86cd799439044',
    activityType: 'ASSIGNMENT',
    title: 'Thiết kế REST endpoint',
    classroom: { id: '507f1f77bcf86cd799439021', name: 'Backend 01' },
    course: { id: '507f1f77bcf86cd799439041', title: 'Backend Fundamentals' },
    completionDeadline: '2026-08-10T16:59:59.000Z',
    defaultDeadline: '2026-08-09T16:59:59.000Z',
    effectiveDeadline: '2026-08-10T16:59:59.000Z',
    hasDeadlineException: true,
    progress: { ...progressExample, status: null, completedAt: null, derivedStatus: 'NOT_STARTED' },
    actionUrl: '/student/assignments/507f1f77bcf86cd799439044',
  };
  return {
    '/api/v1/classrooms/{classroomId}/classwork': {
      get: {
        tags: ['Learning Progress'],
        operationId: 'getStudentClasswork',
        summary: 'Get published Lesson, Quiz and Assignment Classwork for an active enrollment',
        security,
        parameters: [classroomId],
        responses: {
          '200': ok('Published Classwork tree', {
            success: true,
            data: {
              classroom: { id: '507f1f77bcf86cd799439021', name: 'Backend 01' },
              courses: [],
              descriptorVersion: 'P05_ACTIVITY_DESCRIPTOR_V2',
              asOf: '2026-07-20T08:00:00.000Z',
            },
          }),
          ...protectedErrors,
        },
      },
    },
    '/api/v1/lessons/{lessonId}/start': {
      post: {
        tags: ['Learning Progress'],
        operationId: 'startLesson',
        summary: 'Idempotently start a visible Lesson for the current Student',
        security,
        parameters: [lessonId],
        responses: {
          '200': ok('Lesson was already started', {
            success: true,
            data: { progress: { ...progressExample, status: 'IN_PROGRESS' }, newlyStarted: false },
          }),
          '201': ok('Lesson started', {
            success: true,
            data: { progress: { ...progressExample, status: 'IN_PROGRESS' }, newlyStarted: true },
          }),
          ...protectedErrors,
          '409': error('Lesson is no longer completable', 'CONTENT_STATE_CONFLICT'),
        },
      },
    },
    '/api/v1/lessons/{lessonId}/complete': {
      post: {
        tags: ['Learning Progress'],
        operationId: 'completeLesson',
        summary: 'Idempotently complete a visible Lesson for the current Student',
        security,
        parameters: [lessonId],
        responses: {
          '200': ok('Lesson was already completed', {
            success: true,
            data: { progress: progressExample, newlyCompleted: false },
          }),
          '201': ok('Lesson completed', {
            success: true,
            data: { progress: progressExample, newlyCompleted: true },
          }),
          ...protectedErrors,
          '409': error('Lesson is no longer completable', 'CONTENT_STATE_CONFLICT'),
        },
      },
    },
    '/api/v1/students/me/todo': {
      get: {
        tags: ['Learning Progress'],
        operationId: 'listStudentTodo',
        summary: 'List required incomplete learning activities with effective deadlines',
        security,
        parameters: [
          page,
          limit,
          {
            name: 'scope',
            in: 'query',
            schema: { type: 'string', enum: ['ALL', 'OVERDUE', 'UPCOMING'], default: 'ALL' },
          },
          { name: 'classroomId', in: 'query', schema: { type: 'string', pattern: objectIdPattern } },
        ],
        responses: {
          '200': ok('Student To-do list', {
            success: true,
            data: {
              items: [todoExample],
              scopeVersion: 'P05_MIXED_ACTIVITY_TODO_V2',
              descriptorVersion: 'P05_ACTIVITY_DESCRIPTOR_V2',
              asOf: '2026-07-20T08:00:00.000Z',
            },
            meta: { page: 1, limit: 20, totalItems: 1, totalPages: 1 },
          }),
          ...protectedErrors,
        },
      },
    },
    '/api/v1/students/me/deadlines': {
      get: {
        tags: ['Learning Progress'],
        operationId: 'listStudentDeadlines',
        summary: 'List visible Lesson, Quiz and Assignment deadlines in a bounded range',
        security,
        parameters: [
          page,
          limit,
          { name: 'classroomId', in: 'query', schema: { type: 'string', pattern: objectIdPattern } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: {
          '200': ok('Student deadline list', {
            success: true,
            data: {
              items: [todoExample],
              descriptorVersion: 'P05_ACTIVITY_DESCRIPTOR_V2',
              asOf: '2026-07-20T08:00:00.000Z',
            },
            meta: { page: 1, limit: 20, totalItems: 1, totalPages: 1 },
          }),
          ...protectedErrors,
        },
      },
    },
  };
}
