import type { Types } from 'mongoose';

import type {
  AttemptStatus,
  QuestionType,
  ResultReleasePolicy,
} from '../learning-content/assessment.types.js';
import type { QuestionMedia, QuestionOption } from '../questions/question.types.js';

export interface AttemptQuestionSnapshot {
  questionId: Types.ObjectId;
  questionRevision: number;
  type: QuestionType;
  prompt: string;
  points: number;
  isRequired: boolean;
  displayOrder: number;
  options: QuestionOption[];
  media: QuestionMedia | null;
  scoring: { correctOptionIds: string[]; correctBoolean: boolean | null; rubric: string | null };
}

export interface AttemptAnswer {
  questionId: Types.ObjectId;
  selectedOptionIds: string[];
  textAnswer: string | null;
  savedAt: Date;
}

export interface AttemptManualReview {
  questionId: Types.ObjectId;
  awardedPoints: number;
  feedback: string | null;
  reviewedBy: Types.ObjectId;
  reviewedAt: Date;
}

export interface NewQuizAttempt {
  studentId: Types.ObjectId;
  classroomId: Types.ObjectId;
  courseId: Types.ObjectId;
  quizId: Types.ObjectId;
  attemptNumber: number;
  assessmentRevision: number;
  quizSnapshot: {
    title: string;
    resultReleasePolicy: ResultReleasePolicy;
    maxScore: number;
    timeLimitMinutes: number | null;
  };
  questionSnapshots: AttemptQuestionSnapshot[];
  startedAt: Date;
  expiresAt: Date;
}

export interface AttemptTerminalPatch {
  status: AttemptStatus;
  objectiveScore: number;
  manualScore: number;
  totalScore: number;
  submittedAt: Date;
  gradedAt?: Date | null;
  releasedAt?: Date | null;
}
