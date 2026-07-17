import { createHash, randomUUID } from 'node:crypto';

import mongoose from 'mongoose';
import pino from 'pino';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { AuditLogModel } from '../../src/modules/audit/audit-log.model.js';
import { AuthSessionModel } from '../../src/modules/sessions/auth-session.model.js';
import { TeacherInvitationModel } from '../../src/modules/teacher-invitations/teacher-invitation.model.js';
import { UserModel } from '../../src/modules/users/user.model.js';
import type { UserRole } from '../../src/modules/users/user.types.js';
import { AccessTokenService } from '../../src/shared/auth/access-token.js';
import { testConfig, testRuntimeInfo } from '../test-fixtures.js';

const integrationUri = process.env.MONGODB_INTEGRATION_URI;
if (!integrationUri)
  throw new Error('MONGODB_INTEGRATION_URI is required for invitation integration');

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

let sequence = 0;

async function createActor(role: UserRole) {
  sequence += 1;
  const user = await UserModel.create({
    email: `${role.toLowerCase()}-${sequence}@example.test`,
    fullName: `${role} ${sequence}`,
    fullNameNormalized: `${role.toLowerCase()} ${sequence}`,
    passwordHash: 'synthetic-hash-not-used-for-login',
    role,
    status: 'ACTIVE',
    registrationSource: 'ADMIN_BOOTSTRAP',
  });
  const familyId = randomUUID();
  await AuthSessionModel.create({
    userId: user._id,
    familyId,
    tokenHash: createHash('sha256').update(randomUUID()).digest('hex'),
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + 60_000),
  });
  return { user, accessToken: await tokens.sign(user._id.toString(), familyId) };
}

function bearer(accessToken: string) {
  return `Bearer ${accessToken}`;
}

function tokenFromLink(invitationLink: string): string {
  const token = new URL(invitationLink).searchParams.get('token');
  if (!token) throw new Error('Expected invitation token');
  return token;
}

const activation = {
  fullName: 'Teacher Activated',
  email: 'teacher.invited@example.test',
  password: 'StrongPassword123!',
  confirmPassword: 'StrongPassword123!',
};

describe('Teacher Invitation API integration', () => {
  beforeAll(async () => {
    await mongoose.connect(integrationUri, { serverSelectionTimeoutMS: 15_000 });
    await Promise.all([
      UserModel.syncIndexes(),
      AuthSessionModel.syncIndexes(),
      TeacherInvitationModel.syncIndexes(),
      AuditLogModel.syncIndexes(),
    ]);
  });

  beforeEach(async () => {
    sequence = 0;
    await Promise.all([
      UserModel.deleteMany({}),
      AuthSessionModel.deleteMany({}),
      TeacherInvitationModel.deleteMany({}),
      AuditLogModel.deleteMany({}),
    ]);
  });

  afterAll(async () => mongoose.disconnect());

  it('creates one-time manual link while list, detail, database, and audit remain secret-safe', async () => {
    const admin = await createActor('ADMIN');
    const student = await createActor('STUDENT');
    await request(app)
      .post('/api/v1/admin/teacher-invitations')
      .set('Authorization', bearer(student.accessToken))
      .send({ email: activation.email })
      .expect(403);

    const created = await request(app)
      .post('/api/v1/admin/teacher-invitations')
      .set('Authorization', bearer(admin.accessToken))
      .send({ email: `  ${activation.email.toUpperCase()}  `, expiresInDays: 7 })
      .expect(201);
    const invitation = created.body.data.invitation;
    expect(invitation).toMatchObject({
      email: activation.email,
      status: 'PENDING',
      deliveryMethod: 'MANUAL_COPY',
    });
    expect(invitation.invitationLink).toMatch(/^http:\/\/localhost:3000\/teacher\/invite\?token=/u);
    expect(created.headers['cache-control']).toBe('no-store');
    const rawToken = tokenFromLink(invitation.invitationLink);

    const stored = await TeacherInvitationModel.findById(invitation.id).select('+tokenHash');
    expect(stored?.tokenHash).toMatch(/^[a-f\d]{64}$/u);
    expect(stored?.tokenHash).not.toBe(rawToken);
    const audit = await AuditLogModel.findOne({ action: 'TEACHER_INVITATION_CREATED' }).lean();
    expect(JSON.stringify(audit)).not.toContain(rawToken);
    expect(JSON.stringify(audit)).not.toContain(stored!.tokenHash);

    const list = await request(app)
      .get('/api/v1/admin/teacher-invitations')
      .set('Authorization', bearer(admin.accessToken))
      .expect(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0]).not.toHaveProperty('invitationLink');
    expect(list.body.data[0]).not.toHaveProperty('tokenHash');

    const detail = await request(app)
      .get(`/api/v1/admin/teacher-invitations/${invitation.id}`)
      .set('Authorization', bearer(admin.accessToken))
      .expect(200);
    expect(detail.body.data.invitation).not.toHaveProperty('invitationLink');
    expect(JSON.stringify(detail.body)).not.toContain(rawToken);

    const duplicate = await request(app)
      .post('/api/v1/admin/teacher-invitations')
      .set('Authorization', bearer(admin.accessToken))
      .send({ email: activation.email })
      .expect(409);
    expect(duplicate.body.error.code).toBe('INVITATION_ALREADY_PENDING');
  });

  it('allows only one concurrent normalized invitation for the same Teacher email', async () => {
    const admin = await createActor('ADMIN');
    const [first, second] = await Promise.all([
      request(app)
        .post('/api/v1/admin/teacher-invitations')
        .set('Authorization', bearer(admin.accessToken))
        .send({ email: `  ${activation.email.toUpperCase()}  ` }),
      request(app)
        .post('/api/v1/admin/teacher-invitations')
        .set('Authorization', bearer(admin.accessToken))
        .send({ email: activation.email }),
    ]);

    expect([first.status, second.status].sort()).toEqual([201, 409]);
    const conflict = first.status === 409 ? first : second;
    expect(conflict.body.error.code).toBe('INVITATION_ALREADY_PENDING');
    expect(
      await TeacherInvitationModel.countDocuments({ email: activation.email, status: 'PENDING' }),
    ).toBe(1);
    expect(await AuditLogModel.countDocuments({ action: 'TEACHER_INVITATION_CREATED' })).toBe(1);
  });

  it('records copy idempotently and revokes only a pending invitation', async () => {
    const admin = await createActor('ADMIN');
    const created = await request(app)
      .post('/api/v1/admin/teacher-invitations')
      .set('Authorization', bearer(admin.accessToken))
      .send({ email: activation.email })
      .expect(201);
    const invitation = created.body.data.invitation;
    const rawToken = tokenFromLink(invitation.invitationLink);
    const event = { eventId: randomUUID(), channelHint: 'ZALO' };

    const firstCopy = await request(app)
      .post(`/api/v1/admin/teacher-invitations/${invitation.id}/copy-events`)
      .set('Authorization', bearer(admin.accessToken))
      .send(event)
      .expect(201);
    const replayCopy = await request(app)
      .post(`/api/v1/admin/teacher-invitations/${invitation.id}/copy-events`)
      .set('Authorization', bearer(admin.accessToken))
      .send(event)
      .expect(201);
    expect(replayCopy.body.data).toEqual(firstCopy.body.data);
    expect((await TeacherInvitationModel.findById(invitation.id))?.copyCount).toBe(1);
    expect(await AuditLogModel.countDocuments({ action: 'TEACHER_INVITATION_COPIED' })).toBe(1);

    const revoked = await request(app)
      .post(`/api/v1/admin/teacher-invitations/${invitation.id}/revoke`)
      .set('Authorization', bearer(admin.accessToken))
      .send({ reason: 'Invitation sent to wrong address' })
      .expect(200);
    expect(revoked.body.data.invitation.status).toBe('REVOKED');
    const preview = await request(app)
      .post('/api/v1/teacher/invitations/preview')
      .send({ token: rawToken })
      .expect(409);
    expect(preview.body.error.code).toBe('INVITATION_REVOKED');

    const secondRevoke = await request(app)
      .post(`/api/v1/admin/teacher-invitations/${invitation.id}/revoke`)
      .set('Authorization', bearer(admin.accessToken))
      .send({ reason: 'Repeat revoke attempt' })
      .expect(409);
    expect(secondRevoke.body.error.code).toBe('INVITATION_REVOKED');
  });

  it('previews and atomically activates one Teacher without creating a session', async () => {
    const admin = await createActor('ADMIN');
    const created = await request(app)
      .post('/api/v1/admin/teacher-invitations')
      .set('Authorization', bearer(admin.accessToken))
      .send({ email: activation.email })
      .expect(201);
    const token = tokenFromLink(created.body.data.invitation.invitationLink);

    const preview = await request(app)
      .post('/api/v1/teacher/invitations/preview')
      .send({ token })
      .expect(200);
    expect(preview.headers['cache-control']).toBe('no-store');
    expect(preview.headers['referrer-policy']).toBe('no-referrer');
    expect(preview.body.data.invitation).toEqual(
      expect.objectContaining({ email: activation.email, status: 'PENDING' }),
    );

    const accepted = await request(app)
      .post('/api/v1/teacher/invitations/accept')
      .send({ token, ...activation })
      .expect(201);
    expect(accepted.body.data).toMatchObject({
      user: { email: activation.email, role: 'TEACHER', status: 'ACTIVE' },
      nextAction: 'LOGIN',
    });
    const teacher = await UserModel.findOne({ email: activation.email }).select('+passwordHash');
    expect(teacher?.passwordHash).toMatch(/^\$argon2id\$/u);
    expect(await AuthSessionModel.countDocuments({ userId: teacher!._id })).toBe(0);
    expect((await TeacherInvitationModel.findById(created.body.data.invitation.id))?.status).toBe(
      'ACCEPTED',
    );
    expect(await AuditLogModel.countDocuments({ action: 'TEACHER_INVITATION_ACCEPTED' })).toBe(1);

    const replay = await request(app)
      .post('/api/v1/teacher/invitations/accept')
      .send({ token, ...activation })
      .expect(409);
    expect(replay.body.error.code).toBe('INVITATION_ALREADY_ACCEPTED');
  });

  it('rejects mismatch and expiry without partial Teacher creation', async () => {
    const admin = await createActor('ADMIN');
    const created = await request(app)
      .post('/api/v1/admin/teacher-invitations')
      .set('Authorization', bearer(admin.accessToken))
      .send({ email: activation.email })
      .expect(201);
    const invitationId = created.body.data.invitation.id;
    const token = tokenFromLink(created.body.data.invitation.invitationLink);

    const mismatch = await request(app)
      .post('/api/v1/teacher/invitations/accept')
      .send({ token, ...activation, email: 'different@example.test' })
      .expect(422);
    expect(mismatch.body.error.code).toBe('INVITATION_EMAIL_MISMATCH');
    expect(await UserModel.countDocuments({ role: 'TEACHER' })).toBe(0);

    await TeacherInvitationModel.updateOne(
      { _id: invitationId },
      { $set: { expiresAt: new Date(Date.now() - 1_000) } },
    );
    const expired = await request(app)
      .post('/api/v1/teacher/invitations/preview')
      .send({ token })
      .expect(409);
    expect(expired.body.error.code).toBe('INVITATION_EXPIRED');
    expect((await TeacherInvitationModel.findById(invitationId))?.status).toBe('EXPIRED');
    expect(await UserModel.countDocuments({ role: 'TEACHER' })).toBe(0);
  });

  it('allows only one of two concurrent acceptance requests to create the Teacher', async () => {
    const admin = await createActor('ADMIN');
    const created = await request(app)
      .post('/api/v1/admin/teacher-invitations')
      .set('Authorization', bearer(admin.accessToken))
      .send({ email: activation.email })
      .expect(201);
    const token = tokenFromLink(created.body.data.invitation.invitationLink);
    const [first, second] = await Promise.all([
      request(app)
        .post('/api/v1/teacher/invitations/accept')
        .send({ token, ...activation }),
      request(app)
        .post('/api/v1/teacher/invitations/accept')
        .send({ token, ...activation }),
    ]);

    expect([first.status, second.status].sort()).toEqual([201, 409]);
    expect(await UserModel.countDocuments({ email: activation.email, role: 'TEACHER' })).toBe(1);
    expect(await AuditLogModel.countDocuments({ action: 'TEACHER_INVITATION_ACCEPTED' })).toBe(1);
  });
});
