import type { ReportingProgress } from './reporting.types.js';

export interface ReportingProgressReader {
  listByCourseAndStudents(
    courseId: string,
    studentIds: readonly string[],
  ): Promise<readonly ReportingProgress[]>;
  getSourceWatermark(courseId: string, studentIds: readonly string[]): Promise<Date | null>;
}
