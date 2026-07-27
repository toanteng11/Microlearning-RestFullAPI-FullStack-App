import type { Types } from 'mongoose';

import type { SubmissionStatus } from '../learning-content/assessment.types.js';
import type { SubmissionType } from '../assignments/assignment.types.js';

export const SUBMISSION_EVENTS = [
  'DRAFT_SAVED',
  'TURNED_IN',
  'UNSUBMITTED',
  'RESUBMITTED',
  'GRADED',
  'RETURNED',
] as const;
export type SubmissionEventType = (typeof SUBMISSION_EVENTS)[number];

export interface NewSubmission {
  assignmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  classroomId: Types.ObjectId;
  courseId: Types.ObjectId;
  submissionType: SubmissionType | null;
  textAnswer: string | null;
  links: string[];
  markDone: boolean;
}

export interface SubmissionContentPatch {
  submissionType: SubmissionType;
  textAnswer: string | null;
  links: string[];
  markDone: boolean;
}

export interface NewSubmissionRevision {
  submissionId: Types.ObjectId;
  assignmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  revision: number;
  eventType: SubmissionEventType;
  status: SubmissionStatus;
  submissionType: SubmissionType | null;
  textAnswer: string | null;
  links: string[];
  markDone: boolean;
  submittedAt: Date | null;
  isLate: boolean;
  effectiveDeadline: Date | null;
  actorId: Types.ObjectId;
  actorRole: string;
  reason: string | null;
  requestId: string;
}
