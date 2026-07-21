import type { Types } from 'mongoose';

import type { CommonContentStatus } from '../learning-content/content.types.js';

export const COURSE_SORT_FIELDS = ['displayOrder', 'title', 'createdAt', 'updatedAt'] as const;
export type CourseSortField = (typeof COURSE_SORT_FIELDS)[number];

export interface NewCourse {
  classroomId: Types.ObjectId;
  ownerTeacherId: Types.ObjectId;
  title: string;
  description?: string;
  displayOrder: number;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
}

export interface CourseListQuery {
  page: number;
  limit: number;
  search?: string;
  statuses?: readonly CommonContentStatus[];
  sortBy?: CourseSortField;
  sortOrder?: 'asc' | 'desc';
  visibleAt?: Date;
}

export interface CourseGovernanceListQuery {
  page: number;
  limit: number;
  search?: string;
  status?: CommonContentStatus;
  classroomId?: Types.ObjectId;
  ownerTeacherId?: Types.ObjectId;
  sortBy: 'title' | 'status' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

export interface CourseMetadataPatch {
  title?: string;
  description?: string;
}

export interface CourseLifecyclePatch {
  status: CommonContentStatus;
  scheduledPublishAt: Date | null;
  publishedAt?: Date;
  unpublishedAt?: Date;
  archivedAt?: Date;
}
