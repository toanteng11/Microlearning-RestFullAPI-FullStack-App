import type { LearningProgressProjection } from './learning-progress.repository.js';

export const DERIVED_LEARNING_STATUSES = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'MISSING',
  'COMPLETED',
  'LATE',
] as const;

export type DerivedLearningStatus = (typeof DERIVED_LEARNING_STATUSES)[number];

type ProgressSnapshot =
  Pick<LearningProgressProjection, 'status' | 'completedAt'> | null | undefined;

export function deriveLearningStatus(
  progress: ProgressSnapshot,
  completionDeadline: Date | null,
  asOf: Date,
): DerivedLearningStatus {
  if (progress?.status === 'COMPLETED' && progress.completedAt) {
    return completionDeadline && progress.completedAt > completionDeadline ? 'LATE' : 'COMPLETED';
  }
  if (completionDeadline && asOf >= completionDeadline) return 'MISSING';
  return progress ? 'IN_PROGRESS' : 'NOT_STARTED';
}

export function isCompletedDerived(status: DerivedLearningStatus): boolean {
  return status === 'COMPLETED' || status === 'LATE';
}

export function progressPercentage(completed: number, required: number): number {
  if (required === 0) return 0;
  return Math.round((completed / required) * 1_000) / 10;
}
