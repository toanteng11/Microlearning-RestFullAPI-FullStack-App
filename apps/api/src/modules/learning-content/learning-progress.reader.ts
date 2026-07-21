export const LEARNING_PROGRESS_METRIC_VERSION = 'P04_LESSON_COMPLETION_V1' as const;

export type LearningProgressStatus = 'IN_PROGRESS' | 'COMPLETED';

export interface LearningProgressSnapshot {
  studentId: string;
  activityType: 'LESSON';
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
    activityIds: readonly string[],
  ): Promise<ReadonlyMap<string, LearningProgressSnapshot>>;
  countCompletedByActivityIds(activityIds: readonly string[]): Promise<ReadonlyMap<string, number>>;
}
