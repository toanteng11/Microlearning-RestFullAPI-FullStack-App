import { Types } from 'mongoose';

import { withMongoTransaction } from '../../shared/database/unit-of-work.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { PhaseFiveAuditWriter } from '../audit/phase-five-audit.writer.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { CourseScopeReader } from '../learning-content/course-scope.reader.js';
import type { ReportingInvalidationWriter } from '../learning-content/reporting-invalidation.writer.js';
import type { DeadlineExceptionRepository } from '../deadline-exceptions/deadline-exception.repository.js';
import { resolveEffectiveDeadline } from '../deadline-exceptions/effective-deadline.resolver.js';
import type { LearningProgressRepository } from '../learning-progress/learning-progress.repository.js';
import type { QuestionRepository } from '../questions/question.repository.js';
import type { QuizRepository } from '../quizzes/quiz.repository.js';
import { scoreObjectiveAnswers } from '../quiz-scoring/objective-scoring.policy.js';
import {
  toStudentAttemptDto,
  toStudentAttemptSummaryDto,
  toStudentQuizResultDto,
} from './quiz-attempt.dto.js';
import type { QuizAttemptRecord } from './quiz-attempt.model.js';
import type { QuizAttemptRepository } from './quiz-attempt.repository.js';
import type {
  AttemptListQueryInput,
  SaveQuizAnswersInput,
  SubmitQuizAttemptInput,
} from './quiz-attempt.schemas.js';
import type { AttemptAnswer, AttemptQuestionSnapshot } from './quiz-attempt.types.js';
import { assertQuizEligible, resolveQuizEligibility } from './quiz-eligibility.policy.js';
import { isAttemptExpired, resolveAttemptExpiry } from './quiz-timeout.policy.js';

function objectId(value: string, label: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value))
    throw new AppError(404, 'RESOURCE_NOT_FOUND', `${label} was not found`);
  return new Types.ObjectId(value);
}

function assertStudent(actor: AuthenticatedUser): void {
  if (actor.role !== 'STUDENT') throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
}

function paginationMeta(page: number, limit: number, totalItems: number) {
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && totalPages > 0,
  };
}

function isDuplicateKey(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

export class QuizAttemptService {
  constructor(
    private readonly quizzes: QuizRepository,
    private readonly questions: QuestionRepository,
    private readonly attempts: QuizAttemptRepository,
    private readonly progress: LearningProgressRepository,
    private readonly deadlineExceptions: DeadlineExceptionRepository,
    private readonly scopes: CourseScopeReader,
    private readonly audits: PhaseFiveAuditWriter,
    private readonly reportingInvalidationWriter: ReportingInvalidationWriter,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async requireStudentQuiz(actor: AuthenticatedUser, quizId: string) {
    assertStudent(actor);
    const quiz = await this.quizzes.findById(objectId(quizId, 'Quiz'));
    if (!quiz) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Quiz was not found');
    const scope = await this.scopes.requireStudentView(actor.id, quiz.courseId.toString());
    return { quiz, scope };
  }

  private async requireOwnAttempt(actor: AuthenticatedUser, attemptId: string) {
    assertStudent(actor);
    const attempt = await this.attempts.findById(objectId(attemptId, 'Quiz Attempt'));
    if (!attempt || attempt.studentId.toString() !== actor.id)
      throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Quiz Attempt was not found');
    await this.scopes.requireStudentView(actor.id, attempt.courseId.toString());
    return attempt;
  }

  private score(attempt: QuizAttemptRecord) {
    return scoreObjectiveAnswers(
      attempt.questionSnapshots.map((question) => ({
        questionId: question.questionId.toString(),
        type: question.type,
        points: question.points,
        correctOptionIds: question.scoring.correctOptionIds,
        correctBoolean: question.scoring.correctBoolean,
      })),
      attempt.answers.map((answer) => ({
        questionId: answer.questionId.toString(),
        selectedOptionIds: answer.selectedOptionIds,
        textAnswer: answer.textAnswer,
      })),
    );
  }

  private async finalize(
    attempt: QuizAttemptRecord,
    submittedAt: Date,
    requestId: string,
    timedOut: boolean,
  ): Promise<QuizAttemptRecord> {
    return withMongoTransaction(async (session) => {
      const current = await this.attempts.findById(attempt._id, session);
      if (!current) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Quiz Attempt was not found');
      if (current.status !== 'IN_PROGRESS') return current;
      const scoring = this.score(current);
      const releaseImmediately =
        !scoring.requiresManualReview && current.quizSnapshot.resultReleasePolicy === 'IMMEDIATE';
      const status = scoring.requiresManualReview
        ? 'NEEDS_REVIEW'
        : timedOut
          ? 'TIMED_OUT'
          : releaseImmediately
            ? 'RESULT_RELEASED'
            : 'SUBMITTED';
      const finalized = await this.attempts.finalizeCas(
        current._id,
        current.attemptRevision,
        {
          status,
          objectiveScore: scoring.objectiveScore,
          manualScore: 0,
          totalScore: scoring.objectiveScore,
          submittedAt,
          gradedAt: scoring.requiresManualReview ? null : submittedAt,
          releasedAt: releaseImmediately ? submittedAt : null,
        },
        session,
      );
      if (!finalized) {
        const canonical = await this.attempts.findById(current._id, session);
        if (canonical && canonical.status !== 'IN_PROGRESS') return canonical;
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Quiz Attempt changed concurrently');
      }
      await this.progress.complete(
        {
          studentId: finalized.studentId,
          classroomId: finalized.classroomId,
          courseId: finalized.courseId,
          activityType: 'QUIZ',
          activityId: finalized.quizId,
          startedAt: finalized.startedAt,
          lastActiveAt: submittedAt,
          completedAt: submittedAt,
        },
        session,
      );
      await this.audits.append(
        {
          actorId: finalized.studentId,
          actorRole: 'STUDENT',
          action: 'ATTEMPT_FINALIZED',
          resourceId: finalized._id.toString(),
          requestId,
          newValue: {
            status: finalized.status,
            attemptRevision: finalized.attemptRevision,
            objectiveScore: finalized.objectiveScore,
            totalScore: finalized.totalScore,
          },
          metadata: {
            classroomId: finalized.classroomId.toString(),
            courseId: finalized.courseId.toString(),
            quizId: finalized.quizId.toString(),
            studentId: finalized.studentId.toString(),
            attemptNumber: finalized.attemptNumber,
            answeredCount: finalized.answers.length,
            resultReleased: finalized.releasedAt !== null,
          },
        },
        session,
      );
      await this.reportingInvalidationWriter.invalidateStudentCourse(
        {
          classroomId: finalized.classroomId,
          courseId: finalized.courseId,
          studentId: finalized.studentId,
          reasons: ['PROGRESS_CHANGED', 'ASSESSMENT_CHANGED'],
          sourceChangedAt: submittedAt,
        },
        session,
      );
      return finalized;
    });
  }

  private async reconcile(attempt: QuizAttemptRecord, requestId: string) {
    const now = this.now();
    if (attempt.status !== 'IN_PROGRESS' || !isAttemptExpired(attempt.expiresAt, now)) {
      return attempt;
    }
    return this.finalize(attempt, attempt.expiresAt, requestId, true);
  }

  async intro(actor: AuthenticatedUser, quizId: string, requestId: string) {
    const { quiz } = await this.requireStudentQuiz(actor, quizId);
    const studentId = objectId(actor.id, 'Student');
    const deadline = resolveEffectiveDeadline(
      quiz.dueDate,
      await this.deadlineExceptions.findCurrent(studentId, 'QUIZ', quiz._id),
    );
    const active = await this.attempts.findActive(quiz._id, studentId);
    const reconciled = active ? await this.reconcile(active, requestId) : null;
    const currentActive = reconciled?.status === 'IN_PROGRESS' ? reconciled : null;
    const attemptsUsed = await this.attempts.countByStudentAndQuiz(quiz._id, studentId);
    const eligibility = resolveQuizEligibility(
      { ...quiz, dueDate: deadline.effectiveDeadline },
      attemptsUsed,
      Boolean(currentActive),
      this.now(),
    );
    return {
      id: quiz._id.toString(),
      courseId: quiz.courseId.toString(),
      classroomId: quiz.classroomId.toString(),
      title: quiz.title,
      instruction: quiz.instruction,
      attemptLimit: quiz.attemptLimit,
      attemptsUsed,
      attemptsRemaining: Math.max(0, quiz.attemptLimit - attemptsUsed),
      timeLimitMinutes: quiz.timeLimitMinutes,
      defaultDeadline: quiz.dueDate.toISOString(),
      effectiveDeadline: deadline.effectiveDeadline.toISOString(),
      hasDeadlineException: deadline.source === 'STUDENT_EXCEPTION',
      resultReleasePolicy: quiz.resultReleasePolicy,
      canStart: eligibility.canStart,
      unavailableReason: eligibility.unavailableReason,
      activeAttemptId: currentActive?._id.toString() ?? null,
    };
  }

  async start(actor: AuthenticatedUser, quizId: string, requestId: string) {
    const { quiz, scope } = await this.requireStudentQuiz(actor, quizId);
    const studentId = objectId(actor.id, 'Student');
    const deadline = resolveEffectiveDeadline(
      quiz.dueDate,
      await this.deadlineExceptions.findCurrent(studentId, 'QUIZ', quiz._id),
    );
    const active = await this.attempts.findActive(quiz._id, studentId);
    if (active) {
      const reconciled = await this.reconcile(active, requestId);
      if (reconciled.status === 'IN_PROGRESS') {
        return { attempt: toStudentAttemptDto(reconciled), resumed: true };
      }
    }
    const attemptsUsed = await this.attempts.countByStudentAndQuiz(quiz._id, studentId);
    assertQuizEligible(
      resolveQuizEligibility(
        { ...quiz, dueDate: deadline.effectiveDeadline },
        attemptsUsed,
        false,
        this.now(),
      ),
    );

    try {
      return await withMongoTransaction(async (session) => {
        const transactionActive = await this.attempts.findActive(quiz._id, studentId, session);
        if (transactionActive)
          return { attempt: toStudentAttemptDto(transactionActive), resumed: true };
        const attemptNumber = await this.attempts.nextAttemptNumber(quiz._id, studentId, session);
        if (attemptNumber > quiz.attemptLimit)
          throw new AppError(409, 'ATTEMPT_LIMIT_REACHED', 'Quiz attempt limit has been reached');
        const questions = await this.questions.listActiveByQuiz(quiz._id, session);
        if (questions.length === 0)
          throw new AppError(409, 'QUIZ_HAS_NO_VALID_QUESTION', 'Quiz has no valid Question');
        const startedAt = this.now();
        const snapshots: AttemptQuestionSnapshot[] = questions.map((question) => ({
          questionId: question._id,
          questionRevision: question.version,
          type: question.type,
          prompt: question.prompt,
          points: question.points,
          isRequired: question.isRequired,
          displayOrder: question.displayOrder,
          options:
            question.type === 'TRUE_FALSE'
              ? [
                  { id: 'true', label: 'Đúng', displayOrder: 0 },
                  { id: 'false', label: 'Sai', displayOrder: 1 },
                ]
              : question.options.map((option) => ({ ...option })),
          media: question.media ? { ...question.media } : null,
          scoring: {
            correctOptionIds: [...question.correctOptionIds],
            correctBoolean: question.correctBoolean,
            rubric: question.rubric,
          },
        }));
        const attempt = await this.attempts.create(
          {
            studentId,
            classroomId: objectId(scope.classroomId, 'Classroom'),
            courseId: quiz.courseId,
            quizId: quiz._id,
            attemptNumber,
            assessmentRevision: quiz.publishedRevision ?? quiz.contentRevision,
            quizSnapshot: {
              title: quiz.title,
              resultReleasePolicy: quiz.resultReleasePolicy,
              maxScore: snapshots.reduce((sum, question) => sum + question.points, 0),
              timeLimitMinutes: quiz.timeLimitMinutes,
            },
            questionSnapshots: snapshots,
            startedAt,
            expiresAt: resolveAttemptExpiry(
              startedAt,
              deadline.effectiveDeadline,
              quiz.timeLimitMinutes,
            ),
          },
          session,
        );
        await this.progress.start(
          {
            studentId,
            classroomId: attempt.classroomId,
            courseId: attempt.courseId,
            activityType: 'QUIZ',
            activityId: attempt.quizId,
            startedAt,
            lastActiveAt: startedAt,
          },
          session,
        );
        await this.audits.append(
          {
            actorId: studentId,
            actorRole: actor.role,
            action: 'ATTEMPT_STARTED',
            resourceId: attempt._id.toString(),
            requestId,
            newValue: {
              status: attempt.status,
              attemptRevision: attempt.attemptRevision,
              attemptNumber,
            },
            metadata: {
              classroomId: scope.classroomId,
              courseId: quiz.courseId.toString(),
              quizId: quiz._id.toString(),
              studentId: actor.id,
              attemptNumber,
            },
          },
          session,
        );
        await this.reportingInvalidationWriter.invalidateStudentCourse(
          {
            classroomId: attempt.classroomId,
            courseId: attempt.courseId,
            studentId: attempt.studentId,
            reasons: ['PROGRESS_CHANGED'],
            sourceChangedAt: startedAt,
          },
          session,
        );
        return { attempt: toStudentAttemptDto(attempt), resumed: false };
      });
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
      const resumed = await this.attempts.findActive(quiz._id, studentId);
      if (!resumed) throw error;
      return { attempt: toStudentAttemptDto(resumed), resumed: true };
    }
  }

  async getOwn(actor: AuthenticatedUser, attemptId: string, requestId: string) {
    const attempt = await this.requireOwnAttempt(actor, attemptId);
    return toStudentAttemptDto(await this.reconcile(attempt, requestId));
  }

  private normalizeAnswers(
    attempt: QuizAttemptRecord,
    input: SaveQuizAnswersInput,
    savedAt: Date,
  ): AttemptAnswer[] {
    const questionById = new Map(
      attempt.questionSnapshots.map((question) => [question.questionId.toString(), question]),
    );
    const merged = new Map(attempt.answers.map((answer) => [answer.questionId.toString(), answer]));
    for (const inputAnswer of input.answers) {
      const question = questionById.get(inputAnswer.questionId);
      if (!question)
        throw new AppError(422, 'INVALID_ATTEMPT_ANSWER', 'Question is not in Attempt snapshot');
      const selected = [...new Set(inputAnswer.selectedOptionIds)];
      if (selected.length !== inputAnswer.selectedOptionIds.length)
        throw new AppError(422, 'INVALID_ATTEMPT_ANSWER', 'Duplicate selected options are invalid');
      if (question.type === 'SHORT_ANSWER') {
        if (selected.length > 0)
          throw new AppError(422, 'INVALID_ATTEMPT_ANSWER', 'Short answer cannot select options');
      } else {
        if (inputAnswer.textAnswer)
          throw new AppError(422, 'INVALID_ATTEMPT_ANSWER', 'Objective answer cannot contain text');
        const validIds = new Set(question.options.map((option) => option.id));
        if (selected.some((id) => !validIds.has(id)))
          throw new AppError(422, 'INVALID_ATTEMPT_ANSWER', 'Selected option is not in snapshot');
        const expectedCount = question.type === 'MULTIPLE_CHOICE' ? selected.length : 1;
        if (selected.length > 0 && selected.length !== expectedCount)
          throw new AppError(422, 'INVALID_ATTEMPT_ANSWER', 'Answer does not match Question type');
        if (question.type !== 'MULTIPLE_CHOICE' && selected.length > 1)
          throw new AppError(422, 'INVALID_ATTEMPT_ANSWER', 'Only one option may be selected');
      }
      const hasAnswer = selected.length > 0 || Boolean(inputAnswer.textAnswer);
      if (!hasAnswer) merged.delete(inputAnswer.questionId);
      else
        merged.set(inputAnswer.questionId, {
          questionId: objectId(inputAnswer.questionId, 'Question'),
          selectedOptionIds: selected,
          textAnswer: inputAnswer.textAnswer,
          savedAt,
        });
    }
    return [...merged.values()].sort((left, right) => {
      const leftOrder = questionById.get(left.questionId.toString())?.displayOrder ?? 0;
      const rightOrder = questionById.get(right.questionId.toString())?.displayOrder ?? 0;
      return leftOrder - rightOrder;
    });
  }

  async saveAnswers(
    actor: AuthenticatedUser,
    attemptId: string,
    input: SaveQuizAnswersInput,
    requestId: string,
  ) {
    const owned = await this.requireOwnAttempt(actor, attemptId);
    const attempt = await this.reconcile(owned, requestId);
    if (attempt.status !== 'IN_PROGRESS')
      throw new AppError(409, 'ATTEMPT_EXPIRED', 'Quiz Attempt is no longer editable');
    const savedAt = this.now();
    const answers = this.normalizeAnswers(attempt, input, savedAt);
    const updated = await this.attempts.saveAnswersCas(
      attempt._id,
      input.expectedAttemptRevision,
      answers,
      savedAt,
    );
    if (!updated) {
      const current = await this.attempts.findById(attempt._id);
      if (
        current &&
        current.status === 'IN_PROGRESS' &&
        isAttemptExpired(current.expiresAt, savedAt)
      ) {
        await this.reconcile(current, requestId);
        throw new AppError(409, 'ATTEMPT_EXPIRED', 'Quiz Attempt has expired');
      }
      throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Quiz Attempt was modified elsewhere');
    }
    return toStudentAttemptDto(updated);
  }

  async submit(
    actor: AuthenticatedUser,
    attemptId: string,
    input: SubmitQuizAttemptInput,
    requestId: string,
  ) {
    const owned = await this.requireOwnAttempt(actor, attemptId);
    const reconciled = await this.reconcile(owned, requestId);
    if (reconciled.status !== 'IN_PROGRESS') {
      return {
        attempt: toStudentAttemptDto(reconciled),
        idempotentReplay: true,
        resultAvailable: reconciled.releasedAt !== null,
        resultUrl: reconciled.releasedAt
          ? `/student/quiz-attempts/${reconciled._id.toString()}/result`
          : null,
      };
    }
    if (reconciled.attemptRevision !== input.expectedAttemptRevision)
      throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Quiz Attempt was modified elsewhere');
    const finalized = await this.finalize(reconciled, this.now(), requestId, false);
    return {
      attempt: toStudentAttemptDto(finalized),
      idempotentReplay: false,
      resultAvailable: finalized.releasedAt !== null,
      resultUrl: finalized.releasedAt
        ? `/student/quiz-attempts/${finalized._id.toString()}/result`
        : null,
    };
  }

  async listOwn(
    actor: AuthenticatedUser,
    quizId: string,
    query: AttemptListQueryInput,
    requestId: string,
  ) {
    const { quiz } = await this.requireStudentQuiz(actor, quizId);
    const studentId = objectId(actor.id, 'Student');
    const active = await this.attempts.findActive(quiz._id, studentId);
    if (active) await this.reconcile(active, requestId);
    const result = await this.attempts.listByStudentAndQuiz(
      quiz._id,
      studentId,
      query.page,
      query.limit,
    );
    return {
      data: { items: result.items.map(toStudentAttemptSummaryDto) },
      meta: paginationMeta(result.page, result.limit, result.totalItems),
    };
  }

  async result(actor: AuthenticatedUser, attemptId: string, requestId: string) {
    const owned = await this.requireOwnAttempt(actor, attemptId);
    const attempt = await this.reconcile(owned, requestId);
    if (attempt.status === 'IN_PROGRESS')
      throw new AppError(409, 'ATTEMPT_NOT_FINALIZED', 'Quiz Attempt is still in progress');
    return toStudentQuizResultDto(attempt);
  }
}
