import type { Types } from 'mongoose';

import type { GradeStatus } from '../learning-content/assessment.types.js';

export const GRADE_ACTIVITY_TYPES = ['QUIZ', 'ASSIGNMENT'] as const;
export type GradeActivityType = (typeof GRADE_ACTIVITY_TYPES)[number];
export const GRADE_EVIDENCE_TYPES = ['ATTEMPT', 'SUBMISSION'] as const;
export type GradeEvidenceType = (typeof GRADE_EVIDENCE_TYPES)[number];

export interface NewGrade {
  studentId: Types.ObjectId;
  classroomId: Types.ObjectId;
  courseId: Types.ObjectId;
  activityType: GradeActivityType;
  activityId: Types.ObjectId;
  evidenceType: GradeEvidenceType;
  evidenceId: Types.ObjectId;
  evidenceRevision: number;
  score: number;
  maxScore: number;
  feedback: string | null;
  gradedBy: Types.ObjectId;
  gradedAt: Date;
  status?: GradeStatus;
  returnedBy?: Types.ObjectId | null;
  returnedAt?: Date | null;
}

export interface NewGradeRevision {
  gradeId: Types.ObjectId;
  revision: number;
  oldScore: number | null;
  newScore: number;
  oldStatus: GradeStatus | null;
  newStatus: GradeStatus;
  evidenceId: Types.ObjectId;
  evidenceRevision: number;
  feedback: string | null;
  reason: string | null;
  actorId: Types.ObjectId;
  requestId: string;
}
