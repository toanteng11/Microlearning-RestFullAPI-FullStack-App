import { createHash, randomUUID } from 'node:crypto';

import mongoose from 'mongoose';
import pino from 'pino';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { AuditLogModel } from '../../src/modules/audit/audit-log.model.js';
import { AuthSessionModel } from '../../src/modules/sessions/auth-session.model.js';
import { SystemGuardModel } from '../../src/modules/system-guards/system-guard.model.js';
import { UserModel } from '../../src/modules/users/user.model.js';
import type { UserRole, UserStatus } from '../../src/modules/users/user.types.js';
import { AccessTokenService } from '../../src/shared/auth/access-token.js';
import { testConfig, testRuntimeInfo } from '../test-fixtures.js';

const integrationUri = process.env.MONGODB_INTEGRATION_URI;
if (!integrationUri) throw new Error('MONGODB_INTEGRATION_URI is required for Admin integration');

const app = createApp({
  config: { ...testConfig, mongodbUri: integrationUri },
  logger: pino({ level: 'silent' }),
  runtimeInfo: testRuntimeInfo,
  dependencies: { getDatabaseStatus: async () => 'UP' },
});

const tokens = new AccessTokenService({
  secret: testConfig.accessTokenSecret,
  issuer: testConfig.accessTokenIssuer,
  audience: testConfig.accessTokenAudience,
  ttlSeconds: testConfig.accessTokenTtlSeconds,
});

let identitySequence = 0;

async function createIdentity(role: UserRole, status: UserStatus = 'ACTIVE') {
  identitySequence += 1;
  const suffix = `${role.toLowerCase()}-${identitySequence}`;
  const user = await UserModel.create({
    email: `${suffix}@example.test`,
    fullName: `${role} ${identitySequence}`,
    fullNameNormalized: `${role.toLowerCase()} ${identitySequence}`,
    passwordHash: 'synthetic-hash-not-used-for-login',
    role,
    status,
    registrationSource: role === 'TEACHER' ? 'TEACHER_INVITATION' : 'ADMIN_BOOTSTRAP',
    activatedAt: status === 'ACTIVE' ? new Date() : null,
  });
  const familyId = randomUUID();
  if (status === 'ACTIVE') {
    await AuthSessionModel.create({
      userId: user._id,
      familyId,
      tokenHash: createHash('sha256').update(randomUUID()).digest('hex'),
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 60_000),
    });
  }
  return { user, accessToken: await tokens.sign(user._id.toString(), familyId) };
}

function bearer(accessToken: string) {
  return `Bearer ${accessToken}`;
}

describe('Admin User API integration', () => {
  beforeAll(async () => {
    await mongoose.connect(integrationUri, { serverSelectionTimeoutMS: 15_000 });
    await Promise.all([
      UserModel.syncIndexes(),
      AuthSessionModel.syncIndexes(),
      AuditLogModel.syncIndexes(),
      SystemGuardModel.syncIndexes(),
    ]);
  });

  beforeEach(async () => {
    identitySequence = 0;
    await Promise.all([
      UserModel.deleteMany({}),
      AuthSessionModel.deleteMany({}),
      AuditLogModel.deleteMany({}),
      SystemGuardModel.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('separates role lists, paginates on the server, and denies Student access', async () => {
    const admin = await createIdentity('ADMIN');
    const studentActor = await createIdentity('STUDENT');
    await createIdentity('STUDENT');
    await createIdentity('TEACHER');
    await createIdentity('SUPER_ADMIN');

    const students = await request(app)
      .get('/api/v1/admin/users/students?page=1&limit=1&sortBy=email&sortOrder=asc')
      .set('Authorization', bearer(admin.accessToken))
      .expect(200);
    expect(students.body.data).toHaveLength(1);
    expect(students.body.data[0]).not.toHaveProperty('role');
    expect(students.body.data[0]).not.toHaveProperty('passwordHash');
    expect(students.body.pagination).toMatchObject({ totalItems: 2, totalPages: 2 });

    const teachers = await request(app)
      .get('/api/v1/admin/users/teachers')
      .set('Authorization', bearer(admin.accessToken))
      .expect(200);
    expect(teachers.body.data).toHaveLength(1);
    expect(teachers.body.data[0].registrationSource).toBe('TEACHER_INVITATION');

    const admins = await request(app)
      .get('/api/v1/admin/users/admins')
      .set('Authorization', bearer(admin.accessToken))
      .expect(200);
    expect(admins.body.data.map((item: { role: string }) => item.role).sort()).toEqual([
      'ADMIN',
      'SUPER_ADMIN',
    ]);

    await request(app)
      .get('/api/v1/admin/users/students')
      .set('Authorization', bearer(studentActor.accessToken))
      .expect(403);
    await request(app)
      .get('/api/v1/admin/users/students?role=SUPER_ADMIN')
      .set('Authorization', bearer(admin.accessToken))
      .expect(422);
  });

  it('changes Teacher status atomically, revokes sessions, and writes a safe Audit Log', async () => {
    const admin = await createIdentity('ADMIN');
    const teacher = await createIdentity('TEACHER');
    const response = await request(app)
      .patch(`/api/v1/admin/users/${teacher.user._id.toString()}/status`)
      .set('Authorization', bearer(admin.accessToken))
      .send({
        status: 'BLOCKED',
        reason: 'Account security review',
        expectedUpdatedAt: teacher.user.updatedAt.toISOString(),
      })
      .expect(200);

    expect(response.body.data.user).toMatchObject({ role: 'TEACHER', status: 'BLOCKED' });
    expect(response.body.data.auditId).toEqual(expect.any(String));
    expect(
      await AuthSessionModel.countDocuments({ userId: teacher.user._id, status: 'REVOKED' }),
    ).toBe(1);
    const audit = await AuditLogModel.findOne({ resourceId: teacher.user._id.toString() }).lean();
    expect(audit).toMatchObject({
      actorRole: 'ADMIN',
      action: 'USER_STATUS_CHANGED',
      oldValue: { status: 'ACTIVE' },
      newValue: { status: 'BLOCKED' },
    });
    expect(JSON.stringify(audit)).not.toContain('password');
    expect(JSON.stringify(audit)).not.toContain('token');

    const blockedSession = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', bearer(teacher.accessToken))
      .expect(403);
    expect(blockedSession.body.error.code).toBe('ACCOUNT_NOT_ACTIVE');

    await request(app)
      .patch(`/api/v1/admin/users/${admin.user._id.toString()}/status`)
      .set('Authorization', bearer(admin.accessToken))
      .send({
        status: 'BLOCKED',
        reason: 'Self lockout attempt',
        expectedUpdatedAt: admin.user.updatedAt.toISOString(),
      })
      .expect(403);
  });

  it('allows reviewed Super Admin promotion and invalidates the previous target session', async () => {
    const superAdmin = await createIdentity('SUPER_ADMIN');
    const targetAdmin = await createIdentity('ADMIN');
    const response = await request(app)
      .patch(`/api/v1/admin/users/${targetAdmin.user._id.toString()}/role`)
      .set('Authorization', bearer(superAdmin.accessToken))
      .send({
        role: 'SUPER_ADMIN',
        reason: 'Approved governance promotion',
        expectedUpdatedAt: targetAdmin.user.updatedAt.toISOString(),
      })
      .expect(200);

    expect(response.body.data.user.role).toBe('SUPER_ADMIN');
    expect(
      await AuthSessionModel.countDocuments({ userId: targetAdmin.user._id, status: 'REVOKED' }),
    ).toBe(1);
    await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', bearer(targetAdmin.accessToken))
      .expect(401);
  });

  it('serializes concurrent Super Admin blocks and preserves one active Super Admin', async () => {
    const first = await createIdentity('SUPER_ADMIN');
    const second = await createIdentity('SUPER_ADMIN');
    const [firstResult, secondResult] = await Promise.all([
      request(app)
        .patch(`/api/v1/admin/users/${second.user._id.toString()}/status`)
        .set('Authorization', bearer(first.accessToken))
        .send({
          status: 'BLOCKED',
          reason: 'Concurrent governance test A',
          expectedUpdatedAt: second.user.updatedAt.toISOString(),
        }),
      request(app)
        .patch(`/api/v1/admin/users/${first.user._id.toString()}/status`)
        .set('Authorization', bearer(second.accessToken))
        .send({
          status: 'BLOCKED',
          reason: 'Concurrent governance test B',
          expectedUpdatedAt: first.user.updatedAt.toISOString(),
        }),
    ]);

    expect([firstResult.status, secondResult.status].sort()).toEqual([200, 409]);
    const conflict = firstResult.status === 409 ? firstResult : secondResult;
    expect(conflict.body.error.code).toBe('FINAL_SUPER_ADMIN_REQUIRED');
    expect(await UserModel.countDocuments({ role: 'SUPER_ADMIN', status: 'ACTIVE' })).toBe(1);
    expect(await AuditLogModel.countDocuments({ action: 'USER_STATUS_CHANGED' })).toBe(1);
  });
});
