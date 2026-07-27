import { createHash, randomUUID } from 'node:crypto';

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
import { CourseModuleModel } from '../../src/modules/modules/module.model.js';
import { QuestionModel } from '../../src/modules/questions/question.model.js';
import { QuizModel } from '../../src/modules/quizzes/quiz.model.js';
import { UserModel } from '../../src/modules/users/user.model.js';
import type { UserRole } from '../../src/modules/users/user.types.js';
import { AccessTokenService } from '../../src/shared/auth/access-token.js';
import { initializePhaseFiveIndexes } from '../../src/shared/database/phase-five-indexes.js';
import { testConfig, testRuntimeInfo } from '../test-fixtures.js';

const integrationUri = process.env.MONGODB_INTEGRATION_URI;
if (!integrationUri)
  throw new Error('MONGODB_INTEGRATION_URI is required for Phase 05 integration');
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

async function identity(role: UserRole) {
  sequence += 1;
  const user = await UserModel.create({
    email: `${role.toLowerCase()}-p05-${sequence}@example.test`,
    fullName: `${role} P05 ${sequence}`,
    fullNameNormalized: `${role.toLowerCase()} p05 ${sequence}`,
    passwordHash: 'synthetic-not-used',
    role,
    status: 'ACTIVE',
    registrationSource: role === 'STUDENT' ? 'SELF_REGISTRATION' : 'TEACHER_INVITATION',
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
  return { user, token: await tokens.sign(user._id.toString(), familyId) };
}

function bearer(token: string) {
  return `Bearer ${token}`;
}

async function scope() {
  const teacher = await identity('TEACHER');
  const otherTeacher = await identity('TEACHER');
  const classroom = await ClassroomModel.create({
    name: 'Phase 05 Classroom',
    nameNormalized: 'phase 05 classroom',
    ownerTeacherId: teacher.user._id,
    status: 'ACTIVE',
    enrollmentStatus: 'OPEN',
    allowClassCodeJoin: true,
    allowInviteLinkJoin: true,
  });
  const courseResponse = await request(app)
    .post('/api/v1/courses')
    .set('Authorization', bearer(teacher.token))
    .send({ classroomId: classroom._id.toString(), title: 'Assessment Design' })
    .expect(201);
  return { teacher, otherTeacher, courseId: courseResponse.body.data.course.id as string };
}

describe('Phase 05 Quiz and Question authoring on MongoDB replica set', () => {
  beforeAll(async () => {
    await mongoose.connect(integrationUri, { serverSelectionTimeoutMS: 15_000 });
    await initializePhaseFiveIndexes('test');
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
      QuizModel.deleteMany({}),
      QuestionModel.deleteMany({}),
    ]);
  });
  afterAll(async () => mongoose.disconnect());

  it('executes owned Quiz CRUD, four Question types, revision guards, preview redaction and publish lock', async () => {
    const context = await scope();
    const dueDate = new Date(Date.now() + 7 * 86_400_000).toISOString();
    const created = await request(app)
      .post(`/api/v1/teacher/courses/${context.courseId}/quizzes`)
      .set('Authorization', bearer(context.teacher.token))
      .send({
        moduleId: null,
        title: 'REST API Quiz',
        instruction: 'Answer every question.',
        isRequired: true,
        availableFrom: null,
        dueDate,
        attemptLimit: 2,
        timeLimitMinutes: 20,
        resultReleasePolicy: 'AFTER_REVIEW',
        scorePolicy: 'HIGHEST',
      })
      .expect(201);
    const quiz = created.body.data.quiz as {
      id: string;
      contentRevision: number;
      questionRevision: number;
      maxScore: number;
    };
    expect(quiz).toMatchObject({ contentRevision: 1, questionRevision: 0, maxScore: 0 });

    await request(app)
      .get(`/api/v1/teacher/quizzes/${quiz.id}`)
      .set('Authorization', bearer(context.otherTeacher.token))
      .expect(404);
    const updated = await request(app)
      .patch(`/api/v1/teacher/quizzes/${quiz.id}`)
      .set('Authorization', bearer(context.teacher.token))
      .send({ title: 'REST API Quiz Updated', expectedContentRevision: 1 })
      .expect(200);
    expect(updated.body.data.quiz.contentRevision).toBe(2);
    await request(app)
      .patch(`/api/v1/teacher/quizzes/${quiz.id}`)
      .set('Authorization', bearer(context.teacher.token))
      .send({ title: 'Stale update', expectedContentRevision: 1 })
      .expect(409);

    const questionPayloads = [
      {
        type: 'SINGLE_CHOICE',
        prompt: 'Method that creates a resource?',
        points: 2,
        options: [{ label: 'GET' }, { label: 'POST' }],
        correctOptionIndexes: [1],
      },
      {
        type: 'MULTIPLE_CHOICE',
        prompt: 'Successful status codes?',
        points: 3,
        options: [{ label: '200' }, { label: '201' }, { label: '500' }],
        correctOptionIndexes: [0, 1],
      },
      { type: 'TRUE_FALSE', prompt: 'HTTP is stateless.', points: 1, correctBoolean: true },
      {
        type: 'SHORT_ANSWER',
        prompt: 'Explain idempotency.',
        points: 4,
        rubric: 'Retry does not create another side effect.',
      },
    ];
    const questionIds: string[] = [];
    for (const [index, payload] of questionPayloads.entries()) {
      const response = await request(app)
        .post(`/api/v1/teacher/quizzes/${quiz.id}/questions`)
        .set('Authorization', bearer(context.teacher.token))
        .send({ ...payload, isRequired: true, explanation: null, expectedQuestionRevision: index })
        .expect(201);
      questionIds.push(response.body.data.question.id as string);
      expect(response.body.data.questionRevision).toBe(index + 1);
    }

    await request(app)
      .post(`/api/v1/teacher/quizzes/${quiz.id}/questions`)
      .set('Authorization', bearer(context.teacher.token))
      .send({
        type: 'SINGLE_CHOICE',
        prompt: 'Invalid',
        points: 1,
        options: [{ label: 'Same' }, { label: ' same ' }],
        correctOptionIndexes: [0],
        expectedQuestionRevision: 4,
      })
      .expect(422);
    const reordered = await request(app)
      .patch(`/api/v1/teacher/quizzes/${quiz.id}/questions/reorder`)
      .set('Authorization', bearer(context.teacher.token))
      .send({ orderedQuestionIds: [...questionIds].reverse(), expectedQuestionRevision: 4 })
      .expect(200);
    expect(reordered.body.data).toMatchObject({ questionRevision: 5, maxScore: 10 });
    await request(app)
      .patch(`/api/v1/teacher/quizzes/${quiz.id}/questions/reorder`)
      .set('Authorization', bearer(context.teacher.token))
      .send({ orderedQuestionIds: questionIds.slice(1), expectedQuestionRevision: 5 })
      .expect(422);

    const preview = await request(app)
      .post(`/api/v1/teacher/quizzes/${quiz.id}/preview`)
      .set('Authorization', bearer(context.teacher.token))
      .send({})
      .expect(200);
    const serializedPreview = JSON.stringify(preview.body);
    expect(serializedPreview).not.toMatch(/correctOptionIds|correctBoolean|rubric|explanation/u);

    const published = await request(app)
      .patch(`/api/v1/teacher/quizzes/${quiz.id}/status`)
      .set('Authorization', bearer(context.teacher.token))
      .send({
        status: 'PUBLISHED',
        scheduledPublishAt: null,
        reason: 'Ready for the classroom',
        expectedContentRevision: 2,
        expectedQuestionRevision: 5,
      })
      .expect(200);
    expect(published.body.data.quiz.status).toBe('PUBLISHED');
    await request(app)
      .post(`/api/v1/teacher/quizzes/${quiz.id}/questions`)
      .set('Authorization', bearer(context.teacher.token))
      .send({ ...questionPayloads[2], expectedQuestionRevision: 5 })
      .expect(409);

    const auditJson = JSON.stringify(await AuditLogModel.find({ resourceType: 'Question' }).lean());
    expect(auditJson).not.toMatch(/Method that creates|correctOption|rubric|explanation/u);
  });
});
