import { PhaseThreeClassroomScopeAdapter } from './classrooms/classroom-scope.adapter.js';
import type { ClassroomRepository } from './classrooms/classroom.repository.js';
import type {
  ClassroomScopeReader,
  EnrollmentAccessReader,
} from './learning-content/classroom-scope.reader.js';
import type { EnrollmentRepository } from './enrollments/enrollment.repository.js';

export interface PhaseFourFoundation {
  classroomScopeReader: ClassroomScopeReader;
  enrollmentAccessReader: EnrollmentAccessReader;
}

export function createPhaseFourFoundation(
  classrooms: ClassroomRepository,
  enrollments: EnrollmentRepository,
): PhaseFourFoundation {
  const classroomAccess = new PhaseThreeClassroomScopeAdapter(classrooms, enrollments);
  return Object.freeze({
    classroomScopeReader: classroomAccess,
    enrollmentAccessReader: classroomAccess,
  });
}
