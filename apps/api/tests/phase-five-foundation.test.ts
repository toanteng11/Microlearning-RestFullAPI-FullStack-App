import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';

import { buildPhaseFiveAuditInput } from '../src/modules/audit/phase-five-audit.writer.js';
import { toStudentReturnedGradeDto } from '../src/modules/grades/grade.dto.js';
import type { GradeRecord } from '../src/modules/grades/grade.model.js';
import { QuestionModel } from '../src/modules/questions/question.model.js';
import { toStudentAttemptDto } from '../src/modules/quiz-attempts/quiz-attempt.dto.js';
import type { QuizAttemptRecord } from '../src/modules/quiz-attempts/quiz-attempt.model.js';
import { QuizModel } from '../src/modules/quizzes/quiz.model.js';
import { toStudentOwnSubmissionDto } from '../src/modules/submissions/submission.dto.js';
import type { SubmissionRecord } from '../src/modules/submissions/submission.model.js';
import { PHASE_FIVE_MODELS } from '../src/shared/database/phase-five-indexes.js';
import { PERMISSIONS, getCapabilities, hasPermission } from '../src/shared/auth/permissions.js';

describe('Phase 05 data and authorization foundation', () => {
  it('grants assessment capabilities by actor and remains deny-by-default', () => {
    expect(getCapabilities('STUDENT')).toEqual(
      expect.arrayContaining([
        'quiz.view_assigned',
        'quiz.attempt',
        'quiz.result_view_own',
        'assignment.view_assigned',
        'submission.manage_own',
        'submission.view_own',
        'grade.view_own',
      ]),
    );
    expect(getCapabilities('TEACHER')).toEqual(
      expect.arrayContaining([
        'quiz.manage_owned',
        'quiz.publish_owned',
        'quiz.results_view_owned',
        'quiz.review_owned',
        'assignment.manage_owned',
        'assignment.publish_owned',
        'submission.view_owned',
        'grade.manage_owned',
        'deadline_exception.manage_owned',
      ]),
    );
    expect(hasPermission('STUDENT', 'quiz.manage_owned')).toBe(false);
    expect(hasPermission('TEACHER', 'quiz.attempt')).toBe(false);
    expect(hasPermission('ADMIN', 'grade.manage_owned')).toBe(false);
    expect(getCapabilities('SUPER_ADMIN')).toEqual([...PERMISSIONS].sort());
  });

  it('registers every Phase 05 model and its named critical indexes', () => {
    expect(PHASE_FIVE_MODELS).toHaveLength(10);
    for (const model of PHASE_FIVE_MODELS) {
      expect(model.schema.path('schemaVersion'), model.modelName).toBeDefined();
    }
    const quizIndexes = QuizModel.schema.indexes() as Array<[unknown, { name?: string }]>;
    const questionIndexes = QuestionModel.schema.indexes() as Array<[unknown, { name?: string }]>;
    expect(quizIndexes.map((entry) => entry[1].name)).toContain('quiz_course_status_order');
    expect(questionIndexes.map((entry) => entry[1].name)).toContain('question_quiz_status_order');
  });

  it('rejects invalid type-specific Question persistence shapes before database I/O', async () => {
    const id = new Types.ObjectId();
    const invalidSingle = new QuestionModel({
      quizId: id,
      courseId: new Types.ObjectId(),
      type: 'SINGLE_CHOICE',
      prompt: 'Choose one',
      points: 1,
      options: [
        { id: 'one', label: 'Same', displayOrder: 0 },
        { id: 'two', label: ' same ', displayOrder: 1 },
      ],
      correctOptionIds: ['one', 'two'],
      correctBoolean: null,
      rubric: null,
      explanation: null,
      displayOrder: 0,
      createdBy: id,
      updatedBy: id,
    });
    await expect(invalidSingle.validate()).rejects.toMatchObject({ name: 'ValidationError' });

    const validTrueFalse = new QuestionModel({
      quizId: id,
      courseId: new Types.ObjectId(),
      type: 'TRUE_FALSE',
      prompt: 'HTTP is stateless',
      points: 1,
      options: [],
      correctOptionIds: [],
      correctBoolean: true,
      rubric: null,
      explanation: null,
      displayOrder: 0,
      createdBy: id,
      updatedBy: id,
    });
    await expect(validTrueFalse.validate()).resolves.toBeUndefined();
  });

  it('redacts answer and content material from audit payloads', () => {
    const audit = buildPhaseFiveAuditInput({
      actorRole: 'TEACHER',
      action: 'QUESTION_UPDATED',
      resourceId: new Types.ObjectId().toString(),
      requestId: 'p05-test',
      oldValue: {
        type: 'SINGLE_CHOICE',
        points: 2,
        prompt: 'secret prompt',
        correctOptionIds: ['secret'],
        rubric: 'secret',
      },
      metadata: { courseId: 'course', quizId: 'quiz', studentId: 'must-not-leak' },
    });
    expect(audit.oldValue).toEqual({ type: 'SINGLE_CHOICE', points: 2 });
    expect(audit.metadata).toEqual({ courseId: 'course', quizId: 'quiz' });
    expect(JSON.stringify(audit)).not.toMatch(/secret|studentId/u);
  });

  it('uses allowlisted Student projections for private assessment records', () => {
    const id = new Types.ObjectId();
    const now = new Date('2026-08-01T00:00:00.000Z');
    const attempt = {
      _id: id,
      quizId: new Types.ObjectId(),
      attemptNumber: 1,
      status: 'IN_PROGRESS',
      assessmentRevision: 1,
      quizSnapshot: {
        title: 'Quiz',
        resultReleasePolicy: 'AFTER_REVIEW',
        maxScore: 2,
        timeLimitMinutes: 10,
      },
      questionSnapshots: [
        {
          questionId: new Types.ObjectId(),
          questionRevision: 1,
          type: 'SINGLE_CHOICE',
          prompt: 'Method?',
          points: 2,
          isRequired: true,
          displayOrder: 0,
          options: [],
          media: null,
          scoring: { correctOptionIds: ['secret'], correctBoolean: null, rubric: 'secret' },
        },
      ],
      answers: [],
      startedAt: now,
      expiresAt: now,
      lastSavedAt: null,
      submittedAt: null,
      attemptRevision: 1,
      totalScore: 0,
      maxScore: 2,
      gradedAt: null,
      releasedAt: null,
    } as unknown as QuizAttemptRecord;
    const attemptDto = toStudentAttemptDto(attempt);
    expect(JSON.stringify(attemptDto)).not.toMatch(/scoring|correctOptionIds|rubric|secret/u);
    expect(attemptDto.result).toBeNull();

    const submission = {
      _id: id,
      assignmentId: new Types.ObjectId(),
      studentId: new Types.ObjectId(),
      classroomId: new Types.ObjectId(),
      courseId: new Types.ObjectId(),
      status: 'DRAFT',
      submissionType: 'TEXT',
      textAnswer: 'Own draft',
      links: [],
      markDone: false,
      revision: 1,
      submittedRevision: null,
      submittedAt: null,
      isLate: false,
      effectiveDeadlineAtSubmit: null,
      gradedAt: null,
      returnedAt: null,
    } as unknown as SubmissionRecord;
    expect(toStudentOwnSubmissionDto(submission)).not.toHaveProperty('studentId');

    const draftGrade = { status: 'DRAFT' } as GradeRecord;
    expect(toStudentReturnedGradeDto(draftGrade)).toBeNull();
  });
});
