import type { ReportingActivity, ReportingDeadlineException } from './reporting.types.js';

export interface ReportingActivityReader {
  listVisibleByCourse(courseId: string, asOf: Date): Promise<readonly ReportingActivity[]>;
  listDeadlineExceptions(
    courseId: string,
    studentIds: readonly string[],
  ): Promise<readonly ReportingDeadlineException[]>;
  getSourceWatermark(courseId: string): Promise<Date | null>;
}
