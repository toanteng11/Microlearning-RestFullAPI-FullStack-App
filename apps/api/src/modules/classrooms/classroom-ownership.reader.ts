import { Types } from 'mongoose';

import type { ClassroomRepository } from './classroom.repository.js';

export interface ClassroomOwnershipReader {
  countActiveOwnedClassrooms(teacherId: string): Promise<number>;
}

export class ClassroomOwnershipRepositoryReader implements ClassroomOwnershipReader {
  constructor(private readonly classrooms: ClassroomRepository) {}

  countActiveOwnedClassrooms(teacherId: string): Promise<number> {
    return this.classrooms.countActiveOwnedByTeacher(new Types.ObjectId(teacherId));
  }
}
