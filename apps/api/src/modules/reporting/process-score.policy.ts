import {
  effectiveDeadline,
  findActivityProgress,
  isRequiredReportingActivity,
  roundHalfUp,
} from './metric-definition.policy.js';
import type { CourseProgressCalculationInput, ReportingProgressStatus } from './reporting.types.js';

export function calculateProgressPercentage(completed: number, required: number): number | null {
  if (required === 0) return null;
  return roundHalfUp((completed / required) * 100);
}

export function calculateProcessScore(completed: number, required: number): number | null {
  return calculateProgressPercentage(completed, required);
}

export function resolveProgressStatus(
  input: Pick<
    CourseProgressCalculationInput,
    'asOf' | 'studentId' | 'progress' | 'deadlineExceptions'
  >,
  activity: CourseProgressCalculationInput['activities'][number],
): ReportingProgressStatus {
  const current = findActivityProgress(activity, input.studentId, input.progress);
  const deadline = effectiveDeadline(activity, input.studentId, input.deadlineExceptions);
  if (current?.status === 'COMPLETED') {
    return deadline && current.completedAt && current.completedAt > deadline ? 'LATE' : 'COMPLETED';
  }
  if (deadline && deadline < input.asOf) return 'MISSING';
  return current ? 'IN_PROGRESS' : 'NOT_STARTED';
}

export function calculateCompletionMetrics(
  input: Pick<
    CourseProgressCalculationInput,
    'asOf' | 'studentId' | 'activities' | 'progress' | 'deadlineExceptions'
  >,
) {
  const requiredActivities = input.activities.filter(isRequiredReportingActivity);
  let completedRequiredCount = 0;
  let missingActivityCount = 0;
  let lateActivityCount = 0;

  for (const activity of requiredActivities) {
    const status = resolveProgressStatus(input, activity);
    if (status === 'COMPLETED' || status === 'LATE') completedRequiredCount += 1;
    if (status === 'MISSING') missingActivityCount += 1;
    if (status === 'LATE') lateActivityCount += 1;
  }

  const requiredActivityCount = requiredActivities.length;
  const progressPercentage = calculateProgressPercentage(
    completedRequiredCount,
    requiredActivityCount,
  );
  return {
    requiredActivityCount,
    completedRequiredCount,
    progressPercentage,
    processScore: progressPercentage,
    missingActivityCount,
    lateActivityCount,
    courseCompleted: requiredActivityCount > 0 && completedRequiredCount === requiredActivityCount,
  };
}
