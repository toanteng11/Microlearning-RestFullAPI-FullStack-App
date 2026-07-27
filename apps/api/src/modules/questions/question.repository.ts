import type { ClientSession, Types } from 'mongoose';

import { QuestionModel, type QuestionRecord } from './question.model.js';
import type {
  NewQuestion,
  QuestionAggregate,
  QuestionMedia,
  QuestionOrderAssignment,
  QuestionPatch,
} from './question.types.js';

const QUESTION_TEACHER_PROJECTION = {
  quizId: 1,
  courseId: 1,
  type: 1,
  prompt: 1,
  points: 1,
  isRequired: 1,
  options: 1,
  correctOptionIds: 1,
  correctBoolean: 1,
  rubric: 1,
  explanation: 1,
  media: 1,
  displayOrder: 1,
  version: 1,
  status: 1,
  archivedAt: 1,
  createdBy: 1,
  updatedBy: 1,
  createdAt: 1,
  updatedAt: 1,
} as const;

export type QuestionProjection = QuestionRecord;

export class QuestionRepository {
  async create(input: NewQuestion, session?: ClientSession): Promise<QuestionProjection> {
    const question = await new QuestionModel(input).save({ session });
    return question.toObject();
  }

  findById(questionId: Types.ObjectId, session?: ClientSession) {
    return QuestionModel.findById(questionId)
      .select(QUESTION_TEACHER_PROJECTION)
      .session(session ?? null)
      .lean<QuestionProjection>()
      .exec();
  }

  listActiveByQuiz(quizId: Types.ObjectId, session?: ClientSession) {
    return QuestionModel.find({ quizId, status: 'ACTIVE' })
      .select(QUESTION_TEACHER_PROJECTION)
      .sort({ displayOrder: 1, _id: 1 })
      .session(session ?? null)
      .lean<QuestionProjection[]>()
      .exec();
  }

  async nextDisplayOrder(quizId: Types.ObjectId, session?: ClientSession) {
    const last = await QuestionModel.findOne({ quizId, status: 'ACTIVE' })
      .select({ displayOrder: 1 })
      .sort({ displayOrder: -1, _id: -1 })
      .session(session ?? null)
      .lean<Pick<QuestionRecord, 'displayOrder'>>()
      .exec();
    return (last?.displayOrder ?? -1) + 1;
  }

  async aggregateActive(
    quizId: Types.ObjectId,
    session?: ClientSession,
  ): Promise<QuestionAggregate> {
    const [aggregate] = await QuestionModel.aggregate<{
      _id: null;
      activeCount: number;
      maxScore: number;
      hasShortAnswer: boolean;
    }>([
      { $match: { quizId, status: 'ACTIVE' } },
      {
        $group: {
          _id: null,
          activeCount: { $sum: 1 },
          maxScore: { $sum: '$points' },
          hasShortAnswer: { $max: { $eq: ['$type', 'SHORT_ANSWER'] } },
        },
      },
    ])
      .session(session ?? null)
      .exec();
    return aggregate ?? { activeCount: 0, maxScore: 0, hasShortAnswer: false };
  }

  updateCas(
    input: {
      questionId: Types.ObjectId;
      expectedVersion: number;
      actorId: Types.ObjectId;
      patch: QuestionPatch;
    },
    session?: ClientSession,
  ) {
    return QuestionModel.findOneAndUpdate(
      { _id: input.questionId, version: input.expectedVersion, status: 'ACTIVE' },
      { $set: { ...input.patch, updatedBy: input.actorId }, $inc: { version: 1 } },
      { returnDocument: 'after', runValidators: true, session },
    )
      .select(QUESTION_TEACHER_PROJECTION)
      .lean<QuestionProjection>()
      .exec();
  }

  archiveCas(
    questionId: Types.ObjectId,
    expectedVersion: number,
    actorId: Types.ObjectId,
    archivedAt: Date,
    session?: ClientSession,
  ) {
    return QuestionModel.findOneAndUpdate(
      { _id: questionId, version: expectedVersion, status: 'ACTIVE' },
      { $set: { status: 'ARCHIVED', archivedAt, updatedBy: actorId }, $inc: { version: 1 } },
      { returnDocument: 'after', runValidators: true, session },
    )
      .select(QUESTION_TEACHER_PROJECTION)
      .lean<QuestionProjection>()
      .exec();
  }

  setMediaCas(
    questionId: Types.ObjectId,
    expectedVersion: number,
    actorId: Types.ObjectId,
    media: QuestionMedia | null,
    session?: ClientSession,
  ) {
    return this.updateCas({ questionId, expectedVersion, actorId, patch: { media } }, session);
  }

  async reorder(
    quizId: Types.ObjectId,
    assignments: readonly QuestionOrderAssignment[],
    actorId: Types.ObjectId,
    session?: ClientSession,
  ) {
    if (assignments.length === 0) return;
    const result = await QuestionModel.bulkWrite(
      assignments.map((assignment) => ({
        updateOne: {
          filter: { _id: assignment.questionId, quizId, status: 'ACTIVE' },
          update: { $set: { displayOrder: assignment.displayOrder, updatedBy: actorId } },
        },
      })),
      { ordered: true, session },
    );
    if (result.matchedCount !== assignments.length) {
      throw new Error('Question reorder set changed during transaction');
    }
  }
}
