import type { OpenAPIV3 } from 'openapi-types';

type SchemaMap = Record<string, OpenAPIV3.SchemaObject>;

const security: OpenAPIV3.SecurityRequirementObject[] = [{ bearerAuth: [] }];
const objectIdPattern = '^[a-fA-F0-9]{24}$';

function successResponse(
  description: string,
  schema: OpenAPIV3.ReferenceObject,
): OpenAPIV3.ResponseObject {
  return {
    description,
    content: { 'application/json': { schema } },
  };
}

const protectedErrors = {
  '401': {
    description: 'Authentication is required',
    content: {
      'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
    },
  },
  '403': {
    description: 'The current role does not have this permission',
    content: {
      'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
    },
  },
  '404': {
    description: 'The enrolled Course was not found',
    content: {
      'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
    },
  },
  '422': {
    description: 'The query does not match the reporting contract',
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

export const PHASE_SIX_STUDENT_REPORTING_OPENAPI_OPERATIONS = [
  'getStudentReportingDashboard',
  'getStudentCourseProgress',
  'listStudentCourseProgress',
] as const;

export const phaseSixStudentReportingTags: OpenAPIV3.TagObject[] = [
  {
    name: 'Student Reporting',
    description: 'Private Student dashboard and enrolled Course progress reports',
  },
];

export function createPhaseSixStudentReportingPaths(): OpenAPIV3.PathsObject {
  return {
    '/api/v1/students/me/dashboard': {
      get: {
        tags: ['Student Reporting'],
        operationId: 'getStudentReportingDashboard',
        summary: 'Get the current Student action and progress dashboard',
        security,
        parameters: [
          {
            name: 'todoLimit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 10, default: 5 },
          },
          {
            name: 'courseLimit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 10, default: 5 },
          },
          {
            name: 'gradeLimit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 10, default: 5 },
          },
          {
            name: 'timezone',
            in: 'query',
            schema: { type: 'string', default: 'Asia/Ho_Chi_Minh' },
          },
        ],
        responses: {
          '200': successResponse('Student reporting dashboard', {
            $ref: '#/components/schemas/StudentReportingDashboardResponse',
          }),
          ...protectedErrors,
        },
      },
    },
    '/api/v1/students/me/progress': {
      get: {
        tags: ['Student Reporting'],
        operationId: 'getStudentCourseProgress',
        summary: 'Get one enrolled Course progress report',
        security,
        parameters: [
          {
            name: 'courseId',
            in: 'query',
            required: true,
            schema: { type: 'string', pattern: objectIdPattern },
          },
          {
            name: 'timezone',
            in: 'query',
            schema: { type: 'string', default: 'Asia/Ho_Chi_Minh' },
          },
        ],
        responses: {
          '200': successResponse('Student Course progress', {
            $ref: '#/components/schemas/StudentCourseProgressResponse',
          }),
          ...protectedErrors,
        },
      },
    },
    '/api/v1/students/me/progress/courses': {
      get: {
        tags: ['Student Reporting'],
        operationId: 'listStudentCourseProgress',
        summary: 'List enrolled Course progress summaries with stable server pagination',
        security,
        parameters: [
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
            name: 'progressStatus',
            in: 'query',
            schema: { $ref: '#/components/schemas/ReportingProgressStatus' },
          },
          {
            name: 'sortBy',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['courseTitle', 'processScore', 'lastActiveAt'],
              default: 'lastActiveAt',
            },
          },
          {
            name: 'sortOrder',
            in: 'query',
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          },
        ],
        responses: {
          '200': successResponse('Student Course progress list', {
            $ref: '#/components/schemas/StudentCourseProgressListResponse',
          }),
          ...protectedErrors,
        },
      },
    },
  };
}

export const phaseSixStudentReportingSchemas: SchemaMap = {
  StudentCourseProgressSummary: {
    type: 'object',
    additionalProperties: false,
    required: [
      'classroom',
      'course',
      'requiredActivityCount',
      'completedRequiredCount',
      'progressPercentage',
      'processScore',
      'progressStatus',
      'missingCount',
      'lateCount',
      'returnedGradeAverage',
      'lastActiveAt',
      'courseCompleted',
      'actionUrl',
      'recalculatedAt',
    ],
    properties: {
      classroom: {
        type: 'object',
        required: ['id', 'name'],
        properties: { id: { type: 'string' }, name: { type: 'string' } },
      },
      course: {
        type: 'object',
        required: ['id', 'title'],
        properties: { id: { type: 'string' }, title: { type: 'string' } },
      },
      requiredActivityCount: { type: 'integer', minimum: 0 },
      completedRequiredCount: { type: 'integer', minimum: 0 },
      progressPercentage: { type: 'number', minimum: 0, maximum: 100, nullable: true },
      processScore: { type: 'number', minimum: 0, maximum: 100, nullable: true },
      progressStatus: { $ref: '#/components/schemas/ReportingProgressStatus' },
      missingCount: { type: 'integer', minimum: 0 },
      lateCount: { type: 'integer', minimum: 0 },
      returnedGradeAverage: { type: 'number', minimum: 0, maximum: 100, nullable: true },
      lastActiveAt: { type: 'string', format: 'date-time', nullable: true },
      courseCompleted: { type: 'boolean' },
      actionUrl: { type: 'string' },
      recalculatedAt: { type: 'string', format: 'date-time' },
    },
  },
  StudentReturnedGradeSummary: {
    type: 'object',
    additionalProperties: false,
    required: [
      'gradeId',
      'activityId',
      'activityType',
      'activityTitle',
      'score',
      'maxScore',
      'normalizedScore',
      'returnedAt',
      'actionUrl',
    ],
    properties: {
      gradeId: { type: 'string' },
      activityId: { type: 'string' },
      activityType: { type: 'string', enum: ['QUIZ', 'ASSIGNMENT'] },
      activityTitle: { type: 'string' },
      score: { type: 'number' },
      maxScore: { type: 'number', minimum: 1 },
      normalizedScore: { type: 'number', minimum: 0, maximum: 100 },
      returnedAt: { type: 'string', format: 'date-time' },
      actionUrl: { type: 'string' },
    },
  },
  StudentReportingDashboardResponse: {
    type: 'object',
    required: ['success', 'data'],
    properties: {
      success: { type: 'boolean', enum: [true] },
      data: {
        type: 'object',
        required: ['summary', 'todo', 'courses', 'recentGrades', 'reporting'],
        properties: {
          summary: {
            type: 'object',
            required: [
              'activeClassroomCount',
              'activeCourseCount',
              'pendingCount',
              'dueSoonCount',
              'missingCount',
            ],
            properties: {
              activeClassroomCount: { type: 'integer', minimum: 0 },
              activeCourseCount: { type: 'integer', minimum: 0 },
              pendingCount: { type: 'integer', minimum: 0 },
              dueSoonCount: { type: 'integer', minimum: 0 },
              missingCount: { type: 'integer', minimum: 0 },
            },
          },
          todo: {
            type: 'object',
            required: ['items', 'totalItems', 'scopeVersion'],
            properties: {
              items: { type: 'array', items: { type: 'object', additionalProperties: true } },
              totalItems: { type: 'integer', minimum: 0 },
              scopeVersion: { type: 'string' },
            },
          },
          courses: {
            type: 'array',
            items: { $ref: '#/components/schemas/StudentCourseProgressSummary' },
          },
          recentGrades: {
            type: 'array',
            items: { $ref: '#/components/schemas/StudentReturnedGradeSummary' },
          },
          reporting: { $ref: '#/components/schemas/ReportMetadata' },
        },
      },
    },
  },
  StudentCourseProgressResponse: {
    type: 'object',
    required: ['success', 'data'],
    properties: {
      success: { type: 'boolean', enum: [true] },
      data: {
        allOf: [
          { $ref: '#/components/schemas/StudentCourseProgressSummary' },
          {
            type: 'object',
            required: ['metricVersion', 'descriptorVersion', 'reporting'],
            properties: {
              metricVersion: { type: 'string' },
              descriptorVersion: { type: 'string' },
              reporting: { $ref: '#/components/schemas/ReportMetadata' },
            },
          },
        ],
      },
    },
  },
  StudentCourseProgressListResponse: {
    type: 'object',
    required: ['success', 'data', 'meta'],
    properties: {
      success: { type: 'boolean', enum: [true] },
      data: {
        type: 'object',
        required: ['items', 'reporting'],
        properties: {
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/StudentCourseProgressSummary' },
          },
          reporting: { $ref: '#/components/schemas/ReportMetadata' },
        },
      },
      meta: { $ref: '#/components/schemas/Pagination' },
    },
  },
};
