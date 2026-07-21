import type { OpenAPIV3 } from 'openapi-types';

type Schema = OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject;

const bearerSecurity: OpenAPIV3.SecurityRequirementObject[] = [{ bearerAuth: [] }];
const errorSchema = { $ref: '#/components/schemas/ErrorResponse' } as const;

function jsonContent(schema: Schema, example?: unknown) {
  return {
    'application/json': {
      schema,
      ...(example === undefined ? {} : { example }),
    },
  };
}

function ok(description: string, example: unknown): OpenAPIV3.ResponseObject {
  return {
    description,
    content: jsonContent({ $ref: '#/components/schemas/PhaseFourSuccessResponse' }, example),
  };
}

function error(description: string, code: string): OpenAPIV3.ResponseObject {
  return {
    description,
    content: jsonContent(errorSchema, {
      success: false,
      error: { code, message: description },
      meta: {
        requestId: '019d0000-0000-7000-8000-000000000004',
        timestamp: '2026-07-20T08:00:00.000Z',
        path: '/api/v1/courses/507f1f77bcf86cd799439041',
      },
    }),
  };
}

function body(schema: string, example: unknown): OpenAPIV3.RequestBodyObject {
  return {
    required: true,
    content: jsonContent({ $ref: `#/components/schemas/${schema}` }, example),
  };
}

const unauthorized = error('Authentication is required', 'AUTHENTICATION_REQUIRED');
const forbidden = error('Access is denied', 'ACCESS_DENIED');
const notFound = error('Resource was not found', 'RESOURCE_NOT_FOUND');
const validation = error('Request data is invalid', 'VALIDATION_ERROR');
const conflict = error('Resource state conflicts with this request', 'CONCURRENT_MODIFICATION');
const protectedErrors = { '401': unauthorized, '403': forbidden, '422': validation };

const courseIdParameter: OpenAPIV3.ParameterObject = {
  name: 'courseId',
  in: 'path',
  required: true,
  schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
  example: '507f1f77bcf86cd799439041',
};
const moduleIdParameter: OpenAPIV3.ParameterObject = {
  name: 'moduleId',
  in: 'path',
  required: true,
  schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
  example: '507f1f77bcf86cd799439042',
};

const courseExample = {
  id: '507f1f77bcf86cd799439041',
  classroomId: '507f1f77bcf86cd799439021',
  title: 'Backend Fundamentals',
  description: 'Short REST API lessons',
  status: 'DRAFT',
  effectiveStatus: 'DRAFT',
  scheduledPublishAt: null,
  publishedAt: null,
  unpublishedAt: null,
  archivedAt: null,
  displayOrder: 0,
  structureRevision: 0,
  createdAt: '2026-07-20T08:00:00.000Z',
  updatedAt: '2026-07-20T08:00:00.000Z',
  allowedActions: ['VIEW', 'UPDATE', 'CHANGE_STATUS', 'MANAGE_STRUCTURE', 'ARCHIVE'],
};
const moduleExample = {
  id: '507f1f77bcf86cd799439042',
  courseId: courseExample.id,
  title: 'Module 1 - REST Basics',
  description: 'Core REST concepts',
  status: 'DRAFT',
  displayOrder: 0,
  archivedAt: null,
  createdAt: '2026-07-20T08:05:00.000Z',
  updatedAt: '2026-07-20T08:05:00.000Z',
  allowedActions: ['VIEW', 'UPDATE', 'CHANGE_STATUS', 'ARCHIVE'],
};
const auditId = '507f1f77bcf86cd799439050';

export const PHASE_FOUR_OPENAPI_OPERATIONS = [
  'listCourses',
  'createCourse',
  'getCourse',
  'updateCourse',
  'changeCourseStatus',
  'archiveCourse',
  'listCourseModules',
  'createCourseModule',
  'updateCourseModule',
  'changeCourseModuleStatus',
  'archiveCourseModule',
  'reorderCourseModules',
] as const;

export const phaseFourTags: OpenAPIV3.TagObject[] = [
  { name: 'Courses', description: 'Teacher authoring and enrolled Student Course views' },
  { name: 'Modules', description: 'Course structure, lifecycle and atomic ordering' },
];

const timestampProperty: OpenAPIV3.SchemaObject = {
  type: 'string',
  format: 'date-time',
  nullable: true,
};

export const phaseFourSchemas: Record<string, Schema> = {
  ContentStatus: {
    type: 'string',
    enum: ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'],
  },
  ModuleStatus: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'] },
  Course: {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'classroomId', 'title', 'description', 'displayOrder'],
    properties: {
      id: { type: 'string' },
      classroomId: { type: 'string' },
      title: { type: 'string', minLength: 2, maxLength: 150 },
      description: { type: 'string', maxLength: 5_000 },
      status: { $ref: '#/components/schemas/ContentStatus' },
      effectiveStatus: { $ref: '#/components/schemas/ContentStatus' },
      scheduledPublishAt: timestampProperty,
      publishedAt: timestampProperty,
      unpublishedAt: timestampProperty,
      archivedAt: timestampProperty,
      displayOrder: { type: 'integer', minimum: 0 },
      structureRevision: { type: 'integer', minimum: 0 },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      allowedActions: { type: 'array', items: { type: 'string' } },
    },
  },
  CourseModule: {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'courseId', 'title', 'description', 'displayOrder'],
    properties: {
      id: { type: 'string' },
      courseId: { type: 'string' },
      title: { type: 'string', minLength: 2, maxLength: 150 },
      description: { type: 'string', maxLength: 2_000 },
      status: { $ref: '#/components/schemas/ModuleStatus' },
      displayOrder: { type: 'integer', minimum: 0 },
      archivedAt: timestampProperty,
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      allowedActions: { type: 'array', items: { type: 'string' } },
    },
  },
  CreateCourseRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['classroomId', 'title'],
    properties: {
      classroomId: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
      title: { type: 'string', minLength: 2, maxLength: 150 },
      description: { type: 'string', maxLength: 5_000 },
    },
  },
  UpdateCourseRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['expectedUpdatedAt'],
    properties: {
      title: { type: 'string', minLength: 2, maxLength: 150 },
      description: { type: 'string', maxLength: 5_000 },
      expectedUpdatedAt: { type: 'string', format: 'date-time' },
    },
  },
  ChangeCourseStatusRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['targetStatus', 'expectedUpdatedAt'],
    properties: {
      targetStatus: {
        type: 'string',
        enum: ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'UNPUBLISHED'],
      },
      scheduledPublishAt: timestampProperty,
      expectedUpdatedAt: { type: 'string', format: 'date-time' },
    },
  },
  ArchiveContentRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['expectedUpdatedAt'],
    properties: {
      reason: { type: 'string', minLength: 5, maxLength: 500 },
      expectedUpdatedAt: { type: 'string', format: 'date-time' },
    },
  },
  CreateModuleRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['title'],
    properties: {
      title: { type: 'string', minLength: 2, maxLength: 150 },
      description: { type: 'string', maxLength: 2_000 },
    },
  },
  UpdateModuleRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['expectedUpdatedAt'],
    properties: {
      title: { type: 'string', minLength: 2, maxLength: 150 },
      description: { type: 'string', maxLength: 2_000 },
      expectedUpdatedAt: { type: 'string', format: 'date-time' },
    },
  },
  ChangeModuleStatusRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['targetStatus', 'expectedUpdatedAt'],
    properties: {
      targetStatus: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'UNPUBLISHED'] },
      expectedUpdatedAt: { type: 'string', format: 'date-time' },
    },
  },
  ReorderModulesRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['orderedModuleIds', 'expectedStructureRevision'],
    properties: {
      orderedModuleIds: {
        type: 'array',
        minItems: 1,
        maxItems: 500,
        items: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
      },
      expectedStructureRevision: { type: 'integer', minimum: 0 },
    },
  },
  PhaseFourSuccessResponse: {
    type: 'object',
    required: ['success', 'data'],
    properties: {
      success: { type: 'boolean', enum: [true] },
      data: { type: 'object', additionalProperties: true },
      meta: { type: 'object', additionalProperties: true },
    },
  },
};

export function createPhaseFourPaths(): OpenAPIV3.PathsObject {
  const courseMutation = { success: true, data: { course: courseExample, auditId } };
  const moduleMutation = { success: true, data: { module: moduleExample, auditId } };
  const courseErrors = { ...protectedErrors, '404': notFound, '409': conflict };

  return {
    '/api/v1/courses': {
      get: {
        tags: ['Courses'],
        operationId: 'listCourses',
        summary: 'List Courses by owned or enrolled Classroom scope',
        security: bearerSecurity,
        parameters: [
          {
            name: 'classroomId',
            in: 'query',
            required: true,
            schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
          },
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string', minLength: 1, maxLength: 100 },
          },
          {
            name: 'status',
            in: 'query',
            schema: { $ref: '#/components/schemas/ContentStatus' },
          },
          {
            name: 'sortBy',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['displayOrder', 'title', 'createdAt', 'updatedAt'],
              default: 'displayOrder',
            },
          },
          {
            name: 'sortOrder',
            in: 'query',
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
          },
        ],
        responses: {
          '200': ok('Role-scoped Course list', {
            success: true,
            data: { items: [courseExample] },
            meta: {
              page: 1,
              limit: 20,
              totalItems: 1,
              totalPages: 1,
              hasNextPage: false,
              hasPreviousPage: false,
            },
          }),
          ...protectedErrors,
          '404': notFound,
        },
      },
      post: {
        tags: ['Courses'],
        operationId: 'createCourse',
        summary: 'Owner Teacher creates a draft Course',
        security: bearerSecurity,
        requestBody: body('CreateCourseRequest', {
          classroomId: courseExample.classroomId,
          title: courseExample.title,
          description: courseExample.description,
        }),
        responses: { '201': ok('Course created', courseMutation), ...courseErrors },
      },
    },
    '/api/v1/courses/{courseId}': {
      get: {
        tags: ['Courses'],
        operationId: 'getCourse',
        summary: 'Get role-projected Course detail',
        security: bearerSecurity,
        parameters: [courseIdParameter],
        responses: {
          '200': ok('Course detail', { success: true, data: { course: courseExample } }),
          ...protectedErrors,
          '404': notFound,
        },
      },
      patch: {
        tags: ['Courses'],
        operationId: 'updateCourse',
        summary: 'Update editable Course metadata with CAS',
        security: bearerSecurity,
        parameters: [courseIdParameter],
        requestBody: body('UpdateCourseRequest', {
          title: 'Backend Fundamentals Updated',
          expectedUpdatedAt: courseExample.updatedAt,
        }),
        responses: { '200': ok('Course updated', courseMutation), ...courseErrors },
      },
      delete: {
        tags: ['Courses'],
        operationId: 'archiveCourse',
        summary: 'Soft archive a Course without deleting children',
        security: bearerSecurity,
        parameters: [courseIdParameter],
        requestBody: body('ArchiveContentRequest', {
          reason: 'Course is no longer used',
          expectedUpdatedAt: courseExample.updatedAt,
        }),
        responses: { '204': { description: 'Course archived' }, ...courseErrors },
      },
    },
    '/api/v1/courses/{courseId}/status': {
      patch: {
        tags: ['Courses'],
        operationId: 'changeCourseStatus',
        summary: 'Schedule, publish or unpublish a Course',
        security: bearerSecurity,
        parameters: [courseIdParameter],
        requestBody: body('ChangeCourseStatusRequest', {
          targetStatus: 'PUBLISHED',
          scheduledPublishAt: null,
          expectedUpdatedAt: courseExample.updatedAt,
        }),
        responses: { '200': ok('Course lifecycle changed', courseMutation), ...courseErrors },
      },
    },
    '/api/v1/courses/{courseId}/modules': {
      get: {
        tags: ['Modules'],
        operationId: 'listCourseModules',
        summary: 'List role-projected Modules in canonical order',
        security: bearerSecurity,
        parameters: [courseIdParameter],
        responses: {
          '200': ok('Module list', { success: true, data: { items: [moduleExample] } }),
          ...protectedErrors,
          '404': notFound,
        },
      },
      post: {
        tags: ['Modules'],
        operationId: 'createCourseModule',
        summary: 'Create a draft Module and advance structure revision',
        security: bearerSecurity,
        parameters: [courseIdParameter],
        requestBody: body('CreateModuleRequest', {
          title: moduleExample.title,
          description: moduleExample.description,
        }),
        responses: { '201': ok('Module created', moduleMutation), ...courseErrors },
      },
    },
    '/api/v1/modules/{moduleId}': {
      patch: {
        tags: ['Modules'],
        operationId: 'updateCourseModule',
        summary: 'Update Module metadata with CAS',
        security: bearerSecurity,
        parameters: [moduleIdParameter],
        requestBody: body('UpdateModuleRequest', {
          title: 'REST Constraints',
          expectedUpdatedAt: moduleExample.updatedAt,
        }),
        responses: { '200': ok('Module updated', moduleMutation), ...courseErrors },
      },
      delete: {
        tags: ['Modules'],
        operationId: 'archiveCourseModule',
        summary: 'Soft archive a Module and preserve Lessons',
        security: bearerSecurity,
        parameters: [moduleIdParameter],
        requestBody: body('ArchiveContentRequest', {
          reason: 'Module replaced by a new sequence',
          expectedUpdatedAt: moduleExample.updatedAt,
        }),
        responses: { '204': { description: 'Module archived' }, ...courseErrors },
      },
    },
    '/api/v1/modules/{moduleId}/status': {
      patch: {
        tags: ['Modules'],
        operationId: 'changeCourseModuleStatus',
        summary: 'Publish or unpublish a Module',
        security: bearerSecurity,
        parameters: [moduleIdParameter],
        requestBody: body('ChangeModuleStatusRequest', {
          targetStatus: 'PUBLISHED',
          expectedUpdatedAt: moduleExample.updatedAt,
        }),
        responses: { '200': ok('Module lifecycle changed', moduleMutation), ...courseErrors },
      },
    },
    '/api/v1/courses/{courseId}/modules/reorder': {
      patch: {
        tags: ['Modules'],
        operationId: 'reorderCourseModules',
        summary: 'Atomically reorder the exact active Module set',
        security: bearerSecurity,
        parameters: [courseIdParameter],
        requestBody: body('ReorderModulesRequest', {
          orderedModuleIds: [moduleExample.id],
          expectedStructureRevision: 1,
        }),
        responses: {
          '200': ok('Modules reordered', {
            success: true,
            data: { items: [moduleExample], structureRevision: 2, auditId },
          }),
          ...courseErrors,
        },
      },
    },
  };
}
