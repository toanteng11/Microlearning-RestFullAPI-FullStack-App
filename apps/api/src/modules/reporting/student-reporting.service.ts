import { randomUUID } from 'node:crypto';

import { Types } from 'mongoose';

import { AppError } from '../../shared/errors/app-error.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { StudentLearningService } from '../learning-progress/student-learning.service.js';
import type { CourseProgressSummaryRecord } from './course-progress-summary.model.js';
import type { CourseProgressSummaryRepository } from './course-progress-summary.repository.js';
import {
  REPORTING_DESCRIPTOR_VERSION,
  REPORTING_SOURCE_METRIC_VERSION,
  STUDENT_DASHBOARD_VERSION,
} from './reporting.constants.js';
import { toReportMetadataDto } from './reporting.dto.js';
import type {
  StudentCourseDetailQuery,
  StudentCourseListQuery,
  StudentDashboardQuery,
} from './reporting.schemas.js';
import type { ReportingRefreshService } from './reporting-refresh.service.js';
import type { ReportingScopeReader } from './reporting-scope.reader.js';
import type {
  StudentReportingCourseScope,
  StudentReportingSource,
} from './student-reporting.source.js';
import type {
  ReportFilterValue,
  ReportFreshnessStatus,
  ReportingProgressStatus,
} from './reporting.types.js';

interface StudentReportingOptions {
  enabled: boolean;
  timezone: string;
  staleAfterSeconds: number;
  inlineRefreshMaxStudents: number;
  refreshRequestBudgetMs: number;
  dueSoonWindowHours: number;
  trendEnabled: boolean;
}

interface CourseSummaryContext {
  scope: StudentReportingCourseScope;
  summary: CourseProgressSummaryRecord;
}

function assertStudent(actor: AuthenticatedUser) {
  if (actor.role !== 'STUDENT') throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
}

function paginationMeta(page: number, limit: number, totalItems: number) {
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && totalPages > 0,
  };
}

function maxDate(values: readonly (Date | null | undefined)[]) {
  return (
    values
      .filter((value): value is Date => value instanceof Date)
      .sort((left, right) => right.getTime() - left.getTime())[0] ?? null
  );
}

function progressStatus(summary: CourseProgressSummaryRecord): ReportingProgressStatus {
  if (summary.missingActivityCount > 0) return 'MISSING';
  if (summary.courseCompleted && summary.lateActivityCount > 0) return 'LATE';
  if (summary.courseCompleted) return 'COMPLETED';
  if (summary.completedRequiredCount === 0) return 'NOT_STARTED';
  return 'IN_PROGRESS';
}

function courseSummaryDto(context: CourseSummaryContext, trendEnabled: boolean) {
  const { scope, summary } = context;
  return {
    classroom: { id: scope.classroomId, name: scope.classroomName },
    course: { id: scope.courseId, title: scope.courseTitle },
    requiredActivityCount: summary.requiredActivityCount,
    completedRequiredCount: summary.completedRequiredCount,
    progressPercentage: summary.progressPercentage,
    processScore: summary.processScore,
    progressStatus: progressStatus(summary),
    missingCount: summary.missingActivityCount,
    lateCount: summary.lateActivityCount,
    returnedGradeAverage: summary.returnedGradeAverage,
    lastActiveAt: summary.lastActiveAt?.toISOString() ?? null,
    courseCompleted: summary.courseCompleted,
    actionUrl: `/student/courses/${scope.courseId}`,
    recalculatedAt: summary.recalculatedAt.toISOString(),
    allowedActions: trendEnabled ? (['VIEW_PROGRESS_TREND'] as const) : ([] as const),
  };
}

function compareNullable<T>(
  left: T | null,
  right: T | null,
  compare: (a: T, b: T) => number,
  direction: 1 | -1,
) {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return compare(left, right) * direction;
}

export class StudentReportingService {
  constructor(
    private readonly source: StudentReportingSource,
    private readonly scopes: ReportingScopeReader,
    private readonly summaries: CourseProgressSummaryRepository,
    private readonly refresh: ReportingRefreshService,
    private readonly learning: StudentLearningService,
    private readonly options: StudentReportingOptions,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private assertAvailable(actor: AuthenticatedUser) {
    assertStudent(actor);
    if (!this.options.enabled) {
      throw new AppError(503, 'FEATURE_DISABLED', 'Reporting is temporarily unavailable');
    }
  }

  private isStale(summary: CourseProgressSummaryRecord, asOf: Date) {
    return (
      summary.refreshStatus !== 'FRESH' ||
      summary.sourceChangedAt > summary.recalculatedAt ||
      asOf.getTime() - summary.recalculatedAt.getTime() > this.options.staleAfterSeconds * 1_000
    );
  }

  private async loadSummaries(
    studentId: string,
    scopes: readonly StudentReportingCourseScope[],
    asOf: Date,
  ) {
    const existing = await this.summaries.listByStudent(new Types.ObjectId(studentId));
    const byCourse = new Map(existing.map((summary) => [summary.courseId.toString(), summary]));
    const targets = scopes.filter((scope) => {
      const summary = byCourse.get(scope.courseId);
      return !summary || this.isStale(summary, asOf);
    });
    const startedAt = Date.now();
    const failedCourseIds = new Set<string>();
    for (let offset = 0; offset < targets.length; offset += this.options.inlineRefreshMaxStudents) {
      if (offset > 0 && Date.now() - startedAt >= this.options.refreshRequestBudgetMs) break;
      const batch = targets.slice(offset, offset + this.options.inlineRefreshMaxStudents);
      const refreshed = await Promise.allSettled(
        batch.map((scope) => this.refresh.refreshStudent(scope.courseId, studentId, asOf)),
      );
      refreshed.forEach((result, index) => {
        const courseId = batch[index]!.courseId;
        if (result.status === 'fulfilled' && result.value) byCourse.set(courseId, result.value);
        else failedCourseIds.add(courseId);
      });
    }
    const items = scopes.flatMap((scope) => {
      const summary = byCourse.get(scope.courseId);
      return summary ? [{ scope, summary }] : [];
    });
    const missingWithoutAttempt = scopes.filter(
      (scope) => !byCourse.has(scope.courseId) && !failedCourseIds.has(scope.courseId),
    ).length;
    return { items, failedItemsCount: failedCourseIds.size + missingWithoutAttempt };
  }

  private metadata(
    definitionVersion: string,
    contexts: readonly CourseSummaryContext[],
    failedItemsCount: number,
    asOf: Date,
    timezone: string,
    filters: Readonly<Record<string, ReportFilterValue>>,
    dataState: 'READY' | 'NO_DATA' = contexts.length === 0 ? 'NO_DATA' : 'READY',
  ) {
    const staleCount = contexts.filter((context) => this.isStale(context.summary, asOf)).length;
    let status: ReportFreshnessStatus = 'FRESH';
    if (failedItemsCount > 0 && contexts.length === 0) status = 'FAILED';
    else if (failedItemsCount > 0 || (staleCount > 0 && staleCount < contexts.length))
      status = 'PARTIAL';
    else if (staleCount > 0) status = 'STALE';
    return toReportMetadataDto({
      reportId: randomUUID(),
      definitionVersion,
      sourceMetricVersion: REPORTING_SOURCE_METRIC_VERSION,
      descriptorVersion: REPORTING_DESCRIPTOR_VERSION,
      dataState,
      timezone,
      asOf,
      generatedAt: this.now(),
      freshness: {
        status,
        recalculatedAt: maxDate(contexts.map((context) => context.summary.recalculatedAt)),
        sourceChangedAt: maxDate(contexts.map((context) => context.summary.sourceChangedAt)),
        staleAfterSeconds: this.options.staleAfterSeconds,
        failedItemsCount,
      },
      filters,
    });
  }

  async dashboard(actor: AuthenticatedUser, query: StudentDashboardQuery) {
    this.assertAvailable(actor);
    const todo = await this.learning.todoDashboard(
      actor,
      query.todoLimit,
      this.options.dueSoonWindowHours,
    );
    const asOf = todo.asOf;
    const [source, recentGrades] = await Promise.all([
      this.source.listActiveCourses(actor.id, asOf),
      this.source.listRecentReturnedGrades(actor.id, query.gradeLimit),
    ]);
    const loaded = await this.loadSummaries(actor.id, source.courses, asOf);
    const courseContexts = [...loaded.items]
      .sort(
        (left, right) =>
          compareNullable(
            left.summary.lastActiveAt,
            right.summary.lastActiveAt,
            (a, b) => a.getTime() - b.getTime(),
            -1,
          ) || left.scope.courseId.localeCompare(right.scope.courseId),
      )
      .slice(0, query.courseLimit);
    const timezone = query.timezone ?? this.options.timezone;
    return {
      summary: {
        activeClassroomCount: source.activeClassroomCount,
        activeCourseCount: source.courses.length,
        pendingCount: todo.totalItems,
        dueSoonCount: todo.dueSoonCount,
        missingCount: todo.missingCount,
      },
      todo: {
        items: todo.items,
        totalItems: todo.totalItems,
        scopeVersion: todo.scopeVersion,
      },
      courses: courseContexts.map((context) =>
        courseSummaryDto(context, this.options.trendEnabled),
      ),
      recentGrades: recentGrades.map((grade) => ({
        ...grade,
        returnedAt: grade.returnedAt.toISOString(),
      })),
      reporting: this.metadata(
        STUDENT_DASHBOARD_VERSION,
        loaded.items,
        loaded.failedItemsCount,
        asOf,
        timezone,
        {
          todoLimit: query.todoLimit,
          courseLimit: query.courseLimit,
          gradeLimit: query.gradeLimit,
        },
        todo.totalItems > 0 || source.courses.length > 0 || recentGrades.length > 0
          ? 'READY'
          : 'NO_DATA',
      ),
    };
  }

  async course(actor: AuthenticatedUser, query: StudentCourseDetailQuery) {
    this.assertAvailable(actor);
    const asOf = this.now();
    const scope = await this.scopes.requireStudentCourse(actor.id, query.courseId);
    const summary = await this.refresh.refreshStudent(scope.courseId, actor.id, asOf);
    if (!summary) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Course was not found');
    const context = { scope, summary };
    return {
      ...courseSummaryDto(context, this.options.trendEnabled),
      metricVersion: REPORTING_SOURCE_METRIC_VERSION,
      descriptorVersion: REPORTING_DESCRIPTOR_VERSION,
      reporting: this.metadata(
        REPORTING_SOURCE_METRIC_VERSION,
        [context],
        0,
        asOf,
        query.timezone ?? this.options.timezone,
        { courseId: query.courseId },
      ),
    };
  }

  async courses(actor: AuthenticatedUser, query: StudentCourseListQuery) {
    this.assertAvailable(actor);
    const asOf = this.now();
    const source = await this.source.listActiveCourses(actor.id, asOf);
    const loaded = await this.loadSummaries(actor.id, source.courses, asOf);
    const direction: 1 | -1 = query.sortOrder === 'asc' ? 1 : -1;
    const filtered = loaded.items
      .filter(
        (context) =>
          !query.progressStatus || progressStatus(context.summary) === query.progressStatus,
      )
      .sort((left, right) => {
        let compared: number;
        if (query.sortBy === 'courseTitle') {
          compared =
            left.scope.courseTitle.localeCompare(right.scope.courseTitle, 'vi', {
              sensitivity: 'base',
            }) * direction;
        } else if (query.sortBy === 'processScore') {
          compared = compareNullable(
            left.summary.processScore,
            right.summary.processScore,
            (a, b) => a - b,
            direction,
          );
        } else {
          compared = compareNullable(
            left.summary.lastActiveAt,
            right.summary.lastActiveAt,
            (a, b) => a.getTime() - b.getTime(),
            direction,
          );
        }
        return compared || left.scope.courseId.localeCompare(right.scope.courseId);
      });
    const start = (query.page - 1) * query.limit;
    return {
      data: {
        items: filtered
          .slice(start, start + query.limit)
          .map((context) => courseSummaryDto(context, this.options.trendEnabled)),
        reporting: this.metadata(
          REPORTING_SOURCE_METRIC_VERSION,
          loaded.items,
          loaded.failedItemsCount,
          asOf,
          this.options.timezone,
          {
            page: query.page,
            limit: query.limit,
            progressStatus: query.progressStatus ?? null,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
          },
        ),
      },
      meta: paginationMeta(query.page, query.limit, filtered.length),
    };
  }
}
