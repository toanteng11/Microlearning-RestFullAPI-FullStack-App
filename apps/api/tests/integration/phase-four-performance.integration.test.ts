import { createHash, randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';

import mongoose from 'mongoose';
import pino from 'pino';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { ClassroomModel } from '../../src/modules/classrooms/classroom.model.js';
import { CourseModel } from '../../src/modules/courses/course.model.js';
import { EnrollmentModel } from '../../src/modules/enrollments/enrollment.model.js';
import { LearningProgressModel } from '../../src/modules/learning-progress/learning-progress.model.js';
import { LessonModel } from '../../src/modules/lessons/lesson.model.js';
import { CourseModuleModel } from '../../src/modules/modules/module.model.js';
import { AuthSessionModel } from '../../src/modules/sessions/auth-session.model.js';
import { UserModel } from '../../src/modules/users/user.model.js';
import { AccessTokenService } from '../../src/shared/auth/access-token.js';
import { initializePhaseFourIndexes } from '../../src/shared/database/phase-four-indexes.js';
import { testConfig, testRuntimeInfo } from '../test-fixtures.js';

const integrationUri = process.env.MONGODB_INTEGRATION_URI;
if (!integrationUri) throw new Error('MONGODB_INTEGRATION_URI is required for Phase 04 tests');

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

function percentile95(values: readonly number[]) {
  const ordered = [...values].sort((left, right) => left - right);
  return ordered[Math.ceil(ordered.length * 0.95) - 1] ?? Number.POSITIVE_INFINITY;
}

async function measure30(operation: () => Promise<unknown>) {
  await operation();
  const samples: number[] = [];
  for (let iteration = 0; iteration < 30; iteration += 1) {
    const startedAt = performance.now();
    await operation();
    samples.push(performance.now() - startedAt);
  }
  return percentile95(samples);
}

function planContainsStage(value: unknown, stage: string): boolean {
  if (!value || typeof value !== 'object') return false;
  if ('stage' in value && value.stage === stage) return true;
  return Object.values(value).some((child) =>
    Array.isArray(child)
      ? child.some((item) => planContainsStage(item, stage))
      : planContainsStage(child, stage),
  );
}

describe('Phase 04 performance baseline and explain plans', () => {
  beforeAll(async () => {
    await mongoose.connect(integrationUri, { serverSelectionTimeoutMS: 15_000 });
    await initializePhaseFourIndexes('test');
  });

  beforeEach(async () => {
    await Promise.all([
      UserModel.deleteMany({}),
      AuthSessionModel.deleteMany({}),
      ClassroomModel.deleteMany({}),
      EnrollmentModel.deleteMany({}),
      CourseModel.deleteMany({}),
      CourseModuleModel.deleteMany({}),
      LessonModel.deleteMany({}),
      LearningProgressModel.deleteMany({}),
    ]);
  });

  afterAll(async () => mongoose.disconnect());

  it('keeps critical p95 queries within the BA target on 100 students and 50 lessons', async () => {
    const now = new Date();
    const teacher = await UserModel.create({
      email: 'phase4-performance-teacher@example.test',
      fullName: 'Phase Four Performance Teacher',
      fullNameNormalized: 'phase four performance teacher',
      passwordHash: 'synthetic-hash-not-used-for-login',
      role: 'TEACHER',
      status: 'ACTIVE',
      registrationSource: 'TEACHER_INVITATION',
      activatedAt: now,
    });
    const students = await UserModel.insertMany(
      Array.from({ length: 100 }, (_, index) => ({
        email: `phase4-performance-student-${index + 1}@example.test`,
        fullName: `Performance Student ${String(index + 1).padStart(3, '0')}`,
        fullNameNormalized: `performance student ${String(index + 1).padStart(3, '0')}`,
        passwordHash: 'synthetic-hash-not-used-for-login',
        role: 'STUDENT',
        status: 'ACTIVE',
        registrationSource: 'SELF_REGISTRATION',
        studentCode: `P04PF${String(index + 1).padStart(4, '0')}`,
        activatedAt: now,
      })),
    );
    const teacherFamilyId = randomUUID();
    const studentFamilyId = randomUUID();
    await AuthSessionModel.insertMany([
      {
        userId: teacher._id,
        familyId: teacherFamilyId,
        tokenHash: createHash('sha256').update(randomUUID()).digest('hex'),
        status: 'ACTIVE',
        expiresAt: new Date(now.getTime() + 300_000),
      },
      {
        userId: students[0]!._id,
        familyId: studentFamilyId,
        tokenHash: createHash('sha256').update(randomUUID()).digest('hex'),
        status: 'ACTIVE',
        expiresAt: new Date(now.getTime() + 300_000),
      },
    ]);
    const teacherToken = await tokenService.sign(teacher._id.toString(), teacherFamilyId);
    const studentToken = await tokenService.sign(students[0]!._id.toString(), studentFamilyId);
    const classroom = await ClassroomModel.create({
      name: 'Phase Four Performance Classroom',
      nameNormalized: 'phase four performance classroom',
      ownerTeacherId: teacher._id,
      status: 'ACTIVE',
      enrollmentStatus: 'OPEN',
      allowClassCodeJoin: true,
      allowInviteLinkJoin: true,
    });
    await EnrollmentModel.insertMany(
      students.map((student) => ({
        classroomId: classroom._id,
        studentId: student._id,
        status: 'ACTIVE',
        joinedBy: 'CLASS_CODE',
        joinedAt: now,
      })),
    );
    const course = await CourseModel.create({
      classroomId: classroom._id,
      ownerTeacherId: teacher._id,
      title: 'Phase Four Performance Course',
      description: 'Synthetic BA performance baseline',
      status: 'PUBLISHED',
      publishedAt: now,
      displayOrder: 0,
      createdBy: teacher._id,
      updatedBy: teacher._id,
    });
    const courseModule = await CourseModuleModel.create({
      courseId: course._id,
      title: 'Performance Module',
      description: 'Contains the standard 50 lesson dataset',
      status: 'PUBLISHED',
      displayOrder: 0,
      createdBy: teacher._id,
      updatedBy: teacher._id,
    });
    const lessons = await LessonModel.insertMany(
      Array.from({ length: 50 }, (_, index) => ({
        courseId: course._id,
        moduleId: courseModule._id,
        title: `Performance Lesson ${String(index + 1).padStart(2, '0')}`,
        content: `# Lesson ${index + 1}\n\nSynthetic performance content.`,
        estimatedMinutes: 5,
        isRequired: true,
        status: 'PUBLISHED',
        publishedAt: now,
        publishedRevision: 1,
        completionDeadline: new Date(now.getTime() + (index - 25) * 86_400_000),
        deadlineRevision: 1,
        displayOrder: index,
        createdBy: teacher._id,
        updatedBy: teacher._id,
      })),
    );
    await LearningProgressModel.insertMany(
      students.flatMap((student, studentIndex) =>
        lessons.slice(0, studentIndex % 51).map((lesson) => ({
          studentId: student._id,
          classroomId: classroom._id,
          courseId: course._id,
          activityType: 'LESSON',
          activityId: lesson._id,
          status: 'COMPLETED',
          startedAt: new Date(now.getTime() - 60_000),
          completedAt: now,
          lastActiveAt: now,
        })),
      ),
    );

    const studentAuthorization = `Bearer ${studentToken}`;
    const teacherAuthorization = `Bearer ${teacherToken}`;
    const todoP95 = await measure30(() =>
      request(app)
        .get('/api/v1/students/me/todo')
        .set('Authorization', studentAuthorization)
        .expect(200),
    );
    const dashboardP95 = await measure30(() =>
      request(app)
        .get(`/api/v1/teacher/courses/${course._id}/dashboard`)
        .set('Authorization', teacherAuthorization)
        .expect(200),
    );
    const rankingP95 = await measure30(() =>
      request(app)
        .get(`/api/v1/teacher/courses/${course._id}/progress?limit=100`)
        .set('Authorization', teacherAuthorization)
        .expect(200),
    );
    const structureP95 = await measure30(() =>
      request(app)
        .get(`/api/v1/classrooms/${classroom._id}/classwork`)
        .set('Authorization', studentAuthorization)
        .expect(200),
    );

    const lessonPlan = await LessonModel.collection
      .find({ courseId: course._id, status: 'PUBLISHED' })
      .sort({ moduleId: 1, displayOrder: 1, _id: 1 })
      .explain('executionStats');
    const enrollmentPlan = await EnrollmentModel.collection
      .find({ classroomId: classroom._id, status: 'ACTIVE' })
      .sort({ joinedAt: -1, _id: -1 })
      .explain('executionStats');
    const progressPlan = await LearningProgressModel.collection
      .find({ courseId: course._id, status: 'COMPLETED' })
      .explain('executionStats');

    process.stdout.write(
      `${JSON.stringify({
        event: 'phase04.performance.baseline',
        dataset: { students: 100, lessons: 50, measuredRequests: 30 },
        p95Milliseconds: {
          todo: Number(todoP95.toFixed(2)),
          dashboard: Number(dashboardP95.toFixed(2)),
          ranking: Number(rankingP95.toFixed(2)),
          structure: Number(structureP95.toFixed(2)),
        },
      })}\n`,
    );

    expect(todoP95).toBeLessThan(1_000);
    expect(dashboardP95).toBeLessThan(2_000);
    expect(rankingP95).toBeLessThan(2_000);
    expect(structureP95).toBeLessThan(1_500);
    expect(planContainsStage(lessonPlan, 'IXSCAN')).toBe(true);
    expect(planContainsStage(enrollmentPlan, 'IXSCAN')).toBe(true);
    expect(planContainsStage(progressPlan, 'IXSCAN')).toBe(true);
  }, 120_000);
});
