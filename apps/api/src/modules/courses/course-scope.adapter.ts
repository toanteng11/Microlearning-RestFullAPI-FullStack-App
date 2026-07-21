import { Types } from 'mongoose';

import { AppError } from '../../shared/errors/app-error.js';
import type { ClassroomScopeReader } from '../learning-content/classroom-scope.reader.js';
import type {
  ActivityContainer,
  CourseScope,
  CourseScopeReader,
} from '../learning-content/course-scope.reader.js';
import { resolveEffectiveContentStatus } from '../learning-content/content-schedule.policy.js';
import type { CourseRepository } from './course.repository.js';

function scopedObjectId(value: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Course was not found');
  }
  return new Types.ObjectId(value);
}

export class CourseScopeRepositoryAdapter implements CourseScopeReader {
  constructor(
    private readonly courses: CourseRepository,
    private readonly classrooms: ClassroomScopeReader,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private toScope(
    course: Awaited<ReturnType<CourseRepository['findById']>>,
    classroomStatus: CourseScope['classroomStatus'],
    ownerTeacherId = course?.ownerTeacherId.toString(),
  ): CourseScope {
    if (!course) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Course was not found');
    return {
      courseId: course._id.toString(),
      classroomId: course.classroomId.toString(),
      classroomStatus,
      ownerTeacherId: ownerTeacherId ?? course.ownerTeacherId.toString(),
      status: course.status,
      effectiveStatus: resolveEffectiveContentStatus(course, this.now()),
      structureRevision: course.structureRevision,
    };
  }

  async requireTeacherManage(actorId: string, courseId: string): Promise<CourseScope> {
    const course = await this.courses.findById(scopedObjectId(courseId));
    if (!course) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Course was not found');
    const classroom = await this.classrooms.getTeacherOwnedScope(
      actorId,
      course.classroomId.toString(),
    );
    return this.toScope(course, classroom.status, classroom.ownerTeacherId);
  }

  async requireStudentView(studentId: string, courseId: string): Promise<CourseScope> {
    const course = await this.courses.findById(scopedObjectId(courseId));
    if (!course) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Course was not found');
    const enrollment = await this.classrooms.getStudentEnrollmentScope(
      studentId,
      course.classroomId.toString(),
    );
    const scope = this.toScope(course, enrollment.classroomStatus);
    if (enrollment.classroomStatus !== 'ACTIVE' || scope.effectiveStatus !== 'PUBLISHED') {
      throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Course was not found');
    }
    return scope;
  }

  async getActivityContainer(courseId: string): Promise<ActivityContainer> {
    const course = await this.courses.findById(scopedObjectId(courseId));
    if (!course) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Course was not found');
    return {
      courseId: course._id.toString(),
      classroomId: course.classroomId.toString(),
      structureRevision: course.structureRevision,
    };
  }
}
