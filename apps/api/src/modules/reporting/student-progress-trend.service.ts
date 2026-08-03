import { randomUUID } from 'node:crypto';

import { Types } from 'mongoose';

import { AppError } from '../../shared/errors/app-error.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import {
  REPORTING_DESCRIPTOR_VERSION,
  REPORTING_SOURCE_METRIC_VERSION,
  STUDENT_PROGRESS_TREND_VERSION,
} from './reporting.constants.js';
import { CourseProgressSnapshotRepository } from './course-progress-snapshot.repository.js';
import { normalizeReportingDateRange } from './reporting-date-range.js';
import { toReportMetadataDto } from './reporting.dto.js';
import type { ReportingRefreshService } from './reporting-refresh.service.js';
import type { ReportingScopeReader } from './reporting-scope.reader.js';
import type { StudentTrendQuery } from './reporting.schemas.js';

interface StudentProgressTrendOptions {
  enabled: boolean;
  timezone: string;
  maxDateRangeDays: number;
  staleAfterSeconds: number;
}

function difference(last: number | null, first: number | null) {
  return last === null || first === null ? null : Math.round((last - first) * 100) / 100;
}

export class StudentProgressTrendService {
  constructor(
    private readonly scopes: ReportingScopeReader,
    private readonly snapshots: CourseProgressSnapshotRepository,
    private readonly refresh: ReportingRefreshService,
    private readonly options: StudentProgressTrendOptions,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async trend(actor: AuthenticatedUser, query: StudentTrendQuery) {
    if (actor.role !== 'STUDENT') throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
    if (!this.options.enabled) {
      throw new AppError(409, 'FEATURE_NOT_ENABLED', 'Student progress trend is not enabled');
    }
    const asOf = this.now();
    const range = normalizeReportingDateRange(query, {
      timezone: this.options.timezone,
      maxDateRangeDays: this.options.maxDateRangeDays,
      now: asOf,
    });
    const scope = await this.scopes.requireStudentCourse(actor.id, query.courseId);
    await this.refresh.refreshStudent(scope.courseId, actor.id, asOf);
    const courseId = new Types.ObjectId(scope.courseId);
    const studentId = new Types.ObjectId(actor.id);
    const [points, allCount] = await Promise.all([
      this.snapshots.listCompatible(courseId, studentId, range.from, range.to),
      this.snapshots.countAll(courseId, studentId, range.from, range.to),
    ]);
    const distinctPoints = points.filter(
      (point, index) =>
        index === 0 || point.capturedAt.getTime() !== points[index - 1]!.capturedAt.getTime(),
    );
    const hasTrend = distinctPoints.length >= 2;
    const first = hasTrend ? distinctPoints[0]! : null;
    const last = hasTrend ? distinctPoints.at(-1)! : null;
    const noDataReason = hasTrend
      ? null
      : allCount > points.length
        ? 'INCOMPATIBLE_VERSION'
        : 'INSUFFICIENT_SNAPSHOTS';
    return {
      course: { id: scope.courseId, title: scope.courseTitle },
      points: hasTrend
        ? distinctPoints.map((point) => ({
            capturedAt: point.capturedAt.toISOString(),
            progressPercentage: point.progressPercentage,
            processScore: point.processScore,
            returnedGradeAverage: point.returnedGradeAverage,
            completedRequiredCount: point.completedRequiredCount,
            requiredActivityCount: point.requiredActivityCount,
            missingCount: point.missingActivityCount,
            lateCount: point.lateActivityCount,
          }))
        : [],
      change: {
        progressPercentage: difference(
          last?.progressPercentage ?? null,
          first?.progressPercentage ?? null,
        ),
        processScore: difference(last?.processScore ?? null, first?.processScore ?? null),
        returnedGradeAverage: difference(
          last?.returnedGradeAverage ?? null,
          first?.returnedGradeAverage ?? null,
        ),
      },
      noDataReason,
      reporting: toReportMetadataDto({
        reportId: randomUUID(),
        definitionVersion: STUDENT_PROGRESS_TREND_VERSION,
        sourceMetricVersion: REPORTING_SOURCE_METRIC_VERSION,
        descriptorVersion: REPORTING_DESCRIPTOR_VERSION,
        dataState: hasTrend ? 'READY' : 'NO_DATA',
        timezone: range.timezone,
        asOf,
        generatedAt: this.now(),
        freshness: {
          status: 'FRESH',
          recalculatedAt: last?.capturedAt ?? null,
          sourceChangedAt: last?.capturedAt ?? null,
          staleAfterSeconds: this.options.staleAfterSeconds,
          failedItemsCount: 0,
        },
        filters: {
          courseId: query.courseId,
          from: range.from.toISOString(),
          to: range.to.toISOString(),
          timezone: range.timezone,
        },
      }),
    };
  }
}
