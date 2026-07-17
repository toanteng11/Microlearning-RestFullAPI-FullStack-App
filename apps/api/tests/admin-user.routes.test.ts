import express, { type ErrorRequestHandler } from 'express';
import { Types } from 'mongoose';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createAdminUserRouter } from '../src/modules/admin-users/admin-user.routes.js';
import type { AdminUserService } from '../src/modules/admin-users/admin-user.service.js';
import type { UserRole } from '../src/modules/users/user.types.js';
import { getCapabilities } from '../src/shared/auth/permissions.js';
import { AppError } from '../src/shared/errors/app-error.js';

function createTestApp(service: AdminUserService, role: UserRole = 'ADMIN') {
  const app = express();
  app.use(express.json());
  app.use((request_, response, next) => {
    response.setHeader('x-request-id', 'request-route-test');
    request_.auth = {
      id: new Types.ObjectId().toString(),
      role,
      status: 'ACTIVE',
      familyId: 'family-route-test',
      capabilities: getCapabilities(role),
    };
    next();
  });
  app.use('/api/v1/admin/users', createAdminUserRouter(service));
  const errors: ErrorRequestHandler = (error, _request, response, _next) => {
    const appError = error instanceof AppError ? error : new AppError(500, 'INTERNAL', 'Internal');
    response.status(appError.statusCode).json({ error: { code: appError.code } });
  };
  app.use(errors);
  return app;
}

describe('Admin User routes', () => {
  const service = {
    list: vi.fn(),
    getDetail: vi.fn(),
    changeStatus: vi.fn(),
    changeRole: vi.fn(),
  };

  beforeEach(() => vi.clearAllMocks());

  it('parses role-fixed list queries and rejects unknown query controls', async () => {
    service.list.mockResolvedValue({
      data: [],
      pagination: { page: 2, limit: 10, totalItems: 0, totalPages: 0 },
      filters: { keyword: 'an', status: 'ACTIVE' },
    });
    const app = createTestApp(service as unknown as AdminUserService);
    const response = await request(app)
      .get('/api/v1/admin/users/students?page=2&limit=10&keyword=an&status=ACTIVE')
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(service.list).toHaveBeenCalledWith(
      'students',
      expect.objectContaining({ page: 2, limit: 10, keyword: 'an', status: 'ACTIVE' }),
    );

    await request(app).get('/api/v1/admin/users/students?role=SUPER_ADMIN').expect(422);
  });

  it('returns detail and forwards safe mutation metadata', async () => {
    const userId = new Types.ObjectId().toString();
    service.getDetail.mockResolvedValue({ id: userId });
    service.changeStatus.mockResolvedValue({ user: { id: userId }, auditId: 'audit-one' });
    const app = createTestApp(service as unknown as AdminUserService);

    await request(app).get(`/api/v1/admin/users/${userId}`).expect(200);
    expect(service.getDetail).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'ADMIN' }),
      userId,
    );

    await request(app)
      .patch(`/api/v1/admin/users/${userId}/status`)
      .send({
        status: 'BLOCKED',
        reason: 'Security policy',
        expectedUpdatedAt: '2026-07-17T08:00:00.000Z',
      })
      .expect(200);
    expect(service.changeStatus).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'ADMIN' }),
      userId,
      expect.objectContaining({ status: 'BLOCKED' }),
      'request-route-test',
    );
  });

  it('enforces role permission before role mutation and allows Super Admin', async () => {
    const userId = new Types.ObjectId().toString();
    const body = {
      role: 'SUPER_ADMIN',
      reason: 'Approved promotion',
      expectedUpdatedAt: '2026-07-17T08:00:00.000Z',
    };
    service.changeRole.mockResolvedValue({ user: { id: userId }, auditId: 'audit-two' });

    await request(createTestApp(service as unknown as AdminUserService, 'ADMIN'))
      .patch(`/api/v1/admin/users/${userId}/role`)
      .send(body)
      .expect(403);
    expect(service.changeRole).not.toHaveBeenCalled();

    await request(createTestApp(service as unknown as AdminUserService, 'SUPER_ADMIN'))
      .patch(`/api/v1/admin/users/${userId}/role`)
      .send(body)
      .expect(200);
    expect(service.changeRole).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'SUPER_ADMIN' }),
      userId,
      expect.objectContaining({ role: 'SUPER_ADMIN' }),
      'request-route-test',
    );
  });
});
