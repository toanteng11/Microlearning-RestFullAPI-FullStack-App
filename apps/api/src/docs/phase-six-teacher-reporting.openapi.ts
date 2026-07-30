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
const studentId: OpenAPIV3.ParameterObject = {
  name: 'studentId',
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
  schema: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
};
const search: OpenAPIV3.ParameterObject = {
  name: 'search',
  in: 'query',
  schema: { type: 'string', minLength: 1, maxLength: 100 },
};

const protectedErrors = {
  '400': {
    description: 'The path or query does not match the reporting contract',
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
    description: 'The current role does not have this permission',
    content: {
      'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
    },
  },
  '404': {
    description: 'The owned Course or roster Student was not found',
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

function response(description: string, schema: string): OpenAPIV3.ResponseObject {
  return {
    description,
    content: {
      'application/json': { schema: { $ref: `#/components/schemas/${schema}` } },
    },
  };
}

const progressParameters: OpenAPIV3.ParameterObject[] = [
  courseId,
  page,
  limit,
  search,
  {
    name: 'progressStatus',
    in: 'query',
    schema: {
      type: 'string',
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'MISSING', 'COMPLETED', 'LATE'],
    },
  },
  {
    name: 'supportFlag',
    in: 'query',
    schema: {
      type: 'string',
      enum: [
        'HAS_MISSING_WORK',
        'HAS_UNGRADED_WORK',
        'NO_RECENT_ACTIVITY',
        'NO_REQUIRED_ACTIVITY',
        'PARTIAL_DATA',
      ],
    },
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
        'missingActivityCount',
        'lateActivityCount',
        'lastActiveAt',
        'fullName',
      ],
    },
  },
  {
    name: 'sortOrder',
    in: 'query',
    schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
  },
];

export const PHASE_SIX_TEACHER_REPORTING_OPENAPI_OPERATIONS = [
  'getTeacherReportingDashboard',
  'listTeacherCourseProgress',
  'listTeacherCourseStudents',
  'listTeacherActivityAnalytics',
  'listTeacherAssessmentAnalytics',
  'getTeacherStudentProgress',
] as const;

export const phaseSixTeacherReportingTags: OpenAPIV3.TagObject[] = [
  {
    name: 'Teacher Reporting',
    description: 'Owned Course analytics, ranking and roster Student progress',
  },
];

export function createPhaseSixTeacherReportingPaths(): OpenAPIV3.PathsObject {
  const progressOperation: OpenAPIV3.OperationObject = {
    tags: ['Teacher Reporting'],
    operationId: 'listTeacherCourseProgress',
    summary: 'List stable progress ranking for an owned Course',
    security,
    parameters: progressParameters,
    responses: {
      '200': response('Teacher Course progress ranking', 'TeacherProgressListResponse'),
      ...protectedErrors,
    },
  };
  return {
    '/api/v1/teacher/courses/{courseId}/dashboard': {
      get: {
        tags: ['Teacher Reporting'],
        operationId: 'getTeacherReportingDashboard',
        summary: 'Get an owned Course reporting dashboard',
        security,
        parameters: [
          courseId,
          {
            name: 'timezone',
            in: 'query',
            schema: { type: 'string', default: 'Asia/Ho_Chi_Minh' },
          },
        ],
        responses: {
          '200': response('Teacher reporting dashboard', 'TeacherReportingDashboardResponse'),
          ...protectedErrors,
        },
      },
    },
    '/api/v1/teacher/courses/{courseId}/progress': { get: progressOperation },
    '/api/v1/teacher/courses/{courseId}/students': {
      get: {
        ...progressOperation,
        operationId: 'listTeacherCourseStudents',
        deprecated: true,
        summary: 'Compatibility alias for the owned Course progress ranking',
      },
    },
    '/api/v1/teacher/courses/{courseId}/activities': {
      get: {
        tags: ['Teacher Reporting'],
        operationId: 'listTeacherActivityAnalytics',
        summary: 'List activity completion analytics for an owned Course',
        security,
        parameters: [
          courseId,
          page,
          limit,
          search,
          {
            name: 'activityType',
            in: 'query',
            schema: { type: 'string', enum: ['LESSON', 'QUIZ', 'ASSIGNMENT'] },
          },
          { name: 'isRequired', in: 'query', schema: { type: 'boolean' } },
          {
            name: 'lifecycleStatus',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'UNPUBLISHED', 'CLOSED', 'ARCHIVED'],
            },
          },
          {
            name: 'deadlineStatus',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['NO_DEADLINE', 'UPCOMING', 'DUE_SOON', 'OVERDUE'],
            },
          },
          {
            name: 'sortBy',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['position', 'deadline', 'completionPercentage', 'missingCount', 'title'],
              default: 'position',
            },
          },
          {
            name: 'sortOrder',
            in: 'query',
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
          },
        ],
        responses: {
          '200': response('Teacher activity analytics', 'TeacherActivityAnalyticsListResponse'),
          ...protectedErrors,
        },
      },
    },
    '/api/v1/teacher/courses/{courseId}/assessments': {
      get: {
        tags: ['Teacher Reporting'],
        operationId: 'listTeacherAssessmentAnalytics',
        summary: 'List Quiz and Assignment analytics for an owned Course',
        security,
        parameters: [
          courseId,
          page,
          limit,
          search,
          {
            name: 'activityType',
            in: 'query',
            schema: { type: 'string', enum: ['QUIZ', 'ASSIGNMENT'] },
          },
          {
            name: 'sortBy',
            in: 'query',
            schema: {
              type: 'string',
              enum: [
                'position',
                'title',
                'submissionPercentage',
                'returnedGradeAverage',
                'missingCount',
              ],
              default: 'position',
            },
          },
          {
            name: 'sortOrder',
            in: 'query',
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
          },
        ],
        responses: {
          '200': response('Teacher assessment analytics', 'TeacherAssessmentAnalyticsListResponse'),
          ...protectedErrors,
        },
      },
    },
    '/api/v1/teacher/courses/{courseId}/students/{studentId}/progress': {
      get: {
        tags: ['Teacher Reporting'],
        operationId: 'getTeacherStudentProgress',
        summary: 'Get one active roster Student progress detail',
        security,
        parameters: [
          courseId,
          studentId,
          {
            name: 'timezone',
            in: 'query',
            schema: { type: 'string', default: 'Asia/Ho_Chi_Minh' },
          },
        ],
        responses: {
          '200': response('Teacher Student progress detail', 'TeacherStudentProgressResponse'),
          ...protectedErrors,
        },
      },
    },
  };
}

const nullableNumber: OpenAPIV3.SchemaObject = { type: 'number', nullable: true };
const paginationSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  required: ['page', 'limit', 'totalItems', 'totalPages'],
  properties: {
    page: { type: 'integer' },
    limit: { type: 'integer' },
    totalItems: { type: 'integer' },
    totalPages: { type: 'integer' },
    hasNextPage: { type: 'boolean' },
    hasPreviousPage: { type: 'boolean' },
  },
};

export const phaseSixTeacherReportingSchemas: SchemaMap = {
  TeacherReportingMetadata: {
    allOf: [{ $ref: '#/components/schemas/ReportMetadata' }],
  },
  TeacherProgressRow: {
    type: 'object',
    required: [
      'rank',
      'student',
      'requiredActivityCount',
      'completedRequiredCount',
      'progressPercentage',
      'processScore',
      'progressStatus',
      'missingCount',
      'lateCount',
      'ungradedCount',
      'supportFlags',
    ],
    properties: {
      rank: { type: 'integer', minimum: 1 },
      student: {
        type: 'object',
        properties: {
          id: { type: 'string', pattern: objectIdPattern },
          fullName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          studentCode: { type: 'string', nullable: true },
        },
      },
      requiredActivityCount: { type: 'integer' },
      completedRequiredCount: { type: 'integer' },
      progressPercentage: nullableNumber,
      processScore: nullableNumber,
      progressStatus: {
        type: 'string',
        enum: ['NOT_STARTED', 'IN_PROGRESS', 'MISSING', 'COMPLETED', 'LATE'],
      },
      returnedGradeAverage: nullableNumber,
      missingCount: { type: 'integer' },
      lateCount: { type: 'integer' },
      ungradedCount: { type: 'integer' },
      lastActiveAt: { type: 'string', format: 'date-time', nullable: true },
      courseCompleted: { type: 'boolean' },
      supportFlags: { type: 'array', items: { type: 'string' } },
      allowedActions: { type: 'array', items: { type: 'string' } },
    },
  },
  TeacherActivityAnalyticsRow: {
    type: 'object',
    additionalProperties: true,
    required: ['activityId', 'activityType', 'title', 'eligibleStudentCount'],
    properties: {
      activityId: { type: 'string', pattern: objectIdPattern },
      activityType: { type: 'string', enum: ['LESSON', 'QUIZ', 'ASSIGNMENT'] },
      title: { type: 'string' },
      eligibleStudentCount: { type: 'integer' },
      completionPercentage: nullableNumber,
      returnedGradeAverage: nullableNumber,
    },
  },
  TeacherAssessmentAnalyticsRow: {
    type: 'object',
    additionalProperties: true,
    required: ['activityId', 'activityType', 'title', 'eligibleStudentCount'],
    properties: {
      activityId: { type: 'string', pattern: objectIdPattern },
      activityType: { type: 'string', enum: ['QUIZ', 'ASSIGNMENT'] },
      title: { type: 'string' },
      eligibleStudentCount: { type: 'integer' },
      submissionPercentage: nullableNumber,
      returnedGradeAverage: nullableNumber,
    },
  },
  TeacherReportingDashboardResponse: {
    type: 'object',
    required: ['success', 'data'],
    properties: {
      success: { type: 'boolean', enum: [true] },
      data: {
        type: 'object',
        required: ['course', 'summary', 'topActivities', 'topStudents', 'reporting'],
        properties: {
          course: { type: 'object', additionalProperties: true },
          summary: { type: 'object', additionalProperties: true },
          topActivities: {
            type: 'array',
            items: { $ref: '#/components/schemas/TeacherActivityAnalyticsRow' },
          },
          topStudents: {
            type: 'array',
            items: { $ref: '#/components/schemas/TeacherProgressRow' },
          },
          allowedActions: { type: 'array', items: { type: 'string' } },
          reporting: { $ref: '#/components/schemas/ReportMetadata' },
        },
      },
    },
  },
  TeacherProgressListResponse: {
    type: 'object',
    required: ['success', 'data', 'meta'],
    properties: {
      success: { type: 'boolean', enum: [true] },
      data: {
        type: 'object',
        properties: {
          course: { type: 'object', additionalProperties: true },
          items: { type: 'array', items: { $ref: '#/components/schemas/TeacherProgressRow' } },
          reporting: { $ref: '#/components/schemas/ReportMetadata' },
        },
      },
      meta: paginationSchema,
    },
  },
  TeacherActivityAnalyticsListResponse: {
    type: 'object',
    additionalProperties: true,
    properties: {
      success: { type: 'boolean', enum: [true] },
      data: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/TeacherActivityAnalyticsRow' },
          },
        },
      },
      meta: paginationSchema,
    },
  },
  TeacherAssessmentAnalyticsListResponse: {
    type: 'object',
    additionalProperties: true,
    properties: {
      success: { type: 'boolean', enum: [true] },
      data: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/TeacherAssessmentAnalyticsRow' },
          },
        },
      },
      meta: paginationSchema,
    },
  },
  TeacherStudentProgressResponse: {
    type: 'object',
    additionalProperties: true,
    properties: {
      success: { type: 'boolean', enum: [true] },
      data: { type: 'object', additionalProperties: true },
    },
  },
};
