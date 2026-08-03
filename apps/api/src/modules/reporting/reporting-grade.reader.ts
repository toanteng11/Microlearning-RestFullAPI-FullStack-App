import type { ReportingGrade } from './reporting.types.js';

export type ReportingGradeVisibility = 'TEACHER' | 'STUDENT' | 'ADMIN_AGGREGATE';

export interface ReportingGradeReader {
  listCurrentByCourseAndStudents(
    courseId: string,
    studentIds: readonly string[],
    visibility: ReportingGradeVisibility,
  ): Promise<readonly ReportingGrade[]>;
  getSourceWatermark(courseId: string, studentIds: readonly string[]): Promise<Date | null>;
}
