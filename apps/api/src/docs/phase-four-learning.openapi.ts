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
          requestId: '019d0000-0000-7000-8000-000000000044',
          timestamp: '2026-07-20T08:00:00.000Z',
          path: '/api/v1/lessons/507f1f77bcf86cd799439044',
        },
      },
    ),
  };
}

function body(schema: string, example: unknown): OpenAPIV3.RequestBodyObject {
  return {
    required: true,
    content: content({ $ref: `#/components/schemas/${schema}` }, example),
  };
}

const unauthorized = error('Authentication is required', 'AUTHENTICATION_REQUIRED');
const forbidden = error('Access is denied', 'ACCESS_DENIED');
const notFound = error('Resource was not found', 'RESOURCE_NOT_FOUND');
const validation = error('Request data is invalid', 'VALIDATION_ERROR');
const conflict = error(
  'Resource state or revision conflicts with this request',
  'CONCURRENT_MODIFICATION',
);
const protectedErrors = {
  '401': unauthorized,
  '403': forbidden,
  '404': notFound,
  '422': validation,
};
const mutationErrors = { ...protectedErrors, '409': conflict };

const courseId: OpenAPIV3.ParameterObject = {
  name: 'courseId',
  in: 'path',
  required: true,
  schema: { type: 'string', pattern: objectIdPattern },
};
const lessonId: OpenAPIV3.ParameterObject = {
  name: 'lessonId',
  in: 'path',
  required: true,
  schema: { type: 'string', pattern: objectIdPattern },
};
const flashcardId: OpenAPIV3.ParameterObject = {
  name: 'flashcardId',
  in: 'path',
  required: true,
  schema: { type: 'string', pattern: objectIdPattern },
};

const lessonExample = {
  id: '507f1f77bcf86cd799439044',
  courseId: '507f1f77bcf86cd799439041',
  moduleId: '507f1f77bcf86cd799439042',
  title: 'REST Resource Naming',
  content: '## Muc tieu\n\nDat ten resource bang danh tu.',
  contentFormat: 'MARKDOWN',
  estimatedMinutes: 8,
  isRequired: true,
  status: 'DRAFT',
  completionDeadline: '2026-08-10T16:59:59.000Z',
  deadlineRevision: 1,
  displayOrder: 0,
  contentRevision: 1,
  flashcardRevision: 0,
  updatedAt: '2026-07-20T08:00:00.000Z',
};
const flashcardExample = {
  id: '507f1f77bcf86cd799439045',
  lessonId: lessonExample.id,
  frontText: 'HTTP 201 dung khi nao?',
  backText: 'Khi tao resource thanh cong.',
  displayOrder: 0,
  status: 'ACTIVE',
  updatedAt: '2026-07-20T08:05:00.000Z',
};

export const PHASE_FOUR_LEARNING_OPENAPI_OPERATIONS = [
  'listCourseLessons',
  'createLesson',
  'getLesson',
  'updateLesson',
  'changeLessonStatus',
  'archiveLesson',
  'previewLesson',
  'reorderCourseLessons',
  'listLessonFlashcards',
  'createLessonFlashcard',
  'updateFlashcard',
  'archiveFlashcard',
  'reorderLessonFlashcards',
  'changeLessonDeadline',
  'listLessonDeadlineHistory',
] as const;

export const phaseFourLearningTags: OpenAPIV3.TagObject[] = [
  { name: 'Lessons', description: 'Lesson authoring, lifecycle, preview and atomic ordering' },
  { name: 'Flashcards', description: 'Lesson Flashcard authoring and revision-safe ordering' },
  { name: 'Deadlines', description: 'Lesson deadline revision and immutable history' },
];

export const phaseFourLearningSchemas: Record<string, Schema> = {
  Lesson: {
    type: 'object',
    additionalProperties: true,
    required: [
      'id',
      'courseId',
      'title',
      'contentFormat',
      'estimatedMinutes',
      'isRequired',
      'displayOrder',
    ],
    properties: {
      id: { type: 'string', pattern: objectIdPattern },
      courseId: { type: 'string', pattern: objectIdPattern },
      moduleId: { type: 'string', pattern: objectIdPattern, nullable: true },
      title: { type: 'string', minLength: 2, maxLength: 150 },
      content: { type: 'string', minLength: 1, maxLength: 500_000 },
      contentHtml: { type: 'string', description: 'Sanitized HTML in Student/preview projection' },
      contentFormat: { type: 'string', enum: ['MARKDOWN'] },
      estimatedMinutes: { type: 'integer', minimum: 1, maximum: 60 },
      isRequired: { type: 'boolean' },
      completionDeadline: { type: 'string', format: 'date-time', nullable: true },
      displayOrder: { type: 'integer', minimum: 0 },
    },
  },
  CreateLessonRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['courseId', 'title', 'content', 'estimatedMinutes'],
    properties: {
      courseId: { type: 'string', pattern: objectIdPattern },
      moduleId: { type: 'string', pattern: objectIdPattern, nullable: true },
      title: { type: 'string', minLength: 2, maxLength: 150 },
      content: { type: 'string', minLength: 1, maxLength: 500_000 },
      contentFormat: { type: 'string', enum: ['MARKDOWN'], default: 'MARKDOWN' },
      estimatedMinutes: { type: 'integer', minimum: 1, maximum: 60 },
      isRequired: { type: 'boolean', default: true },
      completionDeadline: { type: 'string', format: 'date-time', nullable: true },
    },
  },
  UpdateLessonRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['expectedUpdatedAt'],
    properties: {
      title: { type: 'string', minLength: 2, maxLength: 150 },
      content: { type: 'string', minLength: 1, maxLength: 500_000 },
      estimatedMinutes: { type: 'integer', minimum: 1, maximum: 60 },
      isRequired: { type: 'boolean' },
      expectedUpdatedAt: { type: 'string', format: 'date-time' },
    },
  },
  ChangeLessonStatusRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['targetStatus', 'expectedUpdatedAt'],
    properties: {
      targetStatus: { type: 'string', enum: ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'UNPUBLISHED'] },
      scheduledPublishAt: { type: 'string', format: 'date-time', nullable: true },
      expectedUpdatedAt: { type: 'string', format: 'date-time' },
    },
  },
  ReorderLessonsRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['containers', 'expectedStructureRevision'],
    properties: {
      containers: {
        type: 'array',
        minItems: 1,
        maxItems: 501,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['moduleId', 'orderedLessonIds'],
          properties: {
            moduleId: { type: 'string', pattern: objectIdPattern, nullable: true },
            orderedLessonIds: {
              type: 'array',
              maxItems: 500,
              items: { type: 'string', pattern: objectIdPattern },
            },
          },
        },
      },
      expectedStructureRevision: { type: 'integer', minimum: 0 },
    },
  },
  Flashcard: {
    type: 'object',
    additionalProperties: true,
    required: ['id', 'lessonId', 'displayOrder'],
    properties: {
      id: { type: 'string', pattern: objectIdPattern },
      lessonId: { type: 'string', pattern: objectIdPattern },
      frontText: { type: 'string', maxLength: 2_000 },
      backText: { type: 'string', maxLength: 5_000 },
      frontHtml: { type: 'string' },
      backHtml: { type: 'string' },
      displayOrder: { type: 'integer', minimum: 0 },
    },
  },
  CreateFlashcardRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['frontText', 'backText'],
    properties: {
      frontText: { type: 'string', minLength: 1, maxLength: 2_000 },
      backText: { type: 'string', minLength: 1, maxLength: 5_000 },
    },
  },
  UpdateFlashcardRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['expectedUpdatedAt'],
    properties: {
      frontText: { type: 'string', minLength: 1, maxLength: 2_000 },
      backText: { type: 'string', minLength: 1, maxLength: 5_000 },
      expectedUpdatedAt: { type: 'string', format: 'date-time' },
    },
  },
  ReorderFlashcardsRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['orderedFlashcardIds', 'expectedFlashcardRevision'],
    properties: {
      orderedFlashcardIds: {
        type: 'array',
        minItems: 1,
        maxItems: 500,
        items: { type: 'string', pattern: objectIdPattern },
      },
      expectedFlashcardRevision: { type: 'integer', minimum: 0 },
    },
  },
  ChangeLessonDeadlineRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['completionDeadline', 'expectedDeadlineRevision'],
    properties: {
      completionDeadline: { type: 'string', format: 'date-time', nullable: true },
      reason: { type: 'string', minLength: 10, maxLength: 500 },
      expectedDeadlineRevision: { type: 'integer', minimum: 0 },
    },
  },
};

export function createPhaseFourLearningPaths(): OpenAPIV3.PathsObject {
  const lessonMutation = {
    success: true,
    data: { lesson: lessonExample, auditId: '507f1f77bcf86cd799439050' },
  };
  const flashcardMutation = {
    success: true,
    data: {
      flashcard: flashcardExample,
      flashcardRevision: 1,
      auditId: '507f1f77bcf86cd799439050',
    },
  };
  return {
    '/api/v1/courses/{courseId}/lessons': {
      get: {
        tags: ['Lessons'],
        operationId: 'listCourseLessons',
        summary: 'List role-projected Lessons',
        security,
        parameters: [courseId],
        responses: {
          '200': ok('Lesson list', { success: true, data: { items: [lessonExample] } }),
          ...protectedErrors,
        },
      },
    },
    '/api/v1/lessons': {
      post: {
        tags: ['Lessons'],
        operationId: 'createLesson',
        summary: 'Create a draft Lesson',
        security,
        requestBody: body('CreateLessonRequest', lessonExample),
        responses: { '201': ok('Lesson created', lessonMutation), ...mutationErrors },
      },
    },
    '/api/v1/lessons/{lessonId}': {
      get: {
        tags: ['Lessons'],
        operationId: 'getLesson',
        summary: 'Get Teacher detail or Student-safe Lesson',
        security,
        parameters: [lessonId],
        responses: {
          '200': ok('Lesson detail', { success: true, data: { lesson: lessonExample } }),
          ...protectedErrors,
        },
      },
      patch: {
        tags: ['Lessons'],
        operationId: 'updateLesson',
        summary: 'Update editable Lesson content with CAS',
        security,
        parameters: [lessonId],
        requestBody: body('UpdateLessonRequest', {
          title: 'Updated Lesson',
          expectedUpdatedAt: lessonExample.updatedAt,
        }),
        responses: { '200': ok('Lesson updated', lessonMutation), ...mutationErrors },
      },
      delete: {
        tags: ['Lessons'],
        operationId: 'archiveLesson',
        summary: 'Soft archive a Lesson',
        security,
        parameters: [lessonId],
        requestBody: body('ArchiveContentRequest', {
          reason: 'Lesson replaced by a newer version',
          expectedUpdatedAt: lessonExample.updatedAt,
        }),
        responses: { '204': { description: 'Lesson archived' }, ...mutationErrors },
      },
    },
    '/api/v1/lessons/{lessonId}/status': {
      patch: {
        tags: ['Lessons'],
        operationId: 'changeLessonStatus',
        summary: 'Schedule, publish or unpublish a Lesson',
        security,
        parameters: [lessonId],
        requestBody: body('ChangeLessonStatusRequest', {
          targetStatus: 'PUBLISHED',
          expectedUpdatedAt: lessonExample.updatedAt,
        }),
        responses: { '200': ok('Lesson lifecycle changed', lessonMutation), ...mutationErrors },
      },
    },
    '/api/v1/lessons/{lessonId}/preview': {
      post: {
        tags: ['Lessons'],
        operationId: 'previewLesson',
        summary: 'Render a sanitized Student-like preview',
        security,
        parameters: [lessonId],
        responses: {
          '200': ok('Sanitized preview', {
            success: true,
            data: {
              lesson: { ...lessonExample, content: undefined, contentHtml: '<h2>Muc tieu</h2>' },
            },
          }),
          ...protectedErrors,
        },
      },
    },
    '/api/v1/courses/{courseId}/lessons/reorder': {
      patch: {
        tags: ['Lessons'],
        operationId: 'reorderCourseLessons',
        summary: 'Atomically move and reorder the exact active Lesson set',
        security,
        parameters: [courseId],
        requestBody: body('ReorderLessonsRequest', {
          containers: [{ moduleId: lessonExample.moduleId, orderedLessonIds: [lessonExample.id] }],
          expectedStructureRevision: 2,
        }),
        responses: {
          '200': ok('Lessons reordered', {
            success: true,
            data: { items: [lessonExample], structureRevision: 3 },
          }),
          ...mutationErrors,
        },
      },
    },
    '/api/v1/lessons/{lessonId}/flashcards': {
      get: {
        tags: ['Flashcards'],
        operationId: 'listLessonFlashcards',
        summary: 'List role-projected active Flashcards',
        security,
        parameters: [lessonId],
        responses: {
          '200': ok('Flashcard list', { success: true, data: { items: [flashcardExample] } }),
          ...protectedErrors,
        },
      },
      post: {
        tags: ['Flashcards'],
        operationId: 'createLessonFlashcard',
        summary: 'Create a Flashcard for an editable Lesson',
        security,
        parameters: [lessonId],
        requestBody: body('CreateFlashcardRequest', {
          frontText: flashcardExample.frontText,
          backText: flashcardExample.backText,
        }),
        responses: { '201': ok('Flashcard created', flashcardMutation), ...mutationErrors },
      },
    },
    '/api/v1/flashcards/{flashcardId}': {
      patch: {
        tags: ['Flashcards'],
        operationId: 'updateFlashcard',
        summary: 'Update Flashcard content with CAS',
        security,
        parameters: [flashcardId],
        requestBody: body('UpdateFlashcardRequest', {
          frontText: 'Updated question',
          expectedUpdatedAt: flashcardExample.updatedAt,
        }),
        responses: { '200': ok('Flashcard updated', flashcardMutation), ...mutationErrors },
      },
      delete: {
        tags: ['Flashcards'],
        operationId: 'archiveFlashcard',
        summary: 'Soft archive a Flashcard',
        security,
        parameters: [flashcardId],
        requestBody: body('ArchiveContentRequest', {
          expectedUpdatedAt: flashcardExample.updatedAt,
        }),
        responses: { '204': { description: 'Flashcard archived' }, ...mutationErrors },
      },
    },
    '/api/v1/lessons/{lessonId}/flashcards/reorder': {
      patch: {
        tags: ['Flashcards'],
        operationId: 'reorderLessonFlashcards',
        summary: 'Atomically reorder the exact active Flashcard set',
        security,
        parameters: [lessonId],
        requestBody: body('ReorderFlashcardsRequest', {
          orderedFlashcardIds: [flashcardExample.id],
          expectedFlashcardRevision: 1,
        }),
        responses: {
          '200': ok('Flashcards reordered', {
            success: true,
            data: { items: [flashcardExample], flashcardRevision: 2 },
          }),
          ...mutationErrors,
        },
      },
    },
    '/api/v1/teacher/lessons/{lessonId}/deadline': {
      patch: {
        tags: ['Deadlines'],
        operationId: 'changeLessonDeadline',
        summary: 'Set, extend, shorten or clear a Lesson deadline by policy',
        security,
        parameters: [lessonId],
        requestBody: body('ChangeLessonDeadlineRequest', {
          completionDeadline: '2026-08-12T16:59:59.000Z',
          reason: 'Extended for the classroom schedule',
          expectedDeadlineRevision: 1,
        }),
        responses: {
          '200': ok('Deadline changed', {
            success: true,
            data: {
              lessonId: lessonExample.id,
              completionDeadline: '2026-08-12T16:59:59.000Z',
              deadlineRevision: 2,
            },
          }),
          ...mutationErrors,
        },
      },
    },
    '/api/v1/teacher/lessons/{lessonId}/deadline-history': {
      get: {
        tags: ['Deadlines'],
        operationId: 'listLessonDeadlineHistory',
        summary: 'List immutable deadline history',
        security,
        parameters: [
          lessonId,
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
        ],
        responses: {
          '200': ok('Deadline history', {
            success: true,
            data: { items: [] },
            meta: { page: 1, limit: 20, totalItems: 0 },
          }),
          ...protectedErrors,
        },
      },
    },
  };
}
