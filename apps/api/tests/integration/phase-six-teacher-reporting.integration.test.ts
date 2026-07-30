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
import { LessonModel } from '../../src/modules/lessons/lesson.model.js';
import { LearningProgressModel } from '../../src/modules/learning-progress/learning-progress.model.js';
import { CourseProgressSummaryModel } from '../../src/modules/reporting/course-progress-summary.model.js';
import { ReportingInvalidationModel } from '../../src/modules/reporting/reporting-invalidation.model.js';
import { UserModel } from '../../src/modules/users/user.model.js';
import type { UserRole } from '../../src/modules/users/user.types.js';
import { AccessTokenService } from '../../src/shared/auth/access-token.js';
import { initializePhaseFourIndexes } from '../../src/shared/database/phase-four-indexes.js';
import { initializePhaseSixIndexes } from '../../src/shared/database/phase-six-indexes.js';
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

async function identity(role: UserRole) {
  sequence += 1;
  const user = await UserModel.create({
    email: `${role.toLowerCase()}-teacher-report-${sequence}@example.test`,
    fullName: `${role} Reporting ${sequence}`,
    fullNameNormalized: `${role.toLowerCase()} reporting ${sequence}`,
    passwordHash: 'synthetic-hash',
    role,
    status: 'ACTIVE',
    registrationSource: role === 'STUDENT' ? 'SELF_REGISTRATION' : 'TEACHER_INVITATION',
    studentCode: role === 'STUDENT' ? `TR${String(sequence).padStart(5, '0')}` : null,
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
  const teacher = await identity('TEACHER');
  const otherTeacher = await identity('TEACHER');
  const firstStudent = await identity('STUDENT');
  const secondStudent = await identity('STUDENT');
  const now = new Date();
  const classroom = await ClassroomModel.create({
    name: 'Teacher Reporting Classroom',
    nameNormalized: 'teacher reporting classroom',
    ownerTeacherId: teacher.user._id,
    status: 'ACTIVE',
    enrollmentStatus: 'OPEN',
    allowClassCodeJoin: true,
    allowInviteLinkJoin: true,
  });
  await EnrollmentModel.insertMany(
    [firstStudent, secondStudent].map((student) => ({
      classroomId: classroom._id,
      studentId: student.user._id,
      status: 'ACTIVE',
      joinedBy: 'CLASS_CODE',
      joinedAt: now,
    })),
  );
  const course = await CourseModel.create({
    classroomId: classroom._id,
    ownerTeacherId: teacher.user._id,
    title: 'Teacher Reporting Course',
    description: '',
    status: 'PUBLISHED',
    publishedAt: now,
    displayOrder: 0,
    createdBy: teacher.user._id,
    updatedBy: teacher.user._id,
  });
  const lesson = await LessonModel.create({
    courseId: course._id,
    moduleId: null,
    title: 'Required Lesson',
    content: 'Reporting',
    estimatedMinutes: 5,
    isRequired: true,
    status: 'PUBLISHED',
    publishedAt: now,
    publishedRevision: 1,
    completionDeadline: new Date(now.getTime() + 86_400_000),
    deadlineRevision: 1,
    displayOrder: 0,
    createdBy: teacher.user._id,
    updatedBy: teacher.user._id,
  });
  await LearningProgressModel.create({
    studentId: firstStudent.user._id,
    classroomId: classroom._id,
    courseId: course._id,
    activityType: 'LESSON',
    activityId: lesson._id,
    status: 'COMPLETED',
    startedAt: now,
    completedAt: now,
    lastActiveAt: now,
  });
  return { teacher, otherTeacher, firstStudent, secondStudent, course };
}

describe('Phase 06 Teacher reporting API on MongoDB replica set', () => {
  beforeAll(async () => {
    await mongoose.connect(integrationUri, { serverSelectionTimeoutMS: 15_000 });
    await initializePhaseFourIndexes('test');
    await initializePhaseSixIndexes('test');
  });

  beforeEach(async () => {
    sequence = 0;
    await Promise.all([
      UserModel.deleteMany({}),
      AuthSessionModel.deleteMany({}),
      ClassroomModel.deleteMany({}),
      EnrollmentModel.deleteMany({}),
      CourseModel.deleteMany({}),
      LessonModel.deleteMany({}),
      LearningProgressModel.deleteMany({}),
      CourseProgressSummaryModel.deleteMany({}),
      ReportingInvalidationModel.deleteMany({}),
    ]);
  });

  afterAll(async () => mongoose.disconnect());

  it('returns owned dashboard, stable ranking and active roster Student detail', async () => {
    const data = await fixture();
    const dashboard = await request(app)
      .get(`/api/v1/teacher/courses/${data.course._id}/dashboard`)
      .set('Authorization', bearer(data.teacher.token))
      .expect(200);
    expect(dashboard.headers['cache-control']).toBe('private, no-store');
    expect(dashboard.body.data.summary).toMatchObject({
      activeStudentCount: 2,
      requiredActivityCount: 1,
      averageProgressPercentage: 50,
    });
    const ranking = await request(app)
      .get(`/api/v1/teacher/courses/${data.course._id}/progress?page=1&limit=20`)
      .set('Authorization', bearer(data.teacher.token))
      .expect(200);
    expect(ranking.body.data.items).toHaveLength(2);
    expect(ranking.body.data.items[0]).toMatchObject({
      rank: 1,
      student: { id: data.firstStudent.user._id.toString() },
      processScore: 100,
    });
    const detail = await request(app)
      .get(
        `/api/v1/teacher/courses/${data.course._id}/students/${data.firstStudent.user._id}/progress`,
      )
      .set('Authorization', bearer(data.teacher.token))
      .expect(200);
    expect(detail.body.data.student.id).toBe(data.firstStudent.user._id.toString());
    expect(detail.body.data.activities).toHaveLength(1);
  });

  it('blocks cross-Teacher Course access, out-of-roster Student and unknown filters', async () => {
    const data = await fixture();
    await request(app)
      .get(`/api/v1/teacher/courses/${data.course._id}/dashboard`)
      .set('Authorization', bearer(data.otherTeacher.token))
      .expect(404);
    await request(app)
      .get(
        `/api/v1/teacher/courses/${data.course._id}/students/${new mongoose.Types.ObjectId()}/progress`,
      )
      .set('Authorization', bearer(data.teacher.token))
      .expect(404);
    await request(app)
      .get(`/api/v1/teacher/courses/${data.course._id}/progress?sortBy=rawMongoExpression`)
      .set('Authorization', bearer(data.teacher.token))
      .expect(400);
  });
});
