import type { OpenAPIV3 } from 'openapi-types';

type Schema = OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject;

const security: OpenAPIV3.SecurityRequirementObject[] = [{ bearerAuth: [] }];
const objectIdPattern = '^[a-fA-F0-9]{24}$';

function content(schema: Schema, example?: unknown) {
  return { 'application/json': { schema, ...(example === undefined ? {} : { example }) } };
}

function success(description: string, example: unknown): OpenAPIV3.ResponseObject {
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
          requestId: '019d0000-0000-7000-8000-000000000070',
          timestamp: '2026-07-20T08:00:00.000Z',
          path: '/api/v1/classrooms/507f1f77bcf86cd799439021/announcements',
        },
      },
    ),
  };
}

function body(schemaName: string, example: unknown): OpenAPIV3.RequestBodyObject {
  return {
    required: true,
    content: content({ $ref: `#/components/schemas/${schemaName}` }, example),
  };
}

const protectedErrors = {
  '401': error('Authentication is required', 'AUTHENTICATION_REQUIRED'),
  '403': error('Access is denied', 'ACCESS_DENIED'),
  '404': error('Resource was not found', 'RESOURCE_NOT_FOUND'),
  '422': error('Request data is invalid', 'VALIDATION_ERROR'),
};

const conflict = error('Resource state or revision conflicts with this request', 'CONCURRENT_MODIFICATION');
const classroomId: OpenAPIV3.ParameterObject = {
  name: 'classroomId',
  in: 'path',
  required: true,
  schema: { type: 'string', pattern: objectIdPattern },
};
const announcementId: OpenAPIV3.ParameterObject = {
  name: 'announcementId',
  in: 'path',
  required: true,
  schema: { type: 'string', pattern: objectIdPattern },
};
const courseId: OpenAPIV3.ParameterObject = {
  name: 'courseId',
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
  schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
};

const teacherAnnouncement = {
  id: '507f1f77bcf86cd799439071',
  classroomId: '507f1f77bcf86cd799439021',
  content: 'Complete the HTTP lesson before Friday.',
  contentHtml: '<p>Complete the HTTP lesson before Friday.</p>',
  status: 'PUBLISHED',
  effectiveStatus: 'PUBLISHED',
  scheduledPublishAt: null,
  publishedAt: '2026-07-20T08:00:00.000Z',
  unpublishedAt: null,
  archivedAt: null,
  createdAt: '2026-07-20T07:55:00.000Z',
  updatedAt: '2026-07-20T08:00:00.000Z',
  allowedActions: ['VIEW', 'CHANGE_STATUS', 'ARCHIVE'],
};

const governanceCourse = {
  id: '507f1f77bcf86cd799439041',
  title: 'REST API Foundations',
  status: 'PUBLISHED',
  effectiveStatus: 'PUBLISHED',
  scheduledPublishAt: null,
  publishedAt: '2026-07-20T08:00:00.000Z',
  archivedAt: null,
  classroom: {
    id: '507f1f77bcf86cd799439021',
    name: 'Backend 01',
    status: 'ACTIVE',
  },
  owner: { id: '507f1f77bcf86cd799439031', fullName: 'Nguyen Van Teacher' },
  moduleCount: 2,
  lessonCount: 8,
  createdAt: '2026-07-19T08:00:00.000Z',
  updatedAt: '2026-07-20T08:00:00.000Z',
};

export const PHASE_FOUR_GOVERNANCE_OPENAPI_OPERATIONS = [
  'listClassroomAnnouncements',
  'createAnnouncement',
  'updateAnnouncement',
  'changeAnnouncementStatus',
  'archiveAnnouncement',
  'listAdminCourses',
  'getAdminCourse',
] as const;

export const phaseFourGovernanceTags: OpenAPIV3.TagObject[] = [
  {
    name: 'Announcements',
    description: 'Teacher Announcement lifecycle and the enrolled Student Stream projection',
  },
  {
    name: 'Admin Content Governance',
    description: 'Read-only content metadata for Admin and Super Admin governance',
  },
];

export const phaseFourGovernanceSchemas: Record<string, Schema> = {
  AnnouncementStatus: {
    type: 'string',
    enum: ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'],
  },
  CreateAnnouncementRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['content'],
    properties: { content: { type: 'string', minLength: 1, maxLength: 10_000 } },
  },
  UpdateAnnouncementRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['content', 'expectedUpdatedAt'],
    properties: {
      content: { type: 'string', minLength: 1, maxLength: 10_000 },
      expectedUpdatedAt: { type: 'string', format: 'date-time' },
    },
  },
  ChangeAnnouncementStatusRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['targetStatus', 'expectedUpdatedAt'],
    properties: {
      targetStatus: {
        type: 'string',
        enum: ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'UNPUBLISHED'],
      },
      scheduledPublishAt: { type: 'string', format: 'date-time', nullable: true },
      expectedUpdatedAt: { type: 'string', format: 'date-time' },
    },
  },
  ArchiveAnnouncementRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['reason', 'expectedUpdatedAt'],
    properties: {
      reason: { type: 'string', minLength: 5, maxLength: 500 },
      expectedUpdatedAt: { type: 'string', format: 'date-time' },
    },
  },
  Announcement: {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'classroomId', 'contentHtml', 'publishedAt'],
    properties: {
      id: { type: 'string', pattern: objectIdPattern },
      classroomId: { type: 'string', pattern: objectIdPattern },
      teacherId: { type: 'string', pattern: objectIdPattern },
      content: { type: 'string' },
      contentHtml: { type: 'string' },
      status: { $ref: '#/components/schemas/AnnouncementStatus' },
      effectiveStatus: { $ref: '#/components/schemas/AnnouncementStatus' },
      scheduledPublishAt: { type: 'string', format: 'date-time', nullable: true },
      publishedAt: { type: 'string', format: 'date-time', nullable: true },
      unpublishedAt: { type: 'string', format: 'date-time', nullable: true },
      archivedAt: { type: 'string', format: 'date-time', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      allowedActions: { type: 'array', items: { type: 'string' } },
    },
  },
  CourseGovernanceSummary: {
    type: 'object',
    additionalProperties: false,
    required: [
      'id',
      'title',
      'status',
      'effectiveStatus',
      'classroom',
      'owner',
      'moduleCount',
      'lessonCount',
      'createdAt',
      'updatedAt',
    ],
    properties: {
      id: { type: 'string', pattern: objectIdPattern },
      title: { type: 'string' },
      status: { $ref: '#/components/schemas/AnnouncementStatus' },
      effectiveStatus: { $ref: '#/components/schemas/AnnouncementStatus' },
      scheduledPublishAt: { type: 'string', format: 'date-time', nullable: true },
      publishedAt: { type: 'string', format: 'date-time', nullable: true },
      archivedAt: { type: 'string', format: 'date-time', nullable: true },
      classroom: { type: 'object', additionalProperties: true },
      owner: { type: 'object', additionalProperties: true },
      moduleCount: { type: 'integer', minimum: 0 },
      lessonCount: { type: 'integer', minimum: 0 },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      asOf: { type: 'string', format: 'date-time' },
    },
  },
};

export function createPhaseFourGovernancePaths(): OpenAPIV3.PathsObject {
  return {
    '/api/v1/classrooms/{classroomId}/announcements': {
      get: {
        tags: ['Announcements'],
        operationId: 'listClassroomAnnouncements',
        summary: 'List Teacher authoring records or the visible Student Stream',
        security,
        parameters: [
          classroomId,
          page,
          limit,
          {
            name: 'status',
            in: 'query',
            description: 'Teacher only. Student requests with this filter are rejected.',
            schema: { $ref: '#/components/schemas/AnnouncementStatus' },
          },
        ],
        responses: {
          '200': success('Paginated Announcement list', {
            success: true,
            data: { items: [teacherAnnouncement], asOf: '2026-07-20T08:00:00.000Z' },
            meta: { page: 1, limit: 20, totalItems: 1, totalPages: 1 },
          }),
          ...protectedErrors,
        },
      },
      post: {
        tags: ['Announcements'],
        operationId: 'createAnnouncement',
        summary: 'Create a draft Announcement in an owned active Classroom',
        security,
        parameters: [classroomId],
        requestBody: body('CreateAnnouncementRequest', {
          content: 'Complete the HTTP lesson before Friday.',
        }),
        responses: {
          '201': success('Draft Announcement created with an AuditLog', {
            success: true,
            data: {
              announcement: { ...teacherAnnouncement, status: 'DRAFT', publishedAt: null },
              auditId: '507f1f77bcf86cd799439072',
            },
          }),
          ...protectedErrors,
          '409': conflict,
        },
      },
    },
    '/api/v1/announcements/{announcementId}': {
      patch: {
        tags: ['Announcements'],
        operationId: 'updateAnnouncement',
        summary: 'Update an owned draft or unpublished Announcement',
        security,
        parameters: [announcementId],
        requestBody: body('UpdateAnnouncementRequest', {
          content: 'Updated classroom notice.',
          expectedUpdatedAt: '2026-07-20T08:00:00.000Z',
        }),
        responses: {
          '200': success('Announcement updated with optimistic concurrency', {
            success: true,
            data: { announcement: teacherAnnouncement, auditId: '507f1f77bcf86cd799439072' },
          }),
          ...protectedErrors,
          '409': conflict,
        },
      },
      delete: {
        tags: ['Announcements'],
        operationId: 'archiveAnnouncement',
        summary: 'Soft archive an owned Announcement',
        security,
        parameters: [announcementId],
        requestBody: body('ArchiveAnnouncementRequest', {
          reason: 'Notice is no longer applicable',
          expectedUpdatedAt: '2026-07-20T08:00:00.000Z',
        }),
        responses: {
          '204': { description: 'Announcement archived and AuditLog recorded' },
          ...protectedErrors,
          '409': conflict,
        },
      },
    },
    '/api/v1/announcements/{announcementId}/status': {
      patch: {
        tags: ['Announcements'],
        operationId: 'changeAnnouncementStatus',
        summary: 'Schedule, publish, unpublish or return an owned Announcement to draft',
        security,
        parameters: [announcementId],
        requestBody: body('ChangeAnnouncementStatusRequest', {
          targetStatus: 'PUBLISHED',
          expectedUpdatedAt: '2026-07-20T08:00:00.000Z',
        }),
        responses: {
          '200': success('Announcement lifecycle changed with an AuditLog', {
            success: true,
            data: { announcement: teacherAnnouncement, auditId: '507f1f77bcf86cd799439072' },
          }),
          ...protectedErrors,
          '409': conflict,
        },
      },
    },
    '/api/v1/admin/courses': {
      get: {
        tags: ['Admin Content Governance'],
        operationId: 'listAdminCourses',
        summary: 'List read-only Course governance metadata',
        description: 'Requires content.governance_view. Content bodies and Student progress are excluded.',
        security,
        parameters: [
          page,
          limit,
          { name: 'search', in: 'query', schema: { type: 'string', minLength: 1, maxLength: 100 } },
          { name: 'status', in: 'query', schema: { $ref: '#/components/schemas/AnnouncementStatus' } },
          { name: 'classroomId', in: 'query', schema: { type: 'string', pattern: objectIdPattern } },
          { name: 'ownerTeacherId', in: 'query', schema: { type: 'string', pattern: objectIdPattern } },
          {
            name: 'sortBy',
            in: 'query',
            schema: { type: 'string', enum: ['title', 'status', 'createdAt', 'updatedAt'], default: 'updatedAt' },
          },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
        ],
        responses: {
          '200': success('Paginated Course governance metadata', {
            success: true,
            data: { items: [governanceCourse], asOf: '2026-07-20T08:00:00.000Z' },
            meta: { page: 1, limit: 20, totalItems: 1, totalPages: 1 },
          }),
          ...protectedErrors,
        },
      },
    },
    '/api/v1/admin/courses/{courseId}': {
      get: {
        tags: ['Admin Content Governance'],
        operationId: 'getAdminCourse',
        summary: 'Get a read-only Course governance summary',
        description: 'Requires content.governance_view. Content bodies and Student progress are excluded.',
        security,
        parameters: [courseId],
        responses: {
          '200': success('Course governance summary', {
            success: true,
            data: { course: { ...governanceCourse, asOf: '2026-07-20T08:00:00.000Z' } },
          }),
          ...protectedErrors,
        },
      },
    },
  };
}
