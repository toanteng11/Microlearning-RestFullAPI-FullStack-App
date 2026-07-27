import type { Types } from 'mongoose';

import type { LearningActivityType } from '../learning-content/learning-activity.reader.js';

export const DEADLINE_EXCEPTION_ACTIONS = ['SET', 'REVOKED'] as const;
export type DeadlineExceptionAction = (typeof DEADLINE_EXCEPTION_ACTIONS)[number];

export interface NewDeadlineException {
  studentId: Types.ObjectId;
  classroomId: Types.ObjectId;
  courseId: Types.ObjectId;
  activityType: LearningActivityType;
  activityId: Types.ObjectId;
  deadline: Date;
  reason: string;
  defaultDeadlineSnapshot: Date;
  changedBy: Types.ObjectId;
  changedAt: Date;
}

export interface NewDeadlineExceptionHistory {
  deadlineExceptionId: Types.ObjectId;
  studentId: Types.ObjectId;
  activityType: LearningActivityType;
  activityId: Types.ObjectId;
  fromDeadline: Date | null;
  toDeadline: Date | null;
  fromRevision: number;
  toRevision: number;
  action: DeadlineExceptionAction;
  reason: string;
  actorId: Types.ObjectId;
  actorRole: string;
  requestId: string;
}
