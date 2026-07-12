import type { OpenAPIV3 } from 'openapi-types';

import type { RuntimeInfo } from '../modules/system/system.types.js';

export function createOpenApiDocument(runtimeInfo: RuntimeInfo): OpenAPIV3.Document {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Microlearning Classroom LMS API',
      version: runtimeInfo.version,
      description:
        'RESTful API cho nền tảng Microlearning hỗ trợ Student, Teacher và Admin. Phase 01 cung cấp các endpoint vận hành nền tảng.',
    },
    servers: [{ url: '/', description: 'Current environment' }],
    tags: [{ name: 'System', description: 'Health, readiness và build metadata' }],
    paths: {
      '/health': {
        get: {
          tags: ['System'],
          summary: 'Kiểm tra API process đang hoạt động',
          operationId: 'getBasicHealth',
          responses: {
            '200': {
              description: 'API đang hoạt động',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/BasicHealthResponse' },
                },
              },
            },
          },
        },
      },
      '/ready': {
        get: {
          tags: ['System'],
          summary: 'Kiểm tra API sẵn sàng phục vụ với MongoDB',
          operationId: 'getReadiness',
          responses: {
            '200': {
              description: 'API và MongoDB sẵn sàng',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ReadinessResponse' },
                },
              },
            },
            '503': {
              description: 'Dependency chưa sẵn sàng',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ReadinessResponse' },
                },
              },
            },
          },
        },
      },
      '/api/v1/system/version': {
        get: {
          tags: ['System'],
          summary: 'Xem phiên bản artifact đang chạy',
          operationId: 'getSystemVersion',
          responses: {
            '200': {
              description: 'Thông tin phiên bản public-safe',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/VersionResponse' },
                },
              },
            },
          },
        },
      },
      '/api/v1/system/health': {
        get: {
          tags: ['System'],
          summary: 'Kiểm tra dependency chi tiết cho vận hành',
          operationId: 'getDetailedHealth',
          responses: {
            '200': {
              description: 'Tất cả dependency chính hoạt động',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/DetailedHealthResponse' },
                },
              },
            },
            '503': {
              description: 'Một dependency chính không sẵn sàng',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/DetailedHealthResponse' },
                },
              },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Được sử dụng từ Phase 02. Swagger không lưu token sau refresh.',
        },
      },
      schemas: {
        BasicHealthResponse: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: { type: 'boolean', example: true },
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
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              required: ['appName', 'version', 'environment', 'commitSha', 'buildTime'],
              properties: {
                appName: { type: 'string', example: 'Microlearning Classroom LMS API' },
                version: { type: 'string', example: '0.1.0' },
                environment: { type: 'string', example: 'staging' },
                commitSha: { type: 'string', example: 'abc123' },
                buildTime: { type: 'string', example: '2026-07-12T10:00:00.000Z' },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          required: ['success', 'error', 'meta'],
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              required: ['code', 'message'],
              properties: {
                code: { type: 'string', example: 'RESOURCE_NOT_FOUND' },
                message: { type: 'string', example: 'Resource not found' },
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
