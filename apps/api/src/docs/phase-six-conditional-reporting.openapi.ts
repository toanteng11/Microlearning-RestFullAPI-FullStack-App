import type { OpenAPIV3 } from 'openapi-types';

type SchemaMap = Record<string, OpenAPIV3.SchemaObject>;
const security: OpenAPIV3.SecurityRequirementObject[] = [{ bearerAuth: [] }];
const objectId = { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } as const;
const errorResponse = {
  content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
};
const protectedErrors = {
  '400': { description: 'Strict request validation failed', ...errorResponse },
  '401': { description: 'Authentication is required', ...errorResponse },
  '403': { description: 'The actor or object scope is not authorized', ...errorResponse },
  '409': { description: 'The conditional capability is not enabled', ...errorResponse },
  '422': { description: 'A date, row or privacy bound was not satisfied', ...errorResponse },
  '429': { description: 'The event rate limit was exceeded', ...errorResponse },
} satisfies OpenAPIV3.ResponsesObject;

const dateParameters: OpenAPIV3.ParameterObject[] = [
  { name: 'from', in: 'query', schema: { type: 'string' } },
  { name: 'to', in: 'query', schema: { type: 'string' } },
  {
    name: 'timezone',
    in: 'query',
    schema: { type: 'string', example: 'Asia/Ho_Chi_Minh' },
  },
];
const courseIdParameter: OpenAPIV3.ParameterObject = {
  name: 'courseId',
  in: 'path',
  required: true,
  schema: objectId,
};
const csvResponse: OpenAPIV3.ResponseObject = {
  description: 'Bounded UTF-8 CSV stream with formula-injection protection',
  headers: {
    'Content-Disposition': { schema: { type: 'string' } },
    'X-Report-Row-Count': { schema: { type: 'integer', minimum: 0 } },
  },
  content: { 'text/csv': { schema: { type: 'string' } } },
};

export const PHASE_SIX_CONDITIONAL_REPORTING_OPENAPI_OPERATIONS = [
  'getStudentProgressTrend',
  'exportTeacherCourseProgressCsv',
  'exportTeacherCourseGradebookCsv',
  'getAdminAnalyticsAdoption',
  'getAdminLearningOutcomes',
  'exportAdminGovernanceCsv',
  'exportAdminAuditCsv',
  'ingestAnalyticsEvent',
] as const;

export const phaseSixConditionalReportingTags: OpenAPIV3.TagObject[] = [
  {
    name: 'Conditional Reporting',
    description: 'Flag-gated CSV, trend, privacy aggregate and analytics event contracts',
  },
];

export const phaseSixConditionalReportingSchemas: SchemaMap = {
  StudentProgressTrendPoint: {
    type: 'object',
    additionalProperties: false,
    required: [
      'capturedAt',
      'progressPercentage',
      'processScore',
      'returnedGradeAverage',
      'completedRequiredCount',
      'requiredActivityCount',
      'missingCount',
      'lateCount',
    ],
    properties: {
      capturedAt: { type: 'string', format: 'date-time' },
      progressPercentage: { type: 'number', minimum: 0, maximum: 100, nullable: true },
      processScore: { type: 'number', minimum: 0, maximum: 100, nullable: true },
      returnedGradeAverage: { type: 'number', minimum: 0, maximum: 100, nullable: true },
      completedRequiredCount: { type: 'integer', minimum: 0 },
      requiredActivityCount: { type: 'integer', minimum: 0 },
      missingCount: { type: 'integer', minimum: 0 },
      lateCount: { type: 'integer', minimum: 0 },
    },
  },
  StudentProgressTrendData: {
    type: 'object',
    additionalProperties: false,
    required: ['course', 'points', 'change', 'noDataReason', 'reporting'],
    properties: {
      course: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'title'],
        properties: { id: objectId, title: { type: 'string' } },
      },
      points: {
        type: 'array',
        items: { $ref: '#/components/schemas/StudentProgressTrendPoint' },
      },
      change: {
        type: 'object',
        additionalProperties: false,
        required: ['progressPercentage', 'processScore', 'returnedGradeAverage'],
        properties: {
          progressPercentage: { type: 'number', nullable: true },
          processScore: { type: 'number', nullable: true },
          returnedGradeAverage: { type: 'number', nullable: true },
        },
      },
      noDataReason: {
        type: 'string',
        enum: ['INSUFFICIENT_SNAPSHOTS', 'INCOMPATIBLE_VERSION'],
        nullable: true,
      },
      reporting: { $ref: '#/components/schemas/ReportMetadata' },
    },
  },
  AdminLearningOutcomeRow: {
    type: 'object',
    additionalProperties: false,
    required: [
      'course',
      'studentCountBucket',
      'averageProgressPercentage',
      'completionPercentage',
      'returnedGradeAverage',
      'missingActivityCount',
      'lateActivityCount',
      'dataState',
      'suppressionReason',
    ],
    properties: {
      course: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'title', 'status'],
        properties: {
          id: objectId,
          title: { type: 'string' },
          status: {
            type: 'string',
            enum: ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'],
          },
        },
      },
      studentCountBucket: { type: 'string' },
      averageProgressPercentage: { type: 'number', nullable: true },
      completionPercentage: { type: 'number', nullable: true },
      returnedGradeAverage: { type: 'number', nullable: true },
      missingActivityCount: { type: 'integer', nullable: true },
      lateActivityCount: { type: 'integer', nullable: true },
      dataState: { type: 'string', enum: ['READY', 'SUPPRESSED'] },
      suppressionReason: { type: 'string', enum: ['SMALL_GROUP'], nullable: true },
    },
  },
  AdminLearningOutcomeData: {
    type: 'object',
    additionalProperties: false,
    required: ['items', 'reporting'],
    properties: {
      items: { type: 'array', items: { $ref: '#/components/schemas/AdminLearningOutcomeRow' } },
      reporting: { $ref: '#/components/schemas/ReportMetadata' },
    },
  },
  AdminAnalyticsAdoptionRow: {
    type: 'object',
    additionalProperties: false,
    required: [
      'periodStart',
      'eventName',
      'actorRole',
      'eventCount',
      'distinctActorCountBucket',
      'dataState',
      'suppressionReason',
    ],
    properties: {
      periodStart: { type: 'string', format: 'date-time' },
      eventName: { type: 'string' },
      actorRole: { type: 'string' },
      eventCount: { type: 'integer', nullable: true },
      distinctActorCountBucket: { type: 'string' },
      dataState: { type: 'string', enum: ['READY', 'SUPPRESSED'] },
      suppressionReason: { type: 'string', enum: ['SMALL_GROUP'], nullable: true },
    },
  },
  AdminAnalyticsAdoptionData: {
    type: 'object',
    additionalProperties: false,
    required: ['items', 'reporting'],
    properties: {
      items: { type: 'array', items: { $ref: '#/components/schemas/AdminAnalyticsAdoptionRow' } },
      reporting: { $ref: '#/components/schemas/ReportMetadata' },
    },
  },
  StudentProgressTrendResponse: {
    type: 'object',
    additionalProperties: false,
    required: ['success', 'data'],
    properties: {
      success: { type: 'boolean', enum: [true] },
      data: { $ref: '#/components/schemas/StudentProgressTrendData' },
    },
  },
  AdminLearningOutcomeResponse: {
    type: 'object',
    additionalProperties: false,
    required: ['success', 'data'],
    properties: {
      success: { type: 'boolean', enum: [true] },
      data: { $ref: '#/components/schemas/AdminLearningOutcomeData' },
    },
  },
  AdminAnalyticsAdoptionResponse: {
    type: 'object',
    additionalProperties: false,
    required: ['success', 'data'],
    properties: {
      success: { type: 'boolean', enum: [true] },
      data: { $ref: '#/components/schemas/AdminAnalyticsAdoptionData' },
    },
  },
  AnalyticsEventInput: {
    type: 'object',
    additionalProperties: false,
    required: ['eventId', 'eventName', 'schemaVersion', 'occurredAt', 'context', 'properties'],
    properties: {
      eventId: { type: 'string', format: 'uuid' },
      eventName: {
        type: 'string',
        enum: [
          'account_activated',
          'login_succeeded',
          'classroom_created',
          'classroom_joined',
          'course_published',
          'lesson_started',
          'lesson_completed',
          'quiz_started',
          'quiz_submitted',
          'assignment_opened',
          'assignment_submitted',
          'submission_graded',
          'deadline_exception_created',
          'teacher_invitation_created',
          'teacher_invitation_accepted',
          'report_export_requested',
          'report_export_completed',
          'report_viewed',
          'report_filter_changed',
          'report_tab_changed',
        ],
      },
      schemaVersion: { type: 'string', enum: ['1'] },
      occurredAt: { type: 'string', format: 'date-time' },
      context: {
        type: 'object',
        additionalProperties: false,
        properties: {
          classroomId: objectId,
          courseId: objectId,
          activityType: { type: 'string', enum: ['LESSON', 'QUIZ', 'ASSIGNMENT'] },
          activityId: objectId,
        },
      },
      properties: {
        type: 'object',
        additionalProperties: false,
        properties: {
          reportId: { type: 'string', maxLength: 100 },
          surface: { type: 'string', maxLength: 100 },
          filterName: { type: 'string', maxLength: 100 },
          tabName: { type: 'string', maxLength: 100 },
          lifecycleStatus: { type: 'string', maxLength: 50 },
          durationBucket: { type: 'string', enum: ['LT_10S', '10S_1M', '1M_5M', 'GT_5M'] },
          rowCountBucket: { type: 'string', enum: ['0', '1_9', '10_49', '50_199', '200_PLUS'] },
          result: { type: 'string', enum: ['SUCCESS', 'FAILED'] },
          clientVersion: { type: 'string', maxLength: 50 },
        },
      },
    },
  },
  ConditionalDataResponse: {
    type: 'object',
    additionalProperties: false,
    required: ['success', 'data'],
    properties: { success: { type: 'boolean', enum: [true] }, data: { type: 'object' } },
  },
};

function jsonResponse(schema: string): OpenAPIV3.ResponseObject {
  return {
    description: 'Conditional report response',
    content: { 'application/json': { schema: { $ref: `#/components/schemas/${schema}` } } },
  };
}

export function createPhaseSixConditionalReportingPaths(): OpenAPIV3.PathsObject {
  const exportQuery = [
    { name: 'search', in: 'query', schema: { type: 'string', maxLength: 100 } },
    { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
  ] satisfies OpenAPIV3.ParameterObject[];
  return {
    '/api/v1/students/me/progress/trend': {
      get: {
        tags: ['Conditional Reporting'],
        operationId: 'getStudentProgressTrend',
        summary: 'Get non-interpolated compatible progress snapshots',
        security,
        parameters: [
          { name: 'courseId', in: 'query', required: true, schema: objectId },
          ...dateParameters,
        ],
        responses: {
          '200': jsonResponse('StudentProgressTrendResponse'),
          ...protectedErrors,
        },
      },
    },
    '/api/v1/teacher/courses/{courseId}/progress/export': {
      get: {
        tags: ['Conditional Reporting'],
        operationId: 'exportTeacherCourseProgressCsv',
        summary: 'Stream an owned Course progress CSV',
        security,
        parameters: [courseIdParameter, ...exportQuery],
        responses: { '200': csvResponse, ...protectedErrors },
      },
    },
    '/api/v1/teacher/courses/{courseId}/gradebook/export': {
      get: {
        tags: ['Conditional Reporting'],
        operationId: 'exportTeacherCourseGradebookCsv',
        summary: 'Stream an owned bounded Gradebook CSV',
        security,
        parameters: [courseIdParameter, ...exportQuery],
        responses: { '200': csvResponse, ...protectedErrors },
      },
    },
    '/api/v1/admin/reports/adoption': {
      get: {
        tags: ['Conditional Reporting'],
        operationId: 'getAdminAnalyticsAdoption',
        summary: 'Get privacy-threshold analytics adoption aggregates',
        security,
        parameters: [
          ...dateParameters,
          { name: 'interval', in: 'query', schema: { type: 'string', enum: ['DAY', 'WEEK', 'MONTH'] } },
        ],
        responses: { '200': jsonResponse('AdminAnalyticsAdoptionResponse'), ...protectedErrors },
      },
    },
    '/api/v1/admin/reports/learning-outcomes': {
      get: {
        tags: ['Conditional Reporting'],
        operationId: 'getAdminLearningOutcomes',
        summary: 'Get aggregate-only learning outcomes with small-group suppression',
        security,
        parameters: [
          ...dateParameters,
          {
            name: 'courseStatus',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'],
            },
          },
        ],
        responses: { '200': jsonResponse('AdminLearningOutcomeResponse'), ...protectedErrors },
      },
    },
    '/api/v1/admin/reports/governance/export': {
      get: {
        tags: ['Conditional Reporting'],
        operationId: 'exportAdminGovernanceCsv',
        summary: 'Stream aggregate governance CSV only',
        security,
        parameters: dateParameters,
        responses: { '200': csvResponse, ...protectedErrors },
      },
    },
    '/api/v1/admin/audit-logs/export': {
      get: {
        tags: ['Conditional Reporting'],
        operationId: 'exportAdminAuditCsv',
        summary: 'Stream redacted AuditLog CSV',
        security,
        parameters: [...dateParameters, ...exportQuery],
        responses: { '200': csvResponse, ...protectedErrors },
      },
    },
    '/api/v1/analytics/events': {
      post: {
        tags: ['Conditional Reporting'],
        operationId: 'ingestAnalyticsEvent',
        summary: 'Ingest a strict allowlisted idempotent analytics event',
        security,
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/AnalyticsEventInput' } },
          },
        },
        responses: {
          '200': jsonResponse('ConditionalDataResponse'),
          '202': jsonResponse('ConditionalDataResponse'),
          '413': { description: 'The event body exceeds the configured byte limit', ...errorResponse },
          ...protectedErrors,
        },
      },
    },
  };
}
