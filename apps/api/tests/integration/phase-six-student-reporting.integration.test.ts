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
import { GradeModel } from '../../src/modules/grades/grade.model.js';
import { LessonModel } from '../../src/modules/lessons/lesson.model.js';
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
    email: `${role.toLowerCase()}-${sequence}@example.test`,
    fullName: `${role} ${sequence}`,
    fullNameNormalized: `${role.toLowerCase()} ${sequence}`,
    passwordHash: 'synthetic-hash',
    role,
    status: 'ACTIVE',
    registrationSource:
      role === 'STUDENT'
        ? 'SELF_REGISTRATION'
        : role === 'TEACHER'
          ? 'TEACHER_INVITATION'
          : 'ADMIN_BOOTSTRAP',
    studentCode: role === 'STUDENT' ? `P06${String(sequence).padStart(5, '0')}` : null,
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
  const student = await identity('STUDENT');
  const outsider = await identity('STUDENT');
  const now = new Date();
  const classroom = await ClassroomModel.create({
    name: 'Phase 06 Reporting',
    nameNormalized: 'phase 06 reporting',
    ownerTeacherId: teacher.user._id,
    status: 'ACTIVE',
    enrollmentStatus: 'OPEN',
    allowClassCodeJoin: true,
    allowInviteLinkJoin: true,
  });
  await EnrollmentModel.create({
    classroomId: classroom._id,
    studentId: student.user._id,
    status: 'ACTIVE',
    joinedBy: 'CLASS_CODE',
    joinedAt: now,
  });
  const course = await CourseModel.create({
    classroomId: classroom._id,
    ownerTeacherId: teacher.user._id,
    title: 'Reporting Foundations',
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
    title: 'Required Reporting Lesson',
    content: 'Reporting lesson',
    estimatedMinutes: 5,
    isRequired: true,
    status: 'PUBLISHED',
    publishedAt: now,
    publishedRevision: 1,
    completionDeadline: new Date(now.getTime() + 24 * 60 * 60 * 1_000),
    deadlineRevision: 1,
    displayOrder: 0,
    createdBy: teacher.user._id,
    updatedBy: teacher.user._id,
  });
  await GradeModel.insertMany([
    {
      studentId: student.user._id,
      classroomId: classroom._id,
      courseId: course._id,
      activityType: 'QUIZ',
      activityId: new mongoose.Types.ObjectId(),
      evidenceType: 'ATTEMPT',
      evidenceId: new mongoose.Types.ObjectId(),
      evidenceRevision: 1,
      score: 8,
      maxScore: 10,
      feedback: 'Visible returned feedback',
      status: 'RETURNED',
      revision: 1,
      gradedBy: teacher.user._id,
      gradedAt: now,
      returnedBy: teacher.user._id,
      returnedAt: now,
      schemaVersion: 1,
    },
    {
      studentId: student.user._id,
      classroomId: classroom._id,
      courseId: course._id,
      activityType: 'ASSIGNMENT',
      activityId: new mongoose.Types.ObjectId(),
      evidenceType: 'SUBMISSION',
      evidenceId: new mongoose.Types.ObjectId(),
      evidenceRevision: 1,
      score: 9,
      maxScore: 10,
      feedback: 'Private draft feedback',
      status: 'DRAFT',
      revision: 1,
      gradedBy: teacher.user._id,
      gradedAt: now,
      returnedBy: null,
      returnedAt: null,
      schemaVersion: 1,
    },
  ]);
  return { teacher, student, outsider, classroom, course, lesson };
}

describe('Phase 06 Student reporting API on MongoDB replica set', () => {
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
      GradeModel.deleteMany({}),
      CourseProgressSummaryModel.deleteMany({}),
      ReportingInvalidationModel.deleteMany({}),
    ]);
  });

  afterAll(async () => mongoose.disconnect());

  it('returns private dashboard and paginated Course summaries without draft Grade leakage', async () => {
    const data = await fixture();
    const dashboard = await request(app)
      .get('/api/v1/students/me/dashboard')
      .set('Authorization', bearer(data.student.token))
      .expect(200);
    expect(dashboard.headers['cache-control']).toBe('private, no-store');
    expect(dashboard.body.data.summary).toMatchObject({
      activeClassroomCount: 1,
      activeCourseCount: 1,
      pendingCount: 1,
      dueSoonCount: 1,
      missingCount: 0,
    });
    expect(dashboard.body.data.courses[0]).toMatchObject({
      course: { id: data.course._id.toString(), title: 'Reporting Foundations' },
      requiredActivityCount: 1,
      completedRequiredCount: 0,
      progressStatus: 'NOT_STARTED',
    });
    expect(dashboard.body.data.recentGrades).toHaveLength(1);
    expect(dashboard.body.data.recentGrades[0]).toMatchObject({
      activityType: 'QUIZ',
      normalizedScore: 80,
    });
    expect(JSON.stringify(dashboard.body)).not.toContain('Private draft feedback');

    const courses = await request(app)
      .get('/api/v1/students/me/progress/courses?page=1&limit=20')
      .set('Authorization', bearer(data.student.token))
      .expect(200);
    expect(courses.body.data.items).toHaveLength(1);
    expect(courses.body.meta).toMatchObject({ totalItems: 1, hasNextPage: false });
  });

  it('enforces Student role, strict queries and non-enumerating Course ownership', async () => {
    const data = await fixture();
    await request(app)
      .get('/api/v1/students/me/dashboard')
      .set('Authorization', bearer(data.teacher.token))
      .expect(403);
    await request(app)
      .get('/api/v1/students/me/progress/courses?studentId=507f1f77bcf86cd799439011')
      .set('Authorization', bearer(data.student.token))
      .expect(422);
    await request(app)
      .get(`/api/v1/students/me/progress?courseId=${data.course._id}`)
      .set('Authorization', bearer(data.outsider.token))
      .expect(404);
  });
});
