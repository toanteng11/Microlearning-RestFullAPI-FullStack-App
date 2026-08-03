import { isValidObjectId, Types } from 'mongoose';

import { AppError } from '../../../shared/errors/app-error.js';
import { ClassroomModel } from '../../classrooms/classroom.model.js';
import { CourseModel } from '../../courses/course.model.js';
import { EnrollmentModel } from '../../enrollments/enrollment.model.js';
import type { ReportingScopeReader } from '../reporting-scope.reader.js';

function objectId(value: string): Types.ObjectId {
  if (!isValidObjectId(value)) throw new AppError(400, 'VALIDATION_ERROR', 'Invalid identifier');
  return new Types.ObjectId(value);
}

export class MongoReportingScopeReader implements ReportingScopeReader {
  async requireStudentCourse(actorId: string, courseId: string) {
    const studentId = objectId(actorId);
    const course = await CourseModel.findById(objectId(courseId))
      .select({ classroomId: 1, title: 1, status: 1 })
      .lean()
      .exec();
    if (!course || !['PUBLISHED', 'SCHEDULED', 'ARCHIVED'].includes(course.status)) {
      throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Course was not found');
    }
    const [classroom, enrollment] = await Promise.all([
      ClassroomModel.findById(course.classroomId).select({ name: 1 }).lean().exec(),
      EnrollmentModel.findOne({
        classroomId: course.classroomId,
        studentId,
        status: 'ACTIVE',
      })
        .select({ _id: 1 })
        .lean()
        .exec(),
    ]);
    if (!classroom || !enrollment) {
      throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Course was not found');
    }
    return {
      classroomId: course.classroomId.toString(),
      courseId: course._id.toString(),
      studentId: studentId.toString(),
      courseTitle: course.title,
      classroomName: classroom.name,
    };
  }

  async requireTeacherCourse(actorId: string, courseId: string) {
    const teacherId = objectId(actorId);
    const course = await CourseModel.findOne({ _id: objectId(courseId), ownerTeacherId: teacherId })
      .select({ classroomId: 1, title: 1, status: 1 })
      .lean()
      .exec();
    if (!course) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Course was not found');
    const classroom = await ClassroomModel.findById(course.classroomId)
      .select({ name: 1 })
      .lean()
      .exec();
    if (!classroom) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Course was not found');
    return {
      classroomId: course.classroomId.toString(),
      courseId: course._id.toString(),
      teacherId: teacherId.toString(),
      courseTitle: course.title,
      courseStatus: course.status,
      classroomName: classroom.name,
    };
  }

  async requireTeacherStudent(actorId: string, courseId: string, studentId: string) {
    const scope = await this.requireTeacherCourse(actorId, courseId);
    const resolvedStudentId = objectId(studentId);
    const enrollment = await EnrollmentModel.findOne({
      classroomId: new Types.ObjectId(scope.classroomId),
      studentId: resolvedStudentId,
      status: 'ACTIVE',
    })
      .select({ _id: 1 })
      .lean()
      .exec();
    if (!enrollment) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Student was not found');
    return { ...scope, studentId: resolvedStudentId.toString() };
  }
}
