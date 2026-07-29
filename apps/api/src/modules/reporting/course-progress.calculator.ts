import { calculateReturnedGradeAverage } from './grade-average.policy.js';
import { findActivityProgress, isRequiredReportingActivity } from './metric-definition.policy.js';
import { calculateCompletionMetrics } from './process-score.policy.js';
import type {
  CourseProgressCalculationInput,
  CourseProgressCalculationResult,
  ReportingSupportFlag,
} from './reporting.types.js';

export class CourseProgressCalculator {
  calculate(input: CourseProgressCalculationInput): CourseProgressCalculationResult {
    const completion = calculateCompletionMetrics(input);
    const studentGrades = input.grades.filter((grade) => grade.studentId === input.studentId);
    const gradeAverage = calculateReturnedGradeAverage(studentGrades);
    const requiredActivities = input.activities.filter(isRequiredReportingActivity);

    let ungradedActivityCount = 0;
    for (const activity of requiredActivities) {
      if (activity.activityType === 'LESSON') continue;
      const progress = findActivityProgress(activity, input.studentId, input.progress);
      if (progress?.status !== 'COMPLETED') continue;
      const grade = studentGrades.find(
        (entry) =>
          entry.activityId === activity.activityId && entry.activityType === activity.activityType,
      );
      if (!grade || grade.status === 'DRAFT') ungradedActivityCount += 1;
    }

    const lastActiveAt =
      input.progress
        .filter((row) => row.studentId === input.studentId)
        .map((row) => row.lastActiveAt)
        .sort((left, right) => right.getTime() - left.getTime())[0] ?? null;

    const supportFlags: ReportingSupportFlag[] = [];
    if (completion.missingActivityCount > 0) supportFlags.push('HAS_MISSING_WORK');
    if (ungradedActivityCount > 0) supportFlags.push('HAS_UNGRADED_WORK');
    if (!lastActiveAt) supportFlags.push('NO_RECENT_ACTIVITY');
    if (completion.requiredActivityCount === 0) supportFlags.push('NO_REQUIRED_ACTIVITY');

    return {
      ...completion,
      ...gradeAverage,
      ungradedActivityCount,
      lastActiveAt,
      supportFlags,
    };
  }
}
