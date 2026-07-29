import { Types } from 'mongoose';

import { CourseModel } from '../../courses/course.model.js';
import { EnrollmentModel } from '../../enrollments/enrollment.model.js';
import type { ReportingRosterReader } from '../reporting-roster.reader.js';

export class MongoReportingRosterReader implements ReportingRosterReader {
  async listActiveByCourse(courseId: string) {
    const course = await CourseModel.findById(new Types.ObjectId(courseId))
      .select({ classroomId: 1 })
      .lean()
      .exec();
    if (!course) return [];
    return this.listActiveByClassroom(course.classroomId.toString());
  }

  async listActiveByClassroom(classroomId: string) {
    const rows = await EnrollmentModel.find({
      classroomId: new Types.ObjectId(classroomId),
      status: 'ACTIVE',
    })
      .select({ studentId: 1, updatedAt: 1 })
      .sort({ studentId: 1 })
      .lean()
      .exec();
    return rows.map((row) => ({
      studentId: row.studentId.toString(),
      enrollmentUpdatedAt: row.updatedAt,
    }));
  }

  async getSourceWatermark(classroomId: string) {
    const row = await EnrollmentModel.findOne({ classroomId: new Types.ObjectId(classroomId) })
      .select({ updatedAt: 1 })
      .sort({ updatedAt: -1, _id: -1 })
      .lean()
      .exec();
    return row?.updatedAt ?? null;
  }
}
