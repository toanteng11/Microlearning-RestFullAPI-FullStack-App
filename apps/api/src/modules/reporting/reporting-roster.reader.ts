import type { ReportingRosterStudent } from './reporting.types.js';

export interface ReportingRosterReader {
  listActiveByCourse(courseId: string): Promise<readonly ReportingRosterStudent[]>;
  listActiveByClassroom(classroomId: string): Promise<readonly ReportingRosterStudent[]>;
  getSourceWatermark(classroomId: string): Promise<Date | null>;
}
