import { Types, type ClientSession } from 'mongoose';

import { LearningProgressModel, type LearningProgressRecord } from './learning-progress.model.js';
import type {
  CompleteLearningProgressInput,
  CompleteLessonProgressInput,
  NewLearningProgress,
  StartLearningProgressInput,
  StartLessonProgressInput,
} from './learning-progress.types.js';
import type {
  ActivityKey,
  LearningActivityType,
} from '../learning-content/learning-activity.reader.js';

const LEARNING_PROGRESS_PROJECTION = {
  studentId: 1,
  classroomId: 1,
  courseId: 1,
  activityType: 1,
  activityId: 1,
  status: 1,
  startedAt: 1,
  completedAt: 1,
  lastActiveAt: 1,
  schemaVersion: 1,
  createdAt: 1,
  updatedAt: 1,
} as const;

export type LearningProgressProjection = LearningProgressRecord;

function isDuplicateKey(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

function naturalKey(input: StartLearningProgressInput) {
  return {
    studentId: input.studentId,
    activityType: input.activityType,
    activityId: input.activityId,
  } as const;
}

export class LearningProgressRepository {
  async create(
    input: NewLearningProgress,
    session?: ClientSession,
  ): Promise<LearningProgressProjection> {
    const progress = await new LearningProgressModel(input).save({ session });
    return progress.toObject();
  }

  findByNaturalKey(
    studentId: Types.ObjectId,
    activityType: LearningActivityType,
    activityId: Types.ObjectId,
    session?: ClientSession,
  ) {
    return LearningProgressModel.findOne({ studentId, activityType, activityId })
      .select(LEARNING_PROGRESS_PROJECTION)
      .session(session ?? null)
      .lean<LearningProgressProjection>()
      .exec();
  }

  async start(
    input: StartLearningProgressInput,
    session?: ClientSession,
  ): Promise<{ progress: LearningProgressProjection; newlyStarted: boolean }> {
    let newlyStarted = false;
    try {
      const result = await LearningProgressModel.updateOne(
        naturalKey(input),
        {
          $setOnInsert: {
            ...input,
            status: 'IN_PROGRESS',
            completedAt: null,
          },
        },
        { upsert: true, runValidators: true, session },
      ).exec();
      newlyStarted = result.upsertedCount === 1;
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
    }

    const progress = await this.findByNaturalKey(
      input.studentId,
      input.activityType,
      input.activityId,
      session,
    );
    if (!progress) throw new Error('Learning progress upsert did not produce a record');
    return { progress, newlyStarted };
  }

  async complete(
    input: CompleteLearningProgressInput,
    session?: ClientSession,
  ): Promise<{ progress: LearningProgressProjection; newlyCompleted: boolean }> {
    try {
      await LearningProgressModel.updateOne(
        naturalKey(input),
        {
          $setOnInsert: {
            studentId: input.studentId,
            classroomId: input.classroomId,
            courseId: input.courseId,
            activityType: input.activityType,
            activityId: input.activityId,
            status: 'IN_PROGRESS',
            startedAt: input.startedAt,
            completedAt: null,
            lastActiveAt: input.startedAt,
          },
        },
        { upsert: true, runValidators: true, session },
      ).exec();
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
    }

    const completed = await LearningProgressModel.findOneAndUpdate(
      { ...naturalKey(input), status: { $ne: 'COMPLETED' } },
      {
        $set: {
          status: 'COMPLETED',
          completedAt: input.completedAt,
          lastActiveAt: input.completedAt,
        },
      },
      { returnDocument: 'after', runValidators: true, session },
    )
      .select(LEARNING_PROGRESS_PROJECTION)
      .lean<LearningProgressProjection>()
      .exec();
    if (completed) return { progress: completed, newlyCompleted: true };

    const progress = await this.findByNaturalKey(
      input.studentId,
      input.activityType,
      input.activityId,
      session,
    );
    if (!progress) throw new Error('Learning progress completion did not produce a record');
    return { progress, newlyCompleted: false };
  }

  startLesson(input: StartLessonProgressInput, session?: ClientSession) {
    return this.start(input, session);
  }

  completeLesson(input: CompleteLessonProgressInput, session?: ClientSession) {
    return this.complete(input, session);
  }

  async reverseCompletion(
    input: StartLearningProgressInput,
    session?: ClientSession,
  ): Promise<{ progress: LearningProgressProjection; changed: boolean }> {
    const changed = await LearningProgressModel.findOneAndUpdate(
      { ...naturalKey(input), status: 'COMPLETED' },
      { $set: { status: 'IN_PROGRESS', completedAt: null, lastActiveAt: input.lastActiveAt } },
      { returnDocument: 'after', runValidators: true, session },
    )
      .select(LEARNING_PROGRESS_PROJECTION)
      .lean<LearningProgressProjection>()
      .exec();
    if (changed) return { progress: changed, changed: true };

    const result = await this.start(input, session);
    return { progress: result.progress, changed: false };
  }

  listByStudentAndCourse(
    studentId: Types.ObjectId,
    courseId: Types.ObjectId,
    session?: ClientSession,
  ) {
    return LearningProgressModel.find({ studentId, courseId })
      .select(LEARNING_PROGRESS_PROJECTION)
      .sort({ activityId: 1 })
      .session(session ?? null)
      .lean<LearningProgressProjection[]>()
      .exec();
  }

  listByStudentAndActivityIds(
    studentId: Types.ObjectId,
    activityIds: readonly Types.ObjectId[],
    session?: ClientSession,
  ) {
    if (activityIds.length === 0) return Promise.resolve([] as LearningProgressProjection[]);
    return LearningProgressModel.find({
      studentId,
      activityType: 'LESSON',
      activityId: { $in: activityIds },
    })
      .select(LEARNING_PROGRESS_PROJECTION)
      .sort({ activityId: 1 })
      .session(session ?? null)
      .lean<LearningProgressProjection[]>()
      .exec();
  }

  listByStudentAndActivities(
    studentId: Types.ObjectId,
    activities: readonly ActivityKey[],
    session?: ClientSession,
  ) {
    if (activities.length === 0) return Promise.resolve([] as LearningProgressProjection[]);
    return LearningProgressModel.find({
      studentId,
      $or: activities.map((activity) => ({
        activityType: activity.activityType,
        activityId: new Types.ObjectId(activity.activityId),
      })),
    })
      .select(LEARNING_PROGRESS_PROJECTION)
      .sort({ activityType: 1, activityId: 1 })
      .session(session ?? null)
      .lean<LearningProgressProjection[]>()
      .exec();
  }

  listByCourseAndStudentIds(
    courseId: Types.ObjectId,
    studentIds: readonly Types.ObjectId[],
    session?: ClientSession,
  ) {
    if (studentIds.length === 0) return Promise.resolve([] as LearningProgressProjection[]);
    return LearningProgressModel.find({ courseId, studentId: { $in: studentIds } })
      .select(LEARNING_PROGRESS_PROJECTION)
      .sort({ studentId: 1, activityId: 1 })
      .session(session ?? null)
      .lean<LearningProgressProjection[]>()
      .exec();
  }

  countCompletedByActivityIds(activityIds: readonly Types.ObjectId[], session?: ClientSession) {
    return LearningProgressModel.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { activityType: 'LESSON', activityId: { $in: activityIds }, status: 'COMPLETED' } },
      { $group: { _id: '$activityId', count: { $sum: 1 } } },
    ])
      .session(session ?? null)
      .exec();
  }

  countCompletedByActivities(activities: readonly ActivityKey[], session?: ClientSession) {
    if (activities.length === 0) {
      return Promise.resolve(
        [] as Array<{
          _id: { activityType: LearningActivityType; activityId: Types.ObjectId };
          count: number;
        }>,
      );
    }
    return LearningProgressModel.aggregate<{
      _id: { activityType: LearningActivityType; activityId: Types.ObjectId };
      count: number;
    }>([
      {
        $match: {
          status: 'COMPLETED',
          $or: activities.map((activity) => ({
            activityType: activity.activityType,
            activityId: new Types.ObjectId(activity.activityId),
          })),
        },
      },
      {
        $group: {
          _id: { activityType: '$activityType', activityId: '$activityId' },
          count: { $sum: 1 },
        },
      },
    ])
      .session(session ?? null)
      .exec();
  }
}
