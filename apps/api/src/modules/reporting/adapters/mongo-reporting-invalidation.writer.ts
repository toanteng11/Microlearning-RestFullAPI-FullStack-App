import type { ClientSession } from 'mongoose';

import type {
  ClassroomInvalidationInput,
  CourseInvalidationInput,
  ReportingInvalidationWriter,
  StudentCourseInvalidationInput,
} from '../../learning-content/reporting-invalidation.writer.js';
import type { ReportingInvalidationRepository } from '../reporting-invalidation.repository.js';

export class MongoReportingInvalidationWriter implements ReportingInvalidationWriter {
  constructor(private readonly invalidations: ReportingInvalidationRepository) {}

  invalidateStudentCourse(input: StudentCourseInvalidationInput, session: ClientSession) {
    return this.invalidations.upsert(
      {
        scope: {
          scopeType: 'STUDENT_COURSE',
          classroomId: input.classroomId,
          courseId: input.courseId,
          studentId: input.studentId,
        },
        reasons: input.reasons,
        sourceChangedAt: input.sourceChangedAt,
      },
      session,
    );
  }

  invalidateCourse(input: CourseInvalidationInput, session: ClientSession) {
    return this.invalidations.upsert(
      {
        scope: {
          scopeType: 'COURSE',
          classroomId: input.classroomId,
          courseId: input.courseId,
          studentId: null,
        },
        reasons: input.reasons,
        sourceChangedAt: input.sourceChangedAt,
      },
      session,
    );
  }

  invalidateClassroom(input: ClassroomInvalidationInput, session: ClientSession) {
    return this.invalidations.upsert(
      {
        scope: {
          scopeType: 'CLASSROOM',
          classroomId: input.classroomId,
          courseId: null,
          studentId: null,
        },
        reasons: input.reasons,
        sourceChangedAt: input.sourceChangedAt,
      },
      session,
    );
  }
}
