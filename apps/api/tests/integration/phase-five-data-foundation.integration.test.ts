import mongoose, { type Model, Types } from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AssignmentModel } from '../../src/modules/assignments/assignment.model.js';
import { DeadlineExceptionModel } from '../../src/modules/deadline-exceptions/deadline-exception.model.js';
import { GradeModel } from '../../src/modules/grades/grade.model.js';
import { LearningProgressModel } from '../../src/modules/learning-progress/learning-progress.model.js';
import { QuestionModel } from '../../src/modules/questions/question.model.js';
import { QuizAttemptModel } from '../../src/modules/quiz-attempts/quiz-attempt.model.js';
import { QuizModel } from '../../src/modules/quizzes/quiz.model.js';
import { SubmissionModel } from '../../src/modules/submissions/submission.model.js';
import {
  PHASE_FIVE_MODELS,
  initializePhaseFiveIndexes,
} from '../../src/shared/database/phase-five-indexes.js';
import {
  assertPhaseFiveMigrationPreflight,
  planPhaseFiveRollback,
  runPhaseFiveMigrationPreflight,
} from '../../src/shared/database/phase-five-migration.js';

const integrationUri = process.env.MONGODB_INTEGRATION_URI;
if (!integrationUri)
  throw new Error('MONGODB_INTEGRATION_URI is required for Phase 05 data foundation');

function expectIndexedPlan(explain: unknown, indexName: string) {
  const serialized = JSON.stringify(explain);
  expect(serialized).toContain('"stage":"IXSCAN"');
  expect(serialized).toContain(`"indexName":"${indexName}"`);
  expect(serialized).not.toContain('"stage":"COLLSCAN"');
}

function percentile95(samples: number[]) {
  const ordered = [...samples].sort((left, right) => left - right);
  return ordered[Math.max(0, Math.ceil(ordered.length * 0.95) - 1)] ?? Number.POSITIVE_INFINITY;
}

describe('Phase 05 data foundation on MongoDB replica set', () => {
  beforeAll(async () => {
    await mongoose.connect(integrationUri, { serverSelectionTimeoutMS: 15_000 });
    await initializePhaseFiveIndexes('test');
    await LearningProgressModel.createIndexes();
  });
  beforeEach(async () =>
    Promise.all(
      [...PHASE_FIVE_MODELS, LearningProgressModel as unknown as Model<unknown>].map((model) =>
        model.deleteMany({}),
      ),
    ),
  );
  afterAll(async () => mongoose.disconnect());

  it('creates the declared model set and critical named indexes', async () => {
    expect(PHASE_FIVE_MODELS).toHaveLength(10);
    const expected = new Map<Model<unknown>, string[]>([
      [QuizModel as unknown as Model<unknown>, ['quiz_course_status_order', 'quiz_due_visibility']],
      [QuestionModel as unknown as Model<unknown>, ['question_quiz_status_order']],
      [
        QuizAttemptModel as unknown as Model<unknown>,
        [
          'attempt_identity_unique',
          'attempt_one_active',
          'attempt_student_recent',
          'attempt_quiz_results',
          'attempt_expiry',
        ],
      ],
      [
        AssignmentModel as unknown as Model<unknown>,
        ['assignment_course_status_order', 'assignment_due_visibility'],
      ],
      [
        SubmissionModel as unknown as Model<unknown>,
        ['submission_identity_unique', 'submission_assignment_status', 'submission_student_recent'],
      ],
      [
        GradeModel as unknown as Model<unknown>,
        ['grade_identity_unique', 'grade_course_status', 'grade_student_returned'],
      ],
      [
        DeadlineExceptionModel as unknown as Model<unknown>,
        ['deadline_exception_unique', 'deadline_exception_course'],
      ],
    ]);
    for (const [model, names] of expected) {
      const actual = (await model.collection.indexes()).map((index) => index.name);
      expect(actual).toEqual(expect.arrayContaining(names));
    }
  });

  it('passes migration preflight on compatible data and produces a non-destructive rollback plan', async () => {
    await QuizModel.collection.insertOne({ schemaVersion: 1, marker: 'rollback-retention' });
    await LearningProgressModel.collection.insertOne({
      activityType: 'LESSON',
      marker: 'legacy-lesson-retention',
    });

    const preflight = await runPhaseFiveMigrationPreflight(mongoose.connection);
    expect(preflight).toMatchObject({
      replicaSetName: 'rs0',
      unknownLearningProgressRecords: 0,
      incompatibleSchemaRecords: 0,
      duplicateActiveAttemptGroups: 0,
      duplicateSubmissionGroups: 0,
      duplicateGradeGroups: 0,
      safeToExpand: true,
    });
    expect(() => assertPhaseFiveMigrationPreflight(preflight)).not.toThrow();

    const before = await QuizModel.collection.countDocuments();
    const rollback = await planPhaseFiveRollback(mongoose.connection);
    expect(rollback).toMatchObject({
      dryRun: true,
      retainedLessonProgressRecords: 1,
      destructiveActions: [],
    });
    expect(rollback.retainedDocumentsByCollection.quizzes).toBe(1);
    expect(await QuizModel.collection.countDocuments()).toBe(before);
  });

  it('blocks migration before unique index creation when legacy conflicts are present', async () => {
    const quizId = new Types.ObjectId();
    const studentId = new Types.ObjectId();

    await QuizAttemptModel.collection.dropIndex('attempt_one_active');
    try {
      await QuizAttemptModel.collection.insertMany([
        { quizId, studentId, attemptNumber: 1, status: 'IN_PROGRESS', schemaVersion: 1 },
        { quizId, studentId, attemptNumber: 2, status: 'IN_PROGRESS', schemaVersion: 1 },
      ]);
      await QuizModel.collection.insertOne({ schemaVersion: 999, marker: 'legacy-schema' });
      await LearningProgressModel.collection.insertOne({
        activityType: 'UNKNOWN_ACTIVITY',
        marker: 'legacy-progress',
      });

      const preflight = await runPhaseFiveMigrationPreflight(mongoose.connection);
      expect(preflight).toMatchObject({
        unknownLearningProgressRecords: 1,
        incompatibleSchemaRecords: 1,
        duplicateActiveAttemptGroups: 1,
        safeToExpand: false,
      });
      expect(() => assertPhaseFiveMigrationPreflight(preflight)).toThrow(
        'Phase 05 migration preflight failed',
      );
    } finally {
      await QuizAttemptModel.deleteMany({});
      await QuizAttemptModel.createIndexes();
    }
  });

  it('enforces current-record natural keys for Submission, Grade and deadline exception', async () => {
    const studentId = new Types.ObjectId();
    const assignmentId = new Types.ObjectId();
    const classroomId = new Types.ObjectId();
    const courseId = new Types.ObjectId();
    const currentSubmission = {
      assignmentId,
      studentId,
      classroomId,
      courseId,
      status: 'DRAFT' as const,
      submissionType: 'TEXT' as const,
      textAnswer: 'Draft',
      links: [] as string[],
      markDone: false,
    };
    await SubmissionModel.create(currentSubmission);
    await expect(SubmissionModel.create(currentSubmission)).rejects.toMatchObject({ code: 11000 });

    const grade = {
      studentId,
      classroomId,
      courseId,
      activityType: 'ASSIGNMENT' as const,
      activityId: assignmentId,
      evidenceType: 'SUBMISSION' as const,
      evidenceId: new Types.ObjectId(),
      evidenceRevision: 1,
      score: 8,
      maxScore: 10,
      status: 'DRAFT' as const,
      gradedBy: new Types.ObjectId(),
      gradedAt: new Date(),
    };
    await GradeModel.create(grade);
    await expect(
      GradeModel.create({ ...grade, evidenceId: new Types.ObjectId() }),
    ).rejects.toMatchObject({ code: 11000 });

    const deadline = {
      studentId,
      classroomId,
      courseId,
      activityType: 'ASSIGNMENT' as const,
      activityId: assignmentId,
      deadline: new Date(Date.now() + 86_400_000),
      reason: 'Approved learner exception',
      defaultDeadlineSnapshot: new Date(),
      changedBy: new Types.ObjectId(),
      changedAt: new Date(),
    };
    await DeadlineExceptionModel.create(deadline);
    await expect(DeadlineExceptionModel.create(deadline)).rejects.toMatchObject({ code: 11000 });
  });

  it('keeps legacy Lesson progress valid and accepts Quiz/Assignment discriminators', async () => {
    const base = {
      studentId: new Types.ObjectId(),
      classroomId: new Types.ObjectId(),
      courseId: new Types.ObjectId(),
      status: 'IN_PROGRESS' as const,
      startedAt: new Date(),
      lastActiveAt: new Date(),
    };
    await Promise.all([
      LearningProgressModel.create({
        ...base,
        activityType: 'LESSON',
        activityId: new Types.ObjectId(),
      }),
      LearningProgressModel.create({
        ...base,
        activityType: 'QUIZ',
        activityId: new Types.ObjectId(),
      }),
      LearningProgressModel.create({
        ...base,
        activityType: 'ASSIGNMENT',
        activityId: new Types.ObjectId(),
      }),
    ]);
    expect(await LearningProgressModel.countDocuments()).toBe(3);
  });

  it('uses critical Phase 05 indexes and keeps seeded query p95 within the local budget', async () => {
    const courseId = new Types.ObjectId();
    const quizId = new Types.ObjectId();
    const studentId = new Types.ObjectId();
    const now = Date.now();
    const rows = Array.from({ length: 160 }, (_, index) => ({
      index,
      activityId: new Types.ObjectId(),
      identityId: new Types.ObjectId(),
    }));

    await Promise.all([
      QuizAttemptModel.collection.insertMany(
        rows.map(({ index, identityId }) => ({
          quizId,
          studentId: identityId,
          attemptNumber: 1,
          status: 'SUBMITTED',
          totalScore: index % 11,
          submittedAt: new Date(now - index * 1_000),
          expiresAt: new Date(now + 60_000),
          schemaVersion: 1,
        })),
      ),
      GradeModel.collection.insertMany(
        rows.map(({ index, activityId }) => ({
          studentId,
          classroomId: new Types.ObjectId(),
          courseId,
          activityType: index % 2 === 0 ? 'QUIZ' : 'ASSIGNMENT',
          activityId,
          evidenceType: index % 2 === 0 ? 'QUIZ_ATTEMPT' : 'SUBMISSION',
          evidenceId: new Types.ObjectId(),
          evidenceRevision: 1,
          score: index % 11,
          maxScore: 10,
          status: 'RETURNED',
          gradedBy: new Types.ObjectId(),
          gradedAt: new Date(now - index * 1_000),
          returnedBy: new Types.ObjectId(),
          returnedAt: new Date(now - index * 1_000),
          schemaVersion: 1,
        })),
      ),
      DeadlineExceptionModel.collection.insertMany(
        rows.map(({ index, activityId }) => ({
          studentId,
          classroomId: new Types.ObjectId(),
          courseId,
          activityType: index % 2 === 0 ? 'QUIZ' : 'ASSIGNMENT',
          activityId,
          deadline: new Date(now + (index + 1) * 60_000),
          reason: 'Synthetic performance evidence',
          defaultDeadlineSnapshot: new Date(now),
          active: true,
          revision: 1,
          changedBy: new Types.ObjectId(),
          changedAt: new Date(now),
          schemaVersion: 1,
        })),
      ),
    ]);

    const attemptCursor = () =>
      QuizAttemptModel.collection
        .find({ quizId, status: 'SUBMITTED' })
        .sort({ totalScore: -1, submittedAt: 1, _id: 1 })
        .limit(100);
    const gradeCursor = () =>
      GradeModel.collection
        .find({ studentId, status: 'RETURNED' })
        .sort({ returnedAt: -1, _id: 1 })
        .limit(100);
    const deadlineCursor = () =>
      DeadlineExceptionModel.collection
        .find({ courseId, studentId, active: true })
        .sort({ deadline: 1 })
        .limit(100);

    expectIndexedPlan(await attemptCursor().explain('executionStats'), 'attempt_quiz_results');
    expectIndexedPlan(await gradeCursor().explain('executionStats'), 'grade_student_returned');
    expectIndexedPlan(
      await deadlineCursor().explain('executionStats'),
      'deadline_exception_course',
    );

    const samples: number[] = [];
    for (let iteration = 0; iteration < 20; iteration += 1) {
      const startedAt = performance.now();
      await Promise.all([
        attemptCursor().toArray(),
        gradeCursor().toArray(),
        deadlineCursor().toArray(),
      ]);
      samples.push(performance.now() - startedAt);
    }
    expect(percentile95(samples)).toBeLessThan(500);
  });
});
