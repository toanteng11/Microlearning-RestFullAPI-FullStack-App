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
  '404': error('Scoped resource not found'),
  '409': error('Lifecycle, policy or revision conflict'),
  '422': error('Validation failed'),
  '429': error('Rate limit exceeded'),
};
const body = (schema: Schema, example: unknown): OpenAPIV3.RequestBodyObject => ({
  required: true,
  content: content(schema, example),
});
const id = (
  name: 'quizId' | 'attemptId' | 'submissionId' | 'gradeId' | 'courseId' | 'studentId',
): OpenAPIV3.ParameterObject => ({
  name,
  in: 'path',
  required: true,
  schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
});
const activityType: OpenAPIV3.ParameterObject = {
  name: 'activityType',
  in: 'path',
  required: true,
  schema: { type: 'string', enum: ['lessons', 'quizzes', 'assignments'] },
};
const read = { $ref: '#/components/schemas/AssessmentReadResponse' } as const;

export const PHASE_FIVE_GRADING_DEADLINE_OPENAPI_OPERATIONS = [
  'listQuizResults',
  'getTeacherQuizAttempt',
  'saveQuizManualReview',
  'finalizeQuizManualReview',
  'releaseQuizResult',
  'regradeQuizAttempt',
  'saveSubmissionGrade',
  'returnSubmission',
  'regradeAssessment',
  'listGradeHistory',
  'listOwnGrades',
  'getOwnGrade',
  'listActivityDeadlineExceptions',
  'setStudentDeadlineException',
  'revokeStudentDeadlineException',
  'listStudentDeadlineExceptionHistory',
] as const;

export const phaseFiveGradingDeadlineTags: OpenAPIV3.TagObject[] = [
  {
    name: 'Quiz Review',
    description: 'Teacher result roster, manual review, release and regrade',
  },
  {
    name: 'Grades',
    description: 'Revisioned Grade draft, return, history and Student-own visibility',
  },
  {
    name: 'Deadline Exceptions',
    description: 'Per-Student extension-only deadline overrides and immutable history',
  },
];

export const phaseFiveGradingDeadlineSchemas: Record<string, Schema> = {
  ManualReviewAnswer: {
    type: 'object',
    additionalProperties: false,
    required: ['questionId', 'awardedPoints'],
    properties: {
      questionId: { type: 'string' },
      awardedPoints: { type: 'integer', minimum: 0, maximum: 1000 },
      feedback: { type: 'string', minLength: 1, maxLength: 20000, nullable: true },
    },
  },
  SaveQuizReviewRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['answers', 'expectedReviewRevision'],
    properties: {
      answers: {
        type: 'array',
        maxItems: 100,
        items: { $ref: '#/components/schemas/ManualReviewAnswer' },
      },
      expectedReviewRevision: { type: 'integer', minimum: 0 },
    },
  },
  SaveGradeRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['score', 'expectedEvidenceRevision', 'expectedGradeRevision'],
    properties: {
      score: { type: 'integer', minimum: 0, maximum: 1000 },
      feedback: { type: 'string', minLength: 1, maxLength: 20000, nullable: true },
      expectedEvidenceRevision: { type: 'integer', minimum: 1 },
      expectedGradeRevision: { type: 'integer', minimum: 0 },
    },
  },
  RegradeRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['score', 'reason', 'expectedGradeRevision'],
    properties: {
      score: { type: 'integer', minimum: 0, maximum: 1000 },
      feedback: { type: 'string', minLength: 1, maxLength: 20000, nullable: true },
      reason: { type: 'string', minLength: 10, maxLength: 500 },
      expectedGradeRevision: { type: 'integer', minimum: 1 },
    },
  },
  SetDeadlineExceptionRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['deadline', 'reason', 'expectedRevision'],
    properties: {
      deadline: { type: 'string', format: 'date-time' },
      reason: { type: 'string', minLength: 10, maxLength: 500 },
      expectedRevision: { type: 'integer', minimum: 0 },
    },
  },
};

export function createPhaseFiveGradingDeadlinePaths(): OpenAPIV3.PathsObject {
  const attemptParameters = [id('attemptId')];
  const gradeParameters = [id('gradeId')];
  const activityParameters = [activityType, id('studentId')].filter(Boolean);
  const reviewExample = {
    answers: [
      {
        questionId: '507f1f77bcf86cd799439051',
        awardedPoints: 4,
        feedback: 'Cau tra loi dap ung rubric.',
      },
    ],
    expectedReviewRevision: 0,
  };
  const activityPathParameters = [
    activityType,
    {
      name: 'activityId',
      in: 'path',
      required: true,
      schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
    } as OpenAPIV3.ParameterObject,
  ];
  return {
    '/api/v1/teacher/quizzes/{quizId}/results': {
      parameters: [id('quizId')],
      get: {
        tags: ['Quiz Review'],
        summary: 'List owned Quiz results',
        operationId: 'listQuizResults',
        security,
        responses: { '200': response('Quiz result roster', read), ...errors },
      },
    },
    '/api/v1/teacher/quiz-attempts/{attemptId}': {
      parameters: attemptParameters,
      get: {
        tags: ['Quiz Review'],
        summary: 'Get Teacher review projection',
        operationId: 'getTeacherQuizAttempt',
        security,
        responses: { '200': response('Teacher Attempt review', read), ...errors },
      },
    },
    '/api/v1/teacher/quiz-attempts/{attemptId}/review': {
      parameters: attemptParameters,
      put: {
        tags: ['Quiz Review'],
        summary: 'Save manual review draft',
        operationId: 'saveQuizManualReview',
        security,
        requestBody: body(
          { $ref: '#/components/schemas/SaveQuizReviewRequest' },
          reviewExample,
        ),
        responses: { '200': response('Canonical review draft', read), ...errors },
      },
    },
    '/api/v1/teacher/quiz-attempts/{attemptId}/review/finalize': {
      parameters: attemptParameters,
      post: {
        tags: ['Quiz Review'],
        summary: 'Finalize complete manual review',
        operationId: 'finalizeQuizManualReview',
        security,
        requestBody: body(
          {
            type: 'object',
            additionalProperties: false,
            required: ['expectedReviewRevision'],
            properties: {
              expectedReviewRevision: { type: 'integer', minimum: 1 },
              reason: { type: 'string', minLength: 10, maxLength: 500, nullable: true },
            },
          },
          { expectedReviewRevision: 1, reason: null },
        ),
        responses: { '200': response('Finalized review', read), ...errors },
      },
    },
    '/api/v1/teacher/quiz-attempts/{attemptId}/release': {
      parameters: attemptParameters,
      post: {
        tags: ['Quiz Review'],
        summary: 'Release a graded Quiz result',
        operationId: 'releaseQuizResult',
        security,
        requestBody: body(
          {
            type: 'object',
            additionalProperties: false,
            required: ['expectedReviewRevision'],
            properties: { expectedReviewRevision: { type: 'integer', minimum: 0 } },
          },
          { expectedReviewRevision: 2 },
        ),
        responses: { '200': response('Released Quiz result', read), ...errors },
      },
    },
    '/api/v1/teacher/quiz-attempts/{attemptId}/regrade': {
      parameters: attemptParameters,
      post: {
        tags: ['Quiz Review'],
        summary: 'Regrade a finalized Quiz Attempt',
        operationId: 'regradeQuizAttempt',
        security,
        requestBody: body(
          {
            allOf: [
              { $ref: '#/components/schemas/SaveQuizReviewRequest' },
              {
                type: 'object',
                required: ['reason'],
                properties: { reason: { type: 'string', minLength: 10, maxLength: 500 } },
              },
            ],
          },
          { ...reviewExample, reason: 'Cham lai theo rubric da thong nhat' },
        ),
        responses: { '200': response('Regraded Quiz result', read), ...errors },
      },
    },
    '/api/v1/teacher/submissions/{submissionId}/grade': {
      parameters: [id('submissionId')],
      put: {
        tags: ['Grades'],
        summary: 'Save Assignment Grade draft',
        operationId: 'saveSubmissionGrade',
        security,
        requestBody: body(
          { $ref: '#/components/schemas/SaveGradeRequest' },
          {
            score: 8,
            feedback: 'Cau truc ro rang.',
            expectedEvidenceRevision: 2,
            expectedGradeRevision: 0,
          },
        ),
        responses: { '200': response('Grade draft saved', read), ...errors },
      },
    },
    '/api/v1/teacher/submissions/{submissionId}/return': {
      parameters: [id('submissionId')],
      post: {
        tags: ['Grades'],
        summary: 'Return graded Assignment work',
        operationId: 'returnSubmission',
        security,
        requestBody: body(
          {
            type: 'object',
            additionalProperties: false,
            required: ['expectedGradeRevision'],
            properties: { expectedGradeRevision: { type: 'integer', minimum: 1 } },
          },
          { expectedGradeRevision: 1 },
        ),
        responses: { '200': response('Work returned', read), ...errors },
      },
    },
    '/api/v1/teacher/grades/{gradeId}/regrade': {
      parameters: gradeParameters,
      post: {
        tags: ['Grades'],
        summary: 'Create a Grade revision',
        operationId: 'regradeAssessment',
        security,
        requestBody: body(
          { $ref: '#/components/schemas/RegradeRequest' },
          {
            score: 9,
            feedback: 'Da bo sung validation.',
            reason: 'Cham lai theo rubric da thong nhat',
            expectedGradeRevision: 2,
          },
        ),
        responses: { '200': response('Grade revised', read), ...errors },
      },
    },
    '/api/v1/teacher/grades/{gradeId}/history': {
      parameters: gradeParameters,
      get: {
        tags: ['Grades'],
        summary: 'List immutable Grade history',
        operationId: 'listGradeHistory',
        security,
        responses: { '200': response('Grade history', read), ...errors },
      },
    },
    '/api/v1/students/me/grades': {
      get: {
        tags: ['Grades'],
        summary: 'List own returned Grades',
        operationId: 'listOwnGrades',
        security,
        responses: { '200': response('Own Grade list', read), ...errors },
      },
    },
    '/api/v1/students/me/grades/{gradeId}': {
      parameters: gradeParameters,
      get: {
        tags: ['Grades'],
        summary: 'Get own returned Grade',
        operationId: 'getOwnGrade',
        security,
        responses: { '200': response('Own Grade detail', read), ...errors },
      },
    },
    '/api/v1/teacher/activities/{activityType}/{activityId}/deadline-exceptions': {
      parameters: activityPathParameters,
      get: {
        tags: ['Deadline Exceptions'],
        summary: 'List activity Deadline Exceptions',
        operationId: 'listActivityDeadlineExceptions',
        security,
        responses: { '200': response('Deadline Exception list', read), ...errors },
      },
    },
    '/api/v1/teacher/activities/{activityType}/{activityId}/deadline-exceptions/{studentId}':
      {
        parameters: [...activityPathParameters, ...activityParameters.slice(1)],
        put: {
          tags: ['Deadline Exceptions'],
          summary: 'Set or extend a Student deadline',
          operationId: 'setStudentDeadlineException',
          security,
          requestBody: body(
            { $ref: '#/components/schemas/SetDeadlineExceptionRequest' },
            {
              deadline: '2026-08-15T16:59:59.000Z',
              reason: 'Gia han theo truong hop ca nhan da xac nhan',
              expectedRevision: 0,
            },
          ),
          responses: { '200': response('Deadline Exception updated', read), ...errors },
        },
      },
    '/api/v1/teacher/activities/{activityType}/{activityId}/deadline-exceptions/{studentId}/revoke':
      {
        parameters: [...activityPathParameters, ...activityParameters.slice(1)],
        post: {
          tags: ['Deadline Exceptions'],
          summary: 'Revoke a Student deadline extension',
          operationId: 'revokeStudentDeadlineException',
          security,
          requestBody: body(
            {
              type: 'object',
              additionalProperties: false,
              required: ['reason', 'expectedRevision'],
              properties: {
                reason: { type: 'string', minLength: 10, maxLength: 500 },
                expectedRevision: { type: 'integer', minimum: 1 },
              },
            },
            { reason: 'Khoi phuc han chung theo xac nhan', expectedRevision: 1 },
          ),
          responses: { '200': response('Deadline Exception revoked', read), ...errors },
        },
      },
    '/api/v1/teacher/activities/{activityType}/{activityId}/deadline-exceptions/{studentId}/history':
      {
        parameters: [...activityPathParameters, ...activityParameters.slice(1)],
        get: {
          tags: ['Deadline Exceptions'],
          summary: 'List immutable Deadline Exception history',
          operationId: 'listStudentDeadlineExceptionHistory',
          security,
          responses: { '200': response('Deadline Exception history', read), ...errors },
        },
      },
  };
}
