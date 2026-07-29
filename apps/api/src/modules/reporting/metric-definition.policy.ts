import type {
  ReportFreshness,
  ReportFreshnessStatus,
  ReportingActivity,
  ReportingDeadlineException,
  ReportingProgress,
} from './reporting.types.js';

export function roundHalfUp(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function isRequiredReportingActivity(activity: ReportingActivity): boolean {
  return (
    activity.visible &&
    activity.isRequired &&
    activity.lifecycleStatus !== 'DRAFT' &&
    activity.lifecycleStatus !== 'UNPUBLISHED' &&
    activity.lifecycleStatus !== 'ARCHIVED'
  );
}

export function effectiveDeadline(
  activity: ReportingActivity,
  studentId: string,
  exceptions: readonly ReportingDeadlineException[],
): Date | null {
  const exception = exceptions.find(
    (entry) =>
      entry.active &&
      entry.studentId === studentId &&
      entry.activityId === activity.activityId &&
      entry.activityType === activity.activityType,
  );
  return exception?.deadline ?? activity.defaultDeadline;
}

export function findActivityProgress(
  activity: ReportingActivity,
  studentId: string,
  progress: readonly ReportingProgress[],
): ReportingProgress | null {
  return (
    progress.find(
      (entry) =>
        entry.studentId === studentId &&
        entry.activityId === activity.activityId &&
        entry.activityType === activity.activityType,
    ) ?? null
  );
}

export function resolveFreshness(input: {
  recalculatedAt: Date | null;
  sourceChangedAt: Date | null;
  now: Date;
  staleAfterSeconds: number;
  failedItemsCount?: number;
  rebuilding?: boolean;
  hasTrustworthySnapshot?: boolean;
}): ReportFreshness {
  const failedItemsCount = input.failedItemsCount ?? 0;
  let status: ReportFreshnessStatus;
  if (input.rebuilding) status = 'REBUILDING';
  else if (!input.hasTrustworthySnapshot && failedItemsCount > 0) status = 'FAILED';
  else if (failedItemsCount > 0) status = 'PARTIAL';
  else if (!input.recalculatedAt) status = 'FAILED';
  else if (
    (input.sourceChangedAt && input.sourceChangedAt > input.recalculatedAt) ||
    input.now.getTime() - input.recalculatedAt.getTime() > input.staleAfterSeconds * 1_000
  ) {
    status = 'STALE';
  } else status = 'FRESH';

  return {
    status,
    recalculatedAt: input.recalculatedAt,
    sourceChangedAt: input.sourceChangedAt,
    staleAfterSeconds: input.staleAfterSeconds,
    failedItemsCount,
  };
}
