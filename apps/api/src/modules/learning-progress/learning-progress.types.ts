import type { Types } from 'mongoose';

import type { LearningActivityType } from '../learning-content/learning-activity.reader.js';
import type { LearningProgressStatus } from '../learning-content/learning-progress.reader.js';

export interface NewLearningProgress {
  studentId: Types.ObjectId;
  classroomId: Types.ObjectId;
  courseId: Types.ObjectId;
  activityType: LearningActivityType;
  activityId: Types.ObjectId;
  status: LearningProgressStatus;
  startedAt: Date;
  completedAt?: Date | null;
  lastActiveAt: Date;
}

export type StartLearningProgressInput = Omit<NewLearningProgress, 'status' | 'completedAt'>;

export interface CompleteLearningProgressInput extends StartLearningProgressInput {
  completedAt: Date;
}

export type StartLessonProgressInput = StartLearningProgressInput & { activityType: 'LESSON' };
export type CompleteLessonProgressInput = CompleteLearningProgressInput & {
  activityType: 'LESSON';
};
