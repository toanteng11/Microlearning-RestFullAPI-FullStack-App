import { Types } from 'mongoose';

import { AnnouncementModel } from '../announcements/announcement.model.js';
import { CourseModel } from '../courses/course.model.js';
import type {
  ClassroomContentReader,
  ContentGovernanceSummary,
} from '../learning-content/classroom-content.reader.js';
import { LessonModel } from '../lessons/lesson.model.js';

function objectIds(ids: readonly string[]): Types.ObjectId[] {
  return [...new Set(ids)]
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));
}

function latestIso(values: Array<Date | null | undefined>): string | null {
  const latest = values.reduce<Date | null>(
    (current, value) => (value && (!current || value > current) ? value : current),
    null,
  );
  return latest?.toISOString() ?? null;
}

export class ClassroomContentRepositoryReader implements ClassroomContentReader {
  async countByClassroomIds(ids: readonly string[]): Promise<ReadonlyMap<string, number>> {
    const classroomIds = objectIds(ids);
    if (classroomIds.length === 0) return new Map();
    const counts = await CourseModel.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { classroomId: { $in: classroomIds }, status: { $ne: 'ARCHIVED' } } },
      { $group: { _id: '$classroomId', count: { $sum: 1 } } },
    ]).exec();
    return new Map(counts.map((item) => [item._id.toString(), item.count]));
  }

  async getGovernanceSummary(classroomId: string): Promise<ContentGovernanceSummary> {
    const id = Types.ObjectId.isValid(classroomId)
      ? new Types.ObjectId(classroomId)
      : new Types.ObjectId();
    const [courses, announcements] = await Promise.all([
      CourseModel.find({ classroomId: id, status: { $ne: 'ARCHIVED' } })
        .select({ _id: 1, updatedAt: 1 })
        .lean<Array<{ _id: Types.ObjectId; updatedAt: Date }>>()
        .exec(),
      AnnouncementModel.find({ classroomId: id, status: { $ne: 'ARCHIVED' } })
        .select({ updatedAt: 1 })
        .lean<Array<{ updatedAt: Date }>>()
        .exec(),
    ]);
    const lessons =
      courses.length === 0
        ? []
        : await LessonModel.find({
            courseId: { $in: courses.map((course) => course._id) },
            status: { $ne: 'ARCHIVED' },
          })
            .select({ updatedAt: 1 })
            .lean<Array<{ updatedAt: Date }>>()
            .exec();
    return {
      classroomId,
      courseCount: courses.length,
      lessonCount: lessons.length,
      announcementCount: announcements.length,
      lastContentUpdatedAt: latestIso([
        ...courses.map((item) => item.updatedAt),
        ...lessons.map((item) => item.updatedAt),
        ...announcements.map((item) => item.updatedAt),
      ]),
    };
  }
}
