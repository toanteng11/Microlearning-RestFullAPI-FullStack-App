import type { ClassroomStatus } from '../classrooms/classroom.types.js';

export interface TeacherOwnedClassroomScope {
  classroomId: string;
  ownerTeacherId: string;
  status: ClassroomStatus;
}

export interface StudentEnrollmentScope {
  classroomId: string;
  enrollmentId: string;
  classroomStatus: ClassroomStatus;
  enrollmentStatus: 'ACTIVE';
}

export interface ActiveEnrollmentScope {
  classroomId: string;
  enrollmentId: string;
  enrollmentStatus: 'ACTIVE';
}

export interface ClassroomScopeReader {
  getTeacherOwnedScope(actorId: string, classroomId: string): Promise<TeacherOwnedClassroomScope>;
  getStudentEnrollmentScope(
    studentId: string,
    classroomId: string,
  ): Promise<StudentEnrollmentScope>;
}

export interface EnrollmentAccessReader {
  getActiveEnrollmentScopes(
    studentId: string,
    classroomIds: readonly string[],
  ): Promise<ReadonlyMap<string, ActiveEnrollmentScope>>;
}
