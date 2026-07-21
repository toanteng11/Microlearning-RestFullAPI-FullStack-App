import type { ClientSession, Types } from 'mongoose';

import {
  LessonDeadlineChangeModel,
  type LessonDeadlineChangeRecord,
} from './lesson-deadline-change.model.js';
import type { NewLessonDeadlineChange } from './lesson-deadline.types.js';

export class LessonDeadlineRepository {
  async append(
    input: NewLessonDeadlineChange,
    session?: ClientSession,
  ): Promise<LessonDeadlineChangeRecord> {
    const change = await new LessonDeadlineChangeModel(input).save({ session });
    return change.toObject();
  }

  listByLesson(
    lessonId: Types.ObjectId,
    query: { page: number; limit: number },
    session?: ClientSession,
  ) {
    return LessonDeadlineChangeModel.find({ lessonId })
      .sort({ changedAt: -1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .session(session ?? null)
      .lean<LessonDeadlineChangeRecord[]>()
      .exec();
  }

  countByLesson(lessonId: Types.ObjectId, session?: ClientSession): Promise<number> {
    return LessonDeadlineChangeModel.countDocuments({ lessonId })
      .session(session ?? null)
      .exec();
  }
}
