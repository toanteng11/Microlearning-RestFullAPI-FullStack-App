import { randomUUID } from 'node:crypto';

import mongoose, { type Model } from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AuditLogModel } from '../../src/modules/audit/audit-log.model.js';
import { AuthLoginStateModel } from '../../src/modules/auth/auth-login-state.model.js';
import { AuthSessionModel } from '../../src/modules/sessions/auth-session.model.js';
import { SystemGuardModel } from '../../src/modules/system-guards/system-guard.model.js';
import { TeacherInvitationModel } from '../../src/modules/teacher-invitations/teacher-invitation.model.js';
import { UserModel } from '../../src/modules/users/user.model.js';

const integrationUri = process.env.MONGODB_INTEGRATION_URI;
if (!integrationUri) throw new Error('MONGODB_INTEGRATION_URI is required for index integration');

const models: Model<never>[] = [
  UserModel as unknown as Model<never>,
  AuthSessionModel as unknown as Model<never>,
  AuthLoginStateModel as unknown as Model<never>,
  TeacherInvitationModel as unknown as Model<never>,
  AuditLogModel as unknown as Model<never>,
  SystemGuardModel as unknown as Model<never>,
];

async function indexByName(model: Model<never>, name: string) {
  const indexes = await model.collection.indexes();
  const index = indexes.find((candidate) => candidate.name === name);
  expect(index, `${model.collection.collectionName}.${name}`).toBeDefined();
  return index!;
}

function userFixture(email: string, studentCode: string | null = null) {
  return {
    email,
    fullName: 'Index Test User',
    fullNameNormalized: 'index test user',
    passwordHash: 'synthetic-hash-not-used-for-login',
    role: 'STUDENT' as const,
    status: 'ACTIVE' as const,
    registrationSource: 'SELF_REGISTRATION' as const,
    studentCode,
  };
}

describe('Phase 02 MongoDB indexes', () => {
  beforeAll(async () => {
    await mongoose.connect(integrationUri, { serverSelectionTimeoutMS: 15_000 });
    for (const model of models) await model.syncIndexes();
  });

  beforeEach(async () => {
    await Promise.all(models.map((model) => model.deleteMany({})));
  });

  afterAll(async () => mongoose.disconnect());

  it('creates every required named, unique, partial, query, and TTL index', async () => {
    const expectedNames = new Map<Model<never>, string[]>([
      [
        UserModel as unknown as Model<never>,
        [
          'uq_users_email',
          'ix_users_role_status_created',
          'ix_users_role_name',
          'ix_users_role_email',
          'uq_users_student_code',
        ],
      ],
      [
        AuthSessionModel as unknown as Model<never>,
        [
          'uq_auth_sessions_token_hash',
          'ix_auth_sessions_family_status',
          'ix_auth_sessions_user_status_expiry',
          'ttl_auth_sessions_expiry',
        ],
      ],
      [
        AuthLoginStateModel as unknown as Model<never>,
        ['uq_auth_login_states_identity', 'ttl_auth_login_states_expiry'],
      ],
      [
        TeacherInvitationModel as unknown as Model<never>,
        [
          'uq_teacher_invitations_token_hash',
          'uq_teacher_invitation_pending_email',
          'ix_teacher_invitations_email_status_expiry',
          'ix_teacher_invitations_status_created',
        ],
      ],
      [
        AuditLogModel as unknown as Model<never>,
        [
          'ix_audit_logs_created',
          'ix_audit_logs_actor_created',
          'ix_audit_logs_resource_created',
          'uq_audit_logs_idempotency',
        ],
      ],
    ]);

    for (const [model, names] of expectedNames) {
      const actualNames = (await model.collection.indexes()).map((index) => index.name);
      expect(actualNames).toEqual(expect.arrayContaining(names));
    }

    expect(
      (await indexByName(AuthSessionModel as unknown as Model<never>, 'ttl_auth_sessions_expiry'))
        .expireAfterSeconds,
    ).toBe(0);
    expect(
      (
        await indexByName(
          AuthLoginStateModel as unknown as Model<never>,
          'ttl_auth_login_states_expiry',
        )
      ).expireAfterSeconds,
    ).toBe(0);
    expect(
      (await indexByName(UserModel as unknown as Model<never>, 'uq_users_student_code'))
        .partialFilterExpression,
    ).toEqual({
      studentCode: { $type: 'string' },
    });
    expect(
      (
        await indexByName(
          TeacherInvitationModel as unknown as Model<never>,
          'uq_teacher_invitation_pending_email',
        )
      ).partialFilterExpression,
    ).toEqual({ status: 'PENDING' });
  });

  it('enforces unique constraints while allowing records outside partial indexes', async () => {
    await UserModel.create(userFixture('first.index@example.test'));
    await expect(UserModel.create(userFixture('first.index@example.test'))).rejects.toMatchObject({
      code: 11000,
    });

    await UserModel.create(userFixture('student-a@example.test', 'STU-INDEX-001'));
    await expect(
      UserModel.create(userFixture('student-b@example.test', 'STU-INDEX-001')),
    ).rejects.toMatchObject({ code: 11000 });
    await UserModel.create([
      userFixture('without-code-a@example.test'),
      userFixture('without-code-b@example.test'),
    ]);

    const invitedBy = (await UserModel.findOne({ email: 'first.index@example.test' }))!._id;
    const invitationBase = {
      email: 'pending.index@example.test',
      role: 'TEACHER' as const,
      deliveryMethod: 'MANUAL_COPY' as const,
      invitedBy,
      expiresAt: new Date(Date.now() + 60_000),
    };
    await TeacherInvitationModel.create({
      ...invitationBase,
      tokenHash: randomUUID(),
      status: 'PENDING',
    });
    await expect(
      TeacherInvitationModel.create({
        ...invitationBase,
        tokenHash: randomUUID(),
        status: 'PENDING',
      }),
    ).rejects.toMatchObject({ code: 11000 });
    await TeacherInvitationModel.create({
      ...invitationBase,
      tokenHash: randomUUID(),
      status: 'REVOKED',
    });
  });
});
