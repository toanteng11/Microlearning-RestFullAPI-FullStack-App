import { Types, type ClientSession } from 'mongoose';

import { withMongoTransaction } from '../../shared/database/unit-of-work.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { PhaseFiveAuditWriter } from '../audit/phase-five-audit.writer.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { GradeRecord } from '../grades/grade.model.js';
import type { GradeRepository } from '../grades/grade.repository.js';
import type { AssessmentScopeReader } from '../learning-content/assessment-scope.reader.js';
import type { ReportingInvalidationWriter } from '../learning-content/reporting-invalidation.writer.js';
import type { QuizRepository } from '../quizzes/quiz.repository.js';
import { UserModel } from '../users/user.model.js';
import { toTeacherAttemptReviewDto } from './quiz-review.dto.js';
import type { QuizAttemptRecord } from './quiz-attempt.model.js';
import type { QuizAttemptRepository } from './quiz-attempt.repository.js';
import type {
  FinalizeQuizReviewInput,
  QuizResultListQueryInput,
  RegradeQuizAttemptInput,
  ReleaseQuizResultInput,
  SaveQuizReviewInput,
} from './quiz-review.schemas.js';
import type { AttemptManualReview } from './quiz-attempt.types.js';

function objectId(value: string, label: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value))
    throw new AppError(404, 'RESOURCE_NOT_FOUND', `${label} was not found`);
  return new Types.ObjectId(value);
}

function assertTeacher(actor: AuthenticatedUser): void {
  if (actor.role !== 'TEACHER') throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
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

export class QuizReviewService {
  constructor(
    private readonly quizzes: QuizRepository,
    private readonly attempts: QuizAttemptRepository,
    private readonly grades: GradeRepository,
    private readonly scopes: AssessmentScopeReader,
    private readonly audits: PhaseFiveAuditWriter,
    private readonly reportingInvalidationWriter: ReportingInvalidationWriter,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async requireQuiz(actor: AuthenticatedUser, quizId: string) {
    assertTeacher(actor);
    const quiz = await this.quizzes.findById(objectId(quizId, 'Quiz'));
    if (!quiz) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Quiz was not found');
    await this.scopes.requireTeacherManage(actor.id, quiz.courseId.toString());
    return quiz;
  }

  private async requireAttempt(actor: AuthenticatedUser, attemptId: string) {
    assertTeacher(actor);
    const attempt = await this.attempts.findById(objectId(attemptId, 'Quiz Attempt'));
    if (!attempt) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Quiz Attempt was not found');
    await this.scopes.requireTeacherManage(actor.id, attempt.courseId.toString());
    return attempt;
  }

  private buildReviews(
    attempt: QuizAttemptRecord,
    answers: SaveQuizReviewInput['answers'],
    actor: AuthenticatedUser,
    reviewedAt: Date,
  ): AttemptManualReview[] {
    const shortQuestions = new Map(
      attempt.questionSnapshots
        .filter((question) => question.type === 'SHORT_ANSWER')
        .map((question) => [question.questionId.toString(), question]),
    );
    const unique = new Set<string>();
    return answers.map((answer) => {
      if (unique.has(answer.questionId))
        throw new AppError(422, 'VALIDATION_ERROR', 'Each review question may appear once');
      unique.add(answer.questionId);
      const question = shortQuestions.get(answer.questionId);
      if (!question)
        throw new AppError(
          422,
          'INVALID_REVIEW_ANSWER',
          'Only snapshotted short-answer questions can be reviewed',
        );
      if (answer.awardedPoints > question.points)
        throw new AppError(
          422,
          'INVALID_GRADE_SCORE',
          `Awarded points cannot exceed ${question.points}`,
        );
      return {
        questionId: question.questionId,
        awardedPoints: answer.awardedPoints,
        feedback: answer.feedback,
        reviewedBy: objectId(actor.id, 'Teacher'),
        reviewedAt,
      };
    });
  }

  private async syncHighestGrade(
    attempt: QuizAttemptRecord,
    actor: AuthenticatedUser,
    requestId: string,
    reason: string | null,
    session: ClientSession,
  ): Promise<GradeRecord> {
    const all = await this.attempts.listByStudentAndQuiz(
      attempt.quizId,
      attempt.studentId,
      1,
      20,
      session,
    );
    const candidates = all.items
      .filter((item) => item.status !== 'IN_PROGRESS' && item.status !== 'NEEDS_REVIEW')
      .sort(
        (left, right) =>
          right.totalScore - left.totalScore || right.attemptNumber - left.attemptNumber,
      );
    const selected = candidates[0] ?? attempt;
    const current = await this.grades.findByIdentity(
      attempt.studentId,
      'QUIZ',
      attempt.quizId,
      session,
    );
    const returned = selected.releasedAt !== null;
    let grade: GradeRecord;
    if (!current) {
      grade = await this.grades.create(
        {
          studentId: selected.studentId,
          classroomId: selected.classroomId,
          courseId: selected.courseId,
          activityType: 'QUIZ',
          activityId: selected.quizId,
          evidenceType: 'ATTEMPT',
          evidenceId: selected._id,
          evidenceRevision: selected.reviewRevision || selected.attemptRevision,
          score: selected.totalScore,
          maxScore: selected.maxScore,
          feedback: null,
          gradedBy: objectId(actor.id, 'Teacher'),
          gradedAt: selected.gradedAt ?? this.now(),
          status: returned ? 'RETURNED' : 'DRAFT',
          returnedBy: returned ? objectId(actor.id, 'Teacher') : null,
          returnedAt: selected.releasedAt,
        },
        session,
      );
    } else {
      const updated = await this.grades.updateCas(
        current._id,
        current.revision,
        {
          evidenceId: selected._id,
          evidenceRevision: selected.reviewRevision || selected.attemptRevision,
          score: selected.totalScore,
          maxScore: selected.maxScore,
          status: returned ? 'RETURNED' : 'DRAFT',
          gradedBy: objectId(actor.id, 'Teacher'),
          gradedAt: selected.gradedAt ?? this.now(),
          returnedBy: returned ? objectId(actor.id, 'Teacher') : null,
          returnedAt: selected.releasedAt,
        },
        session,
      );
      if (!updated)
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Grade was modified elsewhere');
      grade = updated;
    }
    await this.grades.appendRevision(
      {
        gradeId: grade._id,
        revision: grade.revision,
        oldScore: current?.score ?? null,
        newScore: grade.score,
        oldStatus: current?.status ?? null,
        newStatus: grade.status,
        evidenceId: grade.evidenceId,
        evidenceRevision: grade.evidenceRevision,
        feedback: grade.feedback,
        reason,
        actorId: objectId(actor.id, 'Teacher'),
        requestId,
      },
      session,
    );
    return grade;
  }

  private invalidateAttempt(
    attempt: QuizAttemptRecord,
    reasons: readonly ('ASSESSMENT_CHANGED' | 'GRADE_CHANGED')[],
    sourceChangedAt: Date,
    session: ClientSession,
  ) {
    return this.reportingInvalidationWriter.invalidateStudentCourse(
      {
        classroomId: attempt.classroomId,
        courseId: attempt.courseId,
        studentId: attempt.studentId,
        reasons,
        sourceChangedAt,
      },
      session,
    );
  }

  async listResults(actor: AuthenticatedUser, quizId: string, query: QuizResultListQueryInput) {
    const quiz = await this.requireQuiz(actor, quizId);
    const attempts = await this.attempts.listByQuiz(quiz._id);
    const studentIds = [...new Set(attempts.map((attempt) => attempt.studentId.toString()))].map(
      (id) => objectId(id, 'Student'),
    );
    const students = await UserModel.find({ _id: { $in: studentIds } })
      .select({ fullName: 1, email: 1, studentCode: 1 })
      .lean<
        Array<{
          _id: Types.ObjectId;
          fullName: string;
          email: string;
          studentCode?: string | null;
        }>
      >()
      .exec();
    const studentById = new Map(students.map((student) => [student._id.toString(), student]));
    const keyword = query.keyword?.toLocaleLowerCase('vi-VN');
    const rows = attempts
      .filter((attempt) => !query.status || attempt.status === query.status)
      .flatMap((attempt) => {
        const student = studentById.get(attempt.studentId.toString());
        if (!student) return [];
        if (
          keyword &&
          ![student.fullName, student.email, student.studentCode ?? ''].some((value) =>
            value.toLocaleLowerCase('vi-VN').includes(keyword),
          )
        )
          return [];
        return [
          {
            attemptId: attempt._id.toString(),
            attemptNumber: attempt.attemptNumber,
            status: attempt.status,
            score:
              attempt.status === 'IN_PROGRESS' || attempt.status === 'NEEDS_REVIEW'
                ? null
                : attempt.totalScore,
            maxScore: attempt.maxScore,
            submittedAt: attempt.submittedAt?.toISOString() ?? null,
            reviewRevision: attempt.reviewRevision,
            student: {
              id: student._id.toString(),
              fullName: student.fullName,
              email: student.email,
              studentCode: student.studentCode ?? null,
            },
          },
        ];
      });
    rows.sort((left, right) => {
      if (query.sort === 'score:desc')
        return (
          (right.score ?? -1) - (left.score ?? -1) || left.attemptId.localeCompare(right.attemptId)
        );
      if (query.sort === 'studentName:asc')
        return (
          left.student.fullName.localeCompare(right.student.fullName, 'vi') ||
          left.attemptId.localeCompare(right.attemptId)
        );
      return (
        (left.submittedAt ?? '').localeCompare(right.submittedAt ?? '') ||
        left.attemptId.localeCompare(right.attemptId)
      );
    });
    const start = (query.page - 1) * query.limit;
    return {
      data: { items: rows.slice(start, start + query.limit) },
      meta: paginationMeta(query.page, query.limit, rows.length),
      summary: {
        totalAttempts: attempts.length,
        needsReview: attempts.filter((attempt) => attempt.status === 'NEEDS_REVIEW').length,
        released: attempts.filter((attempt) => attempt.status === 'RESULT_RELEASED').length,
      },
    };
  }

  async getAttempt(actor: AuthenticatedUser, attemptId: string) {
    return toTeacherAttemptReviewDto(await this.requireAttempt(actor, attemptId));
  }

  async saveReview(
    actor: AuthenticatedUser,
    attemptId: string,
    input: SaveQuizReviewInput,
    requestId: string,
  ) {
    const current = await this.requireAttempt(actor, attemptId);
    if (current.status !== 'NEEDS_REVIEW')
      throw new AppError(409, 'ATTEMPT_STATE_CONFLICT', 'Attempt does not need manual review');
    const reviewedAt = this.now();
    const reviews = this.buildReviews(current, input.answers, actor, reviewedAt);
    const manualScore = reviews.reduce((sum, review) => sum + review.awardedPoints, 0);
    return withMongoTransaction(async (session) => {
      const updated = await this.attempts.saveReviewCas(
        current._id,
        input.expectedReviewRevision,
        reviews,
        manualScore,
        current.objectiveScore + manualScore,
        reviewedAt,
        session,
      );
      if (!updated)
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Quiz review was modified elsewhere');
      await this.audits.append(
        {
          actorId: objectId(actor.id, 'Teacher'),
          actorRole: actor.role,
          action: 'QUIZ_REVIEW_SAVED',
          resourceId: updated._id.toString(),
          requestId,
          newValue: {
            reviewRevision: updated.reviewRevision,
            manualScore: updated.manualScore,
            totalScore: updated.totalScore,
          },
          metadata: {
            classroomId: updated.classroomId.toString(),
            courseId: updated.courseId.toString(),
            quizId: updated.quizId.toString(),
            studentId: updated.studentId.toString(),
          },
        },
        session,
      );
      await this.invalidateAttempt(updated, ['ASSESSMENT_CHANGED'], reviewedAt, session);
      return toTeacherAttemptReviewDto(updated);
    });
  }

  async finalizeReview(
    actor: AuthenticatedUser,
    attemptId: string,
    input: FinalizeQuizReviewInput,
    requestId: string,
  ) {
    const current = await this.requireAttempt(actor, attemptId);
    if (current.status !== 'NEEDS_REVIEW')
      throw new AppError(409, 'ATTEMPT_STATE_CONFLICT', 'Attempt does not need manual review');
    const required = current.questionSnapshots.filter(
      (question) => question.type === 'SHORT_ANSWER',
    );
    const reviewed = new Set(current.manualReviews.map((review) => review.questionId.toString()));
    const firstMissing = required.find((question) => !reviewed.has(question.questionId.toString()));
    if (firstMissing)
      throw new AppError(
        409,
        'REVIEW_INCOMPLETE',
        `Manual review is missing question ${firstMissing.questionId.toString()}`,
      );
    const completedAt = this.now();
    const release = current.quizSnapshot.resultReleasePolicy !== 'TEACHER_RETURN';
    return withMongoTransaction(async (session) => {
      const updated = await this.attempts.finalizeReviewCas(
        current._id,
        input.expectedReviewRevision,
        {
          status: release ? 'RESULT_RELEASED' : 'GRADED',
          gradedAt: completedAt,
          releasedAt: release ? completedAt : null,
        },
        session,
      );
      if (!updated)
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Quiz review was modified elsewhere');
      await this.syncHighestGrade(updated, actor, requestId, input.reason, session);
      await this.audits.append(
        {
          actorId: objectId(actor.id, 'Teacher'),
          actorRole: actor.role,
          action: 'QUIZ_REVIEW_FINALIZED',
          resourceId: updated._id.toString(),
          requestId,
          reason: input.reason,
          newValue: {
            status: updated.status,
            reviewRevision: updated.reviewRevision,
            totalScore: updated.totalScore,
          },
          metadata: {
            classroomId: updated.classroomId.toString(),
            courseId: updated.courseId.toString(),
            quizId: updated.quizId.toString(),
            studentId: updated.studentId.toString(),
            resultReleased: updated.releasedAt !== null,
          },
        },
        session,
      );
      await this.invalidateAttempt(
        updated,
        ['ASSESSMENT_CHANGED', 'GRADE_CHANGED'],
        completedAt,
        session,
      );
      return toTeacherAttemptReviewDto(updated);
    });
  }

  async release(
    actor: AuthenticatedUser,
    attemptId: string,
    input: ReleaseQuizResultInput,
    requestId: string,
  ) {
    const current = await this.requireAttempt(actor, attemptId);
    if (current.status === 'RESULT_RELEASED') return toTeacherAttemptReviewDto(current);
    if (!['SUBMITTED', 'TIMED_OUT', 'GRADED'].includes(current.status))
      throw new AppError(409, 'ATTEMPT_STATE_CONFLICT', 'Attempt is not ready for release');
    const releasedAt = this.now();
    return withMongoTransaction(async (session) => {
      const updated = await this.attempts.releaseCas(
        current._id,
        input.expectedReviewRevision,
        releasedAt,
        session,
      );
      if (!updated)
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Quiz result was modified elsewhere');
      await this.syncHighestGrade(updated, actor, requestId, null, session);
      await this.audits.append(
        {
          actorId: objectId(actor.id, 'Teacher'),
          actorRole: actor.role,
          action: 'QUIZ_RESULT_RELEASED',
          resourceId: updated._id.toString(),
          requestId,
          newValue: {
            status: updated.status,
            reviewRevision: updated.reviewRevision,
            totalScore: updated.totalScore,
          },
          metadata: {
            classroomId: updated.classroomId.toString(),
            courseId: updated.courseId.toString(),
            quizId: updated.quizId.toString(),
            studentId: updated.studentId.toString(),
            resultReleased: true,
          },
        },
        session,
      );
      await this.invalidateAttempt(
        updated,
        ['ASSESSMENT_CHANGED', 'GRADE_CHANGED'],
        releasedAt,
        session,
      );
      return toTeacherAttemptReviewDto(updated);
    });
  }

  async regrade(
    actor: AuthenticatedUser,
    attemptId: string,
    input: RegradeQuizAttemptInput,
    requestId: string,
  ) {
    const current = await this.requireAttempt(actor, attemptId);
    if (!['GRADED', 'RESULT_RELEASED'].includes(current.status))
      throw new AppError(409, 'ATTEMPT_STATE_CONFLICT', 'Attempt is not ready for regrade');
    const reviewedAt = this.now();
    const reviews = this.buildReviews(current, input.answers, actor, reviewedAt);
    const requiredCount = current.questionSnapshots.filter(
      (question) => question.type === 'SHORT_ANSWER',
    ).length;
    if (reviews.length !== requiredCount)
      throw new AppError(409, 'REVIEW_INCOMPLETE', 'Every short-answer question must be reviewed');
    const manualScore = reviews.reduce((sum, review) => sum + review.awardedPoints, 0);
    return withMongoTransaction(async (session) => {
      const updated = await this.attempts.regradeCas(
        current._id,
        input.expectedReviewRevision,
        reviews,
        manualScore,
        current.objectiveScore + manualScore,
        reviewedAt,
        session,
      );
      if (!updated)
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Quiz result was modified elsewhere');
      await this.syncHighestGrade(updated, actor, requestId, input.reason, session);
      await this.audits.append(
        {
          actorId: objectId(actor.id, 'Teacher'),
          actorRole: actor.role,
          action: 'QUIZ_REGRADED',
          resourceId: updated._id.toString(),
          requestId,
          reason: input.reason,
          oldValue: {
            reviewRevision: current.reviewRevision,
            totalScore: current.totalScore,
          },
          newValue: {
            reviewRevision: updated.reviewRevision,
            totalScore: updated.totalScore,
          },
          metadata: {
            classroomId: updated.classroomId.toString(),
            courseId: updated.courseId.toString(),
            quizId: updated.quizId.toString(),
            studentId: updated.studentId.toString(),
          },
        },
        session,
      );
      await this.invalidateAttempt(
        updated,
        ['ASSESSMENT_CHANGED', 'GRADE_CHANGED'],
        reviewedAt,
        session,
      );
      return toTeacherAttemptReviewDto(updated);
    });
  }
}
