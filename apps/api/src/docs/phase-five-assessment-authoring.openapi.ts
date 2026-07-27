import type { OpenAPIV3 } from 'openapi-types';

type Schema = OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject;
const security: OpenAPIV3.SecurityRequirementObject[] = [{ bearerAuth: [] }];
const json = (schema: Schema, example?: unknown) => ({ 'application/json': { schema, ...(example === undefined ? {} : { example }) } });
const ok = (schema: Schema, description = 'Operation completed'): OpenAPIV3.ResponseObject => ({ description, content: json(schema) });
const error = (description: string): OpenAPIV3.ResponseObject => ({ description, content: json({ $ref: '#/components/schemas/ErrorResponse' }) });
const protectedErrors = { '401': error('Authentication required'), '403': error('Permission or ownership denied'), '404': error('Resource not found'), '409': error('Concurrent modification or lifecycle conflict'), '422': error('Validation failed'), '429': error('Rate limit exceeded') };
const request = (schema: Schema, example: unknown): OpenAPIV3.RequestBodyObject => ({ required: true, content: json(schema, example) });
const idParameter = (name: 'courseId' | 'quizId' | 'questionId'): OpenAPIV3.ParameterObject => ({ name, in: 'path', required: true, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } });

export const PHASE_FIVE_ASSESSMENT_AUTHORING_OPENAPI_OPERATIONS = [
  'listTeacherCourseQuizzes', 'createQuiz', 'getTeacherQuiz', 'updateQuiz', 'changeQuizStatus', 'previewQuiz',
  'listQuizQuestions', 'createQuizQuestion', 'updateQuizQuestion', 'archiveQuizQuestion', 'reorderQuizQuestions',
  'setQuestionMedia', 'removeQuestionMedia',
] as const;

export const phaseFiveAssessmentAuthoringTags: OpenAPIV3.TagObject[] = [
  { name: 'Quizzes', description: 'Teacher Quiz authoring, lifecycle and Student-safe preview' },
  { name: 'Quiz Questions', description: 'Revisioned four-type Question authoring and exact ordering' },
];

const nullableTimestamp: OpenAPIV3.SchemaObject = { type: 'string', format: 'date-time', nullable: true };
const revision = { type: 'integer', minimum: 0 } as const;

export const phaseFiveAssessmentAuthoringSchemas: Record<string, Schema> = {
  QuizStatus: { type: 'string', enum: ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'] },
  QuestionType: { type: 'string', enum: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER'] },
  Quiz: {
    type: 'object', additionalProperties: false,
    required: ['id', 'classroomId', 'courseId', 'title', 'instruction', 'status', 'dueDate', 'contentRevision', 'questionRevision', 'maxScore'],
    properties: {
      id: { type: 'string' }, classroomId: { type: 'string' }, courseId: { type: 'string' }, moduleId: { type: 'string', nullable: true },
      title: { type: 'string' }, instruction: { type: 'string' }, isRequired: { type: 'boolean' }, status: { $ref: '#/components/schemas/QuizStatus' }, effectiveStatus: { $ref: '#/components/schemas/QuizStatus' },
      availableFrom: nullableTimestamp, dueDate: { type: 'string', format: 'date-time' }, attemptLimit: { type: 'integer' }, timeLimitMinutes: { type: 'integer', nullable: true },
      resultReleasePolicy: { type: 'string', enum: ['IMMEDIATE', 'AFTER_REVIEW', 'TEACHER_RETURN'] }, scorePolicy: { type: 'string', enum: ['HIGHEST'] },
      displayOrder: { type: 'integer' }, contentRevision: { type: 'integer', minimum: 1 }, questionRevision: revision, publishedRevision: { type: 'integer', nullable: true }, maxScore: revision,
      scheduledPublishAt: nullableTimestamp, publishedAt: nullableTimestamp, unpublishedAt: nullableTimestamp, archivedAt: nullableTimestamp,
      createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' }, allowedActions: { type: 'array', items: { type: 'string' } },
    },
  },
  QuestionOption: { type: 'object', additionalProperties: false, required: ['id', 'label', 'displayOrder'], properties: { id: { type: 'string' }, label: { type: 'string' }, displayOrder: { type: 'integer' } } },
  QuestionMedia: { type: 'object', nullable: true, additionalProperties: false, required: ['kind', 'url'], properties: { kind: { type: 'string', enum: ['IMAGE_URL', 'VIDEO_URL'] }, url: { type: 'string', format: 'uri' }, provider: { type: 'string', nullable: true }, caption: { type: 'string', nullable: true }, altText: { type: 'string', nullable: true } } },
  TeacherQuestion: {
    type: 'object', additionalProperties: false, required: ['id', 'quizId', 'type', 'prompt', 'points', 'options', 'correctOptionIds', 'displayOrder', 'version', 'status'],
    properties: { id: { type: 'string' }, quizId: { type: 'string' }, type: { $ref: '#/components/schemas/QuestionType' }, prompt: { type: 'string' }, points: { type: 'integer' }, isRequired: { type: 'boolean' }, options: { type: 'array', items: { $ref: '#/components/schemas/QuestionOption' } }, correctOptionIds: { type: 'array', items: { type: 'string' } }, correctBoolean: { type: 'boolean', nullable: true }, rubric: { type: 'string', nullable: true }, explanation: { type: 'string', nullable: true }, media: { $ref: '#/components/schemas/QuestionMedia' }, displayOrder: { type: 'integer' }, version: { type: 'integer' }, status: { type: 'string', enum: ['ACTIVE', 'ARCHIVED'] }, createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' }, allowedActions: { type: 'array', items: { type: 'string' } } },
  },
  StudentPreviewQuestion: {
    type: 'object', additionalProperties: false, required: ['id', 'type', 'prompt', 'points', 'options', 'displayOrder'],
    properties: { id: { type: 'string' }, type: { $ref: '#/components/schemas/QuestionType' }, prompt: { type: 'string' }, points: { type: 'integer' }, isRequired: { type: 'boolean' }, options: { type: 'array', items: { $ref: '#/components/schemas/QuestionOption' } }, media: { $ref: '#/components/schemas/QuestionMedia' }, displayOrder: { type: 'integer' } },
  },
  CreateQuizRequest: { type: 'object', additionalProperties: false, required: ['title', 'instruction', 'dueDate'], properties: { moduleId: { type: 'string', nullable: true }, title: { type: 'string', minLength: 2, maxLength: 150 }, instruction: { type: 'string', minLength: 1, maxLength: 100000 }, isRequired: { type: 'boolean' }, availableFrom: nullableTimestamp, dueDate: { type: 'string', format: 'date-time' }, attemptLimit: { type: 'integer', minimum: 1, maximum: 10 }, timeLimitMinutes: { type: 'integer', minimum: 1, maximum: 180, nullable: true }, resultReleasePolicy: { type: 'string', enum: ['IMMEDIATE', 'AFTER_REVIEW', 'TEACHER_RETURN'] }, scorePolicy: { type: 'string', enum: ['HIGHEST'] } } },
  UpdateQuizRequest: { type: 'object', additionalProperties: false, required: ['expectedContentRevision'], properties: { title: { type: 'string' }, instruction: { type: 'string' }, dueDate: { type: 'string', format: 'date-time' }, expectedContentRevision: { type: 'integer', minimum: 1 } } },
  ChangeQuizStatusRequest: { type: 'object', additionalProperties: false, required: ['status', 'reason', 'expectedContentRevision', 'expectedQuestionRevision'], properties: { status: { $ref: '#/components/schemas/QuizStatus' }, scheduledPublishAt: nullableTimestamp, reason: { type: 'string', minLength: 5 }, expectedContentRevision: { type: 'integer', minimum: 1 }, expectedQuestionRevision: revision } },
  CreateQuestionRequest: { oneOf: [
    { type: 'object', additionalProperties: false, required: ['type', 'prompt', 'points', 'options', 'correctOptionIndexes', 'expectedQuestionRevision'], properties: { type: { type: 'string', enum: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE'] }, prompt: { type: 'string' }, points: { type: 'integer', minimum: 1, maximum: 100 }, isRequired: { type: 'boolean' }, options: { type: 'array', minItems: 2, maxItems: 10, items: { type: 'object', required: ['label'], properties: { label: { type: 'string' } } } }, correctOptionIndexes: { type: 'array', minItems: 1, items: { type: 'integer', minimum: 0 } }, expectedQuestionRevision: revision } },
    { type: 'object', additionalProperties: false, required: ['type', 'prompt', 'points', 'correctBoolean', 'expectedQuestionRevision'], properties: { type: { type: 'string', enum: ['TRUE_FALSE'] }, prompt: { type: 'string' }, points: { type: 'integer' }, correctBoolean: { type: 'boolean' }, expectedQuestionRevision: revision } },
    { type: 'object', additionalProperties: false, required: ['type', 'prompt', 'points', 'expectedQuestionRevision'], properties: { type: { type: 'string', enum: ['SHORT_ANSWER'] }, prompt: { type: 'string' }, points: { type: 'integer' }, rubric: { type: 'string', nullable: true }, expectedQuestionRevision: revision } },
  ] },
  UpdateQuestionRequest: { type: 'object', additionalProperties: false, required: ['expectedQuestionRevision'], properties: { prompt: { type: 'string' }, points: { type: 'integer' }, isRequired: { type: 'boolean' }, options: { type: 'array', items: { $ref: '#/components/schemas/QuestionOption' } }, correctOptionIds: { type: 'array', items: { type: 'string' } }, correctBoolean: { type: 'boolean' }, rubric: { type: 'string', nullable: true }, explanation: { type: 'string', nullable: true }, expectedQuestionRevision: revision } },
  QuizMutationResponse: { type: 'object', required: ['success', 'data'], properties: { success: { type: 'boolean', enum: [true] }, data: { type: 'object', required: ['quiz', 'auditId'], properties: { quiz: { $ref: '#/components/schemas/Quiz' }, auditId: { type: 'string' } } } } },
  QuestionMutationResponse: { type: 'object', required: ['success', 'data'], properties: { success: { type: 'boolean', enum: [true] }, data: { type: 'object', required: ['question', 'questionRevision', 'maxScore', 'auditId'], properties: { question: { $ref: '#/components/schemas/TeacherQuestion' }, questionRevision: revision, maxScore: revision, auditId: { type: 'string' } } } } },
  AssessmentReadResponse: { type: 'object', required: ['success', 'data'], properties: { success: { type: 'boolean', enum: [true] }, data: { type: 'object', additionalProperties: true }, meta: { type: 'object', additionalProperties: true } } },
};

export function createPhaseFiveAssessmentAuthoringPaths(): OpenAPIV3.PathsObject {
  const quizResponse = { $ref: '#/components/schemas/QuizMutationResponse' };
  const readResponse = { $ref: '#/components/schemas/AssessmentReadResponse' };
  const questionResponse = { $ref: '#/components/schemas/QuestionMutationResponse' };
  const createQuizExample = { moduleId: null, title: 'REST API Fundamentals Quiz', instruction: 'Chọn đáp án đúng.', isRequired: true, availableFrom: null, dueDate: '2026-08-08T16:59:59.000Z', attemptLimit: 2, timeLimitMinutes: 15, resultReleasePolicy: 'AFTER_REVIEW', scorePolicy: 'HIGHEST' };
  return {
    '/api/v1/teacher/courses/{courseId}/quizzes': {
      parameters: [idParameter('courseId')],
      get: { tags: ['Quizzes'], summary: 'List owned Course Quizzes', operationId: 'listTeacherCourseQuizzes', security, responses: { '200': ok(readResponse), ...protectedErrors } },
      post: { tags: ['Quizzes'], summary: 'Create a draft Quiz', operationId: 'createQuiz', security, requestBody: request({ $ref: '#/components/schemas/CreateQuizRequest' }, createQuizExample), responses: { '201': ok(quizResponse), ...protectedErrors } },
    },
    '/api/v1/teacher/quizzes/{quizId}': {
      parameters: [idParameter('quizId')],
      get: { tags: ['Quizzes'], summary: 'Get owned Quiz authoring detail', operationId: 'getTeacherQuiz', security, responses: { '200': ok(readResponse), ...protectedErrors } },
      patch: { tags: ['Quizzes'], summary: 'Update an editable Quiz', operationId: 'updateQuiz', security, requestBody: request({ $ref: '#/components/schemas/UpdateQuizRequest' }, { title: 'REST API Quiz - Updated', expectedContentRevision: 1 }), responses: { '200': ok(quizResponse), ...protectedErrors } },
    },
    '/api/v1/teacher/quizzes/{quizId}/status': { parameters: [idParameter('quizId')], patch: { tags: ['Quizzes'], summary: 'Change Quiz lifecycle status', operationId: 'changeQuizStatus', security, requestBody: request({ $ref: '#/components/schemas/ChangeQuizStatusRequest' }, { status: 'PUBLISHED', scheduledPublishAt: null, reason: 'Quiz is ready for class', expectedContentRevision: 2, expectedQuestionRevision: 4 }), responses: { '200': ok(quizResponse), ...protectedErrors } } },
    '/api/v1/teacher/quizzes/{quizId}/preview': { parameters: [idParameter('quizId')], post: { tags: ['Quizzes'], summary: 'Preview Student-safe Quiz projection', operationId: 'previewQuiz', security, requestBody: request({ type: 'object', additionalProperties: false }, {}), responses: { '200': ok(readResponse), ...protectedErrors } } },
    '/api/v1/teacher/quizzes/{quizId}/questions': {
      parameters: [idParameter('quizId')],
      get: { tags: ['Quiz Questions'], summary: 'List active Quiz Questions', operationId: 'listQuizQuestions', security, responses: { '200': ok(readResponse), ...protectedErrors } },
      post: { tags: ['Quiz Questions'], summary: 'Create a revisioned Question', operationId: 'createQuizQuestion', security, requestBody: request({ $ref: '#/components/schemas/CreateQuestionRequest' }, { type: 'SINGLE_CHOICE', prompt: 'Method nào tạo resource?', points: 2, isRequired: true, options: [{ label: 'GET' }, { label: 'POST' }], correctOptionIndexes: [1], expectedQuestionRevision: 0 }), responses: { '201': ok(questionResponse), ...protectedErrors } },
    },
    '/api/v1/teacher/questions/{questionId}': {
      parameters: [idParameter('questionId')],
      patch: { tags: ['Quiz Questions'], summary: 'Update an active Question', operationId: 'updateQuizQuestion', security, requestBody: request({ $ref: '#/components/schemas/UpdateQuestionRequest' }, { prompt: 'HTTP method nào tạo resource?', expectedQuestionRevision: 1 }), responses: { '200': ok(questionResponse), ...protectedErrors } },
      delete: { tags: ['Quiz Questions'], summary: 'Archive a Question', operationId: 'archiveQuizQuestion', security, requestBody: request({ type: 'object', required: ['reason', 'expectedQuestionRevision'], properties: { reason: { type: 'string' }, expectedQuestionRevision: revision } }, { reason: 'Question is no longer used', expectedQuestionRevision: 4 }), responses: { '200': ok(questionResponse), ...protectedErrors } },
    },
    '/api/v1/teacher/quizzes/{quizId}/questions/reorder': { parameters: [idParameter('quizId')], patch: { tags: ['Quiz Questions'], summary: 'Atomically reorder the exact active Question set', operationId: 'reorderQuizQuestions', security, requestBody: request({ type: 'object', required: ['orderedQuestionIds', 'expectedQuestionRevision'], properties: { orderedQuestionIds: { type: 'array', items: { type: 'string' } }, expectedQuestionRevision: revision } }, { orderedQuestionIds: ['507f1f77bcf86cd799439051'], expectedQuestionRevision: 2 }), responses: { '200': ok(readResponse), ...protectedErrors } } },
    '/api/v1/teacher/questions/{questionId}/media': {
      parameters: [idParameter('questionId')],
      put: { tags: ['Quiz Questions'], summary: 'Set approved URL media when enabled', operationId: 'setQuestionMedia', security, requestBody: request({ type: 'object', required: ['kind', 'url', 'expectedQuestionRevision'], properties: { kind: { type: 'string', enum: ['IMAGE_URL', 'VIDEO_URL'] }, url: { type: 'string', format: 'uri' }, caption: { type: 'string', nullable: true }, altText: { type: 'string', nullable: true }, expectedQuestionRevision: revision } }, { kind: 'IMAGE_URL', url: 'https://media.example.edu/http.png', caption: 'HTTP response', altText: 'HTTP 201 response', expectedQuestionRevision: 3 }), responses: { '200': ok(questionResponse), ...protectedErrors } },
      delete: { tags: ['Quiz Questions'], summary: 'Remove Question media', operationId: 'removeQuestionMedia', security, requestBody: request({ type: 'object', required: ['expectedQuestionRevision'], properties: { expectedQuestionRevision: revision } }, { expectedQuestionRevision: 4 }), responses: { '200': ok(questionResponse), ...protectedErrors } },
    },
  };
}
