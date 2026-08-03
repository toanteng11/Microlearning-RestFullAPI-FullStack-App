import { Types } from 'mongoose';

import { GradeModel } from '../../grades/grade.model.js';
import type { ReportingGradeReader, ReportingGradeVisibility } from '../reporting-grade.reader.js';

export class MongoReportingGradeReader implements ReportingGradeReader {
  constructor(private readonly maxStudentIds = 500) {}

  private ids(studentIds: readonly string[]) {
    if (studentIds.length > this.maxStudentIds) {
      throw new Error(`Reporting Grade batch exceeds ${this.maxStudentIds} students`);
    }
    return studentIds.map((id) => new Types.ObjectId(id));
  }

  async listCurrentByCourseAndStudents(
    courseId: string,
    studentIds: readonly string[],
    visibility: ReportingGradeVisibility,
  ) {
    if (studentIds.length === 0) return [];
    const rows = await GradeModel.find({
      courseId: new Types.ObjectId(courseId),
      studentId: { $in: this.ids(studentIds) },
      ...(visibility === 'TEACHER' ? {} : { status: 'RETURNED' }),
    })
      .select({
        studentId: 1,
        courseId: 1,
        activityId: 1,
        activityType: 1,
        status: 1,
        score: 1,
        maxScore: 1,
        returnedAt: 1,
        revision: 1,
        updatedAt: 1,
      })
      .sort({ studentId: 1, activityType: 1, activityId: 1 })
      .lean()
      .exec();
    return rows.map((row) => ({
      gradeId: row._id.toString(),
      studentId: row.studentId.toString(),
      courseId: row.courseId.toString(),
      activityId: row.activityId.toString(),
      activityType: row.activityType,
      status: row.status,
      score: row.score,
      maxScore: row.maxScore,
      returnedAt: row.returnedAt,
      revision: row.revision,
      sourceUpdatedAt: row.updatedAt,
    }));
  }

  async getSourceWatermark(courseId: string, studentIds: readonly string[]) {
    if (studentIds.length === 0) return null;
    const row = await GradeModel.findOne({
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
