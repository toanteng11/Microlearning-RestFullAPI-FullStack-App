import type { ClientSession, Types } from 'mongoose';

import { QuizModel, type QuizRecord } from './quiz.model.js';
import type {
  NewQuiz,
  QuizLifecyclePatch,
  QuizListOptions,
  QuizMetadataPatch,
} from './quiz.types.js';

const QUIZ_AUTHORING_PROJECTION = {
  classroomId: 1,
  courseId: 1,
  moduleId: 1,
  title: 1,
  instruction: 1,
  isRequired: 1,
  status: 1,
  availableFrom: 1,
  dueDate: 1,
  attemptLimit: 1,
  timeLimitMinutes: 1,
  resultReleasePolicy: 1,
  scorePolicy: 1,
  displayOrder: 1,
  contentRevision: 1,
  questionRevision: 1,
  publishedRevision: 1,
  maxScore: 1,
  scheduledPublishAt: 1,
  publishedAt: 1,
  unpublishedAt: 1,
  archivedAt: 1,
  createdBy: 1,
  updatedBy: 1,
  schemaVersion: 1,
  createdAt: 1,
  updatedAt: 1,
} as const;

export type QuizProjection = QuizRecord;

export class QuizRepository {
  async create(input: NewQuiz, session?: ClientSession): Promise<QuizProjection> {
    const quiz = await new QuizModel(input).save({ session });
    return quiz.toObject();
  }

  findById(quizId: Types.ObjectId, session?: ClientSession) {
    return QuizModel.findById(quizId)
      .select(QUIZ_AUTHORING_PROJECTION)
      .session(session ?? null)
      .lean<QuizProjection>()
      .exec();
  }

  async listByCourse(courseId: Types.ObjectId, options: QuizListOptions, session?: ClientSession) {
    const statusFilter = options.status ?? ({ $ne: 'ARCHIVED' } as const);
    const filter = {
      courseId,
      status: statusFilter,
      ...(options.search
        ? {
            title: {
              $regex: options.search.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'),
              $options: 'i',
            },
          }
        : {}),
    };
    const skip = (options.page - 1) * options.limit;
    const [items, totalItems] = await Promise.all([
      QuizModel.find(filter)
        .select(QUIZ_AUTHORING_PROJECTION)
        .sort({ moduleId: 1, displayOrder: 1, _id: 1 })
        .skip(skip)
        .limit(options.limit)
        .session(session ?? null)
        .lean<QuizProjection[]>()
        .exec(),
      QuizModel.countDocuments(filter)
        .session(session ?? null)
        .exec(),
    ]);
    return { items, totalItems, page: options.page, limit: options.limit };
  }

  listByCourseIds(courseIds: readonly Types.ObjectId[], session?: ClientSession) {
    if (courseIds.length === 0) return Promise.resolve([] as QuizRecord[]);
    return QuizModel.find({ courseId: { $in: courseIds }, status: { $ne: 'ARCHIVED' } })
      .sort({ courseId: 1, moduleId: 1, displayOrder: 1, _id: 1 })
      .session(session ?? null)
      .lean<QuizRecord[]>()
      .exec();
  }

  async nextDisplayOrder(
    courseId: Types.ObjectId,
    moduleId: Types.ObjectId | null,
    session?: ClientSession,
  ) {
    const last = await QuizModel.findOne({ courseId, moduleId, status: { $ne: 'ARCHIVED' } })
      .select({ displayOrder: 1 })
      .sort({ displayOrder: -1, _id: -1 })
      .session(session ?? null)
      .lean<Pick<QuizRecord, 'displayOrder'>>()
      .exec();
    return (last?.displayOrder ?? -1) + 1;
  }

  updateMetadataCas(
    input: {
      quizId: Types.ObjectId;
      expectedContentRevision: number;
      actorId: Types.ObjectId;
      patch: QuizMetadataPatch;
    },
    session?: ClientSession,
  ) {
    return QuizModel.findOneAndUpdate(
      {
        _id: input.quizId,
        contentRevision: input.expectedContentRevision,
        status: { $in: ['DRAFT', 'UNPUBLISHED'] },
      },
      { $set: { ...input.patch, updatedBy: input.actorId }, $inc: { contentRevision: 1 } },
      { returnDocument: 'after', runValidators: true, session },
    )
      .select(QUIZ_AUTHORING_PROJECTION)
      .lean<QuizProjection>()
      .exec();
  }

  changeStatusCas(
    input: {
      quizId: Types.ObjectId;
      expectedContentRevision: number;
      expectedQuestionRevision: number;
      actorId: Types.ObjectId;
      patch: QuizLifecyclePatch;
    },
    session?: ClientSession,
  ) {
    return QuizModel.findOneAndUpdate(
      {
        _id: input.quizId,
        contentRevision: input.expectedContentRevision,
        questionRevision: input.expectedQuestionRevision,
        status: { $ne: 'ARCHIVED' },
      },
      { $set: { ...input.patch, updatedBy: input.actorId }, $inc: { contentRevision: 1 } },
      { returnDocument: 'after', runValidators: true, session },
    )
      .select(QUIZ_AUTHORING_PROJECTION)
      .lean<QuizProjection>()
      .exec();
  }

  incrementQuestionRevisionCas(
    quizId: Types.ObjectId,
    expectedQuestionRevision: number,
    maxScore: number,
    actorId: Types.ObjectId,
    session?: ClientSession,
  ) {
    return QuizModel.findOneAndUpdate(
      {
        _id: quizId,
        questionRevision: expectedQuestionRevision,
        status: { $in: ['DRAFT', 'UNPUBLISHED'] },
      },
      { $set: { maxScore, updatedBy: actorId }, $inc: { questionRevision: 1 } },
      { returnDocument: 'after', runValidators: true, session },
    )
      .select(QUIZ_AUTHORING_PROJECTION)
      .lean<QuizProjection>()
      .exec();
  }

  countNonArchivedByCourse(courseId: Types.ObjectId, session?: ClientSession) {
    return QuizModel.countDocuments({ courseId, status: { $ne: 'ARCHIVED' } })
      .session(session ?? null)
      .exec();
  }
}
