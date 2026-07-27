import type { CourseScope } from './course-scope.reader.js';

export interface AssessmentScopeReader {
  requireTeacherManage(actorId: string, courseId: string): Promise<CourseScope>;
  requireStudentView(studentId: string, courseId: string): Promise<CourseScope>;
}

export interface AssessmentResourceScope {
  classroomId: string;
  courseId: string;
  ownerTeacherId: string;
}
