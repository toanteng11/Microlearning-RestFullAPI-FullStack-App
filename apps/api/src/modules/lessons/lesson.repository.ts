import type { ClientSession, Types } from 'mongoose';

import { LessonModel, type LessonRecord } from './lesson.model.js';
import type {
  LessonLifecyclePatch,
  LessonMetadataPatch,
  LessonOrderAssignment,
  NewLesson,
} from './lesson.types.js';

const LESSON_AUTHORING_PROJECTION = {
  courseId: 1,
  moduleId: 1,
  title: 1,
  content: 1,
  contentFormat: 1,
  estimatedMinutes: 1,
  isRequired: 1,
  status: 1,
  scheduledPublishAt: 1,
  publishedAt: 1,
  unpublishedAt: 1,
  archivedAt: 1,
  publishedRevision: 1,
  contentRevision: 1,
  completionDeadline: 1,
  deadlineRevision: 1,
  deadlineLastUpdatedAt: 1,
  deadlineLastUpdatedBy: 1,
  displayOrder: 1,
  flashcardRevision: 1,
  schemaVersion: 1,
  createdBy: 1,
  updatedBy: 1,
  createdAt: 1,
  updatedAt: 1,
} as const;

const LESSON_STUDENT_PROJECTION = {
  courseId: 1,
  moduleId: 1,
  title: 1,
  content: 1,
  contentFormat: 1,
  estimatedMinutes: 1,
  isRequired: 1,
  completionDeadline: 1,
  displayOrder: 1,
  publishedRevision: 1,
} as const;

export type LessonProjection = LessonRecord;

export class LessonRepository {
  async create(input: NewLesson, session?: ClientSession): Promise<LessonProjection> {
    const lesson = await new LessonModel(input).save({ session });
    return lesson.toObject();
  }

  findAuthoringById(lessonId: Types.ObjectId, session?: ClientSession) {
    return LessonModel.findById(lessonId)
      .select(LESSON_AUTHORING_PROJECTION)
      .session(session ?? null)
      .lean<LessonProjection>()
      .exec();
  }

  findStudentVisibilityCandidate(lessonId: Types.ObjectId, session?: ClientSession) {
    return LessonModel.findOne({ _id: lessonId, status: { $in: ['PUBLISHED', 'SCHEDULED'] } })
      .select(LESSON_STUDENT_PROJECTION)
      .session(session ?? null)
      .lean()
      .exec();
  }

  listByCourse(
    courseId: Types.ObjectId,
    session?: ClientSession,
    options: { includeArchived?: boolean } = {},
  ) {
    return LessonModel.find({
      courseId,
      ...(options.includeArchived ? {} : { status: { $ne: 'ARCHIVED' } }),
    })
      .select(LESSON_AUTHORING_PROJECTION)
      .sort({ moduleId: 1, displayOrder: 1, _id: 1 })
      .session(session ?? null)
      .lean<LessonProjection[]>()
      .exec();
  }

  listByCourseIds(courseIds: readonly Types.ObjectId[], session?: ClientSession) {
    if (courseIds.length === 0) return Promise.resolve([] as LessonProjection[]);
    return LessonModel.find({ courseId: { $in: courseIds }, status: { $ne: 'ARCHIVED' } })
      .select(LESSON_AUTHORING_PROJECTION)
      .sort({ courseId: 1, moduleId: 1, displayOrder: 1, _id: 1 })
      .session(session ?? null)
      .lean<LessonProjection[]>()
      .exec();
  }

  async nextDisplayOrder(
    courseId: Types.ObjectId,
    moduleId: Types.ObjectId | null,
    session?: ClientSession,
  ): Promise<number> {
    const [last] = await LessonModel.find({
      courseId,
      moduleId,
      status: { $ne: 'ARCHIVED' },
    })
      .select({ displayOrder: 1 })
      .sort({ displayOrder: -1, _id: -1 })
      .limit(1)
      .session(session ?? null)
      .lean<Array<Pick<LessonRecord, 'displayOrder'>>>()
      .exec();
    return (last?.displayOrder ?? -1) + 1;
  }

  updateMetadataCas(
    input: {
      lessonId: Types.ObjectId;
      expectedUpdatedAt: Date;
      updatedBy: Types.ObjectId;
      patch: LessonMetadataPatch;
    },
    session?: ClientSession,
  ) {
    return LessonModel.findOneAndUpdate(
      {
        _id: input.lessonId,
        status: { $in: ['DRAFT', 'UNPUBLISHED'] },
        updatedAt: input.expectedUpdatedAt,
      },
      { $set: { ...input.patch, updatedBy: input.updatedBy }, $inc: { contentRevision: 1 } },
      { returnDocument: 'after', runValidators: true, session },
    )
      .select(LESSON_AUTHORING_PROJECTION)
      .lean<LessonProjection>()
      .exec();
  }

  changeStatusCas(
    input: {
      lessonId: Types.ObjectId;
      expectedUpdatedAt: Date;
      updatedBy: Types.ObjectId;
      patch: LessonLifecyclePatch;
    },
    session: ClientSession,
  ) {
    return LessonModel.findOneAndUpdate(
      { _id: input.lessonId, status: { $ne: 'ARCHIVED' }, updatedAt: input.expectedUpdatedAt },
      { $set: { ...input.patch, updatedBy: input.updatedBy } },
      { returnDocument: 'after', runValidators: true, session },
    )
      .select(LESSON_AUTHORING_PROJECTION)
      .lean<LessonProjection>()
      .exec();
  }

  archiveCas(
    input: {
      lessonId: Types.ObjectId;
      expectedUpdatedAt: Date;
      actorId: Types.ObjectId;
      archivedAt: Date;
    },
    session: ClientSession,
  ) {
    return LessonModel.findOneAndUpdate(
      { _id: input.lessonId, status: { $ne: 'ARCHIVED' }, updatedAt: input.expectedUpdatedAt },
      {
        $set: {
          status: 'ARCHIVED',
          archivedAt: input.archivedAt,
          scheduledPublishAt: null,
          updatedBy: input.actorId,
        },
      },
      { returnDocument: 'after', runValidators: true, session },
    )
      .select(LESSON_AUTHORING_PROJECTION)
      .lean<LessonProjection>()
      .exec();
  }

  changeDeadlineCas(
    input: {
      lessonId: Types.ObjectId;
      expectedDeadlineRevision: number;
      completionDeadline: Date | null;
      actorId: Types.ObjectId;
      changedAt: Date;
    },
    session: ClientSession,
  ) {
    return LessonModel.findOneAndUpdate(
      {
        _id: input.lessonId,
        status: { $ne: 'ARCHIVED' },
        deadlineRevision: input.expectedDeadlineRevision,
      },
      {
        $set: {
          completionDeadline: input.completionDeadline,
          deadlineLastUpdatedAt: input.changedAt,
          deadlineLastUpdatedBy: input.actorId,
          updatedBy: input.actorId,
        },
        $inc: { deadlineRevision: 1 },
      },
      { returnDocument: 'after', runValidators: true, session },
    )
      .select(LESSON_AUTHORING_PROJECTION)
      .lean<LessonProjection>()
      .exec();
  }

  incrementFlashcardRevisionCas(
    lessonId: Types.ObjectId,
    expectedRevision: number,
    actorId: Types.ObjectId,
    session: ClientSession,
  ) {
    return LessonModel.findOneAndUpdate(
      { _id: lessonId, status: { $ne: 'ARCHIVED' }, flashcardRevision: expectedRevision },
      { $inc: { flashcardRevision: 1 }, $set: { updatedBy: actorId } },
      { returnDocument: 'after', runValidators: true, session },
    )
      .select(LESSON_AUTHORING_PROJECTION)
      .lean<LessonProjection>()
      .exec();
  }

  async reorder(
    courseId: Types.ObjectId,
    assignments: readonly LessonOrderAssignment[],
    actorId: Types.ObjectId,
    session: ClientSession,
  ): Promise<void> {
    if (assignments.length === 0) return;
    const result = await LessonModel.bulkWrite(
      assignments.map((assignment) => ({
        updateOne: {
          filter: { _id: assignment.lessonId, courseId, status: { $ne: 'ARCHIVED' } },
          update: {
            $set: {
              moduleId: assignment.moduleId,
              displayOrder: assignment.displayOrder,
              updatedBy: actorId,
            },
          },
        },
      })),
      { session, ordered: true },
    );
    if (result.matchedCount !== assignments.length) {
      throw new Error('Lesson reorder set changed during transaction');
    }
  }

  listCoursePublishCandidates(courseId: Types.ObjectId, asOf: Date, session?: ClientSession) {
    return LessonModel.find({
      courseId,
      isRequired: true,
      status: { $in: ['PUBLISHED', 'SCHEDULED'] },
      completionDeadline: { $gt: asOf },
    })
      .select({ _id: 1, moduleId: 1, status: 1, scheduledPublishAt: 1, completionDeadline: 1 })
      .session(session ?? null)
      .lean<
        Array<
          Pick<
            LessonRecord,
            '_id' | 'moduleId' | 'status' | 'scheduledPublishAt' | 'completionDeadline'
          >
        >
      >()
      .exec();
  }

  countNonArchivedByModule(moduleId: Types.ObjectId, session?: ClientSession): Promise<number> {
    return LessonModel.countDocuments({ moduleId, status: { $ne: 'ARCHIVED' } })
      .session(session ?? null)
      .exec();
  }

  countNonArchivedByCourse(courseId: Types.ObjectId, session?: ClientSession): Promise<number> {
    return LessonModel.countDocuments({ courseId, status: { $ne: 'ARCHIVED' } })
      .session(session ?? null)
      .exec();
  }
}
