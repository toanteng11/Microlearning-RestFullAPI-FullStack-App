import type { OpenAPIV3 } from 'openapi-types';

type SchemaMap = Record<string, OpenAPIV3.SchemaObject>;

const security: OpenAPIV3.SecurityRequirementObject[] = [{ bearerAuth: [] }];
const errorResponse = {
  content: {
    'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
  },
};
const protectedErrors = {
  '400': { description: 'The bounded report query is invalid', ...errorResponse },
  '401': { description: 'Authentication is required', ...errorResponse },
  '403': { description: 'Admin reporting permission is required', ...errorResponse },
  '422': { description: 'The requested date range exceeds the configured limit', ...errorResponse },
  '503': { description: 'Reporting is disabled', ...errorResponse },
} satisfies OpenAPIV3.ResponsesObject;

const count = { type: 'integer', minimum: 0 } as const;
const userStatuses = ['PENDING', 'ACTIVE', 'INACTIVE', 'BLOCKED', 'DELETED'] as const;
const roles = ['STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN'] as const;

function fixedCountMap(keys: readonly string[]): OpenAPIV3.SchemaObject {
  return {
    type: 'object',
    additionalProperties: false,
    required: [...keys],
    properties: Object.fromEntries(keys.map((key) => [key, count])),
  };
}

function queryParameter(
  name: string,
  schema: OpenAPIV3.SchemaObject,
): OpenAPIV3.ParameterObject {
  return { name, in: 'query', schema };
}

const dateRangeParameters: OpenAPIV3.ParameterObject[] = [
  queryParameter('from', {
    oneOf: [
      { type: 'string', format: 'date' },
      { type: 'string', format: 'date-time' },
    ],
  }),
  queryParameter('to', {
    oneOf: [
      { type: 'string', format: 'date' },
      { type: 'string', format: 'date-time' },
    ],
  }),
  queryParameter('timezone', { type: 'string', example: 'Asia/Ho_Chi_Minh' }),
];

export const PHASE_SIX_ADMIN_REPORTING_OPENAPI_OPERATIONS = [
  'getAdminReportingDashboard',
  'getAdminGovernanceReport',
  'listAdminReportingAuditLogs',
] as const;

export const phaseSixAdminReportingTags: OpenAPIV3.TagObject[] = [
  {
    name: 'Admin Reporting',
    description: 'Platform governance counts and redacted audit metadata for Admin roles',
  },
];

export const phaseSixAdminReportingSchemas: SchemaMap = {
  AdminUserStatusCounts: {
    ...fixedCountMap(['total', ...userStatuses]),
  },
  AdminUsersByRole: {
    type: 'object',
    additionalProperties: false,
    required: [...roles],
    properties: Object.fromEntries(
      roles.map((role) => [role, { $ref: '#/components/schemas/AdminUserStatusCounts' }]),
    ),
  },
  AdminRegistrationSourceCounts: fixedCountMap([
    'SELF_REGISTRATION',
    'TEACHER_INVITATION',
    'ADMIN_BOOTSTRAP',
  ]),
  AdminInvitationCounts: fixedCountMap(['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED']),
  AdminClassroomCounts: fixedCountMap(['ACTIVE', 'LOCKED', 'ARCHIVED']),
  AdminCourseCounts: fixedCountMap([
    'DRAFT',
    'SCHEDULED',
    'PUBLISHED',
    'UNPUBLISHED',
    'ARCHIVED',
  ]),
  AdminEnrollmentCounts: fixedCountMap(['ACTIVE', 'REMOVED', 'LEFT', 'BLOCKED']),
  AdminAuditSummary: {
    type: 'object',
    additionalProperties: false,
    required: [
      'id',
      'actorId',
      'actorRole',
      'action',
      'resourceType',
      'resourceId',
      'requestId',
      'createdAt',
    ],
    properties: {
      id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
      actorId: { type: 'string', pattern: '^[a-fA-F0-9]{24}$', nullable: true },
      actorRole: { type: 'string', enum: [...roles, 'SYSTEM'] },
      action: { type: 'string', minLength: 1, maxLength: 100 },
      resourceType: { type: 'string', minLength: 1, maxLength: 100 },
      resourceId: { type: 'string', minLength: 1, maxLength: 100 },
      requestId: { type: 'string', minLength: 1, maxLength: 200 },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  AdminDashboardData: {
    type: 'object',
    additionalProperties: false,
    required: [
      'users',
      'registrationSources',
      'invitations',
      'classrooms',
      'courses',
      'activeEnrollmentCount',
      'recentGovernanceEvents',
      'allowedActions',
      'reporting',
    ],
    properties: {
      users: { $ref: '#/components/schemas/AdminUsersByRole' },
      registrationSources: { $ref: '#/components/schemas/AdminRegistrationSourceCounts' },
      invitations: { $ref: '#/components/schemas/AdminInvitationCounts' },
      classrooms: { $ref: '#/components/schemas/AdminClassroomCounts' },
      courses: { $ref: '#/components/schemas/AdminCourseCounts' },
      activeEnrollmentCount: count,
      recentGovernanceEvents: {
        type: 'array',
        maxItems: 20,
        items: { $ref: '#/components/schemas/AdminAuditSummary' },
      },
      allowedActions: { type: 'array', items: { type: 'string' } },
      reporting: { $ref: '#/components/schemas/ReportMetadata' },
    },
  },
  AdminGovernanceReportData: {
    type: 'object',
    additionalProperties: false,
    required: [
      'users',
      'registrationSources',
      'invitations',
      'classrooms',
      'courses',
      'enrollments',
      'allowedActions',
      'reporting',
    ],
    properties: {
      users: { $ref: '#/components/schemas/AdminUsersByRole' },
      registrationSources: { $ref: '#/components/schemas/AdminRegistrationSourceCounts' },
      invitations: { $ref: '#/components/schemas/AdminInvitationCounts' },
      classrooms: { $ref: '#/components/schemas/AdminClassroomCounts' },
      courses: { $ref: '#/components/schemas/AdminCourseCounts' },
      enrollments: { $ref: '#/components/schemas/AdminEnrollmentCounts' },
      allowedActions: { type: 'array', items: { type: 'string' } },
      reporting: { $ref: '#/components/schemas/ReportMetadata' },
    },
  },
  AdminAuditListData: {
    type: 'object',
    additionalProperties: false,
    required: ['items', 'reporting'],
    properties: {
      items: {
        type: 'array',
        maxItems: 50,
        items: { $ref: '#/components/schemas/AdminAuditSummary' },
      },
      reporting: { $ref: '#/components/schemas/ReportMetadata' },
    },
  },
  AdminDashboardResponse: {
    type: 'object',
    additionalProperties: false,
    required: ['success', 'data'],
    properties: {
      success: { type: 'boolean', enum: [true] },
      data: { $ref: '#/components/schemas/AdminDashboardData' },
    },
  },
  AdminGovernanceReportResponse: {
    type: 'object',
    additionalProperties: false,
    required: ['success', 'data'],
    properties: {
      success: { type: 'boolean', enum: [true] },
      data: { $ref: '#/components/schemas/AdminGovernanceReportData' },
    },
  },
  AdminAuditListResponse: {
    type: 'object',
    additionalProperties: false,
    required: ['success', 'data', 'meta'],
    properties: {
      success: { type: 'boolean', enum: [true] },
      data: { $ref: '#/components/schemas/AdminAuditListData' },
      meta: { $ref: '#/components/schemas/Pagination' },
    },
  },
};

export function createPhaseSixAdminReportingPaths(): OpenAPIV3.PathsObject {
  return {
    '/api/v1/admin/dashboard': {
      get: {
        tags: ['Admin Reporting'],
        operationId: 'getAdminReportingDashboard',
        summary: 'Get the platform governance dashboard',
        security,
        parameters: [
          queryParameter('timezone', { type: 'string', example: 'Asia/Ho_Chi_Minh' }),
          queryParameter('recentLimit', {
            type: 'integer',
            minimum: 1,
            maximum: 20,
            default: 10,
          }),
        ],
        responses: {
          '200': {
            description: 'Role/status/source counts and recent safe audit metadata',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AdminDashboardResponse' },
              },
            },
          },
          ...protectedErrors,
        },
      },
    },
    '/api/v1/admin/reports/governance': {
      get: {
        tags: ['Admin Reporting'],
        operationId: 'getAdminGovernanceReport',
        summary: 'Get bounded lifecycle governance counts',
        security,
        parameters: [
          ...dateRangeParameters,
          queryParameter('role', { type: 'string', enum: [...roles] }),
          queryParameter('userStatus', { type: 'string', enum: [...userStatuses] }),
          queryParameter('invitationStatus', {
            type: 'string',
            enum: ['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'],
          }),
          queryParameter('classroomStatus', {
            type: 'string',
            enum: ['ACTIVE', 'LOCKED', 'ARCHIVED'],
          }),
          queryParameter('courseStatus', {
            type: 'string',
            enum: ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'],
          }),
        ],
        responses: {
          '200': {
            description: 'Filtered governance lifecycle counts',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AdminGovernanceReportResponse' },
              },
            },
          },
          ...protectedErrors,
        },
      },
    },
    '/api/v1/admin/audit-logs': {
      get: {
        tags: ['Admin Reporting'],
        operationId: 'listAdminReportingAuditLogs',
        summary: 'List redacted audit metadata with bounded filters',
        security,
        parameters: [
          queryParameter('page', { type: 'integer', minimum: 1, default: 1 }),
          queryParameter('limit', { type: 'integer', minimum: 1, maximum: 50, default: 20 }),
          ...dateRangeParameters,
          queryParameter('actorRole', { type: 'string', enum: [...roles, 'SYSTEM'] }),
          queryParameter('action', { type: 'string', minLength: 1, maxLength: 100 }),
          queryParameter('resourceType', { type: 'string', minLength: 1, maxLength: 100 }),
          queryParameter('resourceId', { type: 'string', minLength: 1, maxLength: 100 }),
          queryParameter('sortOrder', {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'desc',
          }),
        ],
        responses: {
          '200': {
            description: 'Safe AuditLog projection; raw state and metadata are omitted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AdminAuditListResponse' },
              },
            },
          },
          ...protectedErrors,
        },
      },
    },
  };
}
