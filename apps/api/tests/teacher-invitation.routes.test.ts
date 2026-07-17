import express, { type ErrorRequestHandler } from 'express';
import { Types } from 'mongoose';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TeacherInvitationService } from '../src/modules/teacher-invitations/teacher-invitation.service.js';
import {
  createTeacherInvitationAdminRouter,
  createTeacherInvitationPublicRouter,
} from '../src/modules/teacher-invitations/teacher-invitation.routes.js';
import type { UserRole } from '../src/modules/users/user.types.js';
import { getCapabilities } from '../src/shared/auth/permissions.js';
import { AppError } from '../src/shared/errors/app-error.js';
import { testConfig } from './test-fixtures.js';

function createTestApp(service: TeacherInvitationService, role: UserRole = 'ADMIN') {
  const app = express();
  app.use(express.json());
  app.use((request_, response, next) => {
    response.setHeader('x-request-id', 'request-invitation-route');
    request_.auth = {
      id: new Types.ObjectId().toString(),
      role,
      status: 'ACTIVE',
      familyId: 'family-invitation-route',
      capabilities: getCapabilities(role),
    };
    next();
  });
  app.use(
    '/api/v1/admin/teacher-invitations',
    createTeacherInvitationAdminRouter(testConfig, service),
  );
  app.use('/api/v1/teacher/invitations', createTeacherInvitationPublicRouter(testConfig, service));
  const errors: ErrorRequestHandler = (error, _request, response, _next) => {
    const appError = error instanceof AppError ? error : new AppError(500, 'INTERNAL', 'Internal');
    response.status(appError.statusCode).json({ error: { code: appError.code } });
  };
  app.use(errors);
  return app;
}

describe('Teacher Invitation routes', () => {
  const invitationId = new Types.ObjectId().toString();
  const service = {
    create: vi.fn(),
    list: vi.fn(),
    getDetail: vi.fn(),
    recordCopy: vi.fn(),
    revoke: vi.fn(),
    preview: vi.fn(),
    accept: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service.create.mockResolvedValue({ id: invitationId, invitationLink: 'https://example.test' });
    service.list.mockResolvedValue({ data: [], pagination: {}, filters: {} });
    service.getDetail.mockResolvedValue({ id: invitationId });
    service.recordCopy.mockResolvedValue({
      copyEventId: 'copy-one',
      recordedAt: new Date().toISOString(),
    });
    service.revoke.mockResolvedValue({ invitation: { id: invitationId }, auditId: 'audit-one' });
    service.preview.mockResolvedValue({ email: 'teacher@example.test', status: 'PENDING' });
    service.accept.mockResolvedValue({ user: { role: 'TEACHER' }, nextAction: 'LOGIN' });
  });

  it('maps Admin create/list/detail/copy/revoke contracts', async () => {
    const app = createTestApp(service as unknown as TeacherInvitationService);
    await request(app)
      .post('/api/v1/admin/teacher-invitations')
      .send({ email: 'teacher@example.test', expiresInDays: 7 })
      .expect(201);
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'ADMIN' }),
      expect.objectContaining({ email: 'teacher@example.test' }),
      'request-invitation-route',
    );

    await request(app).get('/api/v1/admin/teacher-invitations?page=2&status=PENDING').expect(200);
    expect(service.list).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, status: 'PENDING' }),
    );

    await request(app).get(`/api/v1/admin/teacher-invitations/${invitationId}`).expect(200);
    expect(service.getDetail).toHaveBeenCalledWith(invitationId);

    const eventId = '019c5cb4-0b51-7000-8000-000000000010';
    await request(app)
      .post(`/api/v1/admin/teacher-invitations/${invitationId}/copy-events`)
      .send({ eventId, channelHint: 'EMAIL' })
      .expect(201);
    expect(service.recordCopy).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'ADMIN' }),
      invitationId,
      { eventId, channelHint: 'EMAIL' },
      'request-invitation-route',
    );

    await request(app)
      .post(`/api/v1/admin/teacher-invitations/${invitationId}/revoke`)
      .send({ reason: 'Wrong recipient' })
      .expect(200);
    expect(service.revoke).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'ADMIN' }),
      invitationId,
      'Wrong recipient',
      'request-invitation-route',
    );
  });

  it('maps public preview and accept with no-store privacy headers', async () => {
    const app = createTestApp(service as unknown as TeacherInvitationService);
    const token = 'synthetic-token-value-with-forty-plus-characters';
    const preview = await request(app)
      .post('/api/v1/teacher/invitations/preview')
      .send({ token })
      .expect(200);
    expect(preview.headers['cache-control']).toBe('no-store');
    expect(service.preview).toHaveBeenCalledWith(token);

    const accepted = await request(app)
      .post('/api/v1/teacher/invitations/accept')
      .send({
        token,
        fullName: 'Teacher Example',
        email: 'teacher@example.test',
        password: 'StrongPassword123!',
        confirmPassword: 'StrongPassword123!',
      })
      .expect(201);
    expect(accepted.headers['referrer-policy']).toBe('no-referrer');
    expect(service.accept).toHaveBeenCalledWith(
      expect.objectContaining({ token, email: 'teacher@example.test' }),
      'request-invitation-route',
    );
  });

  it('denies Student Admin endpoints and rejects unknown input fields', async () => {
    const studentApp = createTestApp(service as unknown as TeacherInvitationService, 'STUDENT');
    await request(studentApp).get('/api/v1/admin/teacher-invitations').expect(403);
    await request(createTestApp(service as unknown as TeacherInvitationService))
      .post('/api/v1/admin/teacher-invitations')
      .send({ email: 'teacher@example.test', role: 'TEACHER' })
      .expect(422);
  });
});
