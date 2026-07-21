import { createHash, randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';

import mongoose from 'mongoose';
import pino from 'pino';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { AuthSessionModel } from '../../src/modules/sessions/auth-session.model.js';
import { ClassroomModel } from '../../src/modules/classrooms/classroom.model.js';
import { CourseModel } from '../../src/modules/courses/course.model.js';
import { EnrollmentModel } from '../../src/modules/enrollments/enrollment.model.js';
import { FlashcardModel } from '../../src/modules/flashcards/flashcard.model.js';
import { LearningProgressModel } from '../../src/modules/learning-progress/learning-progress.model.js';
import { LessonModel } from '../../src/modules/lessons/lesson.model.js';
import { CourseModuleModel } from '../../src/modules/modules/module.model.js';
import { UserModel } from '../../src/modules/users/user.model.js';
import type { UserRole } from '../../src/modules/users/user.types.js';
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

let sequence = 0;

async function identity(role: UserRole, label: string) {
  sequence += 1;
  const user = await UserModel.create({
    email: `${label}-${sequence}@example.test`,
    fullName: label,
    fullNameNormalized: label.toLowerCase(),
    passwordHash: 'synthetic-hash-not-used-for-login',
    role,
    status: 'ACTIVE',
    registrationSource:
      role === 'STUDENT'
        ? 'SELF_REGISTRATION'
        : role === 'TEACHER'
          ? 'TEACHER_INVITATION'
          : 'ADMIN_BOOTSTRAP',
    studentCode: role === 'STUDENT' ? `P04PD${String(sequence).padStart(4, '0')}` : null,
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
  const teacher = await identity('TEACHER', 'Teacher Owner');
  const otherTeacher = await identity('TEACHER', 'Teacher Foreign');
  const firstStudent = await identity('STUDENT', 'Student Alpha');
  const secondStudent = await identity('STUDENT', 'Student Beta');
  const removedStudent = await identity('STUDENT', 'Student Removed');
  const now = new Date();
  const classroom = await ClassroomModel.create({
    name: 'Progress Classroom',
    nameNormalized: 'progress classroom',
    ownerTeacherId: teacher.user._id,
    status: 'ACTIVE',
    enrollmentStatus: 'OPEN',
    allowClassCodeJoin: true,
    allowInviteLinkJoin: true,
  });
  await EnrollmentModel.insertMany([
    {
      classroomId: classroom._id,
      studentId: firstStudent.user._id,
      status: 'ACTIVE',
      joinedBy: 'CLASS_CODE',
      joinedAt: now,
    },
    {
      classroomId: classroom._id,
      studentId: secondStudent.user._id,
      status: 'ACTIVE',
      joinedBy: 'INVITE_LINK',
      joinedAt: now,
    },
    {
      classroomId: classroom._id,
      studentId: removedStudent.user._id,
      status: 'REMOVED',
      joinedBy: 'CLASS_CODE',
      joinedAt: now,
      removedAt: now,
      removedBy: teacher.user._id,
      removalReason: 'Removed from active roster',
    },
  ]);
  const course = await CourseModel.create({
    classroomId: classroom._id,
    ownerTeacherId: teacher.user._id,
    title: 'REST API Foundations',
    description: 'Published microlearning course',
    status: 'PUBLISHED',
    publishedAt: now,
    displayOrder: 0,
    createdBy: teacher.user._id,
    updatedBy: teacher.user._id,
  });
  const courseModule = await CourseModuleModel.create({
    courseId: course._id,
    title: 'HTTP Essentials',
    description: 'Published module',
    status: 'PUBLISHED',
    displayOrder: 0,
    createdBy: teacher.user._id,
    updatedBy: teacher.user._id,
  });
  const lessons = await LessonModel.create([
    {
      courseId: course._id,
      moduleId: null,
      title: 'Course Orientation',
      content: '# Orientation\n\n<script>alert(1)</script>Start here.',
      estimatedMinutes: 3,
      isRequired: false,
      status: 'PUBLISHED',
      publishedAt: now,
      publishedRevision: 1,
      completionDeadline: new Date(now.getTime() + 172_800_000),
      deadlineRevision: 1,
      displayOrder: 0,
      createdBy: teacher.user._id,
      updatedBy: teacher.user._id,
    },
    {
      courseId: course._id,
      moduleId: courseModule._id,
      title: 'HTTP Methods',
      content: '# HTTP Methods\n\nUse methods by semantics.',
      estimatedMinutes: 8,
      isRequired: true,
      status: 'PUBLISHED',
      publishedAt: now,
      publishedRevision: 1,
      completionDeadline: new Date(now.getTime() + 86_400_000),
      deadlineRevision: 1,
      displayOrder: 0,
      createdBy: teacher.user._id,
      updatedBy: teacher.user._id,
    },
    {
      courseId: course._id,
      moduleId: courseModule._id,
      title: 'Status Codes',
      content: '# Status Codes\n\nChoose precise status codes.',
      estimatedMinutes: 7,
      isRequired: true,
      status: 'PUBLISHED',
      publishedAt: now,
      publishedRevision: 1,
      completionDeadline: new Date(now.getTime() - 3_600_000),
      deadlineRevision: 1,
      displayOrder: 1,
      createdBy: teacher.user._id,
      updatedBy: teacher.user._id,
    },
    {
      courseId: course._id,
      moduleId: courseModule._id,
      title: 'Draft Internal Notes',
      content: 'Hidden draft.',
      estimatedMinutes: 5,
      isRequired: true,
      status: 'DRAFT',
      displayOrder: 2,
      createdBy: teacher.user._id,
      updatedBy: teacher.user._id,
    },
  ]);
  await FlashcardModel.create({
    lessonId: lessons[1]!._id,
    frontText: '**GET**',
    backText: 'Read a resource.',
    displayOrder: 0,
    createdBy: teacher.user._id,
    updatedBy: teacher.user._id,
  });
  return {
    teacher,
    otherTeacher,
    firstStudent,
    secondStudent,
    removedStudent,
    classroom,
    course,
    courseModule,
    orientation: lessons[0]!,
    futureLesson: lessons[1]!,
    overdueLesson: lessons[2]!,
    draftLesson: lessons[3]!,
    now,
  };
}

describe('Phase 04 Student learning and Teacher dashboard on MongoDB replica set', () => {
  beforeAll(async () => {
    await mongoose.connect(integrationUri, { serverSelectionTimeoutMS: 15_000 });
    await initializePhaseFourIndexes('test');
  });

  beforeEach(async () => {
    sequence = 0;
    await Promise.all([
      UserModel.deleteMany({}),
      AuthSessionModel.deleteMany({}),
      ClassroomModel.deleteMany({}),
      EnrollmentModel.deleteMany({}),
      CourseModel.deleteMany({}),
      CourseModuleModel.deleteMany({}),
      LessonModel.deleteMany({}),
      FlashcardModel.deleteMany({}),
      LearningProgressModel.deleteMany({}),
    ]);
  });

  afterAll(async () => mongoose.disconnect());

  it('returns published Classwork and a sanitized Lesson Player without creating progress', async () => {
    const data = await fixture();
    const classwork = await request(app)
      .get(`/api/v1/classrooms/${data.classroom._id}/classwork`)
      .set('Authorization', bearer(data.firstStudent.token))
      .expect(200);
    expect(classwork.body.data.courses).toHaveLength(1);
    expect(classwork.body.data.courses[0].lessons).toHaveLength(1);
    expect(classwork.body.data.courses[0].modules[0].lessons).toHaveLength(2);
    expect(JSON.stringify(classwork.body)).not.toContain('Draft Internal Notes');

    const player = await request(app)
      .get(`/api/v1/lessons/${data.futureLesson._id}`)
      .set('Authorization', bearer(data.firstStudent.token))
      .expect(200);
    expect(player.body.data.lesson).toMatchObject({
      id: data.futureLesson._id.toString(),
      progress: { status: null, derivedStatus: 'NOT_STARTED' },
    });
    expect(player.body.data.lesson.contentHtml).not.toContain('<script');
    expect(player.body.data.lesson.flashcards).toHaveLength(1);
    expect(player.body.data.navigation.previous).toBeNull();
    expect(player.body.data.navigation.next.id).toBe(data.overdueLesson._id.toString());
    expect(
      player.body.data.navigation.breadcrumb.map((item: { label: string }) => item.label),
    ).toEqual([
      data.classroom.name,
      data.course.title,
      data.courseModule.title,
      data.futureLesson.title,
    ]);
    expect(await LearningProgressModel.countDocuments({})).toBe(0);

    const unassignedPlayer = await request(app)
      .get(`/api/v1/lessons/${data.orientation._id}`)
      .set('Authorization', bearer(data.firstStudent.token))
      .expect(200);
    expect(unassignedPlayer.body.data.navigation.previous.id).toBe(
      data.overdueLesson._id.toString(),
    );
    expect(unassignedPlayer.body.data.navigation.next).toBeNull();

    await request(app)
      .get(`/api/v1/lessons/${data.draftLesson._id}`)
      .set('Authorization', bearer(data.firstStudent.token))
      .expect(404);
    await request(app)
      .get(`/api/v1/lessons/${data.futureLesson._id}`)
      .set('Authorization', bearer(data.removedStudent.token))
      .expect(404);
  });

  it('starts and completes idempotently under concurrent retries', async () => {
    const data = await fixture();
    const startResponses = await Promise.all(
      Array.from({ length: 8 }, () =>
        request(app)
          .post(`/api/v1/lessons/${data.futureLesson._id}/start`)
          .set('Authorization', bearer(data.firstStudent.token)),
      ),
    );
    expect(startResponses.filter((response) => response.status === 201)).toHaveLength(1);
    expect(startResponses.filter((response) => response.status === 200)).toHaveLength(7);

    const completionResponses = await Promise.all(
      Array.from({ length: 20 }, () =>
        request(app)
          .post(`/api/v1/lessons/${data.futureLesson._id}/complete`)
          .set('Authorization', bearer(data.firstStudent.token)),
      ),
    );
    expect(completionResponses.filter((response) => response.status === 201)).toHaveLength(1);
    expect(completionResponses.filter((response) => response.status === 200)).toHaveLength(19);
    expect(
      await LearningProgressModel.countDocuments({
        studentId: data.firstStudent.user._id,
        activityId: data.futureLesson._id,
      }),
    ).toBe(1);
    const stored = await LearningProgressModel.findOne({
      studentId: data.firstStudent.user._id,
      activityId: data.futureLesson._id,
    }).lean();
    expect(stored).toMatchObject({ status: 'COMPLETED' });
    expect(
      new Set(completionResponses.map((response) => response.body.data.progress.completedAt)),
    ).toHaveLength(1);

    await request(app)
      .post(`/api/v1/lessons/${data.futureLesson._id}/complete`)
      .set('Authorization', bearer(data.teacher.token))
      .expect(403);
    await LessonModel.findByIdAndUpdate(data.futureLesson._id, {
      status: 'UNPUBLISHED',
      unpublishedAt: new Date(),
    });
    await request(app)
      .post(`/api/v1/lessons/${data.futureLesson._id}/complete`)
      .set('Authorization', bearer(data.secondStudent.token))
      .expect(404);
  });

  it('derives overdue To-do, removes completed work and reports own Course progress', async () => {
    const data = await fixture();
    const todo = await request(app)
      .get('/api/v1/students/me/todo')
      .set('Authorization', bearer(data.firstStudent.token))
      .expect(200);
    expect(todo.body.data.scopeVersion).toBe('P04_LESSON_TODO_V1');
    expect(todo.body.data.items.map((item: { id: string }) => item.id)).toEqual([
      data.overdueLesson._id.toString(),
      data.futureLesson._id.toString(),
    ]);
    expect(todo.body.data.items[0].progress.derivedStatus).toBe('MISSING');

    await request(app)
      .post(`/api/v1/lessons/${data.futureLesson._id}/complete`)
      .set('Authorization', bearer(data.firstStudent.token))
      .expect(201);
    const upcoming = await request(app)
      .get('/api/v1/students/me/todo?scope=UPCOMING')
      .set('Authorization', bearer(data.firstStudent.token))
      .expect(200);
    expect(upcoming.body.data.items).toHaveLength(0);
    const deadlines = await request(app)
      .get('/api/v1/students/me/deadlines')
      .set('Authorization', bearer(data.firstStudent.token))
      .expect(200);
    expect(deadlines.body.data.items).toHaveLength(3);
    const extendedDeadline = new Date(data.futureLesson.completionDeadline!.getTime() + 86_400_000);
    await request(app)
      .patch(`/api/v1/teacher/lessons/${data.futureLesson._id}/deadline`)
      .set('Authorization', bearer(data.teacher.token))
      .send({
        completionDeadline: extendedDeadline.toISOString(),
        expectedDeadlineRevision: 1,
        reason: 'Extended to accommodate the active class schedule',
      })
      .expect(200);
    const refreshedDeadlines = await request(app)
      .get('/api/v1/students/me/deadlines')
      .set('Authorization', bearer(data.firstStudent.token))
      .expect(200);
    expect(
      refreshedDeadlines.body.data.items.find(
        (item: { id: string }) => item.id === data.futureLesson._id.toString(),
      ).completionDeadline,
    ).toBe(extendedDeadline.toISOString());
    const progress = await request(app)
      .get(`/api/v1/students/me/progress?courseId=${data.course._id}`)
      .set('Authorization', bearer(data.firstStudent.token))
      .expect(200);
    expect(progress.body.data).toMatchObject({
      metricVersion: 'P04_LESSON_COMPLETION_V1',
      summary: { requiredLessons: 2, completedLessons: 1, progressPercentage: 50 },
    });
  });

  it('reports active roster metrics and deterministic ranking without grade fields', async () => {
    const data = await fixture();
    const completionTime = new Date();
    await LearningProgressModel.insertMany([
      {
        studentId: data.firstStudent.user._id,
        classroomId: data.classroom._id,
        courseId: data.course._id,
        activityType: 'LESSON',
        activityId: data.futureLesson._id,
        status: 'COMPLETED',
        startedAt: new Date(completionTime.getTime() - 10_000),
        completedAt: completionTime,
        lastActiveAt: completionTime,
      },
      {
        studentId: data.firstStudent.user._id,
        classroomId: data.classroom._id,
        courseId: data.course._id,
        activityType: 'LESSON',
        activityId: data.overdueLesson._id,
        status: 'COMPLETED',
        startedAt: new Date(completionTime.getTime() - 10_000),
        completedAt: completionTime,
        lastActiveAt: completionTime,
      },
      {
        studentId: data.secondStudent.user._id,
        classroomId: data.classroom._id,
        courseId: data.course._id,
        activityType: 'LESSON',
        activityId: data.futureLesson._id,
        status: 'COMPLETED',
        startedAt: new Date(completionTime.getTime() - 20_000),
        completedAt: completionTime,
        lastActiveAt: new Date(completionTime.getTime() - 1_000),
      },
      {
        studentId: data.removedStudent.user._id,
        classroomId: data.classroom._id,
        courseId: data.course._id,
        activityType: 'LESSON',
        activityId: data.futureLesson._id,
        status: 'COMPLETED',
        startedAt: new Date(completionTime.getTime() - 20_000),
        completedAt: completionTime,
        lastActiveAt: completionTime,
      },
    ]);

    const startedAt = performance.now();
    const dashboard = await request(app)
      .get(`/api/v1/teacher/courses/${data.course._id}/dashboard`)
      .set('Authorization', bearer(data.teacher.token))
      .expect(200);
    expect(performance.now() - startedAt).toBeLessThan(2_000);
    expect(dashboard.body.data.summary).toMatchObject({
      totalLessons: 4,
      publishedLessons: 3,
      requiredLessons: 2,
      activeStudents: 2,
      averageProgressPercentage: 75,
    });
    expect(JSON.stringify(dashboard.body)).not.toMatch(/grade|quiz|assignment/iu);
    const activities = await request(app)
      .get(`/api/v1/teacher/courses/${data.course._id}/activities`)
      .set('Authorization', bearer(data.teacher.token))
      .expect(200);
    expect(
      activities.body.data.items.find(
        (item: { id: string }) => item.id === data.futureLesson._id.toString(),
      ),
    ).toMatchObject({ completedStudents: 2, activeStudents: 2, completionPercentage: 100 });
    expect(
      activities.body.data.items.find(
        (item: { id: string }) => item.id === data.overdueLesson._id.toString(),
      ),
    ).toMatchObject({ completedStudents: 1, activeStudents: 2, completionPercentage: 50 });

    const filteredStudents = await request(app)
      .get(
        `/api/v1/teacher/courses/${data.course._id}/students?search=Beta&progressStatus=MISSING&limit=1`,
      )
      .set('Authorization', bearer(data.teacher.token))
      .expect(200);
    expect(filteredStudents.body.data.items).toHaveLength(1);
    expect(filteredStudents.body.data.items[0].id).toBe(data.secondStudent.user._id.toString());
    expect(filteredStudents.body.meta).toMatchObject({ totalItems: 1, page: 1, limit: 1 });

    const ranking = await request(app)
      .get(`/api/v1/teacher/courses/${data.course._id}/progress`)
      .set('Authorization', bearer(data.teacher.token))
      .expect(200);
    expect(ranking.body.data.items.map((item: { id: string }) => item.id)).toEqual([
      data.firstStudent.user._id.toString(),
      data.secondStudent.user._id.toString(),
    ]);
    expect(JSON.stringify(ranking.body)).not.toContain(data.removedStudent.user.email);
    await request(app)
      .get(`/api/v1/teacher/courses/${data.course._id}/dashboard`)
      .set('Authorization', bearer(data.otherTeacher.token))
      .expect(404);
  });
});
