import { CourseScopeRepositoryAdapter } from './courses/course-scope.adapter.js';
import type { CourseRepository } from './courses/course.repository.js';
import type { EnrollmentRepository } from './enrollments/enrollment.repository.js';
import type { ClassroomRepository } from './classrooms/classroom.repository.js';
import { createPhaseFourFoundation } from './phase-four.foundation.js';

export function createPhaseFiveFoundation(
  classrooms: ClassroomRepository,
  enrollments: EnrollmentRepository,
  courses: CourseRepository,
) {
  const phaseFour = createPhaseFourFoundation(classrooms, enrollments);
  return Object.freeze({
    ...phaseFour,
    assessmentScopeReader: new CourseScopeRepositoryAdapter(
      courses,
      phaseFour.classroomScopeReader,
    ),
  });
}
