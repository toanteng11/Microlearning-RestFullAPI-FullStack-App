import type { Types } from 'mongoose';

import type { CommonContentStatus } from '../learning-content/content.types.js';

export interface NewAnnouncement {
  classroomId: Types.ObjectId;
  teacherId: Types.ObjectId;
  content: string;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
}

export interface AnnouncementMetadataPatch {
  content: string;
}

export interface AnnouncementLifecyclePatch {
  status: Exclude<CommonContentStatus, 'ARCHIVED'>;
  scheduledPublishAt: Date | null;
  publishedAt?: Date;
  unpublishedAt?: Date;
}

export interface AnnouncementListQuery {
  page: number;
  limit: number;
  status?: CommonContentStatus;
}
