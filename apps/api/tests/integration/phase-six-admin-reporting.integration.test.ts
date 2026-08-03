import { createHash, randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';

import mongoose from 'mongoose';
import pino from 'pino';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { AuditLogModel } from '../../src/modules/audit/audit-log.model.js';
import { AuthSessionModel } from '../../src/modules/sessions/auth-session.model.js';
import { ClassroomModel } from '../../src/modules/classrooms/classroom.model.js';
import { CourseModel } from '../../src/modules/courses/course.model.js';
import { EnrollmentModel } from '../../src/modules/enrollments/enrollment.model.js';
import { TeacherInvitationModel } from '../../src/modules/teacher-invitations/teacher-invitation.model.js';
import { UserModel } from '../../src/modules/users/user.model.js';
import type { UserRole, UserStatus } from '../../src/modules/users/user.types.js';
import { AccessTokenService } from '../../src/shared/auth/access-token.js';
import { testConfig, testRuntimeInfo } from '../test-fixtures.js';

const integrationUri = process.env.MONGODB_INTEGRATION_URI;
if (!integrationUri) throw new Error('MONGODB_INTEGRATION_URI is required for Phase 06 tests');
const config = { ...testConfig, mongodbUri: integrationUri };
const app = createApp({
  config,
  logger: pino({ level: 'silent' }),
  runtimeInfo: testRuntimeInfo,
  dependencies: { getDatabaseStatus: async () => 'UP' },
});
const tokenService = new AccessTokenService({
  secret: config.accessTokenSecret,
  issuer: config.accessTokenIssuer,
  audience: config.accessTokenAudience,
  ttlSeconds: config.accessTokenTtlSeconds,
});
let sequence = 0;

async function identity(role: UserRole, status: UserStatus = 'ACTIVE') {
  sequence += 1;
  const user = await UserModel.create({
    email: `${role.toLowerCase()}-admin-report-${sequence}@example.test`,
    fullName: `${role} Admin Report ${sequence}`,
    fullNameNormalized: `${role.toLowerCase()} admin report ${sequence}`,
    passwordHash: 'synthetic-hash',
    role,
    status,
    registrationSource:
      role === 'STUDENT'
        ? 'SELF_REGISTRATION'
        : role === 'TEACHER'
          ? 'TEACHER_INVITATION'
          : 'ADMIN_BOOTSTRAP',
    studentCode: role === 'STUDENT' ? `AR${String(sequence).padStart(5, '0')}` : null,
    activatedAt: status === 'ACTIVE' ? new Date() : null,
  });
  if (status !== 'ACTIVE') return { user, token: null };
  const familyId = randomUUID();
  await AuthSessionModel.create({
    userId: user._id,
    familyId,
    tokenHash: createHash('sha256').update(randomUUID()).digest('hex'),
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + 300_000),
  });
  return { user, token: await tokenService.sign(user._id.toString(), familyId) };
}

function bearer(token: string | null) {
  if (!token) throw new Error('An active identity token is required');
  return `Bearer ${token}`;
}

async function fixture() {
  const admin = await identity('ADMIN');
  const superAdmin = await identity('SUPER_ADMIN');
  const teacher = await identity('TEACHER');
  const student = await identity('STUDENT');
  await identity('STUDENT', 'BLOCKED');
  await identity('TEACHER', 'PENDING');
  const now = new Date();
  const activeClassroom = await ClassroomModel.create({
    name: 'Admin Report Active Classroom',
    nameNormalized: 'admin report active classroom',
    ownerTeacherId: teacher.user._id,
    status: 'ACTIVE',
    enrollmentStatus: 'OPEN',
    allowClassCodeJoin: true,
    allowInviteLinkJoin: true,
  });
  const archivedClassroom = await ClassroomModel.create({
    name: 'Admin Report Archived Classroom',
    nameNormalized: 'admin report archived classroom',
    ownerTeacherId: teacher.user._id,
    status: 'ARCHIVED',
    enrollmentStatus: 'CLOSED',
    allowClassCodeJoin: false,
    allowInviteLinkJoin: false,
    archivedAt: now,
  });
  await Promise.all([
    CourseModel.create({
      classroomId: activeClassroom._id,
      ownerTeacherId: teacher.user._id,
      title: 'Admin Report Published Course',
      description: '',
      status: 'PUBLISHED',
      publishedAt: now,
      displayOrder: 0,
      createdBy: teacher.user._id,
      updatedBy: teacher.user._id,
    }),
    CourseModel.create({
      classroomId: archivedClassroom._id,
      ownerTeacherId: teacher.user._id,
      title: 'Admin Report Archived Course',
      description: '',
      status: 'ARCHIVED',
      archivedAt: now,
      displayOrder: 0,
      createdBy: teacher.user._id,
      updatedBy: teacher.user._id,
    }),
    EnrollmentModel.create({
      classroomId: activeClassroom._id,
      studentId: student.user._id,
      status: 'ACTIVE',
      joinedBy: 'CLASS_CODE',
      joinedAt: now,
    }),
    TeacherInvitationModel.create({
      email: 'pending-admin-report@example.test',
      tokenHash: createHash('sha256').update('pending-admin-report').digest('hex'),
      status: 'PENDING',
      deliveryMethod: 'MANUAL_COPY',
      invitedBy: admin.user._id,
      expiresAt: new Date(now.getTime() + 86_400_000),
    }),
    TeacherInvitationModel.create({
      email: 'expired-admin-report@example.test',
      tokenHash: createHash('sha256').update('expired-admin-report').digest('hex'),
      status: 'PENDING',
      deliveryMethod: 'MANUAL_COPY',
      invitedBy: admin.user._id,
      expiresAt: new Date(now.getTime() - 86_400_000),
    }),
    AuditLogModel.create({
      actorId: admin.user._id,
      actorRole: 'ADMIN',
      action: 'USER_STATUS_CHANGED',
      resourceType: 'User',
      resourceId: student.user._id.toString(),
      requestId: 'admin-report-sensitive-source',
      oldValue: { status: 'PENDING', passwordHash: 'must-not-leak' },
      newValue: { status: 'ACTIVE', feedback: 'must-not-leak' },
      metadata: { tokenHash: 'must-not-leak', rawAnswer: 'must-not-leak' },
    }),
  ]);
  return { admin, superAdmin, teacher, student };
}

describe('Phase 06 Admin Reporting API on MongoDB replica set', () => {
  beforeAll(async () => {
    await mongoose.connect(integrationUri, { serverSelectionTimeoutMS: 15_000 });
    await AuditLogModel.createIndexes();
  });

  beforeEach(async () => {
    sequence = 0;
    await Promise.all([
      UserModel.deleteMany({}),
      AuthSessionModel.deleteMany({}),
      ClassroomModel.deleteMany({}),
      CourseModel.deleteMany({}),
      EnrollmentModel.deleteMany({}),
      TeacherInvitationModel.deleteMany({}),
      AuditLogModel.deleteMany({}),
    ]);
  });

  afterAll(async () => mongoose.disconnect());

  it('returns complete dashboard and governance lifecycle counts from canonical sources', async () => {
    const data = await fixture();
    const authorization = bearer(data.admin.token);
    const dashboard = await request(app)
      .get('/api/v1/admin/dashboard?recentLimit=10')
      .set('Authorization', authorization)
      .expect(200);

    expect(dashboard.headers['cache-control']).toBe('private, no-store');
    expect(dashboard.body.data.users).toMatchObject({
      STUDENT: { total: 2, ACTIVE: 1, BLOCKED: 1, DELETED: 0 },
      TEACHER: { total: 2, ACTIVE: 1, PENDING: 1 },
      ADMIN: { total: 1, ACTIVE: 1 },
      SUPER_ADMIN: { total: 1, ACTIVE: 1 },
    });
    expect(dashboard.body.data.registrationSources).toEqual({
      SELF_REGISTRATION: 2,
      TEACHER_INVITATION: 2,
      ADMIN_BOOTSTRAP: 2,
    });
    expect(dashboard.body.data.invitations).toEqual({
      PENDING: 1,
      ACCEPTED: 0,
      EXPIRED: 1,
      REVOKED: 0,
    });
    expect(dashboard.body.data.classrooms).toEqual({ ACTIVE: 1, LOCKED: 0, ARCHIVED: 1 });
    expect(dashboard.body.data.courses).toEqual({
      DRAFT: 0,
      SCHEDULED: 0,
      PUBLISHED: 1,
      UNPUBLISHED: 0,
      ARCHIVED: 1,
    });
    expect(dashboard.body.data.activeEnrollmentCount).toBe(1);
    expect(dashboard.body.data.recentGovernanceEvents[0]).toEqual(
      expect.objectContaining({ action: 'USER_STATUS_CHANGED' }),
    );
    expect(Object.keys(dashboard.body.data.recentGovernanceEvents[0]).sort()).toEqual([
      'action',
      'actorId',
      'actorRole',
      'createdAt',
      'id',
      'requestId',
      'resourceId',
      'resourceType',
    ]);

    const from = new Date(Date.now() - 86_400_000).toISOString();
    const to = new Date(Date.now() + 86_400_000).toISOString();
    const governance = await request(app)
      .get(
        `/api/v1/admin/reports/governance?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&role=STUDENT&userStatus=ACTIVE`,
      )
      .set('Authorization', authorization)
      .expect(200);
    expect(governance.body.data.users.STUDENT).toMatchObject({ total: 1, ACTIVE: 1 });
    expect(governance.body.data.users.TEACHER.total).toBe(0);
    expect(governance.body.data.registrationSources).toEqual({
      SELF_REGISTRATION: 1,
      TEACHER_INVITATION: 0,
      ADMIN_BOOTSTRAP: 0,
    });
    expect(governance.body.data.enrollments).toEqual({
      ACTIVE: 1,
      REMOVED: 0,
      LEFT: 0,
      BLOCKED: 0,
    });
  });

  it('enforces RBAC, strict queries and bounded date ranges', async () => {
    const data = await fixture();
    await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', bearer(data.teacher.token))
      .expect(403);
    await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', bearer(data.student.token))
      .expect(403);
    await request(app)
      .get('/api/v1/admin/dashboard?unknown=true')
      .set('Authorization', bearer(data.admin.token))
      .expect(400);
    await request(app)
      .get('/api/v1/admin/audit-logs?limit=51')
      .set('Authorization', bearer(data.admin.token))
      .expect(400);
    const response = await request(app)
      .get('/api/v1/admin/reports/governance?from=2025-01-01&to=2026-07-02')
      .set('Authorization', bearer(data.admin.token))
      .expect(422);
    expect(response.body.error.code).toBe('REPORT_LIMIT_EXCEEDED');
  });

  it('keeps audit item/count scope aligned and never returns raw state or metadata', async () => {
    const data = await fixture();
    const query =
      '/api/v1/admin/audit-logs?page=1&limit=20&actorRole=ADMIN&action=USER_STATUS_CHANGED';
    const adminResponse = await request(app)
      .get(query)
      .set('Authorization', bearer(data.admin.token))
      .expect(200);
    const superResponse = await request(app)
      .get(query)
      .set('Authorization', bearer(data.superAdmin.token))
      .expect(200);

    expect(adminResponse.body.meta.totalItems).toBe(1);
    expect(adminResponse.body.data.items).toHaveLength(1);
    expect(superResponse.body.data.items).toEqual(adminResponse.body.data.items);
    for (const response of [adminResponse, superResponse]) {
      const serialized = JSON.stringify(response.body.data.items);
      expect(serialized).not.toMatch(/oldValue|newValue|metadata|passwordHash|feedback|rawAnswer/u);
    }
    const viewAudit = await AuditLogModel.findOne({
      action: 'REPORT_VIEWED',
      resourceId: 'RPT-ADM-AUDIT',
      actorId: data.admin.user._id,
    })
      .lean()
      .exec();
    expect(viewAudit).toMatchObject({
      oldValue: null,
      newValue: null,
      metadata: {
        reportId: 'RPT-ADM-AUDIT',
        definitionVersion: 'P06_ADMIN_GOVERNANCE_V1',
        page: 1,
        limit: 20,
        rowCount: 1,
        result: 'SUCCESS',
      },
    });
    expect(viewAudit?.metadata).not.toHaveProperty('actorRole');
    expect(viewAudit?.metadata).not.toHaveProperty('action');
    expect(viewAudit?.metadata).not.toHaveProperty('timezone');
    expect(JSON.stringify(viewAudit?.metadata)).not.toContain('USER_STATUS_CHANGED');
  });

  it('meets P06-PERF-006 for a bounded indexed audit query', async () => {
    const data = await fixture();
    await AuditLogModel.insertMany(
      Array.from({ length: 200 }, (_, index) => ({
        actorId: data.admin.user._id,
        actorRole: index % 2 === 0 ? 'ADMIN' : 'SYSTEM',
        action: index % 2 === 0 ? 'REPORTING_RECONCILIATION_COMPLETED' : 'SYSTEM_EVENT',
        resourceType: 'ReportingJob',
        resourceId: `job-${index}`,
        requestId: `perf-admin-report-${index}`,
      })),
    );
    await AuditLogModel.find({ actorRole: 'ADMIN' })
      .sort({ createdAt: -1, _id: -1 })
      .hint('ix_audit_logs_actor_role_created')
      .limit(1)
      .lean()
      .exec();

    const durations: number[] = [];
    for (let index = 0; index < 10; index += 1) {
      const startedAt = performance.now();
      await request(app)
        .get('/api/v1/admin/audit-logs?actorRole=ADMIN&page=1&limit=50')
        .set('Authorization', bearer(data.admin.token))
        .expect(200);
      durations.push(performance.now() - startedAt);
    }
    const sorted = [...durations].sort((left, right) => left - right);
    const p95 = sorted[Math.ceil(sorted.length * 0.95) - 1]!;
    console.info(
      JSON.stringify({ event: 'phase06.admin_reporting.performance', sampleSize: 10, p95Ms: p95 }),
    );
    expect(p95).toBeLessThanOrEqual(1_200);
  });
});
