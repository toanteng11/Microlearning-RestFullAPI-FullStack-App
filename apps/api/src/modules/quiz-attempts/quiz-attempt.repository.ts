import type { ClientSession, Types } from 'mongoose';

import { QuizAttemptModel, type QuizAttemptRecord } from './quiz-attempt.model.js';
import type {
  AttemptAnswer,
  AttemptManualReview,
  AttemptTerminalPatch,
  NewQuizAttempt,
} from './quiz-attempt.types.js';

export class QuizAttemptRepository {
  async create(input: NewQuizAttempt, session?: ClientSession): Promise<QuizAttemptRecord> {
    const attempt = await new QuizAttemptModel({
      ...input,
      maxScore: input.quizSnapshot.maxScore,
      status: 'IN_PROGRESS',
    }).save({ session });
    return attempt.toObject();
  }

  findById(attemptId: Types.ObjectId, session?: ClientSession) {
    return QuizAttemptModel.findById(attemptId)
      .session(session ?? null)
      .lean<QuizAttemptRecord>()
      .exec();
  }

  findActive(quizId: Types.ObjectId, studentId: Types.ObjectId, session?: ClientSession) {
    return QuizAttemptModel.findOne({ quizId, studentId, status: 'IN_PROGRESS' })
      .session(session ?? null)
      .lean<QuizAttemptRecord>()
      .exec();
  }

  countByStudentAndQuiz(
    quizId: Types.ObjectId,
    studentId: Types.ObjectId,
    session?: ClientSession,
  ) {
    return QuizAttemptModel.countDocuments({ quizId, studentId })
      .session(session ?? null)
      .exec();
  }

  async listByStudentAndQuiz(
    quizId: Types.ObjectId,
    studentId: Types.ObjectId,
    page: number,
    limit: number,
    session?: ClientSession,
  ) {
    const filter = { quizId, studentId };
    const [items, totalItems] = await Promise.all([
      QuizAttemptModel.find(filter)
        .sort({ attemptNumber: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .session(session ?? null)
        .lean<QuizAttemptRecord[]>()
        .exec(),
      QuizAttemptModel.countDocuments(filter)
        .session(session ?? null)
        .exec(),
    ]);
    return { items, totalItems, page, limit };
  }

  async listByQuiz(quizId: Types.ObjectId, session?: ClientSession) {
    return QuizAttemptModel.find({ quizId })
      .sort({ submittedAt: 1, _id: 1 })
      .session(session ?? null)
      .lean<QuizAttemptRecord[]>()
      .exec();
  }

  async nextAttemptNumber(
    quizId: Types.ObjectId,
    studentId: Types.ObjectId,
    session?: ClientSession,
  ) {
    const latest = await QuizAttemptModel.findOne({ quizId, studentId })
      .select({ attemptNumber: 1 })
      .sort({ attemptNumber: -1 })
      .session(session ?? null)
      .lean<Pick<QuizAttemptRecord, 'attemptNumber'>>()
      .exec();
    return (latest?.attemptNumber ?? 0) + 1;
  }

  saveAnswersCas(
    attemptId: Types.ObjectId,
    expectedRevision: number,
    answers: readonly AttemptAnswer[],
    savedAt: Date,
    session?: ClientSession,
  ) {
    return QuizAttemptModel.findOneAndUpdate(
      {
        _id: attemptId,
        status: 'IN_PROGRESS',
        attemptRevision: expectedRevision,
        expiresAt: { $gt: savedAt },
      },
      { $set: { answers, lastSavedAt: savedAt }, $inc: { attemptRevision: 1 } },
      { returnDocument: 'after', runValidators: true, session },
    )
      .lean<QuizAttemptRecord>()
      .exec();
  }

  finalizeCas(
    attemptId: Types.ObjectId,
    expectedRevision: number,
    patch: AttemptTerminalPatch,
    session?: ClientSession,
  ) {
    return QuizAttemptModel.findOneAndUpdate(
      { _id: attemptId, status: 'IN_PROGRESS', attemptRevision: expectedRevision },
      { $set: patch, $inc: { attemptRevision: 1 } },
      { returnDocument: 'after', runValidators: true, session },
    )
      .lean<QuizAttemptRecord>()
      .exec();
  }

  saveReviewCas(
    attemptId: Types.ObjectId,
    expectedReviewRevision: number,
    reviews: readonly AttemptManualReview[],
    manualScore: number,
    totalScore: number,
    reviewedAt: Date,
    session?: ClientSession,
  ) {
    return QuizAttemptModel.findOneAndUpdate(
      {
        _id: attemptId,
        status: 'NEEDS_REVIEW',
        reviewRevision: expectedReviewRevision,
      },
      {
        $set: {
          manualReviews: reviews,
          manualScore,
          totalScore,
          gradedAt: reviewedAt,
        },
        $inc: { reviewRevision: 1 },
      },
      { returnDocument: 'after', runValidators: true, session },
    )
      .lean<QuizAttemptRecord>()
      .exec();
  }

  finalizeReviewCas(
    attemptId: Types.ObjectId,
    expectedReviewRevision: number,
    patch: Pick<QuizAttemptRecord, 'status' | 'gradedAt' | 'releasedAt'>,
    session?: ClientSession,
  ) {
    return QuizAttemptModel.findOneAndUpdate(
      {
        _id: attemptId,
        status: 'NEEDS_REVIEW',
        reviewRevision: expectedReviewRevision,
      },
      { $set: patch, $inc: { reviewRevision: 1 } },
      { returnDocument: 'after', runValidators: true, session },
    )
      .lean<QuizAttemptRecord>()
      .exec();
  }

  releaseCas(
    attemptId: Types.ObjectId,
    expectedReviewRevision: number,
    releasedAt: Date,
    session?: ClientSession,
  ) {
    return QuizAttemptModel.findOneAndUpdate(
      {
        _id: attemptId,
        status: { $in: ['SUBMITTED', 'TIMED_OUT', 'GRADED'] },
        reviewRevision: expectedReviewRevision,
      },
      {
        $set: { status: 'RESULT_RELEASED', releasedAt },
        $inc: { reviewRevision: 1 },
      },
      { returnDocument: 'after', runValidators: true, session },
    )
      .lean<QuizAttemptRecord>()
      .exec();
  }

  regradeCas(
    attemptId: Types.ObjectId,
    expectedReviewRevision: number,
    reviews: readonly AttemptManualReview[],
    manualScore: number,
    totalScore: number,
    reviewedAt: Date,
    session?: ClientSession,
  ) {
    return QuizAttemptModel.findOneAndUpdate(
      {
        _id: attemptId,
        status: { $in: ['GRADED', 'RESULT_RELEASED'] },
        reviewRevision: expectedReviewRevision,
      },
      {
        $set: {
          manualReviews: reviews,
          manualScore,
          totalScore,
          gradedAt: reviewedAt,
        },
        $inc: { reviewRevision: 1 },
      },
      { returnDocument: 'after', runValidators: true, session },
    )
      .lean<QuizAttemptRecord>()
      .exec();
  }
}
