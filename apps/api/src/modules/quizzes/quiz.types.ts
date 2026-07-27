import type { Types } from 'mongoose';

import type {
  QuizScorePolicy,
  QuizStatus,
  ResultReleasePolicy,
} from '../learning-content/assessment.types.js';

export interface NewQuiz {
  classroomId: Types.ObjectId;
  courseId: Types.ObjectId;
  moduleId: Types.ObjectId | null;
  title: string;
  instruction: string;
  isRequired: boolean;
  availableFrom: Date | null;
  dueDate: Date;
  attemptLimit: number;
  timeLimitMinutes: number | null;
  resultReleasePolicy: ResultReleasePolicy;
  scorePolicy: QuizScorePolicy;
  displayOrder: number;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
}

export interface QuizMetadataPatch {
  moduleId?: Types.ObjectId | null;
  title?: string;
  instruction?: string;
  isRequired?: boolean;
  availableFrom?: Date | null;
  dueDate?: Date;
  attemptLimit?: number;
  timeLimitMinutes?: number | null;
  resultReleasePolicy?: ResultReleasePolicy;
  scorePolicy?: QuizScorePolicy;
}

export interface QuizLifecyclePatch {
  status: QuizStatus;
  scheduledPublishAt: Date | null;
  publishedAt?: Date;
  unpublishedAt?: Date;
  archivedAt?: Date;
  publishedRevision?: number;
}

export interface QuizListOptions {
  page: number;
  limit: number;
  status?: QuizStatus;
  search?: string;
}
