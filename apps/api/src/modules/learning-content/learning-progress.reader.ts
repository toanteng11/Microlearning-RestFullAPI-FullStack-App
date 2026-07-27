import type { ActivityKey, LearningActivityType } from './learning-activity.reader.js';

export const LEARNING_PROGRESS_METRIC_VERSION = 'P05_REQUIRED_ACTIVITY_COMPLETION_V1' as const;

export type LearningProgressStatus = 'IN_PROGRESS' | 'COMPLETED';

export interface LearningProgressSnapshot {
  studentId: string;
  activityType: LearningActivityType;
  activityId: string;
  status: LearningProgressStatus;
  startedAt: string;
  completedAt: string | null;
  lastActiveAt: string;
}

export interface LearningProgressReader {
  readonly metricVersion: typeof LEARNING_PROGRESS_METRIC_VERSION;
  listStudentProgress(
    studentId: string,
    activities: readonly ActivityKey[],
  ): Promise<ReadonlyMap<string, LearningProgressSnapshot>>;
  countCompletedByActivities(
    activities: readonly ActivityKey[],
  ): Promise<ReadonlyMap<string, number>>;
}
