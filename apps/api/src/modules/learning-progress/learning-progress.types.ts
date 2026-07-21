import type { Types } from 'mongoose';

import type { LearningProgressStatus } from '../learning-content/learning-progress.reader.js';

export interface NewLearningProgress {
  studentId: Types.ObjectId;
  classroomId: Types.ObjectId;
  courseId: Types.ObjectId;
  activityType: 'LESSON';
  activityId: Types.ObjectId;
  status: LearningProgressStatus;
  startedAt: Date;
  completedAt?: Date | null;
  lastActiveAt: Date;
}

export type StartLessonProgressInput = Omit<NewLearningProgress, 'status' | 'completedAt'>;

export interface CompleteLessonProgressInput extends StartLessonProgressInput {
  completedAt: Date;
}
