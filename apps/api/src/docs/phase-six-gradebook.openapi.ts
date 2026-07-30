import type { OpenAPIV3 } from 'openapi-types';

type SchemaMap = Record<string, OpenAPIV3.SchemaObject>;

const security: OpenAPIV3.SecurityRequirementObject[] = [{ bearerAuth: [] }];
const objectIdPattern = '^[a-fA-F0-9]{24}$';
const courseId: OpenAPIV3.ParameterObject = {
  name: 'courseId',
  in: 'path',
  required: true,
  schema: { type: 'string', pattern: objectIdPattern },
};
const protectedErrors = {
  '400': {
    description: 'The Gradebook query, module or activity cursor is invalid',
    content: {
      'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
    },
  },
  '401': {
    description: 'Authentication is required',
    content: {
      'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
    },
  },
  '403': {
    description: 'The current role does not have Gradebook permission',
    content: {
      'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
    },
  },
  '404': {
    description: 'The owned Course was not found',
    content: {
      'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
    },
  },
  '503': {
    description: 'Reporting is disabled',
    content: {
      'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
    },
  },
} satisfies OpenAPIV3.ResponsesObject;

const nullablePercentage: OpenAPIV3.SchemaObject = {
  type: 'number',
  minimum: 0,
  maximum: 100,
  nullable: true,
};
const nullableDateTime: OpenAPIV3.SchemaObject = {
  type: 'string',
  format: 'date-time',
  nullable: true,
};

export const PHASE_SIX_GRADEBOOK_OPENAPI_OPERATIONS = ['getTeacherCourseGradebook'] as const;

export const phaseSixGradebookTags: OpenAPIV3.TagObject[] = [
  {
    name: 'Teacher Gradebook',
    description:
      'Bounded owned-Course Gradebook with independent completion and grading dimensions',
  },
];

export const phaseSixGradebookSchemas: SchemaMap = {
  GradebookColumn: {
    type: 'object',
    additionalProperties: false,
    required: [
      'activityId',
      'activityType',
      'title',
      'isRequired',
      'maxScore',
      'effectiveDefaultDeadline',
      'lifecycleStatus',
      'position',
    ],
    properties: {
      activityId: { type: 'string', pattern: objectIdPattern },
      activityType: { type: 'string', enum: ['LESSON', 'QUIZ', 'ASSIGNMENT'] },
      title: { type: 'string' },
      isRequired: { type: 'boolean' },
      maxScore: { type: 'number', minimum: 0, nullable: true },
      effectiveDefaultDeadline: nullableDateTime,
      lifecycleStatus: {
        type: 'string',
        enum: ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'UNPUBLISHED', 'CLOSED', 'ARCHIVED'],
      },
      position: { type: 'integer', minimum: 0 },
    },
  },
  GradebookCell: {
    type: 'object',
    additionalProperties: false,
    required: [
      'activityId',
      'completionStatus',
      'gradingStatus',
      'displayStatus',
      'score',
      'maxScore',
      'normalizedScore',
      'submittedAt',
      'returnedAt',
      'effectiveDeadline',
      'isDeadlineExceptionApplied',
      'allowedActions',
    ],
    properties: {
      activityId: { type: 'string', pattern: objectIdPattern },
      completionStatus: {
        type: 'string',
        enum: [
          'NOT_APPLICABLE',
          'NOT_STARTED',
          'IN_PROGRESS',
          'MISSING',
          'COMPLETED',
          'LATE',
        ],
      },
      gradingStatus: {
        type: 'string',
        enum: ['NOT_GRADABLE', 'NOT_READY', 'AWAITING_GRADE', 'DRAFT', 'RETURNED'],
      },
      displayStatus: {
        type: 'string',
        enum: [
          'NOT_APPLICABLE',
          'NOT_STARTED',
          'IN_PROGRESS',
          'MISSING',
          'COMPLETED',
          'LATE',
          'AWAITING_GRADE',
          'DRAFT_GRADE',
          'RETURNED',
        ],
      },
      score: { type: 'number', minimum: 0, nullable: true },
      maxScore: { type: 'number', minimum: 0, nullable: true },
      normalizedScore: nullablePercentage,
      submittedAt: nullableDateTime,
      returnedAt: nullableDateTime,
      effectiveDeadline: nullableDateTime,
      isDeadlineExceptionApplied: { type: 'boolean' },
      allowedActions: {
        type: 'array',
        uniqueItems: true,
        items: { type: 'string', enum: ['OPEN_GRADING'] },
      },
    },
  },
  GradebookRow: {
    type: 'object',
    additionalProperties: false,
    required: [
      'student',
      'processScore',
      'progressPercentage',
      'returnedGradeAverage',
      'missingCount',
      'lateCount',
      'cells',
    ],
    properties: {
      student: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'fullName', 'email', 'studentCode'],
        properties: {
          id: { type: 'string', pattern: objectIdPattern },
          fullName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          studentCode: { type: 'string', nullable: true },
        },
      },
      processScore: nullablePercentage,
      progressPercentage: nullablePercentage,
      returnedGradeAverage: nullablePercentage,
      missingCount: { type: 'integer', minimum: 0 },
      lateCount: { type: 'integer', minimum: 0 },
      cells: {
        type: 'array',
        maxItems: 50,
        items: { $ref: '#/components/schemas/GradebookCell' },
      },
    },
  },
  GradebookData: {
    type: 'object',
    additionalProperties: false,
    required: ['course', 'columns', 'rows', 'activityPage', 'reporting'],
    properties: {
      course: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'title'],
        properties: {
          id: { type: 'string', pattern: objectIdPattern },
          title: { type: 'string' },
        },
      },
      columns: {
        type: 'array',
        maxItems: 50,
        items: { $ref: '#/components/schemas/GradebookColumn' },
      },
      rows: {
        type: 'array',
        maxItems: 50,
        items: { $ref: '#/components/schemas/GradebookRow' },
      },
      activityPage: {
        type: 'object',
        additionalProperties: false,
        required: ['limit', 'nextCursor', 'truncated'],
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 50 },
          nextCursor: { type: 'string', nullable: true },
          truncated: { type: 'boolean' },
        },
      },
      reporting: { $ref: '#/components/schemas/ReportMetadata' },
    },
  },
  GradebookResponse: {
    type: 'object',
    additionalProperties: false,
    required: ['success', 'data', 'meta'],
    properties: {
      success: { type: 'boolean', enum: [true] },
      data: { $ref: '#/components/schemas/GradebookData' },
      meta: { $ref: '#/components/schemas/Pagination' },
    },
  },
};

export function createPhaseSixGradebookPaths(): OpenAPIV3.PathsObject {
  return {
    '/api/v1/teacher/courses/{courseId}/gradebook': {
      get: {
        tags: ['Teacher Gradebook'],
        operationId: 'getTeacherCourseGradebook',
        summary: 'Get a bounded Gradebook for an owned Course',
        security,
        parameters: [
          courseId,
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
          },
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string', minLength: 1, maxLength: 100 },
          },
          {
            name: 'activityType',
            in: 'query',
            schema: { type: 'string', enum: ['LESSON', 'QUIZ', 'ASSIGNMENT'] },
          },
          {
            name: 'completionStatus',
            in: 'query',
            schema: {
              type: 'string',
              enum: [
                'NOT_APPLICABLE',
                'NOT_STARTED',
                'IN_PROGRESS',
                'MISSING',
                'COMPLETED',
                'LATE',
              ],
            },
          },
          {
            name: 'gradingStatus',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['NOT_GRADABLE', 'NOT_READY', 'AWAITING_GRADE', 'DRAFT', 'RETURNED'],
            },
          },
          {
            name: 'moduleId',
            in: 'query',
            schema: { type: 'string', pattern: objectIdPattern },
          },
          {
            name: 'activityLimit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 50, default: 25 },
          },
          {
            name: 'activityCursor',
            in: 'query',
            schema: { type: 'string', minLength: 1, maxLength: 500 },
          },
          {
            name: 'sortBy',
            in: 'query',
            schema: {
              type: 'string',
              default: 'processScore',
              enum: [
                'processScore',
                'progressPercentage',
                'returnedGradeAverage',
                'missingCount',
                'lateCount',
                'fullName',
              ],
            },
          },
          {
            name: 'sortOrder',
            in: 'query',
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          },
        ],
        responses: {
          '200': {
            description: 'Bounded Teacher Gradebook',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GradebookResponse' },
              },
            },
          },
          ...protectedErrors,
        },
      },
    },
  };
}
