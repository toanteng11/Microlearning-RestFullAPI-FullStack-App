import { createHash, randomUUID } from 'node:crypto';

import mongoose from 'mongoose';
import pino from 'pino';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../../src/app.js';
import { AuditLogModel } from '../../src/modules/audit/audit-log.model.js';
import { PhaseThreeAuditWriter } from '../../src/modules/audit/phase-three-audit.writer.js';
import { ClassCodeModel } from '../../src/modules/classroom-credentials/class-code.model.js';
import { ClassroomInviteLinkModel } from '../../src/modules/classroom-credentials/classroom-invite-link.model.js';
import { ClassroomModel } from '../../src/modules/classrooms/classroom.model.js';
import { EnrollmentPolicyRepository } from '../../src/modules/enrollment-policy/enrollment-policy.repository.js';
import { SystemSettingModel } from '../../src/modules/enrollment-policy/system-setting.model.js';
import { EnrollmentModel } from '../../src/modules/enrollments/enrollment.model.js';
import { AuthSessionModel } from '../../src/modules/sessions/auth-session.model.js';
import { SystemGuardModel } from '../../src/modules/system-guards/system-guard.model.js';
import { UserModel } from '../../src/modules/users/user.model.js';
import type { UserRole } from '../../src/modules/users/user.types.js';
import { AccessTokenService } from '../../src/shared/auth/access-token.js';
import { initializePhaseThreeIndexes } from '../../src/shared/database/phase-three-indexes.js';
import { testConfig, testRuntimeInfo } from '../test-fixtures.js';

const integrationUri = process.env.MONGODB_INTEGRATION_URI;
if (!integrationUri) throw new Error('MONGODB_INTEGRATION_URI is required for Phase 03 API tests');

const config = {
  ...testConfig,
  mongodbUri: integrationUri,
  classroomRateLimits: {
    ...testConfig.classroomRateLimits,
    joinIpMax: 200,
    joinIdentityMax: 200,
    previewIpMax: 200,
  },
};
const app = createApp({
  config,
  logger: pino({ level: 'silent' }),
  runtimeInfo: testRuntimeInfo,
  dependencies: { getDatabaseStatus: async () => 'UP' },
});
const tokens = new AccessTokenService({
  secret: config.accessTokenSecret,
  issuer: config.accessTokenIssuer,
  audience: config.accessTokenAudience,
  ttlSeconds: config.accessTokenTtlSeconds,
});

let identitySequence = 0;

async function createIdentity(role: UserRole) {
  identitySequence += 1;
  const suffix = `${role.toLowerCase()}-${identitySequence}`;
  const user = await UserModel.create({
    email: `${suffix}@example.test`,
    fullName: `${role} ${identitySequence}`,
    fullNameNormalized: `${role.toLowerCase()} ${identitySequence}`,
    passwordHash: 'synthetic-hash-not-used-for-login',
    role,
    status: 'ACTIVE',
    registrationSource:
      role === 'STUDENT'
        ? 'SELF_REGISTRATION'
        : role === 'TEACHER'
          ? 'TEACHER_INVITATION'
          : 'ADMIN_BOOTSTRAP',
    studentCode: role === 'STUDENT' ? `ST${String(identitySequence).padStart(4, '0')}` : null,
    activatedAt: new Date(),
  });
  const familyId = randomUUID();
  await AuthSessionModel.create({
    userId: user._id,
    familyId,
    tokenHash: createHash('sha256').update(randomUUID()).digest('hex'),
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + 300_000),
  });
  return { user, accessToken: await tokens.sign(user._id.toString(), familyId) };
}

function bearer(accessToken: string) {
  return `Bearer ${accessToken}`;
}

async function createClassroom(accessToken: string, name = 'Node.js Microlearning') {
  return request(app)
    .post('/api/v1/classrooms')
    .set('Authorization', bearer(accessToken))
    .send({ name, description: 'Internal backend class', subject: 'Backend', section: 'SE-01' })
    .expect(201);
}

function tokenFromInviteLink(link: string): string {
  const marker = '#token=';
  const token = link.slice(link.indexOf(marker) + marker.length);
  return decodeURIComponent(token);
}

describe('Phase 03 Classroom API integration', () => {
  beforeAll(async () => {
    await mongoose.connect(integrationUri, { serverSelectionTimeoutMS: 15_000 });
    await Promise.all([
      UserModel.syncIndexes(),
      AuthSessionModel.syncIndexes(),
      AuditLogModel.syncIndexes(),
      SystemGuardModel.syncIndexes(),
    ]);
    await initializePhaseThreeIndexes('test');
  });

  beforeEach(async () => {
    identitySequence = 0;
    await Promise.all([
      UserModel.deleteMany({}),
      AuthSessionModel.deleteMany({}),
      AuditLogModel.deleteMany({}),
      SystemGuardModel.deleteMany({}),
      ClassroomModel.deleteMany({}),
      EnrollmentModel.deleteMany({}),
      ClassCodeModel.deleteMany({}),
      ClassroomInviteLinkModel.deleteMany({}),
      SystemSettingModel.deleteMany({}),
    ]);
    await new EnrollmentPolicyRepository().ensureEnrollmentPolicy(30);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('creates, scopes, updates and governs Classroom records without leaking credentials', async () => {
    const teacher = await createIdentity('TEACHER');
    const otherTeacher = await createIdentity('TEACHER');
    const student = await createIdentity('STUDENT');
    const admin = await createIdentity('ADMIN');

    const created = await createClassroom(teacher.accessToken);
    expect(created.body.data.classroom).toMatchObject({
      name: 'Node.js Microlearning',
      status: 'ACTIVE',
      enrollmentStatus: 'OPEN',
      owner: { id: teacher.user._id.toString() },
    });
    expect(created.body.data.classCode).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/u);
    expect(JSON.stringify(await ClassCodeModel.findOne().lean())).not.toContain(
      created.body.data.classCode,
    );

    const classroomId = created.body.data.classroom.id as string;
    const teacherList = await request(app)
      .get('/api/v1/classrooms?sortBy=name&sortOrder=asc')
      .set('Authorization', bearer(teacher.accessToken))
      .expect(200);
    expect(teacherList.body.data).toHaveLength(1);

    const otherList = await request(app)
      .get('/api/v1/classrooms')
      .set('Authorization', bearer(otherTeacher.accessToken))
      .expect(200);
    expect(otherList.body.data).toHaveLength(0);

    await request(app)
      .get(`/api/v1/classrooms/${classroomId}`)
      .set('Authorization', bearer(otherTeacher.accessToken))
      .expect(404);
    await request(app)
      .patch(`/api/v1/classrooms/${classroomId}`)
      .set('Authorization', bearer(otherTeacher.accessToken))
      .send({ name: 'Cross-owner write', expectedUpdatedAt: created.body.data.classroom.updatedAt })
      .expect(404);

    await request(app)
      .post('/api/v1/classrooms')
      .set('Authorization', bearer(student.accessToken))
      .send({ name: 'Student cannot create' })
      .expect(403);
    await request(app)
      .post('/api/v1/classrooms')
      .set('Authorization', bearer(teacher.accessToken))
      .send({ name: 'Injected owner', ownerTeacherId: otherTeacher.user._id, status: 'ARCHIVED' })
      .expect(422);
    expect(await ClassroomModel.countDocuments()).toBe(1);

    await UserModel.findByIdAndUpdate(otherTeacher.user._id, { status: 'BLOCKED' });
    await request(app)
      .post('/api/v1/classrooms')
      .set('Authorization', bearer(otherTeacher.accessToken))
      .send({ name: 'Blocked Teacher cannot create' })
      .expect(403);

    await request(app)
      .get(`/api/v1/classrooms/${classroomId}`)
      .set('Authorization', bearer(student.accessToken))
      .expect(404);

    const settings = await request(app)
      .patch(`/api/v1/classrooms/${classroomId}/settings`)
      .set('Authorization', bearer(teacher.accessToken))
      .send({
        enrollmentStatus: 'CLOSED',
        expectedUpdatedAt: created.body.data.classroom.updatedAt,
      })
      .expect(200);
    expect(settings.body.data.configuredSettings.enrollmentStatus).toBe('CLOSED');

    const closedJoin = await request(app)
      .post('/api/v1/classrooms/join-by-code')
      .set('Authorization', bearer(student.accessToken))
      .send({ code: created.body.data.classCode })
      .expect(409);
    expect(closedJoin.body.error.code).toBe('ENROLLMENT_CLOSED');

    const stale = await request(app)
      .patch(`/api/v1/classrooms/${classroomId}`)
      .set('Authorization', bearer(teacher.accessToken))
      .send({ name: 'Stale write', expectedUpdatedAt: created.body.data.classroom.updatedAt })
      .expect(409);
    expect(stale.body.error.code).toBe('CONCURRENT_MODIFICATION');

    const governance = await request(app)
      .get('/api/v1/admin/classrooms')
      .set('Authorization', bearer(admin.accessToken))
      .expect(200);
    expect(governance.body.data[0]).toMatchObject({
      id: classroomId,
      memberCount: 0,
      contentCount: 0,
    });
    expect(JSON.stringify(governance.body)).not.toMatch(/codeDigest|tokenHash/u);

    const governanceDetail = await request(app)
      .get(`/api/v1/admin/classrooms/${classroomId}`)
      .set('Authorization', bearer(admin.accessToken))
      .expect(200);
    expect(governanceDetail.body.data.classroom).toMatchObject({
      id: classroomId,
      owner: { id: teacher.user._id.toString() },
      memberCount: 0,
    });
    expect(JSON.stringify(governanceDetail.body)).not.toMatch(/codeDigest|tokenHash|roster/u);

    await request(app)
      .get('/api/v1/admin/classrooms')
      .set('Authorization', bearer(student.accessToken))
      .expect(403);
    await request(app)
      .patch(`/api/v1/admin/classrooms/${classroomId}/ownership`)
      .set('Authorization', bearer(admin.accessToken))
      .send({})
      .expect(404);
  });

  it('supports idempotent join, safe roster removal and terminal rejoin rules', async () => {
    const teacher = await createIdentity('TEACHER');
    const otherTeacher = await createIdentity('TEACHER');
    const student = await createIdentity('STUDENT');
    const blockedStudent = await createIdentity('STUDENT');
    const created = await createClassroom(teacher.accessToken);
    const classroomId = created.body.data.classroom.id as string;

    await request(app)
      .post('/api/v1/classrooms/join-by-code')
      .send({ code: created.body.data.classCode })
      .expect(401);
    await request(app)
      .post('/api/v1/classrooms/join-by-code')
      .set('Authorization', bearer(teacher.accessToken))
      .send({ code: created.body.data.classCode })
      .expect(403);
    await UserModel.findByIdAndUpdate(blockedStudent.user._id, { status: 'BLOCKED' });
    await request(app)
      .post('/api/v1/classrooms/join-by-code')
      .set('Authorization', bearer(blockedStudent.accessToken))
      .send({ code: created.body.data.classCode })
      .expect(403);

    const joined = await request(app)
      .post('/api/v1/classrooms/join-by-code')
      .set('Authorization', bearer(student.accessToken))
      .send({ code: created.body.data.classCode })
      .expect(201);
    expect(joined.body.data).toMatchObject({
      alreadyEnrolled: false,
      nextAction: 'OPEN_CLASSROOM',
    });

    const duplicate = await request(app)
      .post('/api/v1/classrooms/join-by-code')
      .set('Authorization', bearer(student.accessToken))
      .send({ code: created.body.data.classCode })
      .expect(200);
    expect(duplicate.body.data.alreadyEnrolled).toBe(true);
    expect(await EnrollmentModel.countDocuments({ classroomId })).toBe(1);
    expect(await AuditLogModel.countDocuments({ action: 'CLASSROOM_JOINED' })).toBe(1);

    const roster = await request(app)
      .get(`/api/v1/classrooms/${classroomId}/students?keyword=student&sortBy=fullName`)
      .set('Authorization', bearer(teacher.accessToken))
      .expect(200);
    expect(roster.body.data).toHaveLength(1);
    expect(roster.body.data[0].student.email).toBe(student.user.email);
    expect(JSON.stringify(roster.body)).not.toContain('passwordHash');

    await request(app)
      .get(`/api/v1/classrooms/${classroomId}/students`)
      .set('Authorization', bearer(student.accessToken))
      .expect(403);
    await request(app)
      .get(`/api/v1/classrooms/${classroomId}/students`)
      .set('Authorization', bearer(otherTeacher.accessToken))
      .expect(404);
    await request(app)
      .post(`/api/v1/classrooms/${classroomId}/students/${student.user._id.toString()}/remove`)
      .set('Authorization', bearer(otherTeacher.accessToken))
      .send({
        reason: 'Unauthorized roster mutation',
        expectedEnrollmentUpdatedAt: roster.body.data[0].enrollment.updatedAt,
      })
      .expect(404);

    const removed = await request(app)
      .post(`/api/v1/classrooms/${classroomId}/students/${student.user._id.toString()}/remove`)
      .set('Authorization', bearer(teacher.accessToken))
      .send({
        reason: 'Student moved to another class',
        expectedEnrollmentUpdatedAt: roster.body.data[0].enrollment.updatedAt,
      })
      .expect(200);
    expect(removed.body.data.enrollment.status).toBe('REMOVED');

    await request(app)
      .get(`/api/v1/classrooms/${classroomId}`)
      .set('Authorization', bearer(student.accessToken))
      .expect(404);
    const rejoin = await request(app)
      .post('/api/v1/classrooms/join-by-code')
      .set('Authorization', bearer(student.accessToken))
      .send({ code: created.body.data.classCode })
      .expect(409);
    expect(rejoin.body.error.code).toBe('REJOIN_NOT_ALLOWED');
  });

  it('manages Invite Link lifecycle with public preview and raw-once responses', async () => {
    const teacher = await createIdentity('TEACHER');
    const student = await createIdentity('STUDENT');
    const created = await createClassroom(teacher.accessToken);
    const classroomId = created.body.data.classroom.id as string;

    const invite = await request(app)
      .post(`/api/v1/classrooms/${classroomId}/invite-links`)
      .set('Authorization', bearer(teacher.accessToken))
      .send({ expiresInDays: 7 })
      .expect(201);
    const token = tokenFromInviteLink(invite.body.data.inviteLink);
    expect(token.length).toBeGreaterThanOrEqual(43);
    expect(JSON.stringify(await ClassroomInviteLinkModel.findOne().lean())).not.toContain(token);

    const preview = await request(app)
      .post('/api/v1/classrooms/invite-links/preview')
      .send({ token })
      .expect(200);
    expect(preview.headers['cache-control']).toContain('no-store');
    expect(preview.body.data).toMatchObject({
      classroomName: 'Node.js Microlearning',
      joinable: true,
      teacher: { fullName: teacher.user.fullName },
    });

    await request(app)
      .post('/api/v1/classrooms/join-by-token')
      .set('Authorization', bearer(student.accessToken))
      .send({ token })
      .expect(201);

    const links = await request(app)
      .get(`/api/v1/classrooms/${classroomId}/invite-links`)
      .set('Authorization', bearer(teacher.accessToken))
      .expect(200);
    expect(JSON.stringify(links.body)).not.toMatch(/inviteLink|token|tokenHash/u);

    const regeneratePath = `/api/v1/classrooms/${classroomId}/invite-links/${invite.body.data.credential.id}/regenerate`;
    const regenerateInput = {
      expiresInDays: 10,
      reason: 'Rotate a previously shared link',
      expectedCredentialUpdatedAt: invite.body.data.credential.updatedAt,
    };
    const rotations = await Promise.all([
      request(app)
        .post(regeneratePath)
        .set('Authorization', bearer(teacher.accessToken))
        .send(regenerateInput),
      request(app)
        .post(regeneratePath)
        .set('Authorization', bearer(teacher.accessToken))
        .send(regenerateInput),
    ]);
    expect(rotations.map((result) => result.status).sort()).toEqual([200, 404]);
    const regenerated = rotations.find((result) => result.status === 200)!;
    const newToken = tokenFromInviteLink(regenerated.body.data.inviteLink);
    expect(newToken).not.toBe(token);
    await request(app).post('/api/v1/classrooms/invite-links/preview').send({ token }).expect(422);
    await request(app)
      .post('/api/v1/classrooms/invite-links/preview')
      .send({ token: newToken })
      .expect(200);

    const disabled = await request(app)
      .post(
        `/api/v1/classrooms/${classroomId}/invite-links/${regenerated.body.data.credential.id}/disable`,
      )
      .set('Authorization', bearer(teacher.accessToken))
      .send({
        reason: 'Close manual Invite Link enrollment',
        expectedCredentialUpdatedAt: regenerated.body.data.credential.updatedAt,
      })
      .expect(200);
    expect(disabled.body.data.credential.status).toBe('DISABLED');
    await request(app)
      .post('/api/v1/classrooms/invite-links/preview')
      .send({ token: newToken })
      .expect(422);
  });

  it('rotates and disables Class Codes with one concurrent winner and no raw audit data', async () => {
    const teacher = await createIdentity('TEACHER');
    const student = await createIdentity('STUDENT');
    const created = await createClassroom(teacher.accessToken, 'Credential Classroom');
    const classroomId = created.body.data.classroom.id as string;
    const metadata = await request(app)
      .get(`/api/v1/classrooms/${classroomId}/class-code`)
      .set('Authorization', bearer(teacher.accessToken))
      .expect(200);

    const rotationBody = {
      reason: 'Rotate a code shared outside the intended channel',
      expectedCredentialUpdatedAt: metadata.body.data.credential.updatedAt,
    };
    const [first, second] = await Promise.all([
      request(app)
        .post(`/api/v1/classrooms/${classroomId}/class-code/regenerate`)
        .set('Authorization', bearer(teacher.accessToken))
        .send(rotationBody),
      request(app)
        .post(`/api/v1/classrooms/${classroomId}/class-code/regenerate`)
        .set('Authorization', bearer(teacher.accessToken))
        .send(rotationBody),
    ]);
    expect([first.status, second.status].sort()).toEqual([200, 409]);
    const winner = first.status === 200 ? first : second;
    const rotatedCode = winner.body.data.classCode as string;

    await request(app)
      .post('/api/v1/classrooms/join-by-code')
      .set('Authorization', bearer(student.accessToken))
      .send({ code: created.body.data.classCode })
      .expect(422);
    await request(app)
      .post('/api/v1/classrooms/join-by-code')
      .set('Authorization', bearer(student.accessToken))
      .send({ code: rotatedCode })
      .expect(201);

    const disabled = await request(app)
      .post(`/api/v1/classrooms/${classroomId}/class-code/disable`)
      .set('Authorization', bearer(teacher.accessToken))
      .send({
        reason: 'Close Class Code enrollment',
        expectedCredentialUpdatedAt: winner.body.data.credential.updatedAt,
      })
      .expect(200);
    expect(disabled.body.data.credential.status).toBe('DISABLED');
    const retry = await request(app)
      .post(`/api/v1/classrooms/${classroomId}/class-code/disable`)
      .set('Authorization', bearer(teacher.accessToken))
      .send({
        reason: 'Close Class Code enrollment',
        expectedCredentialUpdatedAt: winner.body.data.credential.updatedAt,
      })
      .expect(200);
    expect(retry.body.data).toMatchObject({ alreadyDisabled: true, auditId: null });

    const audits = await AuditLogModel.find({
      action: { $in: ['CLASS_CODE_REGENERATED', 'CLASS_CODE_DISABLED'] },
    }).lean();
    expect(audits).toHaveLength(2);
    expect(JSON.stringify(audits)).not.toContain(rotatedCode);
    expect(JSON.stringify(audits)).not.toContain('codeDigest');
  });

  it('serializes 20 concurrent joins into one Enrollment and one success audit', async () => {
    const teacher = await createIdentity('TEACHER');
    const student = await createIdentity('STUDENT');
    const created = await createClassroom(teacher.accessToken, 'Concurrency Classroom');
    const results = await Promise.all(
      Array.from({ length: 20 }, () =>
        request(app)
          .post('/api/v1/classrooms/join-by-code')
          .set('Authorization', bearer(student.accessToken))
          .send({ code: created.body.data.classCode }),
      ),
    );

    expect(results.every((result) => [200, 201].includes(result.status))).toBe(true);
    expect(results.filter((result) => result.status === 201)).toHaveLength(1);
    expect(await EnrollmentModel.countDocuments()).toBe(1);
    expect(await AuditLogModel.countDocuments({ action: 'CLASSROOM_JOINED' })).toBe(1);
  });

  it('applies global policy precedence and protects Teacher offboarding until archive', async () => {
    const teacher = await createIdentity('TEACHER');
    const student = await createIdentity('STUDENT');
    const secondStudent = await createIdentity('STUDENT');
    const admin = await createIdentity('ADMIN');
    const created = await createClassroom(teacher.accessToken);
    const classroomId = created.body.data.classroom.id as string;

    await request(app)
      .post('/api/v1/classrooms/join-by-code')
      .set('Authorization', bearer(student.accessToken))
      .send({ code: created.body.data.classCode })
      .expect(201);

    const policy = await request(app)
      .get('/api/v1/admin/settings/enrollment-policy')
      .set('Authorization', bearer(admin.accessToken))
      .expect(200);
    const updatedPolicy = await request(app)
      .patch('/api/v1/admin/settings/enrollment-policy')
      .set('Authorization', bearer(admin.accessToken))
      .send({
        allowClassCodeJoin: false,
        allowInviteLinkJoin: true,
        defaultInviteLinkLifetimeDays: 14,
        expectedRevision: policy.body.data.policy.revision,
        reason: 'Temporarily disable Class Code joins',
      })
      .expect(200);
    expect(updatedPolicy.body.data.policy.revision).toBe(policy.body.data.policy.revision + 1);

    await request(app)
      .get('/api/v1/admin/settings/enrollment-policy')
      .set('Authorization', bearer(student.accessToken))
      .expect(403);
    const stalePolicy = await request(app)
      .patch('/api/v1/admin/settings/enrollment-policy')
      .set('Authorization', bearer(admin.accessToken))
      .send({
        allowClassCodeJoin: true,
        allowInviteLinkJoin: updatedPolicy.body.data.policy.allowInviteLinkJoin,
        defaultInviteLinkLifetimeDays: updatedPolicy.body.data.policy.defaultInviteLinkLifetimeDays,
        expectedRevision: policy.body.data.policy.revision,
        reason: 'Stale revision must not overwrite policy',
      })
      .expect(409);
    expect(stalePolicy.body.error.code).toBe('CONCURRENT_MODIFICATION');

    const deniedJoin = await request(app)
      .post('/api/v1/classrooms/join-by-code')
      .set('Authorization', bearer(secondStudent.accessToken))
      .send({ code: created.body.data.classCode })
      .expect(422);
    expect(deniedJoin.body.error.code).toBe('JOIN_METHOD_DISABLED');
    expect(await EnrollmentModel.countDocuments({ classroomId })).toBe(1);
    await request(app)
      .get(`/api/v1/classrooms/${classroomId}`)
      .set('Authorization', bearer(student.accessToken))
      .expect(200);

    const blocked = await request(app)
      .patch(`/api/v1/admin/users/${teacher.user._id.toString()}/status`)
      .set('Authorization', bearer(admin.accessToken))
      .send({
        status: 'BLOCKED',
        reason: 'Scheduled Teacher offboarding',
        expectedUpdatedAt: teacher.user.updatedAt.toISOString(),
      })
      .expect(409);
    expect(blocked.body.error.code).toBe('TEACHER_HAS_ACTIVE_CLASSROOM');

    const restoredPolicy = await request(app)
      .patch('/api/v1/admin/settings/enrollment-policy')
      .set('Authorization', bearer(admin.accessToken))
      .send({
        allowClassCodeJoin: true,
        allowInviteLinkJoin: updatedPolicy.body.data.policy.allowInviteLinkJoin,
        defaultInviteLinkLifetimeDays: updatedPolicy.body.data.policy.defaultInviteLinkLifetimeDays,
        expectedRevision: updatedPolicy.body.data.policy.revision,
        reason: 'Restore Class Code joins after governance check',
      })
      .expect(200);
    expect(restoredPolicy.body.data.policy.revision).toBe(
      updatedPolicy.body.data.policy.revision + 1,
    );

    const current = await ClassroomModel.findById(classroomId).orFail();
    await request(app)
      .delete(`/api/v1/classrooms/${classroomId}`)
      .set('Authorization', bearer(teacher.accessToken))
      .send({ reason: 'End of academic term', expectedUpdatedAt: current.updatedAt.toISOString() })
      .expect(204);

    const archivedJoin = await request(app)
      .post('/api/v1/classrooms/join-by-code')
      .set('Authorization', bearer(secondStudent.accessToken))
      .send({ code: created.body.data.classCode })
      .expect(409);
    expect(archivedJoin.body.error.code).toBe('CLASSROOM_NOT_JOINABLE');
    await request(app)
      .get(`/api/v1/classrooms/${classroomId}`)
      .set('Authorization', bearer(student.accessToken))
      .expect(200);

    const policyAudits = await AuditLogModel.find({ action: 'ENROLLMENT_POLICY_UPDATED' }).lean();
    expect(policyAudits).toHaveLength(2);
    expect(policyAudits[0]).toMatchObject({
      oldValue: { allowClassCodeJoin: true },
      newValue: { allowClassCodeJoin: false },
    });

    const freshTeacher = await UserModel.findById(teacher.user._id).orFail();
    await request(app)
      .patch(`/api/v1/admin/users/${teacher.user._id.toString()}/status`)
      .set('Authorization', bearer(admin.accessToken))
      .send({
        status: 'BLOCKED',
        reason: 'Scheduled Teacher offboarding',
        expectedUpdatedAt: freshTeacher.updatedAt.toISOString(),
      })
      .expect(200);
  });

  it('rolls back Enrollment when the transactional audit write fails', async () => {
    const teacher = await createIdentity('TEACHER');
    const student = await createIdentity('STUDENT');
    const created = await createClassroom(teacher.accessToken, 'Rollback Classroom');

    vi.spyOn(PhaseThreeAuditWriter.prototype, 'append').mockRejectedValueOnce(
      new Error('Synthetic audit failure'),
    );
    await request(app)
      .post('/api/v1/classrooms/join-by-code')
      .set('Authorization', bearer(student.accessToken))
      .send({ code: created.body.data.classCode })
      .expect(500);

    expect(await EnrollmentModel.countDocuments()).toBe(0);
    expect(await AuditLogModel.countDocuments({ action: 'CLASSROOM_JOINED' })).toBe(0);
  });

  it('rate-limits join and public preview without creating partial state', async () => {
    const limitedApp = createApp({
      config: {
        ...config,
        classroomRateLimits: {
          joinIpMax: 1,
          joinIdentityMax: 1,
          joinWindowSeconds: 900,
          previewIpMax: 1,
        },
      },
      logger: pino({ level: 'silent' }),
      runtimeInfo: testRuntimeInfo,
      dependencies: { getDatabaseStatus: async () => 'UP' },
    });
    const student = await createIdentity('STUDENT');
    const invalidCode = 'ABCD-EFGH';

    await request(limitedApp)
      .post('/api/v1/classrooms/join-by-code')
      .set('Authorization', bearer(student.accessToken))
      .send({ code: invalidCode })
      .expect(422);
    const limitedJoin = await request(limitedApp)
      .post('/api/v1/classrooms/join-by-code')
      .set('Authorization', bearer(student.accessToken))
      .send({ code: invalidCode })
      .expect(429);
    expect(limitedJoin.body.error.code).toBe('RATE_LIMITED');

    const invalidToken = 'a'.repeat(43);
    await request(limitedApp)
      .post('/api/v1/classrooms/invite-links/preview')
      .send({ token: invalidToken })
      .expect(422);
    const limitedPreview = await request(limitedApp)
      .post('/api/v1/classrooms/invite-links/preview')
      .send({ token: invalidToken })
      .expect(429);
    expect(limitedPreview.body.error.code).toBe('RATE_LIMITED');
    expect(await EnrollmentModel.countDocuments()).toBe(0);
    expect(await AuditLogModel.countDocuments({ action: 'CLASSROOM_JOINED' })).toBe(0);
  });
});
