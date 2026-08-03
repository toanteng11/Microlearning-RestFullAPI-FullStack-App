import type { OpenAPIV3 } from 'openapi-types';

type SchemaMap = Record<string, OpenAPIV3.SchemaObject>;

const nullablePercentage: OpenAPIV3.SchemaObject = {
  type: 'number',
  minimum: 0,
  maximum: 100,
  nullable: true,
};

export const phaseSixReportingTags: OpenAPIV3.TagObject[] = [
  {
    name: 'Reporting',
    description:
      'Versioned reporting contracts. API paths are introduced only by their approved execution parts.',
  },
];

export const phaseSixReportingSchemas: SchemaMap = {
  ReportFreshnessStatus: {
    type: 'string',
    enum: ['FRESH', 'STALE', 'PARTIAL', 'REBUILDING', 'FAILED'],
  },
  ReportDataState: {
    type: 'string',
    enum: ['READY', 'NO_DATA', 'SUPPRESSED'],
  },
  ReportingProgressStatus: {
    type: 'string',
    enum: ['NOT_STARTED', 'IN_PROGRESS', 'MISSING', 'COMPLETED', 'LATE'],
  },
  ReportingInvalidationReason: {
    type: 'string',
    enum: [
      'ROSTER_CHANGED',
      'GOVERNANCE_CHANGED',
      'ACTIVITY_CHANGED',
      'PROGRESS_CHANGED',
      'ASSESSMENT_CHANGED',
      'GRADE_CHANGED',
      'DEADLINE_EXCEPTION_CHANGED',
      'METRIC_VERSION_CHANGED',
      'MANUAL_REBUILD',
    ],
  },
  ReportFreshness: {
    type: 'object',
    additionalProperties: false,
    required: [
      'status',
      'recalculatedAt',
      'sourceChangedAt',
      'staleAfterSeconds',
      'failedItemsCount',
    ],
    properties: {
      status: { $ref: '#/components/schemas/ReportFreshnessStatus' },
      recalculatedAt: { type: 'string', format: 'date-time', nullable: true },
      sourceChangedAt: { type: 'string', format: 'date-time', nullable: true },
      staleAfterSeconds: { type: 'integer', minimum: 1 },
      failedItemsCount: { type: 'integer', minimum: 0 },
    },
  },
  ReportMetadata: {
    type: 'object',
    additionalProperties: false,
    required: [
      'reportId',
      'definitionVersion',
      'sourceMetricVersion',
      'descriptorVersion',
      'dataState',
      'timezone',
      'asOf',
      'generatedAt',
      'freshness',
      'filters',
    ],
    properties: {
      reportId: { type: 'string', minLength: 1 },
      definitionVersion: { type: 'string', minLength: 1 },
      sourceMetricVersion: { type: 'string', nullable: true },
      descriptorVersion: { type: 'string', nullable: true },
      dataState: { $ref: '#/components/schemas/ReportDataState' },
      timezone: { type: 'string', example: 'Asia/Ho_Chi_Minh' },
      asOf: { type: 'string', format: 'date-time' },
      generatedAt: { type: 'string', format: 'date-time' },
      freshness: { $ref: '#/components/schemas/ReportFreshness' },
      filters: {
        type: 'object',
        additionalProperties: {
          oneOf: [
            { type: 'string' },
            { type: 'number' },
            { type: 'boolean' },
            { type: 'array', items: { type: 'string' } },
          ],
          nullable: true,
        },
      },
    },
  },
  CourseProgressSummary: {
    type: 'object',
    additionalProperties: false,
    required: [
      'courseId',
      'studentId',
      'requiredActivityCount',
      'completedRequiredCount',
      'progressPercentage',
      'processScore',
      'missingActivityCount',
      'lateActivityCount',
      'ungradedActivityCount',
      'returnedGradeCount',
      'returnedGradeAverage',
      'lastActiveAt',
      'courseCompleted',
      'supportFlags',
    ],
    properties: {
      courseId: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
      studentId: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
      requiredActivityCount: { type: 'integer', minimum: 0 },
      completedRequiredCount: { type: 'integer', minimum: 0 },
      progressPercentage: nullablePercentage,
      processScore: nullablePercentage,
      missingActivityCount: { type: 'integer', minimum: 0 },
      lateActivityCount: { type: 'integer', minimum: 0 },
      ungradedActivityCount: { type: 'integer', minimum: 0 },
      returnedGradeCount: { type: 'integer', minimum: 0 },
      returnedGradeAverage: nullablePercentage,
      lastActiveAt: { type: 'string', format: 'date-time', nullable: true },
      courseCompleted: { type: 'boolean' },
      supportFlags: {
        type: 'array',
        uniqueItems: true,
        items: {
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
    },
  },
};
