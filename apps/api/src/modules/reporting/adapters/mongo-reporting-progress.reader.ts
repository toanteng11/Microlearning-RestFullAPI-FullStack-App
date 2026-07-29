import { Types } from 'mongoose';

import { LearningProgressModel } from '../../learning-progress/learning-progress.model.js';
import type { ReportingProgressReader } from '../reporting-progress.reader.js';

export class MongoReportingProgressReader implements ReportingProgressReader {
  constructor(private readonly maxStudentIds = 500) {}

  private ids(studentIds: readonly string[]) {
    if (studentIds.length > this.maxStudentIds) {
      throw new Error(`Reporting progress batch exceeds ${this.maxStudentIds} students`);
    }
    return studentIds.map((id) => new Types.ObjectId(id));
  }

  async listByCourseAndStudents(courseId: string, studentIds: readonly string[]) {
    if (studentIds.length === 0) return [];
    const rows = await LearningProgressModel.find({
      courseId: new Types.ObjectId(courseId),
      studentId: { $in: this.ids(studentIds) },
    })
      .select({
        studentId: 1,
        courseId: 1,
        activityId: 1,
        activityType: 1,
        status: 1,
        startedAt: 1,
        completedAt: 1,
        lastActiveAt: 1,
        updatedAt: 1,
      })
      .sort({ studentId: 1, activityType: 1, activityId: 1 })
      .lean()
      .exec();
    return rows.map((row) => ({
      studentId: row.studentId.toString(),
      courseId: row.courseId.toString(),
      activityId: row.activityId.toString(),
      activityType: row.activityType,
      status: row.status,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      lastActiveAt: row.lastActiveAt,
      sourceUpdatedAt: row.updatedAt,
    }));
  }

  async getSourceWatermark(courseId: string, studentIds: readonly string[]) {
    if (studentIds.length === 0) return null;
    const row = await LearningProgressModel.findOne({
      courseId: new Types.ObjectId(courseId),
      studentId: { $in: this.ids(studentIds) },
    })
      .select({ updatedAt: 1 })
      .sort({ updatedAt: -1, _id: -1 })
      .lean()
      .exec();
    return row?.updatedAt ?? null;
  }
}
