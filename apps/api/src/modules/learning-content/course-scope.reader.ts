import type { CommonContentStatus } from './content.types.js';
import type { ClassroomStatus } from '../classrooms/classroom.types.js';

export interface CourseScope {
  courseId: string;
  classroomId: string;
  classroomStatus: ClassroomStatus;
  ownerTeacherId: string;
  status: CommonContentStatus;
  effectiveStatus: CommonContentStatus;
  structureRevision: number;
}

export interface ActivityContainer {
  courseId: string;
  classroomId: string;
  structureRevision: number;
}

export interface CourseScopeReader {
  requireTeacherManage(actorId: string, courseId: string): Promise<CourseScope>;
  requireStudentView(studentId: string, courseId: string): Promise<CourseScope>;
  getActivityContainer(courseId: string): Promise<ActivityContainer>;
}
