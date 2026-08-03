import { createHash, randomUUID } from 'node:crypto';

import mongoose from 'mongoose';
import pino from 'pino';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { AssignmentModel } from '../../src/modules/assignments/assignment.model.js';
import { AuditLogModel } from '../../src/modules/audit/audit-log.model.js';
import { AuthSessionModel } from '../../src/modules/sessions/auth-session.model.js';
import { ClassroomModel } from '../../src/modules/classrooms/classroom.model.js';
import { CourseModel } from '../../src/modules/courses/course.model.js';
import { EnrollmentModel } from '../../src/modules/enrollments/enrollment.model.js';
import { DeadlineExceptionHistoryModel } from '../../src/modules/deadline-exceptions/deadline-exception-history.model.js';
import { DeadlineExceptionModel } from '../../src/modules/deadline-exceptions/deadline-exception.model.js';
import { GradeRevisionModel } from '../../src/modules/grades/grade-revision.model.js';
import { GradeModel } from '../../src/modules/grades/grade.model.js';
import { LearningProgressModel } from '../../src/modules/learning-progress/learning-progress.model.js';
import { LessonModel } from '../../src/modules/lessons/lesson.model.js';
import { QuestionModel } from '../../src/modules/questions/question.model.js';
import { QuizAttemptModel } from '../../src/modules/quiz-attempts/quiz-attempt.model.js';
import { QuizModel } from '../../src/modules/quizzes/quiz.model.js';
import { SubmissionRevisionModel } from '../../src/modules/submissions/submission-revision.model.js';
import { SubmissionModel } from '../../src/modules/submissions/submission.model.js';
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
    email: `${role.toLowerCase()}-p05-flow-${sequence}@example.test`,
    fullName: `${role} Flow ${sequence}`,
    fullNameNormalized: `${role.toLowerCase()} flow ${sequence}`,
    passwordHash: 'synthetic-not-used',
    role,
    status: 'ACTIVE',
    registrationSource:
      role === 'STUDENT'
        ? 'SELF_REGISTRATION'
        : role === 'TEACHER'
          ? 'TEACHER_INVITATION'
          : 'ADMIN_BOOTSTRAP',
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

async function learningScope() {
  const teacher = await identity('TEACHER');
  const student = await identity('STUDENT');
  const otherStudent = await identity('STUDENT');
  const classroom = await ClassroomModel.create({
    name: 'Phase 05 Learning Flow',
    nameNormalized: 'phase 05 learning flow',
    ownerTeacherId: teacher.user._id,
    status: 'ACTIVE',
    enrollmentStatus: 'OPEN',
    allowClassCodeJoin: true,
    allowInviteLinkJoin: true,
  });
  await EnrollmentModel.insertMany([
    {
      classroomId: classroom._id,
      studentId: student.user._id,
      status: 'ACTIVE',
      joinedBy: 'CLASS_CODE',
      joinedAt: new Date(),
    },
    {
      classroomId: classroom._id,
      studentId: otherStudent.user._id,
      status: 'ACTIVE',
      joinedBy: 'CLASS_CODE',
      joinedAt: new Date(),
    },
  ]);
  const course = await CourseModel.create({
    classroomId: classroom._id,
    ownerTeacherId: teacher.user._id,
    title: 'Assessment Flow Course',
    description: 'Published course for Phase 05 flows',
    status: 'PUBLISHED',
    publishedAt: new Date(),
    displayOrder: 0,
    createdBy: teacher.user._id,
    updatedBy: teacher.user._id,
  });
  return { teacher, student, otherStudent, classroom, course };
}

describe('Phase 05 Quiz Attempt and Assignment Submission flows', () => {
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
      QuizModel.deleteMany({}),
      QuestionModel.deleteMany({}),
      QuizAttemptModel.deleteMany({}),
      AssignmentModel.deleteMany({}),
      SubmissionModel.deleteMany({}),
      SubmissionRevisionModel.deleteMany({}),
      LearningProgressModel.deleteMany({}),
      LessonModel.deleteMany({}),
      GradeModel.deleteMany({}),
      GradeRevisionModel.deleteMany({}),
      DeadlineExceptionModel.deleteMany({}),
      DeadlineExceptionHistoryModel.deleteMany({}),
    ]);
  });
  afterAll(async () => mongoose.disconnect());

  it('starts once, saves with CAS, scores objective answers and releases only own result', async () => {
    const scope = await learningScope();
    const dueDate = new Date(Date.now() + 86_400_000);
    const quiz = await QuizModel.create({
      classroomId: scope.classroom._id,
      courseId: scope.course._id,
      moduleId: null,
      title: 'HTTP Objective Quiz',
      instruction: 'Choose the correct method.',
      isRequired: true,
      status: 'PUBLISHED',
      availableFrom: null,
      dueDate,
      attemptLimit: 2,
      timeLimitMinutes: 15,
      resultReleasePolicy: 'IMMEDIATE',
      scorePolicy: 'HIGHEST',
      displayOrder: 0,
      contentRevision: 2,
      questionRevision: 1,
      publishedRevision: 2,
      maxScore: 2,
      publishedAt: new Date(),
      createdBy: scope.teacher.user._id,
      updatedBy: scope.teacher.user._id,
    });
    const question = await QuestionModel.create({
      quizId: quiz._id,
      courseId: scope.course._id,
      type: 'SINGLE_CHOICE',
      prompt: 'Create resource?',
      points: 2,
      isRequired: true,
      options: [
        { id: 'get', label: 'GET', displayOrder: 0 },
        { id: 'post', label: 'POST', displayOrder: 1 },
      ],
      correctOptionIds: ['post'],
      correctBoolean: null,
      rubric: null,
      explanation: 'POST creates.',
      media: null,
      displayOrder: 0,
      version: 1,
      status: 'ACTIVE',
      createdBy: scope.teacher.user._id,
      updatedBy: scope.teacher.user._id,
    });

    const [startOne, startTwo] = await Promise.all([
      request(app)
        .post(`/api/v1/students/quizzes/${quiz._id.toString()}/attempts`)
        .set('Authorization', bearer(scope.student.token))
        .send({}),
      request(app)
        .post(`/api/v1/students/quizzes/${quiz._id.toString()}/attempts`)
        .set('Authorization', bearer(scope.student.token))
        .send({}),
    ]);
    expect([startOne.status, startTwo.status].sort()).toEqual([200, 201]);
    const first = startOne.status === 201 ? startOne : startTwo;
    const resumed = startOne.status === 200 ? startOne : startTwo;
    const attempt = first.body.data.attempt as { id: string; attemptRevision: number };
    expect(JSON.stringify(first.body)).not.toMatch(
      /correctOptionIds|correctBoolean|rubric|explanation/u,
    );
    expect(resumed.body.data).toMatchObject({ resumed: true, attempt: { id: attempt.id } });
    expect(await QuizAttemptModel.countDocuments({ quizId: quiz._id })).toBe(1);

    const saved = await request(app)
      .patch(`/api/v1/students/quiz-attempts/${attempt.id}/answers`)
      .set('Authorization', bearer(scope.student.token))
      .send({
        answers: [{ questionId: question._id.toString(), selectedOptionIds: ['post'] }],
        expectedAttemptRevision: attempt.attemptRevision,
      })
      .expect(200);
    expect(saved.body.data).toMatchObject({
      attemptRevision: 2,
      progress: { answeredCount: 1, totalCount: 1 },
    });
    await request(app)
      .patch(`/api/v1/students/quiz-attempts/${attempt.id}/answers`)
      .set('Authorization', bearer(scope.student.token))
      .send({
        answers: [{ questionId: question._id.toString(), selectedOptionIds: ['get'] }],
        expectedAttemptRevision: 1,
      })
      .expect(409);

    const submitted = await request(app)
      .post(`/api/v1/students/quiz-attempts/${attempt.id}/submit`)
      .set('Authorization', bearer(scope.student.token))
      .send({ expectedAttemptRevision: 2, confirmUnanswered: true })
      .expect(200);
    expect(submitted.body.data).toMatchObject({
      idempotentReplay: false,
      resultAvailable: true,
      attempt: { status: 'RESULT_RELEASED', result: { score: 2, maxScore: 2 } },
    });
    const replay = await request(app)
      .post(`/api/v1/students/quiz-attempts/${attempt.id}/submit`)
      .set('Authorization', bearer(scope.student.token))
      .send({ expectedAttemptRevision: 2, confirmUnanswered: true })
      .expect(200);
    expect(replay.body.data.idempotentReplay).toBe(true);
    await request(app)
      .get(`/api/v1/students/quiz-attempts/${attempt.id}/result`)
      .set('Authorization', bearer(scope.otherStudent.token))
      .expect(404);
    const progress = await LearningProgressModel.findOne({
      studentId: scope.student.user._id,
      activityType: 'QUIZ',
      activityId: quiz._id,
    }).lean();
    expect(progress?.status).toBe('COMPLETED');
  });

  it('keeps mixed Quiz result pending for manual review', async () => {
    const scope = await learningScope();
    const quiz = await QuizModel.create({
      classroomId: scope.classroom._id,
      courseId: scope.course._id,
      moduleId: null,
      title: 'Mixed Quiz',
      instruction: 'Explain idempotency.',
      isRequired: true,
      status: 'PUBLISHED',
      availableFrom: null,
      dueDate: new Date(Date.now() + 86_400_000),
      attemptLimit: 1,
      timeLimitMinutes: null,
      resultReleasePolicy: 'AFTER_REVIEW',
      scorePolicy: 'HIGHEST',
      displayOrder: 0,
      contentRevision: 2,
      questionRevision: 1,
      publishedRevision: 2,
      maxScore: 4,
      publishedAt: new Date(),
      createdBy: scope.teacher.user._id,
      updatedBy: scope.teacher.user._id,
    });
    await QuestionModel.create({
      quizId: quiz._id,
      courseId: scope.course._id,
      type: 'SHORT_ANSWER',
      prompt: 'Explain idempotency.',
      points: 4,
      isRequired: true,
      options: [],
      correctOptionIds: [],
      correctBoolean: null,
      rubric: 'A retry does not duplicate side effects.',
      explanation: null,
      media: null,
      displayOrder: 0,
      version: 1,
      status: 'ACTIVE',
      createdBy: scope.teacher.user._id,
      updatedBy: scope.teacher.user._id,
    });
    const started = await request(app)
      .post(`/api/v1/students/quizzes/${quiz._id.toString()}/attempts`)
      .set('Authorization', bearer(scope.student.token))
      .send({})
      .expect(201);
    const attempt = started.body.data.attempt;
    const submitted = await request(app)
      .post(`/api/v1/students/quiz-attempts/${attempt.id}/submit`)
      .set('Authorization', bearer(scope.student.token))
      .send({ expectedAttemptRevision: attempt.attemptRevision, confirmUnanswered: true })
      .expect(200);
    expect(submitted.body.data.attempt).toMatchObject({
      status: 'NEEDS_REVIEW',
      result: null,
      resultPending: true,
    });
  });

  it('reconciles an expired objective Attempt once and releases its result', async () => {
    const scope = await learningScope();
    const quiz = await QuizModel.create({
      classroomId: scope.classroom._id,
      courseId: scope.course._id,
      moduleId: null,
      title: 'Timeout Quiz',
      instruction: 'Server time controls expiry.',
      isRequired: true,
      status: 'PUBLISHED',
      availableFrom: null,
      dueDate: new Date(Date.now() + 86_400_000),
      attemptLimit: 1,
      timeLimitMinutes: 5,
      resultReleasePolicy: 'IMMEDIATE',
      scorePolicy: 'HIGHEST',
      displayOrder: 0,
      contentRevision: 2,
      questionRevision: 1,
      publishedRevision: 2,
      maxScore: 1,
      publishedAt: new Date(),
      createdBy: scope.teacher.user._id,
      updatedBy: scope.teacher.user._id,
    });
    await QuestionModel.create({
      quizId: quiz._id,
      courseId: scope.course._id,
      type: 'TRUE_FALSE',
      prompt: 'The server owns the timer.',
      points: 1,
      isRequired: true,
      options: [],
      correctOptionIds: [],
      correctBoolean: true,
      rubric: null,
      explanation: null,
      media: null,
      displayOrder: 0,
      version: 1,
      status: 'ACTIVE',
      createdBy: scope.teacher.user._id,
      updatedBy: scope.teacher.user._id,
    });
    const started = await request(app)
      .post(`/api/v1/students/quizzes/${quiz._id.toString()}/attempts`)
      .set('Authorization', bearer(scope.student.token))
      .send({})
      .expect(201);
    const attemptId = started.body.data.attempt.id as string;
    const forcedExpiry = await QuizAttemptModel.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(attemptId) },
      { $set: { expiresAt: new Date(Date.now() - 1_000) } },
    );
    expect(forcedExpiry.modifiedCount).toBe(1);

    const [firstRead, secondRead] = await Promise.all([
      request(app)
        .get(`/api/v1/students/quiz-attempts/${attemptId}`)
        .set('Authorization', bearer(scope.student.token)),
      request(app)
        .get(`/api/v1/students/quiz-attempts/${attemptId}`)
        .set('Authorization', bearer(scope.student.token)),
    ]);
    expect([firstRead.status, secondRead.status]).toEqual([200, 200]);
    expect(firstRead.body.data).toMatchObject({
      id: attemptId,
      status: 'TIMED_OUT',
      attemptRevision: 2,
      result: { score: 0, maxScore: 1 },
    });
    expect(secondRead.body.data).toMatchObject({ id: attemptId, status: 'TIMED_OUT' });
    expect(await AuditLogModel.countDocuments({ action: 'ATTEMPT_FINALIZED' })).toBe(1);
  });

  it('runs Assignment draft, turn-in, unsubmit, resubmit, history and derived roster end-to-end', async () => {
    const scope = await learningScope();
    const created = await request(app)
      .post(`/api/v1/teacher/courses/${scope.course._id.toString()}/assignments`)
      .set('Authorization', bearer(scope.teacher.token))
      .send({
        moduleId: null,
        title: 'Design REST endpoint',
        instruction: 'Submit a textual API design.',
        maxScore: 10,
        isRequired: true,
        allowedSubmissionTypes: ['TEXT'],
        allowLateSubmission: true,
        allowUnsubmit: true,
        allowResubmit: true,
        availableFrom: null,
        dueDate: new Date(Date.now() + 86_400_000).toISOString(),
      })
      .expect(201);
    const assignment = created.body.data.assignment as { id: string; contentRevision: number };
    await request(app)
      .patch(`/api/v1/teacher/assignments/${assignment.id}/status`)
      .set('Authorization', bearer(scope.teacher.token))
      .send({
        status: 'PUBLISHED',
        scheduledPublishAt: null,
        reason: 'Assignment is ready',
        expectedContentRevision: assignment.contentRevision,
      })
      .expect(200);
    await request(app)
      .get(`/api/v1/students/assignments/${assignment.id}`)
      .set('Authorization', bearer(scope.student.token))
      .expect(200);
    const empty = await request(app)
      .get(`/api/v1/students/assignments/${assignment.id}/submission`)
      .set('Authorization', bearer(scope.student.token))
      .expect(200);
    expect(empty.body.data).toBeNull();

    const draft = await request(app)
      .put(`/api/v1/students/assignments/${assignment.id}/submission`)
      .set('Authorization', bearer(scope.student.token))
      .send({
        submissionType: 'TEXT',
        textAnswer: 'POST /api/v1/books',
        links: [],
        markDone: false,
        expectedSubmissionRevision: 0,
      })
      .expect(200);
    expect(draft.body.data).toMatchObject({ status: 'DRAFT', revision: 1 });
    await request(app)
      .put(`/api/v1/students/assignments/${assignment.id}/submission`)
      .set('Authorization', bearer(scope.student.token))
      .send({
        submissionType: 'TEXT',
        textAnswer: 'stale',
        links: [],
        markDone: false,
        expectedSubmissionRevision: 0,
      })
      .expect(409);

    const [turnInOne, turnInTwo] = await Promise.all([
      request(app)
        .post(`/api/v1/students/submissions/${draft.body.data.id}/turn-in`)
        .set('Authorization', bearer(scope.student.token))
        .send({ expectedSubmissionRevision: 1 }),
      request(app)
        .post(`/api/v1/students/submissions/${draft.body.data.id}/turn-in`)
        .set('Authorization', bearer(scope.student.token))
        .send({ expectedSubmissionRevision: 1 }),
    ]);
    expect(
      [turnInOne.status, turnInTwo.status].filter((status) => status === 200),
    ).not.toHaveLength(0);
    expect(
      [turnInOne.status, turnInTwo.status].every((status) => [200, 409].includes(status)),
    ).toBe(true);
    const turnedIn = turnInOne.status === 200 ? turnInOne : turnInTwo;
    expect(turnedIn.body.data).toMatchObject({
      idempotentReplay: false,
      submission: { status: 'SUBMITTED', revision: 2 },
    });
    const replay = await request(app)
      .post(`/api/v1/students/submissions/${draft.body.data.id}/turn-in`)
      .set('Authorization', bearer(scope.student.token))
      .send({ expectedSubmissionRevision: 1 })
      .expect(200);
    expect(replay.body.data.idempotentReplay).toBe(true);
    expect(
      await SubmissionRevisionModel.countDocuments({
        submissionId: draft.body.data.id,
        eventType: 'TURNED_IN',
      }),
    ).toBe(1);

    const unsubmitted = await request(app)
      .post(`/api/v1/students/submissions/${draft.body.data.id}/unsubmit`)
      .set('Authorization', bearer(scope.student.token))
      .send({ expectedSubmissionRevision: 2 })
      .expect(200);
    expect(unsubmitted.body.data).toMatchObject({ status: 'DRAFT', revision: 3 });
    const turnedInAgain = await request(app)
      .post(`/api/v1/students/submissions/${draft.body.data.id}/turn-in`)
      .set('Authorization', bearer(scope.student.token))
      .send({ expectedSubmissionRevision: 3 })
      .expect(200);
    const resubmitted = await request(app)
      .post(`/api/v1/students/submissions/${draft.body.data.id}/resubmit`)
      .set('Authorization', bearer(scope.student.token))
      .send({
        reason: 'Improve endpoint design',
        expectedSubmissionRevision: turnedInAgain.body.data.submission.revision,
      })
      .expect(200);
    expect(resubmitted.body.data).toMatchObject({ status: 'DRAFT', revision: 5 });

    const history = await request(app)
      .get(`/api/v1/students/submissions/${draft.body.data.id}/history`)
      .set('Authorization', bearer(scope.student.token))
      .expect(200);
    expect(history.body.data.items.map((item: { eventType: string }) => item.eventType)).toEqual([
      'RESUBMITTED',
      'TURNED_IN',
      'UNSUBMITTED',
      'TURNED_IN',
      'DRAFT_SAVED',
    ]);
    const roster = await request(app)
      .get(`/api/v1/teacher/assignments/${assignment.id}/submissions`)
      .set('Authorization', bearer(scope.teacher.token))
      .expect(200);
    expect(roster.body.data.items).toHaveLength(2);
    expect(
      roster.body.data.items.find(
        (row: { student: { id: string } }) => row.student.id === scope.student.user._id.toString(),
      ).status,
    ).toBe('IN_PROGRESS');
  });

  it('saves, returns and revises an Assignment Grade without exposing drafts', async () => {
    const scope = await learningScope();
    const assignment = await AssignmentModel.create({
      classroomId: scope.classroom._id,
      courseId: scope.course._id,
      moduleId: null,
      title: 'Gradeable Assignment',
      instruction: 'Submit a concise API design.',
      maxScore: 10,
      isRequired: true,
      allowedSubmissionTypes: ['TEXT'],
      allowLateSubmission: true,
      allowUnsubmit: false,
      allowResubmit: false,
      availableFrom: null,
      dueDate: new Date(Date.now() + 86_400_000),
      status: 'PUBLISHED',
      displayOrder: 0,
      contentRevision: 2,
      publishedRevision: 2,
      publishedAt: new Date(),
      createdBy: scope.teacher.user._id,
      updatedBy: scope.teacher.user._id,
    });
    const submission = await SubmissionModel.create({
      assignmentId: assignment._id,
      studentId: scope.student.user._id,
      classroomId: scope.classroom._id,
      courseId: scope.course._id,
      status: 'SUBMITTED',
      submissionType: 'TEXT',
      textAnswer: 'POST /books with validation',
      links: [],
      markDone: false,
      submittedRevision: 1,
      submittedAt: new Date(),
      isLate: false,
      effectiveDeadlineAtSubmit: assignment.dueDate,
    });

    const saved = await request(app)
      .put(`/api/v1/teacher/submissions/${submission._id.toString()}/grade`)
      .set('Authorization', bearer(scope.teacher.token))
      .send({
        score: 8,
        feedback: 'Good endpoint boundaries.',
        expectedEvidenceRevision: 1,
        expectedGradeRevision: 0,
      })
      .expect(200);
    expect(saved.body.data.grade).toMatchObject({
      score: 8,
      status: 'DRAFT',
      revision: 1,
    });

    const hidden = await request(app)
      .get('/api/v1/students/me/grades')
      .set('Authorization', bearer(scope.student.token))
      .expect(200);
    expect(hidden.body.data.items).toHaveLength(0);
    await request(app)
      .get(`/api/v1/students/me/grades/${saved.body.data.grade.id}`)
      .set('Authorization', bearer(scope.otherStudent.token))
      .expect(404);

    const returned = await request(app)
      .post(`/api/v1/teacher/submissions/${submission._id.toString()}/return`)
      .set('Authorization', bearer(scope.teacher.token))
      .send({ expectedGradeRevision: 1 })
      .expect(200);
    expect(returned.body.data.grade).toMatchObject({ status: 'RETURNED', revision: 2 });

    const visible = await request(app)
      .get('/api/v1/students/me/grades')
      .set('Authorization', bearer(scope.student.token))
      .expect(200);
    expect(visible.body.data.items[0]).toMatchObject({
      score: 8,
      maxScore: 10,
      activityType: 'ASSIGNMENT',
      title: 'Gradeable Assignment',
    });

    await request(app)
      .post(`/api/v1/teacher/grades/${saved.body.data.grade.id}/regrade`)
      .set('Authorization', bearer(scope.teacher.token))
      .send({
        score: 9,
        feedback: 'Validation is now complete.',
        reason: 'Rechecked against the agreed rubric',
        expectedGradeRevision: 1,
      })
      .expect(409);
    const revised = await request(app)
      .post(`/api/v1/teacher/grades/${saved.body.data.grade.id}/regrade`)
      .set('Authorization', bearer(scope.teacher.token))
      .send({
        score: 9,
        feedback: 'Validation is now complete.',
        reason: 'Rechecked against the agreed rubric',
        expectedGradeRevision: 2,
      })
      .expect(200);
    expect(revised.body.data.grade).toMatchObject({
      score: 9,
      status: 'RETURNED',
      revision: 3,
    });
    const history = await request(app)
      .get(`/api/v1/teacher/grades/${saved.body.data.grade.id}/history`)
      .set('Authorization', bearer(scope.teacher.token))
      .expect(200);
    expect(history.body.data.items).toHaveLength(3);
  });

  it('reviews, finalizes and regrades a short-answer Quiz with released Grade visibility', async () => {
    const scope = await learningScope();
    const quiz = await QuizModel.create({
      classroomId: scope.classroom._id,
      courseId: scope.course._id,
      moduleId: null,
      title: 'Manual Review Quiz',
      instruction: 'Explain retry safety.',
      isRequired: true,
      status: 'PUBLISHED',
      availableFrom: null,
      dueDate: new Date(Date.now() + 86_400_000),
      attemptLimit: 1,
      timeLimitMinutes: null,
      resultReleasePolicy: 'AFTER_REVIEW',
      scorePolicy: 'HIGHEST',
      displayOrder: 0,
      contentRevision: 2,
      questionRevision: 1,
      publishedRevision: 2,
      maxScore: 4,
      publishedAt: new Date(),
      createdBy: scope.teacher.user._id,
      updatedBy: scope.teacher.user._id,
    });
    const questionId = new mongoose.Types.ObjectId();
    const now = new Date();
    const attempt = await QuizAttemptModel.create({
      studentId: scope.student.user._id,
      classroomId: scope.classroom._id,
      courseId: scope.course._id,
      quizId: quiz._id,
      attemptNumber: 1,
      status: 'NEEDS_REVIEW',
      assessmentRevision: 2,
      quizSnapshot: {
        title: quiz.title,
        resultReleasePolicy: quiz.resultReleasePolicy,
        maxScore: 4,
        timeLimitMinutes: null,
      },
      questionSnapshots: [
        {
          questionId,
          questionRevision: 1,
          type: 'SHORT_ANSWER',
          prompt: 'Explain idempotency.',
          points: 4,
          isRequired: true,
          displayOrder: 0,
          options: [],
          media: null,
          scoring: { correctOptionIds: [], correctBoolean: null, rubric: 'No duplicate effect.' },
        },
      ],
      answers: [
        {
          questionId,
          selectedOptionIds: [],
          textAnswer: 'A retry produces the same final effect.',
          savedAt: now,
        },
      ],
      objectiveScore: 0,
      manualScore: 0,
      totalScore: 0,
      maxScore: 4,
      startedAt: now,
      expiresAt: new Date(now.getTime() + 86_400_000),
      submittedAt: now,
    });

    const review = await request(app)
      .put(`/api/v1/teacher/quiz-attempts/${attempt._id.toString()}/review`)
      .set('Authorization', bearer(scope.teacher.token))
      .send({
        answers: [
          {
            questionId: questionId.toString(),
            awardedPoints: 3,
            feedback: 'Correct idea; add a concrete retry example.',
          },
        ],
        expectedReviewRevision: 0,
      })
      .expect(200);
    expect(review.body.data).toMatchObject({
      status: 'NEEDS_REVIEW',
      totalScore: 3,
      reviewRevision: 1,
    });

    const finalized = await request(app)
      .post(`/api/v1/teacher/quiz-attempts/${attempt._id.toString()}/review/finalize`)
      .set('Authorization', bearer(scope.teacher.token))
      .send({ expectedReviewRevision: 1, reason: null })
      .expect(200);
    expect(finalized.body.data).toMatchObject({
      status: 'RESULT_RELEASED',
      totalScore: 3,
      reviewRevision: 2,
    });
    const studentResult = await request(app)
      .get(`/api/v1/students/quiz-attempts/${attempt._id.toString()}/result`)
      .set('Authorization', bearer(scope.student.token))
      .expect(200);
    expect(studentResult.body.data.result).toMatchObject({ score: 3, maxScore: 4 });
    const grades = await request(app)
      .get('/api/v1/students/me/grades?activityType=QUIZ')
      .set('Authorization', bearer(scope.student.token))
      .expect(200);
    expect(grades.body.data.items[0]).toMatchObject({
      activityType: 'QUIZ',
      score: 3,
      title: 'Manual Review Quiz',
    });

    const regraded = await request(app)
      .post(`/api/v1/teacher/quiz-attempts/${attempt._id.toString()}/regrade`)
      .set('Authorization', bearer(scope.teacher.token))
      .send({
        answers: [
          {
            questionId: questionId.toString(),
            awardedPoints: 4,
            feedback: 'Complete answer after rubric review.',
          },
        ],
        reason: 'Rechecked the response against the full rubric',
        expectedReviewRevision: 2,
      })
      .expect(200);
    expect(regraded.body.data).toMatchObject({ totalScore: 4, reviewRevision: 3 });
  });

  it('sets, extends and revokes a scoped Student deadline with immutable history', async () => {
    const scope = await learningScope();
    const assignment = await AssignmentModel.create({
      classroomId: scope.classroom._id,
      courseId: scope.course._id,
      moduleId: null,
      title: 'Deadline Assignment',
      instruction: 'Submit before the effective deadline.',
      maxScore: 10,
      isRequired: true,
      allowedSubmissionTypes: ['TEXT'],
      allowLateSubmission: false,
      allowUnsubmit: false,
      allowResubmit: false,
      availableFrom: null,
      dueDate: new Date(Date.now() + 86_400_000),
      status: 'PUBLISHED',
      displayOrder: 0,
      contentRevision: 2,
      publishedRevision: 2,
      publishedAt: new Date(),
      createdBy: scope.teacher.user._id,
      updatedBy: scope.teacher.user._id,
    });
    const firstDeadline = new Date(Date.now() + 172_800_000);
    const first = await request(app)
      .put(
        `/api/v1/teacher/activities/assignments/${assignment._id.toString()}/deadline-exceptions/${scope.student.user._id.toString()}`,
      )
      .set('Authorization', bearer(scope.teacher.token))
      .send({
        deadline: firstDeadline.toISOString(),
        reason: 'Approved individual learning support extension',
        expectedRevision: 0,
      })
      .expect(200);
    expect(first.body.data.exception).toMatchObject({ active: true, revision: 1 });

    await request(app)
      .put(
        `/api/v1/teacher/activities/assignments/${assignment._id.toString()}/deadline-exceptions/${scope.student.user._id.toString()}`,
      )
      .set('Authorization', bearer(scope.teacher.token))
      .send({
        deadline: new Date(Date.now() + 259_200_000).toISOString(),
        reason: 'Approved additional individual learning support',
        expectedRevision: 0,
      })
      .expect(409);
    const extended = await request(app)
      .put(
        `/api/v1/teacher/activities/assignments/${assignment._id.toString()}/deadline-exceptions/${scope.student.user._id.toString()}`,
      )
      .set('Authorization', bearer(scope.teacher.token))
      .send({
        deadline: new Date(Date.now() + 259_200_000).toISOString(),
        reason: 'Approved additional individual learning support',
        expectedRevision: 1,
      })
      .expect(200);
    expect(extended.body.data.exception).toMatchObject({ active: true, revision: 2 });

    const revoked = await request(app)
      .post(
        `/api/v1/teacher/activities/assignments/${assignment._id.toString()}/deadline-exceptions/${scope.student.user._id.toString()}/revoke`,
      )
      .set('Authorization', bearer(scope.teacher.token))
      .send({
        reason: 'Restore the shared deadline after support review',
        expectedRevision: 2,
      })
      .expect(200);
    expect(revoked.body.data.exception).toMatchObject({ active: false, revision: 3 });

    const history = await request(app)
      .get(
        `/api/v1/teacher/activities/assignments/${assignment._id.toString()}/deadline-exceptions/${scope.student.user._id.toString()}/history`,
      )
      .set('Authorization', bearer(scope.teacher.token))
      .expect(200);
    expect(history.body.data.items.map((item: { action: string }) => item.action)).toEqual([
      'REVOKED',
      'SET',
      'SET',
    ]);
  });

  it('projects mixed required activities and per-student deadlines consistently', async () => {
    const scope = await learningScope();
    const now = new Date();
    const defaultDeadline = new Date(now.getTime() + 86_400_000);
    const extendedDeadline = new Date(now.getTime() + 259_200_000);
    const lesson = await LessonModel.create({
      courseId: scope.course._id,
      moduleId: null,
      title: 'Mixed Activity Lesson',
      content: '# Mixed activity\n\nComplete the lesson.',
      estimatedMinutes: 5,
      isRequired: true,
      status: 'PUBLISHED',
      publishedAt: now,
      publishedRevision: 1,
      completionDeadline: defaultDeadline,
      deadlineRevision: 1,
      displayOrder: 0,
      createdBy: scope.teacher.user._id,
      updatedBy: scope.teacher.user._id,
    });
    const quiz = await QuizModel.create({
      classroomId: scope.classroom._id,
      courseId: scope.course._id,
      moduleId: null,
      title: 'Mixed Activity Quiz',
      instruction: 'Complete the quiz.',
      isRequired: true,
      status: 'PUBLISHED',
      availableFrom: null,
      dueDate: defaultDeadline,
      attemptLimit: 1,
      timeLimitMinutes: null,
      resultReleasePolicy: 'IMMEDIATE',
      scorePolicy: 'HIGHEST',
      displayOrder: 1,
      contentRevision: 1,
      questionRevision: 0,
      publishedRevision: 1,
      maxScore: 0,
      publishedAt: now,
      createdBy: scope.teacher.user._id,
      updatedBy: scope.teacher.user._id,
    });
    const assignment = await AssignmentModel.create({
      classroomId: scope.classroom._id,
      courseId: scope.course._id,
      moduleId: null,
      title: 'Mixed Activity Assignment',
      instruction: 'Submit the assignment.',
      maxScore: 10,
      isRequired: true,
      allowedSubmissionTypes: ['TEXT'],
      allowLateSubmission: false,
      allowUnsubmit: false,
      allowResubmit: false,
      availableFrom: null,
      dueDate: defaultDeadline,
      status: 'PUBLISHED',
      displayOrder: 2,
      contentRevision: 1,
      publishedRevision: 1,
      publishedAt: now,
      createdBy: scope.teacher.user._id,
      updatedBy: scope.teacher.user._id,
    });
    await LearningProgressModel.insertMany([
      {
        studentId: scope.student.user._id,
        classroomId: scope.classroom._id,
        courseId: scope.course._id,
        activityType: 'LESSON',
        activityId: lesson._id,
        status: 'COMPLETED',
        startedAt: now,
        completedAt: now,
        lastActiveAt: now,
      },
      {
        studentId: scope.student.user._id,
        classroomId: scope.classroom._id,
        courseId: scope.course._id,
        activityType: 'QUIZ',
        activityId: quiz._id,
        status: 'COMPLETED',
        startedAt: now,
        completedAt: now,
        lastActiveAt: now,
      },
    ]);

    await request(app)
      .put(
        `/api/v1/teacher/activities/assignments/${assignment._id.toString()}/deadline-exceptions/${scope.student.user._id.toString()}`,
      )
      .set('Authorization', bearer(scope.teacher.token))
      .send({
        deadline: extendedDeadline.toISOString(),
        reason: 'Approved extension for the mixed activity projection',
        expectedRevision: 0,
      })
      .expect(200);

    const todo = await request(app)
      .get('/api/v1/students/me/todo')
      .set('Authorization', bearer(scope.student.token))
      .expect(200);
    expect(todo.body.data).toMatchObject({ scopeVersion: 'P05_MIXED_ACTIVITY_TODO_V2' });
    expect(todo.body.data.items).toHaveLength(1);
    expect(todo.body.data.items[0]).toMatchObject({
      activityId: assignment._id.toString(),
      activityType: 'ASSIGNMENT',
      effectiveDeadline: extendedDeadline.toISOString(),
      hasDeadlineException: true,
      actionUrl: `/student/assignments/${assignment._id.toString()}`,
    });

    const deadlines = await request(app)
      .get('/api/v1/students/me/deadlines')
      .set('Authorization', bearer(scope.student.token))
      .expect(200);
    expect(deadlines.body.data.descriptorVersion).toBe('P05_ACTIVITY_DESCRIPTOR_V2');
    expect(
      deadlines.body.data.items.map((item: { activityType: string }) => item.activityType).sort(),
    ).toEqual(['ASSIGNMENT', 'LESSON', 'QUIZ']);

    const progress = await request(app)
      .get(`/api/v1/students/me/progress?courseId=${scope.course._id.toString()}`)
      .set('Authorization', bearer(scope.student.token))
      .expect(200);
    expect(progress.body.data).toMatchObject({
      metricVersion: 'P05_REQUIRED_ACTIVITY_COMPLETION_V1',
      descriptorVersion: 'P05_ACTIVITY_DESCRIPTOR_V2',
      requiredActivityCount: 3,
      completedRequiredCount: 2,
      progressPercentage: 66.7,
    });

    const classwork = await request(app)
      .get(`/api/v1/classrooms/${scope.classroom._id.toString()}/classwork`)
      .set('Authorization', bearer(scope.student.token))
      .expect(200);
    expect(classwork.body.data.descriptorVersion).toBe('P05_ACTIVITY_DESCRIPTOR_V2');
    expect(
      classwork.body.data.courses[0].activities
        .map((item: { activityType: string }) => item.activityType)
        .sort(),
    ).toEqual(['ASSIGNMENT', 'LESSON', 'QUIZ']);

    const dashboard = await request(app)
      .get(`/api/v1/teacher/courses/${scope.course._id.toString()}/dashboard`)
      .set('Authorization', bearer(scope.teacher.token))
      .expect(200);
    expect(dashboard.body.data).toMatchObject({
      summary: { requiredActivityCount: 3, publishedActivityCount: 3 },
      reporting: {
        sourceMetricVersion: 'P05_REQUIRED_ACTIVITY_COMPLETION_V1',
        descriptorVersion: 'P05_ACTIVITY_DESCRIPTOR_V2',
      },
    });
    expect(dashboard.body.data.topStudents[0]).toMatchObject({
      student: { id: scope.student.user._id.toString() },
      requiredActivityCount: 3,
      completedRequiredCount: 2,
      progressPercentage: 66.7,
    });

    const otherTodo = await request(app)
      .get('/api/v1/students/me/todo')
      .set('Authorization', bearer(scope.otherStudent.token))
      .expect(200);
    expect(
      otherTodo.body.data.items.find(
        (item: { activityId: string }) => item.activityId === assignment._id.toString(),
      ),
    ).toMatchObject({
      effectiveDeadline: defaultDeadline.toISOString(),
      hasDeadlineException: false,
    });
  });

  it('applies a Student deadline exception to Quiz eligibility and Assignment turn-in', async () => {
    const scope = await learningScope();
    const now = new Date();
    const defaultDeadline = new Date(now.getTime() - 3_600_000);
    const extendedDeadline = new Date(now.getTime() + 86_400_000);
    const quiz = await QuizModel.create({
      classroomId: scope.classroom._id,
      courseId: scope.course._id,
      moduleId: null,
      title: 'Extended Quiz',
      instruction: 'Use the approved extension.',
      isRequired: true,
      status: 'PUBLISHED',
      availableFrom: null,
      dueDate: defaultDeadline,
      attemptLimit: 1,
      timeLimitMinutes: null,
      resultReleasePolicy: 'IMMEDIATE',
      scorePolicy: 'HIGHEST',
      displayOrder: 0,
      contentRevision: 2,
      questionRevision: 1,
      publishedRevision: 2,
      maxScore: 1,
      publishedAt: now,
      createdBy: scope.teacher.user._id,
      updatedBy: scope.teacher.user._id,
    });
    await QuestionModel.create({
      quizId: quiz._id,
      courseId: scope.course._id,
      type: 'TRUE_FALSE',
      prompt: 'An extension changes the effective deadline.',
      points: 1,
      isRequired: true,
      options: [],
      correctOptionIds: [],
      correctBoolean: true,
      rubric: null,
      explanation: null,
      media: null,
      displayOrder: 0,
      version: 1,
      status: 'ACTIVE',
      createdBy: scope.teacher.user._id,
      updatedBy: scope.teacher.user._id,
    });
    const assignment = await AssignmentModel.create({
      classroomId: scope.classroom._id,
      courseId: scope.course._id,
      moduleId: null,
      title: 'Extended Assignment',
      instruction: 'Submit with the approved extension.',
      maxScore: 10,
      isRequired: true,
      allowedSubmissionTypes: ['TEXT'],
      allowLateSubmission: false,
      allowUnsubmit: true,
      allowResubmit: false,
      availableFrom: null,
      dueDate: defaultDeadline,
      status: 'PUBLISHED',
      displayOrder: 1,
      contentRevision: 2,
      publishedRevision: 2,
      publishedAt: now,
      createdBy: scope.teacher.user._id,
      updatedBy: scope.teacher.user._id,
    });

    for (const [activityType, activityId] of [
      ['quizzes', quiz._id.toString()],
      ['assignments', assignment._id.toString()],
    ] as const) {
      await request(app)
        .put(
          `/api/v1/teacher/activities/${activityType}/${activityId}/deadline-exceptions/${scope.student.user._id.toString()}`,
        )
        .set('Authorization', bearer(scope.teacher.token))
        .send({
          deadline: extendedDeadline.toISOString(),
          reason: 'Approved deadline extension for an enrolled Student',
          expectedRevision: 0,
        })
        .expect(200);
    }

    const intro = await request(app)
      .get(`/api/v1/students/quizzes/${quiz._id.toString()}`)
      .set('Authorization', bearer(scope.student.token))
      .expect(200);
    expect(intro.body.data).toMatchObject({
      canStart: true,
      defaultDeadline: defaultDeadline.toISOString(),
      effectiveDeadline: extendedDeadline.toISOString(),
      hasDeadlineException: true,
    });
    const otherIntro = await request(app)
      .get(`/api/v1/students/quizzes/${quiz._id.toString()}`)
      .set('Authorization', bearer(scope.otherStudent.token))
      .expect(200);
    expect(otherIntro.body.data).toMatchObject({
      canStart: false,
      unavailableReason: 'QUIZ_DUE_PASSED',
      hasDeadlineException: false,
    });
    const started = await request(app)
      .post(`/api/v1/students/quizzes/${quiz._id.toString()}/attempts`)
      .set('Authorization', bearer(scope.student.token))
      .send({})
      .expect(201);
    expect(new Date(started.body.data.attempt.expiresAt).getTime()).toBe(
      extendedDeadline.getTime(),
    );

    const assignmentDetail = await request(app)
      .get(`/api/v1/students/assignments/${assignment._id.toString()}`)
      .set('Authorization', bearer(scope.student.token))
      .expect(200);
    expect(assignmentDetail.body.data).toMatchObject({
      defaultDeadline: defaultDeadline.toISOString(),
      effectiveDeadline: extendedDeadline.toISOString(),
      hasDeadlineException: true,
    });
    const draft = await request(app)
      .put(`/api/v1/students/assignments/${assignment._id.toString()}/submission`)
      .set('Authorization', bearer(scope.student.token))
      .send({
        submissionType: 'TEXT',
        textAnswer: 'Submitted inside the individual extension.',
        links: [],
        markDone: false,
        expectedSubmissionRevision: 0,
      })
      .expect(200);
    const turnedIn = await request(app)
      .post(`/api/v1/students/submissions/${draft.body.data.id}/turn-in`)
      .set('Authorization', bearer(scope.student.token))
      .send({ expectedSubmissionRevision: draft.body.data.revision })
      .expect(200);
    expect(turnedIn.body.data.submission).toMatchObject({
      status: 'SUBMITTED',
      isLate: false,
      effectiveDeadlineAtSubmit: extendedDeadline.toISOString(),
    });
  });

  it('enforces the Phase 05 authorization, IDOR and field-leak matrix', async () => {
    const scope = await learningScope();
    const otherTeacher = await identity('TEACHER');
    const admin = await identity('ADMIN');
    const quiz = await QuizModel.create({
      classroomId: scope.classroom._id,
      courseId: scope.course._id,
      moduleId: null,
      title: 'Security Projection Quiz',
      instruction: 'Visible instruction without scoring data.',
      isRequired: true,
      status: 'PUBLISHED',
      availableFrom: null,
      dueDate: new Date(Date.now() + 86_400_000),
      attemptLimit: 1,
      timeLimitMinutes: 15,
      resultReleasePolicy: 'AFTER_REVIEW',
      scorePolicy: 'HIGHEST',
      displayOrder: 0,
      contentRevision: 2,
      questionRevision: 1,
      publishedRevision: 2,
      maxScore: 2,
      publishedAt: new Date(),
      createdBy: scope.teacher.user._id,
      updatedBy: scope.teacher.user._id,
    });
    await QuestionModel.create({
      quizId: quiz._id,
      courseId: scope.course._id,
      type: 'SINGLE_CHOICE',
      prompt: 'Which method creates a resource?',
      points: 2,
      isRequired: true,
      options: [
        { id: 'get', label: 'GET', displayOrder: 0 },
        { id: 'post', label: 'POST', displayOrder: 1 },
      ],
      correctOptionIds: ['post'],
      correctBoolean: null,
      rubric: null,
      explanation: 'POST creates a resource.',
      media: null,
      displayOrder: 0,
      version: 1,
      status: 'ACTIVE',
      createdBy: scope.teacher.user._id,
      updatedBy: scope.teacher.user._id,
    });
    const grade = await GradeModel.create({
      studentId: scope.student.user._id,
      classroomId: scope.classroom._id,
      courseId: scope.course._id,
      activityType: 'QUIZ',
      activityId: quiz._id,
      evidenceType: 'ATTEMPT',
      evidenceId: new mongoose.Types.ObjectId(),
      evidenceRevision: 1,
      score: 2,
      maxScore: 2,
      feedback: 'Returned feedback',
      status: 'RETURNED',
      revision: 1,
      gradedBy: scope.teacher.user._id,
      gradedAt: new Date(),
      returnedBy: scope.teacher.user._id,
      returnedAt: new Date(),
    });

    await request(app).get(`/api/v1/students/quizzes/${quiz._id.toString()}`).expect(401);
    await request(app)
      .get(`/api/v1/teacher/quizzes/${quiz._id.toString()}/results`)
      .set('Authorization', bearer(scope.student.token))
      .expect(403);
    await request(app)
      .get(`/api/v1/teacher/quizzes/${quiz._id.toString()}/results`)
      .set('Authorization', bearer(admin.token))
      .expect(403);
    await request(app)
      .get(`/api/v1/teacher/quizzes/${quiz._id.toString()}/results`)
      .set('Authorization', bearer(otherTeacher.token))
      .expect(404);
    await request(app)
      .get(`/api/v1/teacher/activities/quizzes/${quiz._id.toString()}/deadline-exceptions`)
      .set('Authorization', bearer(scope.student.token))
      .expect(403);
    await request(app)
      .get(`/api/v1/students/me/grades/${grade._id.toString()}`)
      .set('Authorization', bearer(scope.otherStudent.token))
      .expect(404);

    const studentProjection = await request(app)
      .get(`/api/v1/students/quizzes/${quiz._id.toString()}`)
      .set('Authorization', bearer(scope.student.token))
      .expect(200);
    const ownGrade = await request(app)
      .get(`/api/v1/students/me/grades/${grade._id.toString()}`)
      .set('Authorization', bearer(scope.student.token))
      .expect(200);
    const governance = await request(app)
      .get(`/api/v1/admin/courses/${scope.course._id.toString()}`)
      .set('Authorization', bearer(admin.token))
      .expect(200);

    const forbiddenFields =
      /correctOptionIds|correctBoolean|rubric|explanation|questionSnapshots|answers|studentId/u;
    expect(JSON.stringify(studentProjection.body)).not.toMatch(forbiddenFields);
    expect(JSON.stringify(ownGrade.body)).not.toMatch(forbiddenFields);
    expect(JSON.stringify(governance.body)).not.toMatch(forbiddenFields);
    expect(governance.body.data.course).toMatchObject({
      quizCount: 1,
      assignmentCount: 0,
    });
  });
});
