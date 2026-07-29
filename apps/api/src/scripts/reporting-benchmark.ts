import { performance } from 'node:perf_hooks';

import { CourseProgressCalculator } from '../modules/reporting/course-progress.calculator.js';
import type { ReportingActivity, ReportingProgress } from '../modules/reporting/reporting.types.js';
import {
  assertKnownArguments,
  positiveIntegerArgument,
  writeCliFailure,
  writeCliSuccess,
} from './reporting-cli-support.js';

function percentile(values: readonly number[], fraction: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))] ?? 0;
}

async function main() {
  const arguments_ = process.argv.slice(2);
  assertKnownArguments(arguments_, ['students', 'activities', 'iterations']);
  const students = positiveIntegerArgument(arguments_, 'students') ?? 100;
  const activityCount = positiveIntegerArgument(arguments_, 'activities') ?? 50;
  const iterations = positiveIntegerArgument(arguments_, 'iterations') ?? 3;
  const now = new Date('2026-01-01T00:00:00.000Z');
  const activities: ReportingActivity[] = Array.from({ length: activityCount }, (_, index) => ({
    activityId: `activity-${index + 1}`,
    activityType: index % 3 === 0 ? 'LESSON' : index % 3 === 1 ? 'QUIZ' : 'ASSIGNMENT',
    classroomId: 'benchmark-classroom',
    courseId: 'benchmark-course',
    moduleId: null,
    title: `Activity ${index + 1}`,
    isRequired: true,
    lifecycleStatus: 'PUBLISHED',
    visible: true,
    defaultDeadline: new Date(now.getTime() + 86_400_000),
    maxScore: index % 3 === 0 ? null : 10,
    displayOrder: index,
    sourceUpdatedAt: now,
  }));
  const progress: ReportingProgress[] = Array.from({ length: students }, (_, studentIndex) =>
    activities.slice(0, Math.ceil(activityCount * 0.7)).map((activity, activityIndex) => ({
      studentId: `student-${studentIndex + 1}`,
      courseId: 'benchmark-course',
      activityId: activity.activityId,
      activityType: activity.activityType,
      status: 'COMPLETED' as const,
      startedAt: new Date(now.getTime() - 3_600_000),
      completedAt: new Date(now.getTime() - 1_800_000 + activityIndex),
      lastActiveAt: new Date(now.getTime() - activityIndex),
      sourceUpdatedAt: now,
    })),
  ).flat();
  const calculator = new CourseProgressCalculator();
  const durations: number[] = [];

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const startedAt = performance.now();
    for (let studentIndex = 0; studentIndex < students; studentIndex += 1) {
      calculator.calculate({
        asOf: now,
        courseId: 'benchmark-course',
        classroomId: 'benchmark-classroom',
        studentId: `student-${studentIndex + 1}`,
        activities,
        progress,
        grades: [],
        deadlineExceptions: [],
      });
    }
    durations.push(performance.now() - startedAt);
  }

  writeCliSuccess('reporting.benchmark.completed', {
    dataset: { students, activities: activityCount },
    iterations,
    durationMs: {
      min: Number(Math.min(...durations).toFixed(2)),
      p50: Number(percentile(durations, 0.5).toFixed(2)),
      p95: Number(percentile(durations, 0.95).toFixed(2)),
      max: Number(Math.max(...durations).toFixed(2)),
    },
    heapUsedMb: Number((process.memoryUsage().heapUsed / 1_048_576).toFixed(2)),
  });
}

main().catch((error: unknown) => writeCliFailure('reporting.benchmark.failed', error));
