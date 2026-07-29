import { describe, expect, it } from 'vitest';

import { CourseProgressCalculator } from '../src/modules/reporting/course-progress.calculator.js';
import { calculateReturnedGradeAverage } from '../src/modules/reporting/grade-average.policy.js';
import { resolveGradebookCell } from '../src/modules/reporting/gradebook-cell.policy.js';
import {
  resolveFreshness,
  roundHalfUp,
} from '../src/modules/reporting/metric-definition.policy.js';
import {
  calculateCompletionMetrics,
  calculateProcessScore,
  resolveProgressStatus,
} from '../src/modules/reporting/process-score.policy.js';
import { rankCandidates } from '../src/modules/reporting/ranking.policy.js';
import type {
  ReportingActivity,
  ReportingDeadlineException,
  ReportingGrade,
  ReportingProgress,
} from '../src/modules/reporting/reporting.types.js';

const asOf = new Date('2026-08-01T12:00:00.000Z');

function activity(id: string, patch: Partial<ReportingActivity> = {}): ReportingActivity {
  return {
    activityId: id,
    activityType: 'LESSON',
    classroomId: 'classroom-1',
    courseId: 'course-1',
    moduleId: null,
    title: id,
    isRequired: true,
    lifecycleStatus: 'PUBLISHED',
    visible: true,
    defaultDeadline: new Date('2026-08-01T10:00:00.000Z'),
    maxScore: null,
    displayOrder: 0,
    sourceUpdatedAt: asOf,
    ...patch,
  };
}

function progress(activityId: string, patch: Partial<ReportingProgress> = {}): ReportingProgress {
  return {
    studentId: 'student-1',
    courseId: 'course-1',
    activityId,
    activityType: 'LESSON',
    status: 'COMPLETED',
    startedAt: new Date('2026-08-01T08:00:00.000Z'),
    completedAt: new Date('2026-08-01T09:00:00.000Z'),
    lastActiveAt: new Date('2026-08-01T09:00:00.000Z'),
    sourceUpdatedAt: asOf,
    ...patch,
  };
}

function grade(
  id: string,
  score: number,
  maxScore: number,
  patch: Partial<ReportingGrade> = {},
): ReportingGrade {
  return {
    gradeId: id,
    studentId: 'student-1',
    courseId: 'course-1',
    activityId: `activity-${id}`,
    activityType: 'QUIZ',
    status: 'RETURNED',
    score,
    maxScore,
    returnedAt: asOf,
    revision: 1,
    sourceUpdatedAt: asOf,
    ...patch,
  };
}

describe('Phase 06 reporting metric policies', () => {
  it('uses null for an empty denominator and one-decimal half-up rounding', () => {
    expect(calculateProcessScore(0, 0)).toBeNull();
    expect(calculateProcessScore(2, 3)).toBe(66.7);
    expect(roundHalfUp(66.65)).toBe(66.7);
  });

  it('counts only visible required activities from eligible lifecycle states', () => {
    const result = calculateCompletionMetrics({
      asOf,
      studentId: 'student-1',
      activities: [
        activity('required-complete'),
        activity('optional', { isRequired: false }),
        activity('hidden', { visible: false }),
        activity('draft', { lifecycleStatus: 'DRAFT' }),
        activity('missing'),
      ],
      progress: [progress('required-complete')],
      deadlineExceptions: [],
    });
    expect(result).toEqual({
      requiredActivityCount: 2,
      completedRequiredCount: 1,
      progressPercentage: 50,
      processScore: 50,
      missingActivityCount: 1,
      lateActivityCount: 0,
      courseCompleted: false,
    });
  });

  it('classifies completion, late, missing and active deadline exceptions deterministically', () => {
    const lateActivity = activity('late');
    expect(
      resolveProgressStatus(
        {
          asOf,
          studentId: 'student-1',
          progress: [
            progress('late', {
              completedAt: new Date('2026-08-01T11:00:00.000Z'),
            }),
          ],
          deadlineExceptions: [],
        },
        lateActivity,
      ),
    ).toBe('LATE');
    expect(
      resolveProgressStatus(
        { asOf, studentId: 'student-1', progress: [], deadlineExceptions: [] },
        activity('missing'),
      ),
    ).toBe('MISSING');

    const exceptions: ReportingDeadlineException[] = [
      {
        studentId: 'student-1',
        courseId: 'course-1',
        activityId: 'extended',
        activityType: 'LESSON',
        deadline: new Date('2026-08-02T10:00:00.000Z'),
        active: true,
        revision: 1,
        sourceUpdatedAt: asOf,
      },
    ];
    expect(
      resolveProgressStatus(
        { asOf, studentId: 'student-1', progress: [], deadlineExceptions: exceptions },
        activity('extended'),
      ),
    ).toBe('NOT_STARTED');
  });

  it('calculates a points-weighted average from returned grades only', () => {
    expect(
      calculateReturnedGradeAverage([
        grade('one', 5, 10),
        grade('two', 90, 100),
        grade('draft', 10, 10, { status: 'DRAFT', returnedAt: null }),
      ]),
    ).toEqual({
      returnedGradeCount: 2,
      gradePointsEarned: 95,
      gradePointsPossible: 110,
      returnedGradeAverage: 86.4,
    });
  });

  it('applies the full stable ranking tie-break chain with null scores last', () => {
    const ranked = rankCandidates([
      {
        studentId: 'student-c',
        processScore: null,
        completedRequiredCount: 10,
        missingActivityCount: 0,
        lateActivityCount: 0,
        lastActiveAt: asOf,
      },
      {
        studentId: 'student-b',
        processScore: 80,
        completedRequiredCount: 8,
        missingActivityCount: 1,
        lateActivityCount: 0,
        lastActiveAt: new Date('2026-08-01T09:00:00.000Z'),
      },
      {
        studentId: 'student-a',
        processScore: 80,
        completedRequiredCount: 8,
        missingActivityCount: 1,
        lateActivityCount: 0,
        lastActiveAt: new Date('2026-08-01T09:00:00.000Z'),
      },
    ]);
    expect(ranked.map(({ studentId, rank }) => ({ studentId, rank }))).toEqual([
      { studentId: 'student-a', rank: 1 },
      { studentId: 'student-b', rank: 2 },
      { studentId: 'student-c', rank: 3 },
    ]);
  });

  it('keeps completion and grading dimensions independent in gradebook cells', () => {
    expect(
      resolveGradebookCell({
        completionStatus: 'COMPLETED',
        gradable: true,
        terminalEvidence: true,
        grade: null,
      }),
    ).toEqual({
      completionStatus: 'COMPLETED',
      gradingStatus: 'AWAITING_GRADE',
      score: null,
      maxScore: null,
    });
    expect(
      resolveGradebookCell({
        completionStatus: 'NOT_APPLICABLE',
        gradable: false,
        terminalEvidence: false,
        grade: null,
      }).gradingStatus,
    ).toBe('NOT_GRADABLE');
  });

  it('publishes fresh, stale, partial, rebuilding and failed states honestly', () => {
    const recalculatedAt = new Date('2026-08-01T11:59:00.000Z');
    expect(
      resolveFreshness({
        recalculatedAt,
        sourceChangedAt: recalculatedAt,
        now: asOf,
        staleAfterSeconds: 300,
        hasTrustworthySnapshot: true,
      }).status,
    ).toBe('FRESH');
    expect(
      resolveFreshness({
        recalculatedAt,
        sourceChangedAt: new Date('2026-08-01T12:00:00.000Z'),
        now: asOf,
        staleAfterSeconds: 300,
        hasTrustworthySnapshot: true,
      }).status,
    ).toBe('STALE');
    expect(
      resolveFreshness({
        recalculatedAt,
        sourceChangedAt: null,
        now: asOf,
        staleAfterSeconds: 300,
        failedItemsCount: 1,
        hasTrustworthySnapshot: true,
      }).status,
    ).toBe('PARTIAL');
    expect(
      resolveFreshness({
        recalculatedAt,
        sourceChangedAt: null,
        now: asOf,
        staleAfterSeconds: 300,
        rebuilding: true,
      }).status,
    ).toBe('REBUILDING');
    expect(
      resolveFreshness({
        recalculatedAt: null,
        sourceChangedAt: null,
        now: asOf,
        staleAfterSeconds: 300,
        failedItemsCount: 1,
        hasTrustworthySnapshot: false,
      }).status,
    ).toBe('FAILED');
  });

  it('composes completion, ungraded work, returned grades and support flags', () => {
    const quiz = activity('quiz', {
      activityType: 'QUIZ',
      maxScore: 10,
    });
    const result = new CourseProgressCalculator().calculate({
      asOf,
      courseId: 'course-1',
      classroomId: 'classroom-1',
      studentId: 'student-1',
      activities: [quiz],
      progress: [progress('quiz', { activityType: 'QUIZ' })],
      grades: [],
      deadlineExceptions: [],
    });
    expect(result).toMatchObject({
      processScore: 100,
      ungradedActivityCount: 1,
      returnedGradeAverage: null,
      courseCompleted: true,
    });
    expect(result.supportFlags).toContain('HAS_UNGRADED_WORK');
  });
});
