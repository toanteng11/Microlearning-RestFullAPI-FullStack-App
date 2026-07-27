import { Types, type ClientSession } from 'mongoose';

import {
  DeadlineExceptionModel,
  type DeadlineExceptionRecord,
} from './deadline-exception.model.js';
import { DeadlineExceptionHistoryModel } from './deadline-exception-history.model.js';
import type {
  NewDeadlineException,
  NewDeadlineExceptionHistory,
} from './deadline-exception.types.js';
import type { ActivityKey } from '../learning-content/learning-activity.reader.js';

export class DeadlineExceptionRepository {
  async create(
    input: NewDeadlineException,
    session?: ClientSession,
  ): Promise<DeadlineExceptionRecord> {
    const record = await new DeadlineExceptionModel(input).save({ session });
    return record.toObject();
  }

  findCurrent(
    studentId: Types.ObjectId,
    activityType: 'LESSON' | 'QUIZ' | 'ASSIGNMENT',
    activityId: Types.ObjectId,
    session?: ClientSession,
  ) {
    return DeadlineExceptionModel.findOne({ studentId, activityType, activityId })
      .session(session ?? null)
      .lean<DeadlineExceptionRecord>()
      .exec();
  }

  async listByActivity(
    activityType: 'LESSON' | 'QUIZ' | 'ASSIGNMENT',
    activityId: Types.ObjectId,
    page: number,
    limit: number,
    session?: ClientSession,
  ) {
    const filter = { activityType, activityId };
    const [items, totalItems] = await Promise.all([
      DeadlineExceptionModel.find(filter)
        .sort({ studentId: 1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .session(session ?? null)
        .lean<DeadlineExceptionRecord[]>()
        .exec(),
      DeadlineExceptionModel.countDocuments(filter)
        .session(session ?? null)
        .exec(),
    ]);
    return { items, totalItems, page, limit };
  }

  listActiveByStudentAndActivities(
    studentId: Types.ObjectId,
    activities: readonly ActivityKey[],
    session?: ClientSession,
  ) {
    if (activities.length === 0) return Promise.resolve([] as DeadlineExceptionRecord[]);
    return DeadlineExceptionModel.find({
      studentId,
      active: true,
      $or: activities.map((activity) => ({
        activityType: activity.activityType,
        activityId: new Types.ObjectId(activity.activityId),
      })),
    })
      .session(session ?? null)
      .lean<DeadlineExceptionRecord[]>()
      .exec();
  }

  listActiveByCourse(courseId: Types.ObjectId, session?: ClientSession) {
    return DeadlineExceptionModel.find({ courseId, active: true })
      .session(session ?? null)
      .lean<DeadlineExceptionRecord[]>()
      .exec();
  }

  updateCas(
    exceptionId: Types.ObjectId,
    expectedRevision: number,
    patch: Pick<
      DeadlineExceptionRecord,
      'deadline' | 'active' | 'reason' | 'changedBy' | 'changedAt'
    >,
    session?: ClientSession,
  ) {
    return DeadlineExceptionModel.findOneAndUpdate(
      { _id: exceptionId, revision: expectedRevision },
      { $set: patch, $inc: { revision: 1 } },
      { returnDocument: 'after', runValidators: true, session },
    )
      .lean<DeadlineExceptionRecord>()
      .exec();
  }

  async appendHistory(input: NewDeadlineExceptionHistory, session?: ClientSession) {
    const history = await new DeadlineExceptionHistoryModel(input).save({ session });
    return history.toObject();
  }

  async listHistory(
    studentId: Types.ObjectId,
    activityType: 'LESSON' | 'QUIZ' | 'ASSIGNMENT',
    activityId: Types.ObjectId,
    page: number,
    limit: number,
    session?: ClientSession,
  ) {
    const filter = { studentId, activityType, activityId };
    const [items, totalItems] = await Promise.all([
      DeadlineExceptionHistoryModel.find(filter)
        .sort({ toRevision: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .session(session ?? null)
        .lean()
        .exec(),
      DeadlineExceptionHistoryModel.countDocuments(filter)
        .session(session ?? null)
        .exec(),
    ]);
    return { items, totalItems, page, limit };
  }
}
