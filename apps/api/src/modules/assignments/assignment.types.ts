import type { Types } from 'mongoose';

import type { AssignmentStatus } from '../learning-content/assessment.types.js';

export const SUBMISSION_TYPES = ['TEXT', 'LINK', 'MARK_DONE'] as const;
export type SubmissionType = (typeof SUBMISSION_TYPES)[number];

export interface NewAssignment {
  classroomId: Types.ObjectId;
  courseId: Types.ObjectId;
  moduleId: Types.ObjectId | null;
  title: string;
  instruction: string;
  maxScore: number;
  isRequired: boolean;
  allowedSubmissionTypes: SubmissionType[];
  allowLateSubmission: boolean;
  allowUnsubmit: boolean;
  allowResubmit: boolean;
  availableFrom: Date | null;
  dueDate: Date;
  displayOrder: number;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
}

export interface AssignmentPatch {
  moduleId?: Types.ObjectId | null;
  title?: string;
  instruction?: string;
  maxScore?: number;
  isRequired?: boolean;
  allowedSubmissionTypes?: SubmissionType[];
  allowLateSubmission?: boolean;
  allowUnsubmit?: boolean;
  allowResubmit?: boolean;
  availableFrom?: Date | null;
  dueDate?: Date;
}

export interface AssignmentLifecyclePatch {
  status: AssignmentStatus;
  scheduledPublishAt: Date | null;
  publishedAt?: Date;
  unpublishedAt?: Date;
  closedAt?: Date;
  archivedAt?: Date;
  publishedRevision?: number;
}

export interface AssignmentListOptions {
  page: number;
  limit: number;
  status?: AssignmentStatus;
  search?: string;
}
