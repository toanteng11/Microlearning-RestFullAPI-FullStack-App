import type {
  ResolvedStudentCourseScope,
  ResolvedTeacherCourseScope,
  ResolvedTeacherStudentScope,
} from './reporting.types.js';

export interface ReportingScopeReader {
  requireStudentCourse(actorId: string, courseId: string): Promise<ResolvedStudentCourseScope>;
  requireTeacherCourse(actorId: string, courseId: string): Promise<ResolvedTeacherCourseScope>;
  requireTeacherStudent(
    actorId: string,
    courseId: string,
    studentId: string,
  ): Promise<ResolvedTeacherStudentScope>;
}
