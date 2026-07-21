import { createHash, randomUUID } from 'node:crypto';

import mongoose from 'mongoose';
import pino from 'pino';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../../src/app.js';
import { AuditLogModel } from '../../src/modules/audit/audit-log.model.js';
import { PhaseFourAuditWriter } from '../../src/modules/audit/phase-four-audit.writer.js';
import { AuthSessionModel } from '../../src/modules/sessions/auth-session.model.js';
import { ClassroomModel } from '../../src/modules/classrooms/classroom.model.js';
import { CourseModel } from '../../src/modules/courses/course.model.js';
import { LessonDeadlineChangeModel } from '../../src/modules/deadlines/lesson-deadline-change.model.js';
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
const tokens = new AccessTokenService({
  secret: config.accessTokenSecret,
  issuer: config.accessTokenIssuer,
  audience: config.accessTokenAudience,
  ttlSeconds: config.accessTokenTtlSeconds,
});

let sequence = 0;

async function createIdentity(role: UserRole) {
  sequence += 1;
  const suffix = `${role.toLowerCase()}-learning-${sequence}`;
  const user = await UserModel.create({
    email: `${suffix}@example.test`,
    fullName: `${role} Learning ${sequence}`,
    fullNameNormalized: `${role.toLowerCase()} learning ${sequence}`,
    passwordHash: 'synthetic-hash-not-used-for-login',
    role,
    status: 'ACTIVE',
    registrationSource:
      role === 'STUDENT'
        ? 'SELF_REGISTRATION'
        : role === 'TEACHER'
          ? 'TEACHER_INVITATION'
          : 'ADMIN_BOOTSTRAP',
    studentCode: role === 'STUDENT' ? `P04LC${String(sequence).padStart(4, '0')}` : null,
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

async function createScope() {
  const teacher = await createIdentity('TEACHER');
  const otherTeacher = await createIdentity('TEACHER');
  const student = await createIdentity('STUDENT');
  const classroom = await ClassroomModel.create({
    name: 'Phase 04 Learning Classroom',
    nameNormalized: 'phase 04 learning classroom',
    description: 'Lesson integration fixture',
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
    joinedAt: new Date(),
  });
  const courseResponse = await request(app)
    .post('/api/v1/courses')
    .set('Authorization', bearer(teacher.accessToken))
    .send({ classroomId: classroom._id.toString(), title: 'API Design' })
    .expect(201);
  const course = courseResponse.body.data.course as { id: string; updatedAt: string };
  const moduleResponse = await request(app)
    .post(`/api/v1/courses/${course.id}/modules`)
    .set('Authorization', bearer(teacher.accessToken))
    .send({ title: 'REST Foundations' })
    .expect(201);
  const courseModule = moduleResponse.body.data.module as { id: string; updatedAt: string };
  return { teacher, otherTeacher, student, classroom, course, courseModule };
}

async function createLesson(
  accessToken: string,
  courseId: string,
  moduleId: string | null,
  title: string,
) {
  return request(app)
    .post('/api/v1/lessons')
    .set('Authorization', bearer(accessToken))
    .send({
      courseId,
      moduleId,
      title,
      content: '# Safe content\n\n<script>alert(1)</script>\n[bad](javascript:alert(2))',
      contentFormat: 'MARKDOWN',
      estimatedMinutes: 8,
      isRequired: true,
      completionDeadline: new Date(Date.now() + 86_400_000).toISOString(),
    })
    .expect(201);
}

describe('Phase 04 Lesson, Flashcard and Deadline APIs on MongoDB replica set', () => {
  beforeAll(async () => {
    await mongoose.connect(integrationUri, { serverSelectionTimeoutMS: 15_000 });
    await initializePhaseFourIndexes('test');
  });

  beforeEach(async () => {
    sequence = 0;
    await Promise.all([
      UserModel.deleteMany({}),
      AuthSessionModel.deleteMany({}),
      AuditLogModel.deleteMany({}),
      ClassroomModel.deleteMany({}),
      EnrollmentModel.deleteMany({}),
      CourseModel.deleteMany({}),
      CourseModuleModel.deleteMany({}),
      LessonModel.deleteMany({}),
      FlashcardModel.deleteMany({}),
      LearningProgressModel.deleteMany({}),
      LessonDeadlineChangeModel.deleteMany({}),
    ]);
  });

  afterAll(async () => mongoose.disconnect());

  it('supports secure Lesson and Flashcard authoring with Student projections and published locks', async () => {
    const scope = await createScope();
    const created = await createLesson(
      scope.teacher.accessToken,
      scope.course.id,
      scope.courseModule.id,
      'Resource Naming',
    );
    const lesson = created.body.data.lesson as {
      id: string;
      updatedAt: string;
      deadlineRevision: number;
    };
    expect(lesson.deadlineRevision).toBe(1);
    expect(await LessonDeadlineChangeModel.countDocuments({ lessonId: lesson.id })).toBe(1);

    const foreignClassroom = await ClassroomModel.create({
      name: 'Foreign Parent Classroom',
      nameNormalized: 'foreign parent classroom',
      ownerTeacherId: scope.teacher.user._id,
      status: 'ACTIVE',
      enrollmentStatus: 'OPEN',
      allowClassCodeJoin: true,
      allowInviteLinkJoin: true,
    });
    const foreignCourse = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', bearer(scope.teacher.accessToken))
      .send({ classroomId: foreignClassroom._id.toString(), title: 'Foreign Parent Course' })
      .expect(201);
    const foreignModule = await request(app)
      .post(`/api/v1/courses/${foreignCourse.body.data.course.id}/modules`)
      .set('Authorization', bearer(scope.teacher.accessToken))
      .send({ title: 'Foreign Parent Module' })
      .expect(201);
    await request(app)
      .post('/api/v1/lessons')
      .set('Authorization', bearer(scope.teacher.accessToken))
      .send({
        courseId: scope.course.id,
        moduleId: foreignModule.body.data.module.id,
        title: 'Invalid Cross Course Lesson',
        content: 'This parent reference must be rejected.',
        estimatedMinutes: 5,
      })
      .expect(422);

    await request(app)
      .post('/api/v1/lessons')
      .set('Authorization', bearer(scope.otherTeacher.accessToken))
      .send({
        courseId: scope.course.id,
        title: 'Foreign Lesson',
        content: 'Denied',
        estimatedMinutes: 5,
      })
      .expect(404);

    const flashcardOne = await request(app)
      .post(`/api/v1/lessons/${lesson.id}/flashcards`)
      .set('Authorization', bearer(scope.teacher.accessToken))
      .send({ frontText: '**HTTP 201?**', backText: 'Created' })
      .expect(201);
    const flashcardTwo = await request(app)
      .post(`/api/v1/lessons/${lesson.id}/flashcards`)
      .set('Authorization', bearer(scope.teacher.accessToken))
      .send({
        frontText: 'Unsafe <img src=x onerror=alert(1)>',
        backText: '[bad](javascript:alert(1))',
      })
      .expect(201);

    const revision = flashcardTwo.body.data.flashcardRevision as number;
    const reordered = await request(app)
      .patch(`/api/v1/lessons/${lesson.id}/flashcards/reorder`)
      .set('Authorization', bearer(scope.teacher.accessToken))
      .send({
        orderedFlashcardIds: [
          flashcardTwo.body.data.flashcard.id,
          flashcardOne.body.data.flashcard.id,
        ],
        expectedFlashcardRevision: revision,
      })
      .expect(200);
    expect(reordered.body.data.flashcardRevision).toBe(revision + 1);
    const reorderedCards = reordered.body.data.items as Array<{
      id: string;
      updatedAt: string;
    }>;
    const firstAfterReorder = reorderedCards.find(
      (item) => item.id === flashcardOne.body.data.flashcard.id,
    )!;
    const secondAfterReorder = reorderedCards.find(
      (item) => item.id === flashcardTwo.body.data.flashcard.id,
    )!;
    const updatedCard = await request(app)
      .patch(`/api/v1/flashcards/${firstAfterReorder.id}`)
      .set('Authorization', bearer(scope.teacher.accessToken))
      .send({
        backText: 'Created with a Location response header',
        expectedUpdatedAt: firstAfterReorder.updatedAt,
      })
      .expect(200);
    expect(updatedCard.body.data.flashcardRevision).toBe(revision + 2);
    await request(app)
      .delete(`/api/v1/flashcards/${secondAfterReorder.id}`)
      .set('Authorization', bearer(scope.teacher.accessToken))
      .send({ expectedUpdatedAt: secondAfterReorder.updatedAt })
      .expect(204);

    const preview = await request(app)
      .post(`/api/v1/lessons/${lesson.id}/preview`)
      .set('Authorization', bearer(scope.teacher.accessToken))
      .expect(200);
    expect(preview.body.data.lesson.contentHtml).not.toContain('<script');
    expect(preview.body.data.lesson).not.toHaveProperty('content');
    expect(await LearningProgressModel.countDocuments({ lessonId: lesson.id })).toBe(0);

    const currentLesson = await request(app)
      .get(`/api/v1/lessons/${lesson.id}`)
      .set('Authorization', bearer(scope.teacher.accessToken))
      .expect(200);
    const publishedModule = await request(app)
      .patch(`/api/v1/modules/${scope.courseModule.id}/status`)
      .set('Authorization', bearer(scope.teacher.accessToken))
      .send({ targetStatus: 'PUBLISHED', expectedUpdatedAt: scope.courseModule.updatedAt })
      .expect(200);
    expect(publishedModule.body.data.module.status).toBe('PUBLISHED');

    const publishedLesson = await request(app)
      .patch(`/api/v1/lessons/${lesson.id}/status`)
      .set('Authorization', bearer(scope.teacher.accessToken))
      .send({
        targetStatus: 'PUBLISHED',
        expectedUpdatedAt: currentLesson.body.data.lesson.updatedAt,
      })
      .expect(200);
    expect(publishedLesson.body.data.lesson.status).toBe('PUBLISHED');

    const currentCourse = await request(app)
      .get(`/api/v1/courses/${scope.course.id}`)
      .set('Authorization', bearer(scope.teacher.accessToken))
      .expect(200);
    await request(app)
      .patch(`/api/v1/courses/${scope.course.id}/status`)
      .set('Authorization', bearer(scope.teacher.accessToken))
      .send({
        targetStatus: 'PUBLISHED',
        expectedUpdatedAt: currentCourse.body.data.course.updatedAt,
      })
      .expect(200);

    const studentLesson = await request(app)
      .get(`/api/v1/lessons/${lesson.id}`)
      .set('Authorization', bearer(scope.student.accessToken))
      .expect(200);
    expect(studentLesson.body.data.lesson.contentHtml).toContain('<h1>Safe content</h1>');
    expect(studentLesson.body.data.lesson.contentHtml).not.toContain('javascript:');
    expect(studentLesson.body.data.lesson).not.toHaveProperty('contentRevision');

    const studentCards = await request(app)
      .get(`/api/v1/lessons/${lesson.id}/flashcards`)
      .set('Authorization', bearer(scope.student.accessToken))
      .expect(200);
    expect(studentCards.body.data.items).toHaveLength(1);
    expect(studentCards.body.data.items[0]).not.toHaveProperty('frontText');
    expect(JSON.stringify(studentCards.body)).not.toContain('javascript:');

    await request(app)
      .patch(`/api/v1/lessons/${lesson.id}`)
      .set('Authorization', bearer(scope.teacher.accessToken))
      .send({
        title: 'Locked update',
        expectedUpdatedAt: publishedLesson.body.data.lesson.updatedAt,
      })
      .expect(409);
    await request(app)
      .post(`/api/v1/lessons/${lesson.id}/flashcards`)
      .set('Authorization', bearer(scope.teacher.accessToken))
      .send({ frontText: 'Locked', backText: 'Locked' })
      .expect(409);

    const currentDeadline = new Date(publishedLesson.body.data.lesson.completionDeadline as string);
    await request(app)
      .patch(`/api/v1/teacher/lessons/${lesson.id}/deadline`)
      .set('Authorization', bearer(scope.teacher.accessToken))
      .send({
        completionDeadline: new Date(currentDeadline.getTime() - 3_600_000).toISOString(),
        reason: 'A valid reason cannot override the shortening policy',
        expectedDeadlineRevision: publishedLesson.body.data.lesson.deadlineRevision,
      })
      .expect(409);
    await request(app)
      .patch(`/api/v1/teacher/lessons/${lesson.id}/deadline`)
      .set('Authorization', bearer(scope.teacher.accessToken))
      .send({
        completionDeadline: new Date(currentDeadline.getTime() + 3_600_000).toISOString(),
        expectedDeadlineRevision: publishedLesson.body.data.lesson.deadlineRevision,
      })
      .expect(422);

    const unpublished = await request(app)
      .patch(`/api/v1/lessons/${lesson.id}/status`)
      .set('Authorization', bearer(scope.teacher.accessToken))
      .send({
        targetStatus: 'UNPUBLISHED',
        expectedUpdatedAt: publishedLesson.body.data.lesson.updatedAt,
      })
      .expect(200);
    await request(app)
      .delete(`/api/v1/lessons/${lesson.id}`)
      .set('Authorization', bearer(scope.teacher.accessToken))
      .send({
        reason: 'Lesson replaced by a verified revised learning activity',
        expectedUpdatedAt: unpublished.body.data.lesson.updatedAt,
      })
      .expect(204);
    expect(await FlashcardModel.countDocuments({ lessonId: lesson.id })).toBe(2);
    await request(app)
      .get(`/api/v1/lessons/${lesson.id}`)
      .set('Authorization', bearer(scope.student.accessToken))
      .expect(404);
  });

  it('moves the exact Lesson set atomically and rejects a concurrent stale revision', async () => {
    const scope = await createScope();
    const first = await createLesson(
      scope.teacher.accessToken,
      scope.course.id,
      scope.courseModule.id,
      'First Lesson',
    );
    const second = await createLesson(
      scope.teacher.accessToken,
      scope.course.id,
      null,
      'Second Lesson',
    );
    const currentCourse = await request(app)
      .get(`/api/v1/courses/${scope.course.id}`)
      .set('Authorization', bearer(scope.teacher.accessToken))
      .expect(200);
    const expectedStructureRevision = currentCourse.body.data.course.structureRevision as number;
    const firstPayload = {
      containers: [
        { moduleId: null, orderedLessonIds: [first.body.data.lesson.id] },
        { moduleId: scope.courseModule.id, orderedLessonIds: [second.body.data.lesson.id] },
      ],
      expectedStructureRevision,
    };
    const secondPayload = {
      containers: [
        {
          moduleId: scope.courseModule.id,
          orderedLessonIds: [first.body.data.lesson.id, second.body.data.lesson.id],
        },
      ],
      expectedStructureRevision,
    };
    const results = await Promise.all([
      request(app)
        .patch(`/api/v1/courses/${scope.course.id}/lessons/reorder`)
        .set('Authorization', bearer(scope.teacher.accessToken))
        .send(firstPayload),
      request(app)
        .patch(`/api/v1/courses/${scope.course.id}/lessons/reorder`)
        .set('Authorization', bearer(scope.teacher.accessToken))
        .send(secondPayload),
    ]);
    expect(results.map((result) => result.status).sort()).toEqual([200, 409]);
    expect(
      await LessonModel.countDocuments({ courseId: scope.course.id, status: { $ne: 'ARCHIVED' } }),
    ).toBe(2);

    const latestCourse = await CourseModel.findById(scope.course.id).lean();
    await request(app)
      .patch(`/api/v1/courses/${scope.course.id}/lessons/reorder`)
      .set('Authorization', bearer(scope.teacher.accessToken))
      .send({
        containers: [{ moduleId: null, orderedLessonIds: [first.body.data.lesson.id] }],
        expectedStructureRevision: latestCourse!.structureRevision,
      })
      .expect(422);
  });

  it('commits deadline, history and audit atomically while one concurrent writer wins', async () => {
    const scope = await createScope();
    const created = await createLesson(
      scope.teacher.accessToken,
      scope.course.id,
      null,
      'Deadline Lesson',
    );
    const lesson = created.body.data.lesson as { id: string; deadlineRevision: number };
    const cleared = await request(app)
      .patch(`/api/v1/teacher/lessons/${lesson.id}/deadline`)
      .set('Authorization', bearer(scope.teacher.accessToken))
      .send({ completionDeadline: null, expectedDeadlineRevision: lesson.deadlineRevision })
      .expect(200);
    expect(cleared.body.data.deadlineRevision).toBe(2);
    const firstDeadline = new Date(Date.now() + 86_400_000);
    const reset = await request(app)
      .patch(`/api/v1/teacher/lessons/${lesson.id}/deadline`)
      .set('Authorization', bearer(scope.teacher.accessToken))
      .send({
        completionDeadline: firstDeadline.toISOString(),
        expectedDeadlineRevision: cleared.body.data.deadlineRevision,
      })
      .expect(200);
    expect(reset.body.data.deadlineRevision).toBe(3);
    const extensions = [
      new Date(firstDeadline.getTime() + 86_400_000),
      new Date(firstDeadline.getTime() + 172_800_000),
    ];
    const results = await Promise.all(
      extensions.map((deadline) =>
        request(app)
          .patch(`/api/v1/teacher/lessons/${lesson.id}/deadline`)
          .set('Authorization', bearer(scope.teacher.accessToken))
          .send({
            completionDeadline: deadline.toISOString(),
            expectedDeadlineRevision: reset.body.data.deadlineRevision,
          }),
      ),
    );
    expect(results.map((result) => result.status).sort()).toEqual([200, 409]);

    const current = await request(app)
      .get(`/api/v1/lessons/${lesson.id}`)
      .set('Authorization', bearer(scope.teacher.accessToken))
      .expect(200);
    expect(current.body.data.lesson.deadlineRevision).toBe(4);
    expect(await LessonDeadlineChangeModel.countDocuments({ lessonId: lesson.id })).toBe(4);
    expect(await AuditLogModel.countDocuments({ action: 'LESSON_DEADLINE_CHANGED' })).toBe(3);

    const beforeFailure = await LessonModel.findById(lesson.id).lean();
    const historyCountBeforeFailure = await LessonDeadlineChangeModel.countDocuments({
      lessonId: lesson.id,
    });
    const auditFailure = vi
      .spyOn(PhaseFourAuditWriter.prototype, 'append')
      .mockRejectedValueOnce(new Error('synthetic audit failure'));
    await request(app)
      .patch(`/api/v1/teacher/lessons/${lesson.id}/deadline`)
      .set('Authorization', bearer(scope.teacher.accessToken))
      .send({
        completionDeadline: new Date(Date.now() + 604_800_000).toISOString(),
        expectedDeadlineRevision: beforeFailure!.deadlineRevision,
      })
      .expect(500);
    auditFailure.mockRestore();
    const afterFailure = await LessonModel.findById(lesson.id).lean();
    expect(afterFailure!.deadlineRevision).toBe(beforeFailure!.deadlineRevision);
    expect(afterFailure!.completionDeadline?.toISOString()).toBe(
      beforeFailure!.completionDeadline?.toISOString(),
    );
    expect(await LessonDeadlineChangeModel.countDocuments({ lessonId: lesson.id })).toBe(
      historyCountBeforeFailure,
    );

    const history = await request(app)
      .get(`/api/v1/teacher/lessons/${lesson.id}/deadline-history?page=1&limit=10`)
      .set('Authorization', bearer(scope.teacher.accessToken))
      .expect(200);
    expect(history.body.data.items).toHaveLength(4);
    expect(history.body.meta.totalItems).toBe(4);

    await request(app)
      .get(`/api/v1/teacher/lessons/${lesson.id}/deadline-history`)
      .set('Authorization', bearer(scope.otherTeacher.accessToken))
      .expect(404);
  });
});
