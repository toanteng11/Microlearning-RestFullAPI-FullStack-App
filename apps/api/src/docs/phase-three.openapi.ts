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

function ok(description: string, schema: Schema, example: unknown): OpenAPIV3.ResponseObject {
  return { description, content: jsonContent(schema, example) };
}

function error(description: string, code: string): OpenAPIV3.ResponseObject {
  return ok(description, errorSchema, {
    success: false,
    error: { code, message: description },
    meta: {
      requestId: '019c5cb4-0b51-7000-8000-000000000003',
      timestamp: '2026-07-19T10:00:00.000Z',
      path: '/api/v1/classrooms',
    },
  });
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
const rateLimited = error('Too many requests. Try again later', 'RATE_LIMITED');

const classroomIdParameter: OpenAPIV3.ParameterObject = {
  name: 'classroomId',
  in: 'path',
  required: true,
  schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
  example: '507f1f77bcf86cd799439021',
};
const studentIdParameter: OpenAPIV3.ParameterObject = {
  name: 'studentId',
  in: 'path',
  required: true,
  schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
  example: '507f1f77bcf86cd799439022',
};
const linkIdParameter: OpenAPIV3.ParameterObject = {
  name: 'linkId',
  in: 'path',
  required: true,
  schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
  example: '507f1f77bcf86cd799439023',
};

const listParameters: OpenAPIV3.ParameterObject[] = [
  { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
  {
    name: 'limit',
    in: 'query',
    schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
  },
  {
    name: 'keyword',
    in: 'query',
    schema: { type: 'string', minLength: 1, maxLength: 100 },
  },
  { name: 'status', in: 'query', schema: { $ref: '#/components/schemas/ClassroomStatus' } },
  {
    name: 'sortOrder',
    in: 'query',
    schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
  },
];

const classroomExample = {
  id: '507f1f77bcf86cd799439021',
  name: 'Node.js Microlearning',
  description: 'Internal backend class',
  subject: 'Backend Development',
  section: 'SE-01',
  owner: { id: '507f1f77bcf86cd799439024', fullName: 'Nguyen Van An' },
  status: 'ACTIVE',
  enrollmentStatus: 'OPEN',
  membership: null,
  archivedAt: null,
  createdAt: '2026-07-19T09:00:00.000Z',
  updatedAt: '2026-07-19T09:00:00.000Z',
};
const credentialExample = {
  id: '507f1f77bcf86cd799439023',
  status: 'ACTIVE',
  maskedCode: '****-9KLM',
  generatedAt: '2026-07-19T09:00:00.000Z',
  expiresAt: null,
  createdAt: '2026-07-19T09:00:00.000Z',
  updatedAt: '2026-07-19T09:00:00.000Z',
};
const paginationExample = {
  page: 1,
  limit: 20,
  totalItems: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

export const PHASE_THREE_OPENAPI_OPERATIONS = [
  'listClassrooms',
  'createClassroom',
  'getClassroom',
  'updateClassroom',
  'archiveClassroom',
  'updateClassroomSettings',
  'listClassroomStudents',
  'removeClassroomStudent',
  'getClassCode',
  'regenerateClassCode',
  'disableClassCode',
  'listClassroomInviteLinks',
  'createClassroomInviteLink',
  'regenerateClassroomInviteLink',
  'disableClassroomInviteLink',
  'previewClassroomInviteLink',
  'joinClassroomByCode',
  'joinClassroomByToken',
  'getEnrollmentPolicy',
  'updateEnrollmentPolicy',
  'listAdminClassrooms',
  'getAdminClassroom',
] as const;

export const phaseThreeTags: OpenAPIV3.TagObject[] = [
  { name: 'Classrooms', description: 'Teacher-owned and Student-enrolled Classroom workflows' },
  { name: 'Classroom Credentials', description: 'Class Code and manual Invite Link lifecycle' },
  { name: 'Classroom Enrollment', description: 'Public preview, join, roster and removal' },
  { name: 'Classroom Governance', description: 'Admin enrollment policy and governance views' },
];

export const phaseThreeSchemas: Record<string, Schema> = {
  ClassroomStatus: { type: 'string', enum: ['ACTIVE', 'LOCKED', 'ARCHIVED'] },
  ClassroomEnrollmentStatus: { type: 'string', enum: ['OPEN', 'CLOSED', 'LOCKED'] },
  ClassroomOwner: {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'fullName'],
    properties: { id: { type: 'string' }, fullName: { type: 'string' } },
  },
  EnrollmentSummary: {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'classroomId', 'studentId', 'status', 'joinedBy', 'joinedAt', 'updatedAt'],
    properties: {
      id: { type: 'string' },
      classroomId: { type: 'string' },
      studentId: { type: 'string' },
      status: { type: 'string', enum: ['ACTIVE', 'REMOVED', 'LEFT', 'BLOCKED'] },
      joinedBy: { type: 'string', enum: ['CLASS_CODE', 'INVITE_LINK'] },
      joinedAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  ClassroomSummary: {
    type: 'object',
    additionalProperties: false,
    required: [
      'id',
      'name',
      'description',
      'subject',
      'section',
      'owner',
      'status',
      'enrollmentStatus',
      'membership',
      'archivedAt',
      'createdAt',
      'updatedAt',
    ],
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      description: { type: 'string', nullable: true },
      subject: { type: 'string', nullable: true },
      section: { type: 'string', nullable: true },
      owner: { $ref: '#/components/schemas/ClassroomOwner' },
      status: { $ref: '#/components/schemas/ClassroomStatus' },
      enrollmentStatus: { $ref: '#/components/schemas/ClassroomEnrollmentStatus' },
      membership: { allOf: [{ $ref: '#/components/schemas/EnrollmentSummary' }], nullable: true },
      archivedAt: { type: 'string', format: 'date-time', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  ClassroomSettings: {
    type: 'object',
    additionalProperties: false,
    required: ['enrollmentStatus', 'allowClassCodeJoin', 'allowInviteLinkJoin'],
    properties: {
      enrollmentStatus: { $ref: '#/components/schemas/ClassroomEnrollmentStatus' },
      allowClassCodeJoin: { type: 'boolean' },
      allowInviteLinkJoin: { type: 'boolean' },
    },
  },
  ClassroomDetail: {
    allOf: [
      { $ref: '#/components/schemas/ClassroomSummary' },
      {
        type: 'object',
        required: ['configuredSettings', 'effectiveSettings', 'allowedActions'],
        properties: {
          configuredSettings: { $ref: '#/components/schemas/ClassroomSettings' },
          effectiveSettings: { $ref: '#/components/schemas/ClassroomSettings' },
          allowedActions: { type: 'array', items: { type: 'string' } },
        },
      },
    ],
  },
  CreateClassroomRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 120 },
      description: { type: 'string', nullable: true, maxLength: 1000 },
      subject: { type: 'string', nullable: true, maxLength: 120 },
      section: { type: 'string', nullable: true, maxLength: 120 },
    },
  },
  UpdateClassroomRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['expectedUpdatedAt'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 120 },
      description: { type: 'string', nullable: true, maxLength: 1000 },
      subject: { type: 'string', nullable: true, maxLength: 120 },
      section: { type: 'string', nullable: true, maxLength: 120 },
      expectedUpdatedAt: { type: 'string', format: 'date-time' },
    },
  },
  ArchiveClassroomRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['reason', 'expectedUpdatedAt'],
    properties: {
      reason: { type: 'string', minLength: 5, maxLength: 500 },
      expectedUpdatedAt: { type: 'string', format: 'date-time' },
    },
  },
  UpdateClassroomSettingsRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['expectedUpdatedAt'],
    properties: {
      enrollmentStatus: { $ref: '#/components/schemas/ClassroomEnrollmentStatus' },
      allowClassCodeJoin: { type: 'boolean' },
      allowInviteLinkJoin: { type: 'boolean' },
      expectedUpdatedAt: { type: 'string', format: 'date-time' },
    },
  },
  CredentialMutationRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['expectedCredentialUpdatedAt', 'reason'],
    properties: {
      expectedCredentialUpdatedAt: { type: 'string', format: 'date-time' },
      reason: { type: 'string', minLength: 5, maxLength: 500 },
      expiresInDays: { type: 'integer', minimum: 1, maximum: 90 },
    },
  },
  CreateInviteLinkRequest: {
    type: 'object',
    additionalProperties: false,
    properties: { expiresInDays: { type: 'integer', minimum: 1, maximum: 90 } },
  },
  JoinByCodeRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['code'],
    properties: { code: { type: 'string', example: '7KMQ-9RTP' } },
  },
  TokenRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['token'],
    properties: { token: { type: 'string', example: 'synthetic-opaque-token-value-not-valid' } },
  },
  RemoveStudentRequest: {
    type: 'object',
    additionalProperties: false,
    required: ['reason', 'expectedEnrollmentUpdatedAt'],
    properties: {
      reason: { type: 'string', minLength: 3, maxLength: 500 },
      expectedEnrollmentUpdatedAt: { type: 'string', format: 'date-time' },
    },
  },
  UpdateEnrollmentPolicyRequest: {
    type: 'object',
    additionalProperties: false,
    required: [
      'allowClassCodeJoin',
      'allowInviteLinkJoin',
      'defaultInviteLinkLifetimeDays',
      'expectedRevision',
      'reason',
    ],
    properties: {
      allowClassCodeJoin: { type: 'boolean' },
      allowInviteLinkJoin: { type: 'boolean' },
      defaultInviteLinkLifetimeDays: { type: 'integer', minimum: 1, maximum: 90 },
      expectedRevision: { type: 'integer', minimum: 1 },
      reason: { type: 'string', minLength: 5, maxLength: 500 },
    },
  },
  ClassroomListResponse: {
    type: 'object',
    required: ['success', 'data', 'pagination', 'filters'],
    properties: {
      success: { type: 'boolean', enum: [true] },
      data: { type: 'array', items: { $ref: '#/components/schemas/ClassroomSummary' } },
      pagination: { $ref: '#/components/schemas/Pagination' },
      filters: { type: 'object', additionalProperties: true },
    },
  },
  ClassroomDetailResponse: {
    type: 'object',
    required: ['success', 'data'],
    properties: {
      success: { type: 'boolean', enum: [true] },
      data: {
        type: 'object',
        required: ['classroom'],
        properties: { classroom: { $ref: '#/components/schemas/ClassroomDetail' } },
      },
    },
  },
  PhaseThreeSuccessResponse: {
    type: 'object',
    required: ['success', 'data'],
    properties: {
      success: { type: 'boolean', enum: [true] },
      data: { type: 'object', additionalProperties: true },
    },
  },
};

export function createPhaseThreePaths(): OpenAPIV3.PathsObject {
  const classroomListExample = {
    success: true,
    data: [classroomExample],
    pagination: paginationExample,
    filters: { keyword: null, status: null },
  };
  const detailExample = {
    success: true,
    data: {
      classroom: {
        ...classroomExample,
        configuredSettings: {
          enrollmentStatus: 'OPEN',
          allowClassCodeJoin: true,
          allowInviteLinkJoin: true,
        },
        effectiveSettings: {
          enrollmentStatus: 'OPEN',
          allowClassCodeJoin: true,
          allowInviteLinkJoin: true,
        },
        allowedActions: ['VIEW', 'UPDATE'],
      },
    },
  };
  const protectedErrors = { '401': unauthorized, '403': forbidden, '422': validation };

  return {
    '/api/v1/classrooms': {
      get: {
        tags: ['Classrooms'],
        operationId: 'listClassrooms',
        summary: 'Danh sách Classroom theo scope của Teacher hoặc Student',
        security: bearerSecurity,
        parameters: [
          ...listParameters,
          {
            name: 'enrollmentStatus',
            in: 'query',
            schema: { $ref: '#/components/schemas/ClassroomEnrollmentStatus' },
          },
          {
            name: 'sortBy',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['name', 'status', 'createdAt', 'updatedAt', 'joinedAt'],
            },
          },
        ],
        responses: {
          '200': ok('Classroom list', { $ref: '#/components/schemas/ClassroomListResponse' }, classroomListExample),
          ...protectedErrors,
        },
      },
      post: {
        tags: ['Classrooms'],
        operationId: 'createClassroom',
        summary: 'Teacher tạo Classroom mới',
        security: bearerSecurity,
        requestBody: body('CreateClassroomRequest', {
          name: 'Node.js Microlearning',
          description: 'Internal backend class',
          subject: 'Backend Development',
          section: 'SE-01',
        }),
        responses: {
          '201': ok('Classroom created with optional one-time Class Code', { $ref: '#/components/schemas/PhaseThreeSuccessResponse' }, { success: true, data: { classroom: detailExample.data.classroom, classCode: '7KMQ-9RTP', auditId: '507f1f77bcf86cd799439025' } }),
          ...protectedErrors,
        },
      },
    },
    '/api/v1/classrooms/{classroomId}': {
      get: {
        tags: ['Classrooms'], operationId: 'getClassroom', summary: 'Xem Classroom theo object scope', security: bearerSecurity, parameters: [classroomIdParameter],
        responses: { '200': ok('Classroom detail', { $ref: '#/components/schemas/ClassroomDetailResponse' }, detailExample), ...protectedErrors, '404': notFound },
      },
      patch: {
        tags: ['Classrooms'], operationId: 'updateClassroom', summary: 'Owner Teacher cập nhật Classroom bằng CAS', security: bearerSecurity, parameters: [classroomIdParameter],
        requestBody: body('UpdateClassroomRequest', { name: 'Node.js Microlearning Updated', expectedUpdatedAt: '2026-07-19T09:00:00.000Z' }),
        responses: { '200': ok('Classroom updated', { $ref: '#/components/schemas/PhaseThreeSuccessResponse' }, { success: true, data: { classroom: detailExample.data.classroom, auditId: '507f1f77bcf86cd799439025' } }), ...protectedErrors, '404': notFound, '409': conflict },
      },
      delete: {
        tags: ['Classrooms'], operationId: 'archiveClassroom', summary: 'Owner Teacher lưu trữ mềm Classroom', security: bearerSecurity, parameters: [classroomIdParameter],
        requestBody: body('ArchiveClassroomRequest', { reason: 'End of academic term', expectedUpdatedAt: '2026-07-19T09:00:00.000Z' }),
        responses: { '204': { description: 'Classroom archived' }, ...protectedErrors, '404': notFound, '409': conflict },
      },
    },
    '/api/v1/classrooms/{classroomId}/settings': {
      patch: {
        tags: ['Classrooms'], operationId: 'updateClassroomSettings', summary: 'Cập nhật cấu hình enrollment và join', security: bearerSecurity, parameters: [classroomIdParameter],
        requestBody: body('UpdateClassroomSettingsRequest', { enrollmentStatus: 'OPEN', allowClassCodeJoin: true, allowInviteLinkJoin: true, expectedUpdatedAt: '2026-07-19T09:00:00.000Z' }),
        responses: { '200': ok('Configured and effective settings', { $ref: '#/components/schemas/PhaseThreeSuccessResponse' }, { success: true, data: { configuredSettings: detailExample.data.classroom.configuredSettings, effectiveSettings: detailExample.data.classroom.effectiveSettings, updatedAt: '2026-07-19T09:10:00.000Z' } }), ...protectedErrors, '404': notFound, '409': conflict },
      },
    },
    '/api/v1/classrooms/{classroomId}/students': {
      get: {
        tags: ['Classroom Enrollment'], operationId: 'listClassroomStudents', summary: 'Owner Teacher xem roster', security: bearerSecurity, parameters: [classroomIdParameter, ...listParameters, { name: 'enrollmentStatus', in: 'query', schema: { type: 'string', enum: ['ACTIVE', 'REMOVED', 'LEFT', 'BLOCKED'] } }, { name: 'accountStatus', in: 'query', schema: { $ref: '#/components/schemas/UserStatus' } }, { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['fullName', 'email', 'joinedAt', 'status'] } }],
        responses: { '200': ok('Paginated roster', { $ref: '#/components/schemas/PhaseThreeSuccessResponse' }, { success: true, data: [], pagination: paginationExample, filters: { enrollmentStatus: 'ACTIVE' } }), ...protectedErrors, '404': notFound },
      },
    },
    '/api/v1/classrooms/{classroomId}/students/{studentId}/remove': {
      post: {
        tags: ['Classroom Enrollment'], operationId: 'removeClassroomStudent', summary: 'Owner Teacher remove Student bằng CAS', security: bearerSecurity, parameters: [classroomIdParameter, studentIdParameter],
        requestBody: body('RemoveStudentRequest', { reason: 'Student moved to another class', expectedEnrollmentUpdatedAt: '2026-07-19T09:00:00.000Z' }),
        responses: { '200': ok('Enrollment removed', { $ref: '#/components/schemas/PhaseThreeSuccessResponse' }, { success: true, data: { enrollment: { id: '507f1f77bcf86cd799439026', status: 'REMOVED' }, auditId: '507f1f77bcf86cd799439025' } }), ...protectedErrors, '404': notFound, '409': conflict },
      },
    },
    '/api/v1/classrooms/{classroomId}/class-code': {
      get: {
        tags: ['Classroom Credentials'], operationId: 'getClassCode', summary: 'Xem metadata Class Code, không trả raw/digest', security: bearerSecurity, parameters: [classroomIdParameter],
        responses: { '200': ok('Class Code metadata', { $ref: '#/components/schemas/PhaseThreeSuccessResponse' }, { success: true, data: { credential: credentialExample } }), ...protectedErrors, '404': notFound },
      },
    },
    '/api/v1/classrooms/{classroomId}/class-code/regenerate': {
      post: {
        tags: ['Classroom Credentials'], operationId: 'regenerateClassCode', summary: 'Rotate Class Code và trả raw một lần', security: bearerSecurity, parameters: [classroomIdParameter],
        requestBody: body('CredentialMutationRequest', { expectedCredentialUpdatedAt: '2026-07-19T09:00:00.000Z', reason: 'Rotate shared code' }),
        responses: { '200': ok('New Class Code issued', { $ref: '#/components/schemas/PhaseThreeSuccessResponse' }, { success: true, data: { credential: credentialExample, classCode: '7KMQ-9RTP', auditId: '507f1f77bcf86cd799439025' } }), ...protectedErrors, '404': notFound, '409': conflict },
      },
    },
    '/api/v1/classrooms/{classroomId}/class-code/disable': {
      post: {
        tags: ['Classroom Credentials'], operationId: 'disableClassCode', summary: 'Vô hiệu hóa Class Code', security: bearerSecurity, parameters: [classroomIdParameter], requestBody: body('CredentialMutationRequest', { expectedCredentialUpdatedAt: '2026-07-19T09:00:00.000Z', reason: 'Close code enrollment' }),
        responses: { '200': ok('Class Code disabled', { $ref: '#/components/schemas/PhaseThreeSuccessResponse' }, { success: true, data: { credential: { ...credentialExample, status: 'DISABLED' }, alreadyDisabled: false } }), ...protectedErrors, '404': notFound, '409': conflict },
      },
    },
    '/api/v1/classrooms/{classroomId}/invite-links': {
      get: {
        tags: ['Classroom Credentials'], operationId: 'listClassroomInviteLinks', summary: 'Danh sách metadata Invite Link', security: bearerSecurity, parameters: [classroomIdParameter],
        responses: { '200': ok('Invite Link metadata history', { $ref: '#/components/schemas/PhaseThreeSuccessResponse' }, { success: true, data: [{ id: credentialExample.id, status: 'ACTIVE', expiresAt: '2026-08-18T09:00:00.000Z', createdAt: credentialExample.createdAt, updatedAt: credentialExample.updatedAt }] }), ...protectedErrors, '404': notFound },
      },
      post: {
        tags: ['Classroom Credentials'], operationId: 'createClassroomInviteLink', summary: 'Tạo Invite Link và trả link một lần', security: bearerSecurity, parameters: [classroomIdParameter], requestBody: body('CreateInviteLinkRequest', { expiresInDays: 30 }),
        responses: { '201': ok('Invite Link issued', { $ref: '#/components/schemas/PhaseThreeSuccessResponse' }, { success: true, data: { credential: credentialExample, inviteLink: 'https://microlearning.example/join/invite#token=synthetic-one-time-token' } }), ...protectedErrors, '404': notFound, '409': conflict },
      },
    },
    '/api/v1/classrooms/{classroomId}/invite-links/{linkId}/regenerate': {
      post: {
        tags: ['Classroom Credentials'], operationId: 'regenerateClassroomInviteLink', summary: 'Rotate Invite Link', security: bearerSecurity, parameters: [classroomIdParameter, linkIdParameter], requestBody: body('CredentialMutationRequest', { expectedCredentialUpdatedAt: '2026-07-19T09:00:00.000Z', reason: 'Rotate shared link', expiresInDays: 30 }),
        responses: { '200': ok('New Invite Link issued', { $ref: '#/components/schemas/PhaseThreeSuccessResponse' }, { success: true, data: { credential: credentialExample, inviteLink: 'https://microlearning.example/join/invite#token=synthetic-new-token' } }), ...protectedErrors, '404': notFound, '409': conflict },
      },
    },
    '/api/v1/classrooms/{classroomId}/invite-links/{linkId}/disable': {
      post: {
        tags: ['Classroom Credentials'], operationId: 'disableClassroomInviteLink', summary: 'Vô hiệu hóa Invite Link', security: bearerSecurity, parameters: [classroomIdParameter, linkIdParameter], requestBody: body('CredentialMutationRequest', { expectedCredentialUpdatedAt: '2026-07-19T09:00:00.000Z', reason: 'Close link enrollment' }),
        responses: { '200': ok('Invite Link disabled', { $ref: '#/components/schemas/PhaseThreeSuccessResponse' }, { success: true, data: { credential: { ...credentialExample, status: 'DISABLED' } } }), ...protectedErrors, '404': notFound, '409': conflict },
      },
    },
    '/api/v1/classrooms/invite-links/preview': {
      post: {
        tags: ['Classroom Enrollment'], operationId: 'previewClassroomInviteLink', summary: 'Public preview an toàn của Invite Link', security: [], requestBody: body('TokenRequest', { token: 'synthetic-opaque-token-value-not-valid' }),
        responses: { '200': ok('Safe Classroom preview', { $ref: '#/components/schemas/PhaseThreeSuccessResponse' }, { success: true, data: { classroomName: 'Node.js Microlearning', subject: 'Backend Development', teacher: { fullName: 'Nguyen Van An' }, joinable: true, expiresAt: '2026-08-18T09:00:00.000Z' } }), '422': validation, '429': rateLimited },
      },
    },
    '/api/v1/classrooms/join-by-code': {
      post: {
        tags: ['Classroom Enrollment'], operationId: 'joinClassroomByCode', summary: 'Student tham gia bằng Class Code', security: bearerSecurity, requestBody: body('JoinByCodeRequest', { code: '7KMQ-9RTP' }),
        responses: { '200': ok('Already enrolled idempotent result', { $ref: '#/components/schemas/PhaseThreeSuccessResponse' }, { success: true, data: { classroom: classroomExample, alreadyEnrolled: true, nextAction: 'OPEN_CLASSROOM' } }), '201': ok('Enrollment created', { $ref: '#/components/schemas/PhaseThreeSuccessResponse' }, { success: true, data: { classroom: classroomExample, alreadyEnrolled: false, nextAction: 'OPEN_CLASSROOM' } }), ...protectedErrors, '409': conflict, '429': rateLimited },
      },
    },
    '/api/v1/classrooms/join-by-token': {
      post: {
        tags: ['Classroom Enrollment'], operationId: 'joinClassroomByToken', summary: 'Student tham gia bằng Invite Link token', security: bearerSecurity, requestBody: body('TokenRequest', { token: 'synthetic-opaque-token-value-not-valid' }),
        responses: { '200': ok('Already enrolled idempotent result', { $ref: '#/components/schemas/PhaseThreeSuccessResponse' }, { success: true, data: { classroom: classroomExample, alreadyEnrolled: true, nextAction: 'OPEN_CLASSROOM' } }), '201': ok('Enrollment created', { $ref: '#/components/schemas/PhaseThreeSuccessResponse' }, { success: true, data: { classroom: classroomExample, alreadyEnrolled: false, nextAction: 'OPEN_CLASSROOM' } }), ...protectedErrors, '409': conflict, '429': rateLimited },
      },
    },
    '/api/v1/admin/settings/enrollment-policy': {
      get: {
        tags: ['Classroom Governance'], operationId: 'getEnrollmentPolicy', summary: 'Admin xem Enrollment Policy', security: bearerSecurity,
        responses: { '200': ok('Current policy and revision', { $ref: '#/components/schemas/PhaseThreeSuccessResponse' }, { success: true, data: { policy: { allowClassCodeJoin: true, allowInviteLinkJoin: true, defaultInviteLinkLifetimeDays: 30, revision: 1, updatedBy: null, createdAt: '2026-07-19T09:00:00.000Z', updatedAt: '2026-07-19T09:00:00.000Z' } } }), ...protectedErrors },
      },
      patch: {
        tags: ['Classroom Governance'], operationId: 'updateEnrollmentPolicy', summary: 'Admin cập nhật Enrollment Policy bằng revision', security: bearerSecurity, requestBody: body('UpdateEnrollmentPolicyRequest', { allowClassCodeJoin: true, allowInviteLinkJoin: true, defaultInviteLinkLifetimeDays: 30, expectedRevision: 1, reason: 'Academic term policy review' }),
        responses: { '200': ok('Policy updated and audited', { $ref: '#/components/schemas/PhaseThreeSuccessResponse' }, { success: true, data: { policy: { allowClassCodeJoin: true, allowInviteLinkJoin: true, defaultInviteLinkLifetimeDays: 30, revision: 2 }, auditId: '507f1f77bcf86cd799439025' } }), ...protectedErrors, '409': conflict },
      },
    },
    '/api/v1/admin/classrooms': {
      get: {
        tags: ['Classroom Governance'], operationId: 'listAdminClassrooms', summary: 'Admin xem danh sách governance và memberCount', security: bearerSecurity, parameters: [...listParameters, { name: 'enrollmentStatus', in: 'query', schema: { $ref: '#/components/schemas/ClassroomEnrollmentStatus' } }, { name: 'ownerTeacherId', in: 'query', schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } }, { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['name', 'status', 'createdAt', 'updatedAt'] } }],
        responses: { '200': ok('Governance list', { $ref: '#/components/schemas/PhaseThreeSuccessResponse' }, { ...classroomListExample, data: [{ ...classroomExample, memberCount: 12 }] }), ...protectedErrors },
      },
    },
    '/api/v1/admin/classrooms/{classroomId}': {
      get: {
        tags: ['Classroom Governance'], operationId: 'getAdminClassroom', summary: 'Admin xem Classroom governance detail', security: bearerSecurity, parameters: [classroomIdParameter],
        responses: { '200': ok('Governance detail', { $ref: '#/components/schemas/PhaseThreeSuccessResponse' }, { success: true, data: { classroom: { ...classroomExample, memberCount: 12 } } }), ...protectedErrors, '404': notFound },
      },
    },
  };
}
