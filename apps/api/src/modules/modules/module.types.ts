import type { Types } from 'mongoose';

import type { ModuleContentStatus } from '../learning-content/content.types.js';

export interface NewCourseModule {
  courseId: Types.ObjectId;
  title: string;
  description?: string;
  displayOrder: number;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
}

export interface CourseModuleMetadataPatch {
  title?: string;
  description?: string;
}

export interface CourseModuleLifecyclePatch {
  status: ModuleContentStatus;
  archivedAt?: Date;
}

export interface CourseModuleOrderAssignment {
  moduleId: Types.ObjectId;
  displayOrder: number;
}
