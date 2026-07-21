import type { OpenAPIV3 } from 'openapi-types';

import type { RuntimeInfo } from '../modules/system/system.types.js';
import { createPhaseThreePaths, phaseThreeSchemas, phaseThreeTags } from './phase-three.openapi.js';
import {
  createPhaseFourPaths,
  PHASE_FOUR_OPENAPI_OPERATIONS as PHASE_FOUR_CORE_OPENAPI_OPERATIONS,
  phaseFourSchemas,
  phaseFourTags,
} from './phase-four.openapi.js';
import {
  createPhaseFourLearningPaths,
  PHASE_FOUR_LEARNING_OPENAPI_OPERATIONS,
  phaseFourLearningSchemas,
  phaseFourLearningTags,
} from './phase-four-learning.openapi.js';
import {
  createPhaseFourProgressPaths,
  PHASE_FOUR_PROGRESS_OPENAPI_OPERATIONS,
  phaseFourProgressSchemas,
  phaseFourProgressTags,
} from './phase-four-progress.openapi.js';
import {
  createPhaseFourGovernancePaths,
  PHASE_FOUR_GOVERNANCE_OPENAPI_OPERATIONS,
  phaseFourGovernanceSchemas,
  phaseFourGovernanceTags,
} from './phase-four-governance.openapi.js';
export { PHASE_THREE_OPENAPI_OPERATIONS } from './phase-three.openapi.js';

export const PHASE_FOUR_OPENAPI_OPERATIONS = [
  ...PHASE_FOUR_CORE_OPENAPI_OPERATIONS,
  ...PHASE_FOUR_LEARNING_OPENAPI_OPERATIONS,
  ...PHASE_FOUR_PROGRESS_OPENAPI_OPERATIONS,
  ...PHASE_FOUR_GOVERNANCE_OPENAPI_OPERATIONS,
] as const;

type Schema = OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject;

const bearerSecurity: OpenAPIV3.SecurityRequirementObject[] = [{ bearerAuth: [] }];
const cookieSecurity: OpenAPIV3.SecurityRequirementObject[] = [{ refreshCookie: [] }];

function jsonContent(schema: Schema, example?: unknown): Record<string, OpenAPIV3.MediaTypeObject> {
  return {
    'application/json': {
      schema,
      ...(example === undefined ? {} : { example }),
    },
  };
}

function response(
  description: string,
  schema: Schema,
  example?: unknown,
): OpenAPIV3.ResponseObject {
  return { description, content: jsonContent(schema, example) };
}

function errorResponse(description: string, code: string): OpenAPIV3.ResponseObject {
  return response(
    description,
    { $ref: '#/components/schemas/ErrorResponse' },
    {
      success: false,
      error: { code, message: description },
      meta: {
        requestId: '019c5cb4-0b51-7000-8000-000000000001',
        timestamp: '2026-07-17T10:00:00.000Z',
        path: '/api/v1/example',
      },
    },
  );
}

const unauthorized = errorResponse('Authentication is required or no longer valid', 'UNAUTHORIZED');
const forbidden = errorResponse('The current role does not have this permission', 'FORBIDDEN');
const validationError = errorResponse(
  'The request does not match the contract',
  'VALIDATION_ERROR',
);
const notFound = errorResponse('The requested resource was not found', 'RESOURCE_NOT_FOUND');
const conflict = errorResponse(
  'The request conflicts with current resource state',
  'INVALID_STATE_TRANSITION',
);
const rateLimited = errorResponse('Too many requests. Try again later', 'RATE_LIMITED');

function requestBody(schema: Schema, example: unknown): OpenAPIV3.RequestBodyObject {
  return {
    required: true,
    content: jsonContent(schema, example),
  };
}

const userExample = {
  id: '507f1f77bcf86cd799439011',
  fullName: 'Nguyen Van An',
  email: 'student.active@example.test',
  role: 'STUDENT',
  status: 'ACTIVE',
};

const invitationExample = {
  id: '507f1f77bcf86cd799439012',
  email: 'teacher.invited@example.test',
  status: 'PENDING',
  deliveryMethod: 'MANUAL_COPY',
  invitedBy: '507f1f77bcf86cd799439013',
  expiresAt: '2026-07-24T10:00:00.000Z',
  acceptedAt: null,
  revokedAt: null,
  copyCount: 1,
  lastCopiedAt: '2026-07-17T10:05:00.000Z',
  channelHint: 'ZALO',
  createdAt: '2026-07-17T10:00:00.000Z',
  updatedAt: '2026-07-17T10:05:00.000Z',
};

const paginationParameters: OpenAPIV3.ParameterObject[] = [
  {
    name: 'page',
    in: 'query',
    schema: { type: 'integer', minimum: 1, default: 1 },
    description: 'Trang bắt đầu từ 1',
  },
  {
    name: 'limit',
    in: 'query',
    schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    description: 'Số phần tử mỗi trang',
  },
];

function adminListPath(
  operationId: string,
  summary: string,
  permission: string,
): OpenAPIV3.PathItemObject {
  return {
    get: {
      tags: ['Admin Users'],
      summary,
      operationId,
      security: bearerSecurity,
      parameters: [
        ...paginationParameters,
        {
          name: 'keyword',
          in: 'query',
          schema: { type: 'string', minLength: 1, maxLength: 100 },
          description: 'Tiền tố họ tên chuẩn hóa hoặc email',
        },
        {
          name: 'status',
          in: 'query',
          schema: { $ref: '#/components/schemas/UserStatus' },
        },
        {
          name: 'sortBy',
          in: 'query',
          schema: {
            type: 'string',
            enum: [
              'fullName',
              'email',
              'role',
              'status',
              'department',
              'lastActiveAt',
              'createdAt',
            ],
            default: 'createdAt',
          },
        },
        {
          name: 'sortOrder',
          in: 'query',
          schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        },
      ],
      responses: {
        '200': response(
          'Danh sách đúng phạm vi role, được phân trang tại server',
          { $ref: '#/components/schemas/AdminUserListResponse' },
          {
            success: true,
            data: [userExample],
            pagination: {
              page: 1,
              limit: 20,
              totalItems: 1,
              totalPages: 1,
              hasNextPage: false,
              hasPreviousPage: false,
            },
            filters: { keyword: null, status: null },
          },
        ),
        '401': unauthorized,
        '403': forbidden,
        '422': validationError,
      },
      description: `Permission bắt buộc: ${permission}.`,
    },
  };
}

export const PHASE_TWO_OPENAPI_OPERATIONS = [
  'registerStudent',
  'loginUser',
  'refreshSession',
  'logoutUser',
  'getCurrentUser',
  'updateCurrentUser',
  'listStudents',
  'listTeachers',
  'listAdmins',
  'getAdminUserDetail',
  'changeAdminUserStatus',
  'changeAdminUserRole',
  'createTeacherInvitation',
  'listTeacherInvitations',
  'getTeacherInvitation',
  'recordTeacherInvitationCopy',
  'revokeTeacherInvitation',
  'previewTeacherInvitation',
  'acceptTeacherInvitation',
] as const;

export function createOpenApiDocument(runtimeInfo: RuntimeInfo): OpenAPIV3.Document {
  const paths: OpenAPIV3.PathsObject = {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Kiểm tra API process đang hoạt động',
        operationId: 'getBasicHealth',
        security: [],
        responses: {
          '200': response('API đang hoạt động', {
            $ref: '#/components/schemas/BasicHealthResponse',
          }),
        },
      },
    },
    '/ready': {
      get: {
        tags: ['System'],
        summary: 'Kiểm tra API và MongoDB replica-set primary sẵn sàng',
        operationId: 'getReadiness',
        security: [],
        responses: {
          '200': response('API và MongoDB sẵn sàng', {
            $ref: '#/components/schemas/ReadinessResponse',
          }),
          '503': response('MongoDB chưa sẵn sàng', {
            $ref: '#/components/schemas/ReadinessResponse',
          }),
        },
      },
    },
    '/api/v1/system/version': {
      get: {
        tags: ['System'],
        summary: 'Xem phiên bản artifact đang chạy',
        operationId: 'getSystemVersion',
        security: [],
        responses: {
          '200': response('Thông tin phiên bản public-safe', {
            $ref: '#/components/schemas/VersionResponse',
          }),
        },
      },
    },
    '/api/v1/system/health': {
      get: {
        tags: ['System'],
        summary: 'Kiểm tra dependency chi tiết cho vận hành',
        operationId: 'getDetailedHealth',
        security: [],
        responses: {
          '200': response('Tất cả dependency chính hoạt động', {
            $ref: '#/components/schemas/DetailedHealthResponse',
          }),
          '503': response('Một dependency chính không sẵn sàng', {
            $ref: '#/components/schemas/DetailedHealthResponse',
          }),
        },
      },
    },
    '/api/v1/openapi.json': {
      get: {
        tags: ['System'],
        summary: 'Tải OpenAPI contract dùng bởi Swagger UI',
        operationId: 'getOpenApiDocument',
        security: [],
        responses: {
          '200': response(
            'OpenAPI 3.0 document',
            { type: 'object', additionalProperties: true },
            { openapi: '3.0.3', info: { title: 'Microlearning Classroom LMS API' } },
          ),
        },
      },
    },
    '/api/v1/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Student tự đăng ký tài khoản',
        operationId: 'registerStudent',
        security: [],
        requestBody: requestBody(
          { $ref: '#/components/schemas/RegisterRequest' },
          {
            fullName: 'Nguyen Van An',
            email: 'student.active@example.test',
            password: 'SyntheticPassword123!',
            confirmPassword: 'SyntheticPassword123!',
          },
        ),
        responses: {
          '201': response(
            'Tạo STUDENT ACTIVE; không tạo session',
            { $ref: '#/components/schemas/RegisterResponse' },
            { success: true, data: { user: userExample, nextAction: 'LOGIN' } },
          ),
          '409': errorResponse('Email is already in use', 'DUPLICATE_RESOURCE'),
          '422': validationError,
          '429': rateLimited,
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Đăng nhập và nhận access token cùng refresh cookie',
        operationId: 'loginUser',
        security: [],
        requestBody: requestBody(
          { $ref: '#/components/schemas/LoginRequest' },
          { email: 'student.active@example.test', password: 'SyntheticPassword123!' },
        ),
        responses: {
          '200': response(
            'Đăng nhập thành công; response có Cache-Control no-store',
            { $ref: '#/components/schemas/AuthSessionResponse' },
            {
              success: true,
              data: { accessToken: 'eyJ...redacted', expiresInSeconds: 900, user: userExample },
            },
          ),
          '401': errorResponse('Email or password is invalid', 'INVALID_CREDENTIALS'),
          '403': errorResponse('Account is not active', 'ACCOUNT_NOT_ACTIVE'),
          '423': errorResponse('Identity is temporarily locked', 'LOGIN_COOLDOWN_ACTIVE'),
          '422': validationError,
          '429': rateLimited,
        },
      },
    },
    '/api/v1/auth/refresh-token': {
      post: {
        tags: ['Authentication'],
        summary: 'Rotate refresh token và cấp access token mới',
        operationId: 'refreshSession',
        security: cookieSecurity,
        responses: {
          '200': response(
            'Refresh thành công và cookie được rotate',
            { $ref: '#/components/schemas/AuthSessionResponse' },
            {
              success: true,
              data: { accessToken: 'eyJ...redacted', expiresInSeconds: 900, user: userExample },
            },
          ),
          '401': unauthorized,
          '409': errorResponse('A concurrent tab should retry once', 'REFRESH_RACE_RETRY'),
          '429': rateLimited,
        },
      },
    },
    '/api/v1/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Thu hồi session family và xóa refresh cookie',
        operationId: 'logoutUser',
        security: cookieSecurity,
        responses: {
          '204': { description: 'Đã logout; không có response body' },
          '401': unauthorized,
          '422': validationError,
        },
      },
    },
    '/api/v1/users/me': {
      get: {
        tags: ['Profile'],
        summary: 'Xem hồ sơ an toàn của chính người dùng',
        operationId: 'getCurrentUser',
        security: bearerSecurity,
        responses: {
          '200': response(
            'Hồ sơ hiện tại và capabilities do server resolve',
            { $ref: '#/components/schemas/CurrentUserResponse' },
            {
              success: true,
              data: {
                user: {
                  ...userExample,
                  capabilities: [
                    'classroom.join',
                    'classroom.view_enrolled',
                    'profile.update_own',
                    'profile.view_own',
                  ],
                  avatarUrl: null,
                  studentCode: null,
                  department: null,
                  registrationSource: 'SELF_REGISTRATION',
                  activatedAt: '2026-07-17T10:00:00.000Z',
                  lastLoginAt: '2026-07-17T10:00:00.000Z',
                  createdAt: '2026-07-17T09:00:00.000Z',
                  updatedAt: '2026-07-17T10:00:00.000Z',
                },
              },
            },
          ),
          '401': unauthorized,
          '403': forbidden,
          '404': notFound,
        },
      },
      patch: {
        tags: ['Profile'],
        summary: 'Cập nhật họ tên của chính người dùng',
        operationId: 'updateCurrentUser',
        security: bearerSecurity,
        requestBody: requestBody(
          { $ref: '#/components/schemas/UpdateProfileRequest' },
          { fullName: 'Nguyen Van An Updated' },
        ),
        responses: {
          '200': response('Hồ sơ sau cập nhật', {
            $ref: '#/components/schemas/CurrentUserResponse',
          }),
          '401': unauthorized,
          '403': forbidden,
          '404': notFound,
          '422': validationError,
        },
      },
    },
    '/api/v1/admin/users/students': adminListPath(
      'listStudents',
      'Danh sách chỉ gồm Student',
      'user.view_students',
    ),
    '/api/v1/admin/users/teachers': adminListPath(
      'listTeachers',
      'Danh sách chỉ gồm Teacher',
      'user.view_teachers',
    ),
    '/api/v1/admin/users/admins': adminListPath(
      'listAdmins',
      'Danh sách chỉ gồm Admin và Super Admin',
      'user.view_admins',
    ),
    '/api/v1/admin/users/{userId}': {
      parameters: [{ $ref: '#/components/parameters/UserId' }],
      get: {
        tags: ['Admin Users'],
        summary: 'Xem chi tiết người dùng theo quyền trên target role',
        operationId: 'getAdminUserDetail',
        security: bearerSecurity,
        responses: {
          '200': response(
            'Safe detail cùng allowedActions',
            { $ref: '#/components/schemas/AdminUserDetailResponse' },
            { success: true, data: { user: { ...userExample, allowedActions: ['STATUS_BLOCK'] } } },
          ),
          '401': unauthorized,
          '403': forbidden,
          '404': notFound,
          '422': validationError,
        },
      },
    },
    '/api/v1/admin/users/{userId}/status': {
      parameters: [{ $ref: '#/components/parameters/UserId' }],
      patch: {
        tags: ['Admin Users'],
        summary: 'Thay đổi trạng thái tài khoản có optimistic concurrency',
        operationId: 'changeAdminUserStatus',
        security: bearerSecurity,
        requestBody: requestBody(
          { $ref: '#/components/schemas/ChangeUserStatusRequest' },
          {
            status: 'BLOCKED',
            reason: 'Security review outcome',
            expectedUpdatedAt: '2026-07-17T10:00:00.000Z',
          },
        ),
        responses: {
          '200': response('Cập nhật atomically cùng session revoke và AuditLog', {
            $ref: '#/components/schemas/AdminUserMutationResponse',
          }),
          '401': unauthorized,
          '403': forbidden,
          '404': notFound,
          '409': conflict,
          '422': validationError,
        },
        description: 'Permission bắt buộc: user.update_status.',
      },
    },
    '/api/v1/admin/users/{userId}/role': {
      parameters: [{ $ref: '#/components/parameters/UserId' }],
      patch: {
        tags: ['Admin Users'],
        summary: 'Thay đổi role theo governance policy',
        operationId: 'changeAdminUserRole',
        security: bearerSecurity,
        requestBody: requestBody(
          { $ref: '#/components/schemas/ChangeUserRoleRequest' },
          {
            role: 'TEACHER',
            reason: 'Approved role correction',
            expectedUpdatedAt: '2026-07-17T10:00:00.000Z',
          },
        ),
        responses: {
          '200': response('Role được cập nhật và ghi AuditLog', {
            $ref: '#/components/schemas/AdminUserMutationResponse',
          }),
          '401': unauthorized,
          '403': forbidden,
          '404': notFound,
          '409': conflict,
          '422': validationError,
        },
        description: 'Permission bắt buộc: role.assign_limited.',
      },
    },
    '/api/v1/admin/teacher-invitations': {
      post: {
        tags: ['Teacher Invitations'],
        summary: 'Tạo manual Teacher invitation và trả link đúng một lần',
        operationId: 'createTeacherInvitation',
        security: bearerSecurity,
        requestBody: requestBody(
          { $ref: '#/components/schemas/CreateTeacherInvitationRequest' },
          { email: 'teacher.invited@example.test', expiresInDays: 7 },
        ),
        responses: {
          '201': response(
            'PENDING invitation; invitationLink chỉ có trong response này',
            { $ref: '#/components/schemas/CreateTeacherInvitationResponse' },
            {
              success: true,
              data: {
                invitation: {
                  ...invitationExample,
                  invitationLink:
                    'https://microlearning.example/teacher/invite?token=one-time-token-redacted',
                },
              },
            },
          ),
          '401': unauthorized,
          '403': forbidden,
          '409': conflict,
          '422': validationError,
          '429': rateLimited,
        },
        description: 'Permission bắt buộc: teacher_invitation.create.',
      },
      get: {
        tags: ['Teacher Invitations'],
        summary: 'Liệt kê invitation metadata, không trả token/link',
        operationId: 'listTeacherInvitations',
        security: bearerSecurity,
        parameters: [
          ...paginationParameters,
          {
            name: 'email',
            in: 'query',
            schema: { type: 'string', minLength: 1, maxLength: 100 },
          },
          {
            name: 'status',
            in: 'query',
            schema: { $ref: '#/components/schemas/InvitationStatus' },
          },
          {
            name: 'sortBy',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['createdAt', 'expiresAt', 'status'],
              default: 'createdAt',
            },
          },
          {
            name: 'sortOrder',
            in: 'query',
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          },
        ],
        responses: {
          '200': response(
            'Invitation history metadata',
            { $ref: '#/components/schemas/TeacherInvitationListResponse' },
            {
              success: true,
              data: [invitationExample],
              pagination: {
                page: 1,
                limit: 20,
                totalItems: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPreviousPage: false,
              },
              filters: { email: null, status: null },
            },
          ),
          '401': unauthorized,
          '403': forbidden,
          '422': validationError,
        },
        description: 'Permission bắt buộc: teacher_invitation.view.',
      },
    },
    '/api/v1/admin/teacher-invitations/{invitationId}': {
      parameters: [{ $ref: '#/components/parameters/InvitationId' }],
      get: {
        tags: ['Teacher Invitations'],
        summary: 'Xem safe invitation detail, không phục hồi link',
        operationId: 'getTeacherInvitation',
        security: bearerSecurity,
        responses: {
          '200': response(
            'Invitation metadata',
            { $ref: '#/components/schemas/TeacherInvitationResponse' },
            { success: true, data: { invitation: invitationExample } },
          ),
          '401': unauthorized,
          '403': forbidden,
          '404': notFound,
          '422': validationError,
        },
        description: 'Permission bắt buộc: teacher_invitation.view.',
      },
    },
    '/api/v1/admin/teacher-invitations/{invitationId}/copy-events': {
      parameters: [{ $ref: '#/components/parameters/InvitationId' }],
      post: {
        tags: ['Teacher Invitations'],
        summary: 'Ghi idempotent event sau khi Clipboard thành công',
        operationId: 'recordTeacherInvitationCopy',
        security: bearerSecurity,
        requestBody: requestBody(
          { $ref: '#/components/schemas/RecordCopyEventRequest' },
          { eventId: '019c5cb4-0b51-7000-8000-000000000002', channelHint: 'ZALO' },
        ),
        responses: {
          '201': response(
            'Copy event đã được ghi hoặc replay cùng eventId',
            { $ref: '#/components/schemas/CopyEventResponse' },
            {
              success: true,
              data: {
                copyEventId: '507f1f77bcf86cd799439014',
                recordedAt: '2026-07-17T10:05:00.000Z',
              },
            },
          ),
          '401': unauthorized,
          '403': forbidden,
          '404': notFound,
          '409': conflict,
          '422': validationError,
        },
        description: 'Permission bắt buộc: teacher_invitation.copy_link.',
      },
    },
    '/api/v1/admin/teacher-invitations/{invitationId}/revoke': {
      parameters: [{ $ref: '#/components/parameters/InvitationId' }],
      post: {
        tags: ['Teacher Invitations'],
        summary: 'Thu hồi một PENDING invitation',
        operationId: 'revokeTeacherInvitation',
        security: bearerSecurity,
        requestBody: requestBody(
          { $ref: '#/components/schemas/RevokeTeacherInvitationRequest' },
          { reason: 'Invitation was sent to the wrong address' },
        ),
        responses: {
          '200': response('Invitation REVOKED cùng AuditLog', {
            $ref: '#/components/schemas/TeacherInvitationMutationResponse',
          }),
          '401': unauthorized,
          '403': forbidden,
          '404': notFound,
          '409': conflict,
          '422': validationError,
        },
        description: 'Permission bắt buộc: teacher_invitation.revoke.',
      },
    },
    '/api/v1/teacher/invitations/preview': {
      post: {
        tags: ['Teacher Invitations'],
        summary: 'Kiểm tra one-time token bằng POST body',
        operationId: 'previewTeacherInvitation',
        security: [],
        requestBody: requestBody(
          { $ref: '#/components/schemas/InvitationTokenRequest' },
          { token: 'one-time-token-redacted-from-logs' },
        ),
        responses: {
          '200': response(
            'Metadata tối thiểu để hiển thị activation form',
            { $ref: '#/components/schemas/TeacherInvitationPreviewResponse' },
            {
              success: true,
              data: {
                invitation: {
                  email: 'teacher.invited@example.test',
                  expiresAt: '2026-07-24T10:00:00.000Z',
                  status: 'PENDING',
                  deliveryMethod: 'MANUAL_COPY',
                },
              },
            },
          ),
          '404': notFound,
          '409': conflict,
          '422': validationError,
          '429': rateLimited,
        },
      },
    },
    '/api/v1/teacher/invitations/accept': {
      post: {
        tags: ['Teacher Invitations'],
        summary: 'Kích hoạt Teacher account và consume invitation atomically',
        operationId: 'acceptTeacherInvitation',
        security: [],
        requestBody: requestBody(
          { $ref: '#/components/schemas/AcceptTeacherInvitationRequest' },
          {
            token: 'one-time-token-redacted-from-logs',
            fullName: 'Tran Thi Giang Vien',
            email: 'teacher.invited@example.test',
            password: 'SyntheticPassword123!',
            confirmPassword: 'SyntheticPassword123!',
          },
        ),
        responses: {
          '201': response(
            'TEACHER ACTIVE được tạo; người dùng phải đăng nhập',
            { $ref: '#/components/schemas/AcceptTeacherInvitationResponse' },
            {
              success: true,
              data: {
                user: {
                  ...userExample,
                  fullName: 'Tran Thi Giang Vien',
                  email: 'teacher.invited@example.test',
                  role: 'TEACHER',
                },
                nextAction: 'LOGIN',
              },
            },
          ),
          '404': notFound,
          '409': conflict,
          '422': validationError,
          '429': rateLimited,
        },
      },
    },
  };

  Object.assign(paths, createPhaseThreePaths());
  Object.assign(paths, createPhaseFourPaths());
  Object.assign(paths, createPhaseFourLearningPaths());
  Object.assign(paths, createPhaseFourProgressPaths());
  Object.assign(paths, createPhaseFourGovernancePaths());

  return {
    openapi: '3.0.3',
    info: {
      title: 'Microlearning Classroom LMS API',
      version: runtimeInfo.version,
      description:
        'RESTful API cho nền tảng Microlearning nội bộ. Phase 02 cung cấp Identity, secure session rotation, RBAC, Admin User Governance và manual Teacher Invitation; Phase 03 bổ sung Classroom, Class Code, Invite Link, enrollment, roster và governance policy.',
    },
    servers: [{ url: '/', description: 'Current environment' }],
    tags: [
      { name: 'System', description: 'Health, readiness, version và API contract' },
      { name: 'Authentication', description: 'Student registration và browser session' },
      { name: 'Profile', description: 'Hồ sơ của người dùng đang đăng nhập' },
      { name: 'Admin Users', description: 'Role-scoped user administration và governance' },
      {
        name: 'Teacher Invitations',
        description: 'Manual one-time Teacher invitation lifecycle',
      },
      ...phaseThreeTags,
      ...phaseFourTags,
      ...phaseFourLearningTags,
      ...phaseFourProgressTags,
      ...phaseFourGovernanceTags,
    ],
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'Short-lived access token. Web giữ token trong memory, không persistent storage.',
        },
        refreshCookie: {
          type: 'apiKey',
          in: 'cookie',
          name: 'ml_refresh',
          description: 'HttpOnly refresh cookie; tên thật có thể thay đổi theo environment.',
        },
      },
      parameters: {
        UserId: {
          name: 'userId',
          in: 'path',
          required: true,
          schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
          example: '507f1f77bcf86cd799439011',
        },
        InvitationId: {
          name: 'invitationId',
          in: 'path',
          required: true,
          schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
          example: '507f1f77bcf86cd799439012',
        },
      },
      schemas: {
        ...phaseThreeSchemas,
        ...phaseFourSchemas,
        ...phaseFourLearningSchemas,
        ...phaseFourProgressSchemas,
        ...phaseFourGovernanceSchemas,
        UserRole: {
          type: 'string',
          enum: ['STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN'],
          example: 'STUDENT',
        },
        UserStatus: {
          type: 'string',
          enum: ['PENDING', 'ACTIVE', 'INACTIVE', 'BLOCKED', 'DELETED'],
          example: 'ACTIVE',
        },
        InvitationStatus: {
          type: 'string',
          enum: ['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'],
          example: 'PENDING',
        },
        UserSummary: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'fullName', 'email', 'role', 'status'],
          properties: {
            id: { type: 'string', example: userExample.id },
            fullName: { type: 'string', example: userExample.fullName },
            email: { type: 'string', format: 'email', example: userExample.email },
            role: { $ref: '#/components/schemas/UserRole' },
            status: { $ref: '#/components/schemas/UserStatus' },
          },
        },
        CurrentUserProfile: {
          allOf: [
            { $ref: '#/components/schemas/UserSummary' },
            {
              type: 'object',
              required: [
                'capabilities',
                'avatarUrl',
                'studentCode',
                'department',
                'registrationSource',
                'activatedAt',
                'lastLoginAt',
                'createdAt',
                'updatedAt',
              ],
              properties: {
                capabilities: { type: 'array', items: { type: 'string' } },
                avatarUrl: { type: 'string', format: 'uri', nullable: true },
                studentCode: { type: 'string', nullable: true },
                department: { type: 'string', nullable: true },
                registrationSource: {
                  type: 'string',
                  enum: ['SELF_REGISTRATION', 'TEACHER_INVITATION', 'ADMIN_BOOTSTRAP'],
                },
                activatedAt: { type: 'string', format: 'date-time', nullable: true },
                lastLoginAt: { type: 'string', format: 'date-time', nullable: true },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
          ],
        },
        RegisterRequest: {
          type: 'object',
          additionalProperties: false,
          required: ['fullName', 'email', 'password', 'confirmPassword'],
          properties: {
            fullName: { type: 'string', minLength: 2, maxLength: 100 },
            email: { type: 'string', format: 'email', maxLength: 254 },
            password: { type: 'string', format: 'password', minLength: 12, maxLength: 128 },
            confirmPassword: {
              type: 'string',
              format: 'password',
              minLength: 12,
              maxLength: 128,
            },
          },
        },
        LoginRequest: {
          type: 'object',
          additionalProperties: false,
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password' },
          },
        },
        UpdateProfileRequest: {
          type: 'object',
          additionalProperties: false,
          required: ['fullName'],
          properties: { fullName: { type: 'string', minLength: 2, maxLength: 100 } },
        },
        RegisterResponse: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: {
              type: 'object',
              required: ['user', 'nextAction'],
              properties: {
                user: { $ref: '#/components/schemas/UserSummary' },
                nextAction: { type: 'string', enum: ['LOGIN'] },
              },
            },
          },
        },
        AuthSessionResponse: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: {
              type: 'object',
              required: ['accessToken', 'expiresInSeconds', 'user'],
              properties: {
                accessToken: { type: 'string', description: 'Short-lived JWT' },
                expiresInSeconds: { type: 'integer', minimum: 60, maximum: 3600 },
                user: { $ref: '#/components/schemas/UserSummary' },
              },
            },
          },
        },
        CurrentUserResponse: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: {
              type: 'object',
              required: ['user'],
              properties: { user: { $ref: '#/components/schemas/CurrentUserProfile' } },
            },
          },
        },
        Pagination: {
          type: 'object',
          required: ['page', 'limit', 'totalItems', 'totalPages', 'hasNextPage', 'hasPreviousPage'],
          properties: {
            page: { type: 'integer', minimum: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100 },
            totalItems: { type: 'integer', minimum: 0 },
            totalPages: { type: 'integer', minimum: 0 },
            hasNextPage: { type: 'boolean' },
            hasPreviousPage: { type: 'boolean' },
          },
        },
        AdminUserListItem: {
          allOf: [
            { $ref: '#/components/schemas/UserSummary' },
            {
              type: 'object',
              properties: {
                studentCode: { type: 'string', nullable: true },
                department: { type: 'string', nullable: true },
                lastActiveAt: { type: 'string', format: 'date-time', nullable: true },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
          ],
        },
        AdminUserListResponse: {
          type: 'object',
          required: ['success', 'data', 'pagination', 'filters'],
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: { type: 'array', items: { $ref: '#/components/schemas/AdminUserListItem' } },
            pagination: { $ref: '#/components/schemas/Pagination' },
            filters: {
              type: 'object',
              properties: {
                keyword: { type: 'string', nullable: true },
                status: { allOf: [{ $ref: '#/components/schemas/UserStatus' }], nullable: true },
              },
            },
          },
        },
        AdminUserDetail: {
          allOf: [
            { $ref: '#/components/schemas/CurrentUserProfile' },
            {
              type: 'object',
              required: ['allowedActions'],
              properties: { allowedActions: { type: 'array', items: { type: 'string' } } },
            },
          ],
        },
        AdminUserDetailResponse: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: {
              type: 'object',
              required: ['user'],
              properties: { user: { $ref: '#/components/schemas/AdminUserDetail' } },
            },
          },
        },
        ChangeUserStatusRequest: {
          type: 'object',
          additionalProperties: false,
          required: ['status', 'reason', 'expectedUpdatedAt'],
          properties: {
            status: { $ref: '#/components/schemas/UserStatus' },
            reason: { type: 'string', minLength: 5, maxLength: 500 },
            expectedUpdatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ChangeUserRoleRequest: {
          type: 'object',
          additionalProperties: false,
          required: ['role', 'reason', 'expectedUpdatedAt'],
          properties: {
            role: { $ref: '#/components/schemas/UserRole' },
            reason: { type: 'string', minLength: 5, maxLength: 500 },
            expectedUpdatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AdminUserMutationResponse: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: {
              type: 'object',
              required: ['user', 'auditId'],
              properties: {
                user: { $ref: '#/components/schemas/AdminUserDetail' },
                auditId: { type: 'string' },
              },
            },
          },
        },
        TeacherInvitation: {
          type: 'object',
          additionalProperties: false,
          required: [
            'id',
            'email',
            'status',
            'deliveryMethod',
            'invitedBy',
            'expiresAt',
            'acceptedAt',
            'revokedAt',
            'copyCount',
            'lastCopiedAt',
            'channelHint',
            'createdAt',
            'updatedAt',
          ],
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            status: { $ref: '#/components/schemas/InvitationStatus' },
            deliveryMethod: { type: 'string', enum: ['MANUAL_COPY'] },
            invitedBy: { type: 'string' },
            expiresAt: { type: 'string', format: 'date-time' },
            acceptedAt: { type: 'string', format: 'date-time', nullable: true },
            revokedAt: { type: 'string', format: 'date-time', nullable: true },
            copyCount: { type: 'integer', minimum: 0 },
            lastCopiedAt: { type: 'string', format: 'date-time', nullable: true },
            channelHint: {
              type: 'string',
              enum: ['EMAIL', 'ZALO', 'FACEBOOK', 'MESSENGER', 'TEAMS', 'OTHER'],
              nullable: true,
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateTeacherInvitationRequest: {
          type: 'object',
          additionalProperties: false,
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email' },
            expiresInDays: { type: 'integer', minimum: 1, maximum: 30, default: 7 },
          },
        },
        CreateTeacherInvitationResponse: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: {
              type: 'object',
              required: ['invitation'],
              properties: {
                invitation: {
                  allOf: [
                    { $ref: '#/components/schemas/TeacherInvitation' },
                    {
                      type: 'object',
                      required: ['invitationLink'],
                      properties: { invitationLink: { type: 'string', format: 'uri' } },
                    },
                  ],
                },
              },
            },
          },
        },
        TeacherInvitationResponse: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: {
              type: 'object',
              required: ['invitation'],
              properties: { invitation: { $ref: '#/components/schemas/TeacherInvitation' } },
            },
          },
        },
        TeacherInvitationListResponse: {
          type: 'object',
          required: ['success', 'data', 'pagination', 'filters'],
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: { type: 'array', items: { $ref: '#/components/schemas/TeacherInvitation' } },
            pagination: { $ref: '#/components/schemas/Pagination' },
            filters: {
              type: 'object',
              properties: {
                email: { type: 'string', nullable: true },
                status: {
                  allOf: [{ $ref: '#/components/schemas/InvitationStatus' }],
                  nullable: true,
                },
              },
            },
          },
        },
        RecordCopyEventRequest: {
          type: 'object',
          additionalProperties: false,
          required: ['eventId'],
          properties: {
            eventId: { type: 'string', format: 'uuid' },
            channelHint: {
              type: 'string',
              enum: ['EMAIL', 'ZALO', 'FACEBOOK', 'MESSENGER', 'TEAMS', 'OTHER'],
            },
          },
        },
        CopyEventResponse: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: {
              type: 'object',
              required: ['copyEventId', 'recordedAt'],
              properties: {
                copyEventId: { type: 'string' },
                recordedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        RevokeTeacherInvitationRequest: {
          type: 'object',
          additionalProperties: false,
          required: ['reason'],
          properties: { reason: { type: 'string', minLength: 5, maxLength: 500 } },
        },
        TeacherInvitationMutationResponse: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: {
              type: 'object',
              required: ['invitation', 'auditId'],
              properties: {
                invitation: { $ref: '#/components/schemas/TeacherInvitation' },
                auditId: { type: 'string' },
              },
            },
          },
        },
        InvitationTokenRequest: {
          type: 'object',
          additionalProperties: false,
          required: ['token'],
          properties: { token: { type: 'string', minLength: 40, maxLength: 512 } },
        },
        TeacherInvitationPreviewResponse: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: {
              type: 'object',
              required: ['invitation'],
              properties: {
                invitation: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['email', 'expiresAt', 'status', 'deliveryMethod'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    expiresAt: { type: 'string', format: 'date-time' },
                    status: { type: 'string', enum: ['PENDING'] },
                    deliveryMethod: { type: 'string', enum: ['MANUAL_COPY'] },
                  },
                },
              },
            },
          },
        },
        AcceptTeacherInvitationRequest: {
          type: 'object',
          additionalProperties: false,
          required: ['token', 'fullName', 'email', 'password', 'confirmPassword'],
          properties: {
            token: { type: 'string', minLength: 40, maxLength: 512 },
            fullName: { type: 'string', minLength: 2, maxLength: 100 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password', minLength: 12, maxLength: 128 },
            confirmPassword: {
              type: 'string',
              format: 'password',
              minLength: 12,
              maxLength: 128,
            },
          },
        },
        AcceptTeacherInvitationResponse: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: {
              type: 'object',
              required: ['user', 'nextAction'],
              properties: {
                user: { $ref: '#/components/schemas/UserSummary' },
                nextAction: { type: 'string', enum: ['LOGIN'] },
              },
            },
          },
        },
        BasicHealthResponse: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: {
              type: 'object',
              required: ['status', 'service', 'timestamp'],
              properties: {
                status: { type: 'string', enum: ['UP'] },
                service: { type: 'string', example: 'microlearning-api' },
                timestamp: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        ReadinessResponse: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              required: ['status', 'dependencies', 'timestamp'],
              properties: {
                status: { type: 'string', enum: ['UP', 'DOWN'] },
                dependencies: {
                  type: 'object',
                  properties: {
                    mongodb: { type: 'string', enum: ['UP', 'DOWN', 'CONNECTING'] },
                  },
                },
                timestamp: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        DetailedHealthResponse: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              required: ['status', 'service', 'dependencies', 'uptimeSeconds', 'timestamp'],
              properties: {
                status: { type: 'string', enum: ['UP', 'DEGRADED', 'DOWN'] },
                service: { type: 'string', example: 'microlearning-api' },
                dependencies: {
                  type: 'object',
                  properties: {
                    mongodb: { type: 'string', enum: ['UP', 'DOWN', 'CONNECTING'] },
                  },
                },
                uptimeSeconds: { type: 'integer', minimum: 0 },
                timestamp: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        VersionResponse: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: {
              type: 'object',
              required: ['appName', 'version', 'environment', 'commitSha', 'buildTime'],
              properties: {
                appName: { type: 'string', example: 'Microlearning Classroom LMS API' },
                version: { type: 'string', example: '0.2.0' },
                environment: { type: 'string', example: 'staging' },
                commitSha: { type: 'string', example: 'abc123' },
                buildTime: { type: 'string', example: '2026-07-17T10:00:00.000Z' },
              },
            },
          },
        },
        ErrorDetail: {
          type: 'object',
          required: ['field', 'code', 'message'],
          properties: {
            field: { type: 'string' },
            code: { type: 'string' },
            message: { type: 'string' },
          },
        },
        ErrorResponse: {
          type: 'object',
          required: ['success', 'error', 'meta'],
          properties: {
            success: { type: 'boolean', enum: [false] },
            error: {
              type: 'object',
              required: ['code', 'message'],
              properties: {
                code: { type: 'string', example: 'RESOURCE_NOT_FOUND' },
                message: { type: 'string', example: 'Resource not found' },
                details: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/ErrorDetail' },
                },
              },
            },
            meta: {
              type: 'object',
              required: ['requestId', 'timestamp', 'path'],
              properties: {
                requestId: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' },
                path: { type: 'string' },
              },
            },
          },
        },
      },
    },
  };
}
