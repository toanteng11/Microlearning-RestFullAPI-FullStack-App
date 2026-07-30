import { Types } from 'mongoose';
import { describe, expect, it, vi } from 'vitest';

import type { AuthenticatedUser } from '../src/modules/auth/auth.types.js';
import type { StudentLearningService } from '../src/modules/learning-progress/student-learning.service.js';
import type { CourseProgressSummaryRecord } from '../src/modules/reporting/course-progress-summary.model.js';
import type { CourseProgressSummaryRepository } from '../src/modules/reporting/course-progress-summary.repository.js';
import type { ReportingRefreshService } from '../src/modules/reporting/reporting-refresh.service.js';
import type { ReportingScopeReader } from '../src/modules/reporting/reporting-scope.reader.js';
import { StudentReportingService } from '../src/modules/reporting/student-reporting.service.js';
import type { StudentReportingSource } from '../src/modules/reporting/student-reporting.source.js';

const now = new Date('2026-07-30T03:00:00.000Z');
const studentId = new Types.ObjectId().toString();
const classroomId = new Types.ObjectId().toString();
const actor: AuthenticatedUser = {
  id: studentId,
  role: 'STUDENT',
  status: 'ACTIVE',
  familyId: 'family-1',
  capabilities: ['learning.view_enrolled'],
};

function summary(courseId: string, values: Partial<CourseProgressSummaryRecord> = {}) {
  return {
    _id: new Types.ObjectId(),
    schemaVersion: 1,
    courseId: new Types.ObjectId(courseId),
    classroomId: new Types.ObjectId(classroomId),
    studentId: new Types.ObjectId(studentId),
    sourceMetricVersion: 'P05_REQUIRED_ACTIVITY_COMPLETION_V1',
    descriptorVersion: 'P05_ACTIVITY_DESCRIPTOR_V2',
    processScoreVersion: 'P06_PROCESS_SCORE_V1',
    requiredActivityCount: 4,
    completedRequiredCount: 2,
    progressPercentage: 50,
    processScore: 50,
    missingActivityCount: 1,
    lateActivityCount: 0,
    ungradedActivityCount: 0,
    returnedGradeCount: 1,
    gradePointsEarned: 8,
    gradePointsPossible: 10,
    returnedGradeAverage: 80,
    lastActiveAt: new Date('2026-07-30T02:00:00.000Z'),
    courseCompleted: false,
    supportFlags: ['HAS_MISSING_WORK'],
    sourceChangedAt: new Date('2026-07-30T02:00:00.000Z'),
    recalculatedAt: new Date('2026-07-30T02:59:00.000Z'),
    refreshStatus: 'FRESH',
    revision: 1,
    createdAt: now,
    updatedAt: now,
    ...values,
  } satisfies CourseProgressSummaryRecord;
}

function serviceFixture(input?: {
  courses?: Array<{ courseId: string; courseTitle: string }>;
  summaries?: CourseProgressSummaryRecord[];
}) {
  const courses = (
    input?.courses ?? [{ courseId: new Types.ObjectId().toString(), courseTitle: 'REST API' }]
  ).map((course) => ({
    ...course,
    classroomId,
    classroomName: 'Backend Classroom',
  }));
  const rows = input?.summaries ?? [summary(courses[0]!.courseId)];
  const source = {
    listActiveCourses: vi.fn().mockResolvedValue({
      activeClassroomCount: 1,
      courses,
    }),
    listRecentReturnedGrades: vi.fn().mockResolvedValue([
      {
        gradeId: new Types.ObjectId().toString(),
        activityId: new Types.ObjectId().toString(),
        activityType: 'QUIZ',
        activityTitle: 'HTTP Quiz',
        score: 8,
        maxScore: 10,
        normalizedScore: 80,
        returnedAt: now,
        actionUrl: '/student/grades/grade-1',
      },
    ]),
  } satisfies StudentReportingSource;
  const summaries = {
    listByStudent: vi.fn().mockResolvedValue(rows),
  };
  const refresh = {
    refreshStudent: vi.fn(
      async (courseId: string) => rows.find((row) => row.courseId.toString() === courseId) ?? null,
    ),
  };
  const learning = {
    todoDashboard: vi.fn().mockResolvedValue({
      items: [],
      totalItems: 3,
      missingCount: 1,
      dueSoonCount: 1,
      scopeVersion: 'P05_MIXED_ACTIVITY_TODO_V2',
      asOf: now,
    }),
  };
  const scopes = {
    requireStudentCourse: vi.fn(async (_actorId: string, courseId: string) => {
      const course = courses.find((item) => item.courseId === courseId)!;
      return { ...course, studentId };
    }),
  };
  const service = new StudentReportingService(
    source,
    scopes as unknown as ReportingScopeReader,
    summaries as unknown as CourseProgressSummaryRepository,
    refresh as unknown as ReportingRefreshService,
    learning as unknown as StudentLearningService,
    {
      enabled: true,
      timezone: 'Asia/Ho_Chi_Minh',
      staleAfterSeconds: 300,
      inlineRefreshMaxStudents: 5,
      refreshRequestBudgetMs: 900,
      dueSoonWindowHours: 72,
    },
    () => now,
  );
  return { service, source, scopes, refresh };
}

describe('Phase 06 Student reporting service', () => {
  it('combines canonical To-do counts, current Course summary and returned Grade only', async () => {
    const fixture = serviceFixture();
    const result = await fixture.service.dashboard(actor, {
      todoLimit: 5,
      courseLimit: 5,
      gradeLimit: 5,
    });
    expect(result.summary).toEqual({
      activeClassroomCount: 1,
      activeCourseCount: 1,
      pendingCount: 3,
      dueSoonCount: 1,
      missingCount: 1,
    });
    expect(result.courses[0]).toMatchObject({
      progressStatus: 'MISSING',
      progressPercentage: 50,
      returnedGradeAverage: 80,
    });
    expect(result.recentGrades).toEqual([
      expect.objectContaining({ activityTitle: 'HTTP Quiz', normalizedScore: 80 }),
    ]);
    expect(result.reporting.freshness.status).toBe('FRESH');
  });

  it('sorts nullable process scores last and keeps Course id as a stable tie-breaker', async () => {
    const firstId = new Types.ObjectId().toString();
    const secondId = new Types.ObjectId().toString();
    const fixture = serviceFixture({
      courses: [
        { courseId: secondId, courseTitle: 'No denominator' },
        { courseId: firstId, courseTitle: 'Scored Course' },
      ],
      summaries: [
        summary(secondId, {
          requiredActivityCount: 0,
          completedRequiredCount: 0,
          progressPercentage: null,
          processScore: null,
          returnedGradeAverage: null,
          missingActivityCount: 0,
          supportFlags: ['NO_REQUIRED_ACTIVITY'],
        }),
        summary(firstId, { processScore: 70, progressPercentage: 70 }),
      ],
    });
    const result = await fixture.service.courses(actor, {
      page: 1,
      limit: 20,
      sortBy: 'processScore',
      sortOrder: 'asc',
    });
    expect(result.data.items.map((item) => item.course.id)).toEqual([firstId, secondId]);
    expect(result.data.items[1]?.processScore).toBeNull();
  });

  it('resolves Course scope from the actor and never accepts a Student identifier', async () => {
    const fixture = serviceFixture();
    const courseId = (await fixture.source.listActiveCourses(studentId, now)).courses[0]!.courseId;
    await fixture.service.course(actor, { courseId });
    expect(fixture.scopes.requireStudentCourse).toHaveBeenCalledWith(studentId, courseId);
    expect(fixture.refresh.refreshStudent).toHaveBeenCalledWith(courseId, studentId, now);
  });
});
