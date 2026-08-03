import { createHash, randomUUID } from 'node:crypto';

import mongoose from 'mongoose';
import pino from 'pino';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { AuthSessionModel } from '../../src/modules/sessions/auth-session.model.js';
import { ClassroomModel } from '../../src/modules/classrooms/classroom.model.js';
import { CourseModel } from '../../src/modules/courses/course.model.js';
import { EnrollmentModel } from '../../src/modules/enrollments/enrollment.model.js';
import { AnalyticsEventModel } from '../../src/modules/reporting/analytics-event.model.js';
import { CourseProgressSnapshotModel } from '../../src/modules/reporting/course-progress-snapshot.model.js';
import { CourseProgressSummaryModel } from '../../src/modules/reporting/course-progress-summary.model.js';
import {
  PROCESS_SCORE_VERSION,
  REPORTING_DESCRIPTOR_VERSION,
  REPORTING_SCHEMA_VERSION,
  REPORTING_SOURCE_METRIC_VERSION,
} from '../../src/modules/reporting/reporting.constants.js';
import { UserModel } from '../../src/modules/users/user.model.js';
import type { UserRole } from '../../src/modules/users/user.types.js';
import { AccessTokenService } from '../../src/shared/auth/access-token.js';
import { initializePhaseSixIndexes } from '../../src/shared/database/phase-six-indexes.js';
import { testConfig, testRuntimeInfo } from '../test-fixtures.js';

const integrationUri = process.env.MONGODB_INTEGRATION_URI;
if (!integrationUri) throw new Error('MONGODB_INTEGRATION_URI is required for Phase 06 tests');

const enabledConfig = {
  ...testConfig,
  mongodbUri: integrationUri,
  reporting: {
    ...testConfig.reporting,
    exportEnabled: true,
    analyticsEventsEnabled: true,
    studentProgressTrendEnabled: true,
    adminLearningOutcomesEnabled: true,
  },
};
const disabledConfig = { ...testConfig, mongodbUri: integrationUri };

function app(config: typeof enabledConfig) {
  return createApp({
    config,
    logger: pino({ level: 'silent' }),
    runtimeInfo: testRuntimeInfo,
    dependencies: { getDatabaseStatus: async () => 'UP' },
  });
}

const enabledApp = app(enabledConfig);
const disabledApp = app(disabledConfig);
const tokenService = new AccessTokenService({
  secret: enabledConfig.accessTokenSecret,
  issuer: enabledConfig.accessTokenIssuer,
  audience: enabledConfig.accessTokenAudience,
  ttlSeconds: enabledConfig.accessTokenTtlSeconds,
});
let sequence = 0;

async function identity(role: UserRole) {
  sequence += 1;
  const user = await UserModel.create({
    email: `${role.toLowerCase()}-conditional-${sequence}@example.test`,
    fullName: `${role} Conditional ${sequence}`,
    fullNameNormalized: `${role.toLowerCase()} conditional ${sequence}`,
    passwordHash: 'synthetic-hash',
    role,
    status: 'ACTIVE',
    registrationSource:
      role === 'STUDENT'
        ? 'SELF_REGISTRATION'
        : role === 'TEACHER'
          ? 'TEACHER_INVITATION'
          : 'ADMIN_BOOTSTRAP',
    studentCode: role === 'STUDENT' ? `CR${String(sequence).padStart(5, '0')}` : null,
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
  return { user, token: await tokenService.sign(user._id.toString(), familyId) };
}

function bearer(token: string) {
  return `Bearer ${token}`;
}

async function fixture() {
  const admin = await identity('ADMIN');
  const teacher = await identity('TEACHER');
  const student = await identity('STUDENT');
  const now = new Date();
  const classroom = await ClassroomModel.create({
    name: 'Conditional Reporting Classroom',
    nameNormalized: 'conditional reporting classroom',
    ownerTeacherId: teacher.user._id,
    status: 'ACTIVE',
    enrollmentStatus: 'OPEN',
    allowClassCodeJoin: true,
    allowInviteLinkJoin: true,
  });
  const course = await CourseModel.create({
    classroomId: classroom._id,
    ownerTeacherId: teacher.user._id,
    title: 'Conditional Reporting Course',
    description: '',
    status: 'PUBLISHED',
    publishedAt: now,
    displayOrder: 0,
    createdBy: teacher.user._id,
    updatedBy: teacher.user._id,
  });
  await EnrollmentModel.create({
    classroomId: classroom._id,
    studentId: student.user._id,
    status: 'ACTIVE',
    joinedBy: 'CLASS_CODE',
    joinedAt: now,
  });
  const summaryStudentIds = [
    student.user._id,
    new mongoose.Types.ObjectId(),
    new mongoose.Types.ObjectId(),
    new mongoose.Types.ObjectId(),
    new mongoose.Types.ObjectId(),
  ];
  await CourseProgressSummaryModel.insertMany(
    summaryStudentIds.map((studentId, index) => ({
      schemaVersion: REPORTING_SCHEMA_VERSION,
      courseId: course._id,
      classroomId: classroom._id,
      studentId,
      sourceMetricVersion: REPORTING_SOURCE_METRIC_VERSION,
      descriptorVersion: REPORTING_DESCRIPTOR_VERSION,
      processScoreVersion: PROCESS_SCORE_VERSION,
      requiredActivityCount: 4,
      completedRequiredCount: index === 0 ? 2 : 4,
      progressPercentage: index === 0 ? 50 : 100,
      processScore: index === 0 ? 50 : 100,
      missingActivityCount: index === 0 ? 1 : 0,
      lateActivityCount: 0,
      ungradedActivityCount: 0,
      returnedGradeCount: 1,
      gradePointsEarned: 8,
      gradePointsPossible: 10,
      returnedGradeAverage: 80,
      lastActiveAt: now,
      courseCompleted: index !== 0,
      supportFlags: index === 0 ? ['HAS_MISSING_WORK'] : [],
      sourceChangedAt: now,
      recalculatedAt: now,
      refreshStatus: 'FRESH',
      revision: 3,
    })),
  );
  await CourseProgressSnapshotModel.insertMany([
    {
      schemaVersion: REPORTING_SCHEMA_VERSION,
      courseId: course._id,
      classroomId: classroom._id,
      studentId: student.user._id,
      sourceMetricVersion: REPORTING_SOURCE_METRIC_VERSION,
      descriptorVersion: REPORTING_DESCRIPTOR_VERSION,
      processScoreVersion: PROCESS_SCORE_VERSION,
      summaryRevision: 1,
      progressPercentage: 25,
      processScore: 25,
      returnedGradeAverage: null,
      completedRequiredCount: 1,
      requiredActivityCount: 4,
      missingActivityCount: 0,
      lateActivityCount: 0,
      capturedAt: new Date(now.getTime() - 86_400_000),
    },
    {
      schemaVersion: REPORTING_SCHEMA_VERSION,
      courseId: course._id,
      classroomId: classroom._id,
      studentId: student.user._id,
      sourceMetricVersion: REPORTING_SOURCE_METRIC_VERSION,
      descriptorVersion: REPORTING_DESCRIPTOR_VERSION,
      processScoreVersion: PROCESS_SCORE_VERSION,
      summaryRevision: 2,
      progressPercentage: 50,
      processScore: 50,
      returnedGradeAverage: 80,
      completedRequiredCount: 2,
      requiredActivityCount: 4,
      missingActivityCount: 1,
      lateActivityCount: 0,
      capturedAt: new Date(now.getTime() - 3_600_000),
    },
  ]);
  return { admin, teacher, student, classroom, course };
}

describe('Phase 06 conditional reporting on MongoDB replica set', () => {
  beforeAll(async () => {
    await mongoose.connect(integrationUri, { serverSelectionTimeoutMS: 15_000 });
    await initializePhaseSixIndexes('test');
  });

  beforeEach(async () => {
    sequence = 0;
    await Promise.all([
      UserModel.deleteMany({}),
      AuthSessionModel.deleteMany({}),
      ClassroomModel.deleteMany({}),
      CourseModel.deleteMany({}),
      EnrollmentModel.deleteMany({}),
      CourseProgressSummaryModel.deleteMany({}),
      CourseProgressSnapshotModel.deleteMany({}),
      AnalyticsEventModel.deleteMany({}),
    ]);
  });

  afterAll(async () => mongoose.disconnect());

  it('fails closed when conditional capabilities remain disabled', async () => {
    const data = await fixture();
    await request(disabledApp)
      .get(`/api/v1/students/me/progress/trend?courseId=${data.course._id.toString()}`)
      .set('Authorization', bearer(data.student.token))
      .expect(409);
    await request(disabledApp)
      .post('/api/v1/analytics/events')
      .set('Authorization', bearer(data.student.token))
      .send({
        eventId: randomUUID(),
        eventName: 'report_viewed',
        schemaVersion: '1',
        occurredAt: new Date().toISOString(),
        context: { courseId: data.course._id.toString() },
        properties: { reportId: 'RPT-STUDENT-PROGRESS' },
      })
      .expect(409);
    await request(disabledApp)
      .get('/api/v1/admin/reports/governance/export')
      .set('Authorization', bearer(data.admin.token))
      .expect(409);
  });

  it('returns real snapshots, privacy-safe outcomes and a bounded CSV export', async () => {
    const data = await fixture();
    const trend = await request(enabledApp)
      .get(`/api/v1/students/me/progress/trend?courseId=${data.course._id.toString()}`)
      .set('Authorization', bearer(data.student.token))
      .expect(200);
    expect(trend.body.data.reporting.dataState).toBe('READY');
    expect(trend.body.data.points.length).toBeGreaterThanOrEqual(2);
    expect(trend.body.data.change.progressPercentage).toBe(25);

    const outcomes = await request(enabledApp)
      .get('/api/v1/admin/reports/learning-outcomes?courseStatus=PUBLISHED')
      .set('Authorization', bearer(data.admin.token))
      .expect(200);
    expect(outcomes.body.data.items[0]).toMatchObject({
      studentCountBucket: '5-9',
      dataState: 'READY',
      returnedGradeAverage: 80,
    });

    const exported = await request(enabledApp)
      .get('/api/v1/admin/reports/governance/export')
      .set('Authorization', bearer(data.admin.token))
      .expect(200);
    expect(exported.headers['content-type']).toContain('text/csv');
    expect(exported.headers['content-disposition']).toContain('attachment');
    expect(exported.text.split('\n').length).toBeLessThanOrEqual(
      enabledConfig.reporting.exportMaxRows + 2,
    );
  });

  it('stores analytics idempotently with TTL and suppresses small adoption groups', async () => {
    const data = await fixture();
    const eventId = randomUUID();
    const event = {
      eventId,
      eventName: 'report_viewed',
      schemaVersion: '1',
      occurredAt: new Date().toISOString(),
      context: { courseId: data.course._id.toString() },
      properties: { reportId: 'RPT-STUDENT-PROGRESS' },
    };
    await request(enabledApp)
      .post('/api/v1/analytics/events')
      .set('Authorization', bearer(data.student.token))
      .send(event)
      .expect(202);
    await request(enabledApp)
      .post('/api/v1/analytics/events')
      .set('Authorization', bearer(data.student.token))
      .send(event)
      .expect(200);
    expect(await AnalyticsEventModel.countDocuments({ eventId })).toBe(1);
    const stored = await AnalyticsEventModel.findOne({ eventId }).lean().exec();
    expect(stored?.actorId.toString()).toBe(data.student.user._id.toString());
    expect(stored?.expiresAt.getTime()).toBeGreaterThan(Date.now() + 80 * 86_400_000);

    const adoption = await request(enabledApp)
      .get('/api/v1/admin/reports/adoption?interval=DAY')
      .set('Authorization', bearer(data.admin.token))
      .expect(200);
    expect(adoption.body.data.items[0]).toMatchObject({
      eventName: 'report_viewed',
      eventCount: null,
      distinctActorCountBucket: '<5',
      dataState: 'SUPPRESSED',
    });
  });
});
