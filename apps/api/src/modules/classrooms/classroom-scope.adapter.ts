import { Types } from 'mongoose';

import { AppError } from '../../shared/errors/app-error.js';
import type {
  ActiveEnrollmentScope,
  ClassroomScopeReader,
  EnrollmentAccessReader,
  StudentEnrollmentScope,
  TeacherOwnedClassroomScope,
} from '../learning-content/classroom-scope.reader.js';
import type { EnrollmentRepository } from '../enrollments/enrollment.repository.js';
import type { ClassroomRepository } from './classroom.repository.js';

type ClassroomScopeDataSource = Pick<ClassroomRepository, 'findById' | 'findOwnedById'>;
type EnrollmentScopeDataSource = Pick<
  EnrollmentRepository,
  'findActiveMembership' | 'findActiveMemberships'
>;

function scopedObjectId(value: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Resource was not found');
  }
  return new Types.ObjectId(value);
}

export class PhaseThreeClassroomScopeAdapter
  implements ClassroomScopeReader, EnrollmentAccessReader
{
  constructor(
    private readonly classrooms: ClassroomScopeDataSource,
    private readonly enrollments: EnrollmentScopeDataSource,
  ) {}

  async getTeacherOwnedScope(
    actorId: string,
    classroomId: string,
  ): Promise<TeacherOwnedClassroomScope> {
    const classroom = await this.classrooms.findOwnedById(
      scopedObjectId(classroomId),
      scopedObjectId(actorId),
    );
    if (!classroom) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Classroom was not found');

    return {
      classroomId: classroom._id.toString(),
      ownerTeacherId: classroom.ownerTeacherId.toString(),
      status: classroom.status,
    };
  }

  async getStudentEnrollmentScope(
    studentId: string,
    classroomId: string,
  ): Promise<StudentEnrollmentScope> {
    const classroomObjectId = scopedObjectId(classroomId);
    const [classroom, enrollment] = await Promise.all([
      this.classrooms.findById(classroomObjectId),
      this.enrollments.findActiveMembership(classroomObjectId, scopedObjectId(studentId)),
    ]);
    if (!classroom || !enrollment) {
      throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Classroom was not found');
    }

    return {
      classroomId: classroom._id.toString(),
      enrollmentId: enrollment._id.toString(),
      classroomStatus: classroom.status,
      enrollmentStatus: 'ACTIVE',
    };
  }

  async getActiveEnrollmentScopes(
    studentId: string,
    classroomIds: readonly string[],
  ): Promise<ReadonlyMap<string, ActiveEnrollmentScope>> {
    const uniqueClassroomIds = [...new Set(classroomIds)];
    if (uniqueClassroomIds.length === 0) return new Map();

    const memberships = await this.enrollments.findActiveMemberships(
      scopedObjectId(studentId),
      uniqueClassroomIds.map(scopedObjectId),
    );

    return new Map(
      memberships.map((membership) => {
        const classroomId = membership.classroomId.toString();
        return [
          classroomId,
          {
            classroomId,
            enrollmentId: membership._id.toString(),
            enrollmentStatus: 'ACTIVE' as const,
          },
        ];
      }),
    );
  }
}
