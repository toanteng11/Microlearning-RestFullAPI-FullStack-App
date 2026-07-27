import type { Types } from 'mongoose';

import type { QuestionStatus, QuestionType } from '../learning-content/assessment.types.js';

export const QUESTION_MEDIA_KINDS = ['IMAGE_URL', 'VIDEO_URL'] as const;
export type QuestionMediaKind = (typeof QUESTION_MEDIA_KINDS)[number];

export interface QuestionOption {
  id: string;
  label: string;
  displayOrder: number;
}

export interface QuestionMedia {
  kind: QuestionMediaKind;
  url: string;
  provider: string | null;
  caption: string | null;
  altText: string | null;
}

export interface NewQuestion {
  quizId: Types.ObjectId;
  courseId: Types.ObjectId;
  type: QuestionType;
  prompt: string;
  points: number;
  isRequired: boolean;
  options: QuestionOption[];
  correctOptionIds: string[];
  correctBoolean: boolean | null;
  rubric: string | null;
  explanation: string | null;
  media: QuestionMedia | null;
  displayOrder: number;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
}

export interface QuestionPatch {
  prompt?: string;
  points?: number;
  isRequired?: boolean;
  options?: QuestionOption[];
  correctOptionIds?: string[];
  correctBoolean?: boolean | null;
  rubric?: string | null;
  explanation?: string | null;
  media?: QuestionMedia | null;
}

export interface QuestionOrderAssignment {
  questionId: Types.ObjectId;
  displayOrder: number;
}

export interface QuestionAggregate {
  activeCount: number;
  maxScore: number;
  hasShortAnswer: boolean;
}

export interface QuestionState {
  status: QuestionStatus;
  version: number;
}
