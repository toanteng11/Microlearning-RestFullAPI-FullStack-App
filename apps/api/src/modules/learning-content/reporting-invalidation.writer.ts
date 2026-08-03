import type {
  DatabaseObjectId,
  TransactionSession,
} from '../../shared/database/transaction.types.js';
import type { ReportingInvalidationReason } from '../reporting/reporting.types.js';

export interface StudentCourseInvalidationInput {
  classroomId: DatabaseObjectId;
  courseId: DatabaseObjectId;
  studentId: DatabaseObjectId;
  reasons: readonly ReportingInvalidationReason[];
  sourceChangedAt: Date;
}

export interface CourseInvalidationInput {
  classroomId: DatabaseObjectId;
  courseId: DatabaseObjectId;
  reasons: readonly ReportingInvalidationReason[];
  sourceChangedAt: Date;
}

export interface ClassroomInvalidationInput {
  classroomId: DatabaseObjectId;
  reasons: readonly ReportingInvalidationReason[];
  sourceChangedAt: Date;
}

export interface ReportingInvalidationWriter {
  invalidateStudentCourse(
    input: StudentCourseInvalidationInput,
    session: TransactionSession,
  ): Promise<void>;
  invalidateCourse(input: CourseInvalidationInput, session: TransactionSession): Promise<void>;
  invalidateClassroom(
    input: ClassroomInvalidationInput,
    session: TransactionSession,
  ): Promise<void>;
}
