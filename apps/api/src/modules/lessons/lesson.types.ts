import type { Types } from 'mongoose';

export interface NewLesson {
  courseId: Types.ObjectId;
  moduleId?: Types.ObjectId | null;
  title: string;
  content: string;
  estimatedMinutes: number;
  isRequired?: boolean;
  completionDeadline?: Date | null;
  deadlineRevision?: number;
  deadlineLastUpdatedAt?: Date | null;
  deadlineLastUpdatedBy?: Types.ObjectId | null;
  displayOrder: number;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
}

export interface LessonMetadataPatch {
  title?: string;
  content?: string;
  estimatedMinutes?: number;
  isRequired?: boolean;
}

export interface LessonLifecyclePatch {
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'UNPUBLISHED';
  scheduledPublishAt: Date | null;
  publishedAt?: Date;
  unpublishedAt?: Date;
  publishedRevision?: number;
}

export interface LessonOrderAssignment {
  lessonId: Types.ObjectId;
  moduleId: Types.ObjectId | null;
  displayOrder: number;
}
