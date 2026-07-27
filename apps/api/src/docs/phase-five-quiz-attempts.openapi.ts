import type { OpenAPIV3 } from 'openapi-types';

type Schema = OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject;
const security: OpenAPIV3.SecurityRequirementObject[] = [{ bearerAuth: [] }];
const content = (schema: Schema, example?: unknown) => ({
  'application/json': { schema, ...(example === undefined ? {} : { example }) },
});
const response = (description: string, schema: Schema): OpenAPIV3.ResponseObject => ({
  description,
  content: content(schema),
});
const error = (description: string): OpenAPIV3.ResponseObject =>
  response(description, { $ref: '#/components/schemas/ErrorResponse' });
const errors = {
  '401': error('Authentication required'),
  '403': error('Permission denied'),
  '404': error('Quiz or Attempt not found'),
  '409': error('Attempt lifecycle or revision conflict'),
  '422': error('Invalid answer payload'),
  '429': error('Rate limit exceeded'),
};
const body = (schema: Schema, example: unknown): OpenAPIV3.RequestBodyObject => ({
  required: true,
  content: content(schema, example),
});
const id = (name: 'quizId' | 'attemptId'): OpenAPIV3.ParameterObject => ({
  name,
  in: 'path',
  required: true,
  schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
});
const read = { $ref: '#/components/schemas/AssessmentReadResponse' } as const;

export const PHASE_FIVE_QUIZ_ATTEMPT_OPENAPI_OPERATIONS = [
  'getStudentQuizIntro',
  'startQuizAttempt',
  'getOwnQuizAttempt',
  'saveQuizAnswers',
  'submitQuizAttempt',
  'listOwnQuizAttempts',
  'getOwnQuizResult',
] as const;

export const phaseFiveQuizAttemptTags: OpenAPIV3.TagObject[] = [
  {
    name: 'Quiz Attempts',
    description: 'Student-safe Quiz eligibility, player, scoring state and own result',
  },
];

export const phaseFiveQuizAttemptSchemas: Record<string, Schema> = {
  AttemptStatus: {
    type: 'string',
    enum: [
      'IN_PROGRESS',
      'SUBMITTED',
      'TIMED_OUT',
      'NEEDS_REVIEW',
      'GRADED',
      'RESULT_RELEASED',
    ],
  },
  SaveQuizAnswersRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['answers', 'expectedAttemptRevision'],
    properties: {
      answers: {
        type: 'array',
        minItems: 1,
        maxItems: 100,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['questionId'],
          properties: {
            questionId: { type: 'string' },
            selectedOptionIds: { type: 'array', items: { type: 'string' } },
            textAnswer: { type: 'string', nullable: true, maxLength: 20000 },
          },
        },
      },
      expectedAttemptRevision: { type: 'integer', minimum: 1 },
    },
  },
  SubmitQuizAttemptRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['expectedAttemptRevision'],
    properties: {
      expectedAttemptRevision: { type: 'integer', minimum: 1 },
      confirmUnanswered: { type: 'boolean', default: false },
    },
  },
  StudentAttemptQuestion: {
    type: 'object',
    additionalProperties: false,
    required: ['questionId', 'type', 'prompt', 'points', 'options', 'displayOrder'],
    properties: {
      questionId: { type: 'string' },
      type: { $ref: '#/components/schemas/QuestionType' },
      prompt: { type: 'string' },
      points: { type: 'integer' },
      isRequired: { type: 'boolean' },
      options: { type: 'array', items: { $ref: '#/components/schemas/QuestionOption' } },
      media: { $ref: '#/components/schemas/QuestionMedia' },
      displayOrder: { type: 'integer' },
    },
  },
};

export function createPhaseFiveQuizAttemptPaths(): OpenAPIV3.PathsObject {
  const saveExample = {
    answers: [{ questionId: '507f1f77bcf86cd799439051', selectedOptionIds: ['opt-b'] }],
    expectedAttemptRevision: 1,
  };
  return {
    '/api/v1/students/quizzes/{quizId}': {
      parameters: [id('quizId')],
      get: {
        tags: ['Quiz Attempts'], summary: 'Get assigned Quiz intro and eligibility', operationId: 'getStudentQuizIntro', security,
        responses: { '200': response('Student Quiz intro', read), ...errors },
      },
    },
    '/api/v1/students/quizzes/{quizId}/attempts': {
      parameters: [id('quizId')],
      post: {
        tags: ['Quiz Attempts'], summary: 'Start or resume a Quiz Attempt', operationId: 'startQuizAttempt', security,
        requestBody: body({ type: 'object', additionalProperties: false }, {}),
        responses: { '200': response('Existing active Attempt resumed', read), '201': response('Attempt created', read), ...errors },
      },
      get: {
        tags: ['Quiz Attempts'], summary: 'List own Quiz Attempt history', operationId: 'listOwnQuizAttempts', security,
        responses: { '200': response('Own Attempt history', read), ...errors },
      },
    },
    '/api/v1/students/quiz-attempts/{attemptId}': {
      parameters: [id('attemptId')],
      get: {
        tags: ['Quiz Attempts'], summary: 'Get own Quiz Attempt player state', operationId: 'getOwnQuizAttempt', security,
        responses: { '200': response('Student-safe Attempt', read), ...errors },
      },
    },
    '/api/v1/students/quiz-attempts/{attemptId}/answers': {
      parameters: [id('attemptId')],
      patch: {
        tags: ['Quiz Attempts'], summary: 'Save a bounded Quiz answer batch', operationId: 'saveQuizAnswers', security,
        requestBody: body({ $ref: '#/components/schemas/SaveQuizAnswersRequest' }, saveExample),
        responses: { '200': response('Canonical saved Attempt', read), ...errors },
      },
    },
    '/api/v1/students/quiz-attempts/{attemptId}/submit': {
      parameters: [id('attemptId')],
      post: {
        tags: ['Quiz Attempts'], summary: 'Finalize and score a Quiz Attempt', operationId: 'submitQuizAttempt', security,
        requestBody: body({ $ref: '#/components/schemas/SubmitQuizAttemptRequest' }, { expectedAttemptRevision: 2, confirmUnanswered: true }),
        responses: { '200': response('Canonical finalization state', read), ...errors },
      },
    },
    '/api/v1/students/quiz-attempts/{attemptId}/result': {
      parameters: [id('attemptId')],
      get: {
        tags: ['Quiz Attempts'], summary: 'Get own released or pending Quiz result', operationId: 'getOwnQuizResult', security,
        responses: { '200': response('Own result state', read), ...errors },
      },
    },
  };
}
