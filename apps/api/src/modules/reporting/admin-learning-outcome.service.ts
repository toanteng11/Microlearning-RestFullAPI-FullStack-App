import { randomUUID } from 'node:crypto';

import { AppError } from '../../shared/errors/app-error.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { ADMIN_LEARNING_OUTCOME_VERSION } from './reporting.constants.js';
import { AdminLearningOutcomeRepository } from './admin-learning-outcome.repository.js';
import type { ReportingAuditSink } from './reporting-audit.writer.js';
import { normalizeReportingDateRange } from './reporting-date-range.js';
import { protectSensitiveAggregate } from './reporting-privacy.policy.js';
import type { AdminLearningOutcomesQuery } from './reporting.schemas.js';
import { toReportMetadataDto } from './reporting.dto.js';

interface AdminLearningOutcomeOptions {
  enabled: boolean;
  timezone: string;
  maxDateRangeDays: number;
  privacyMinGroupSize: number;
  staleAfterSeconds: number;
}

function round(value: number | null) {
  return value === null ? null : Math.round(value * 10) / 10;
}

function groupSizeBucket(size: number, minimum: number) {
  if (size < minimum) return `<${minimum}`;
  if (size < 10) return `${minimum}-9`;
  if (size < 20) return '10-19';
  if (size < 50) return '20-49';
  return '50+';
}

export class AdminLearningOutcomeService {
  constructor(
    private readonly repository: AdminLearningOutcomeRepository,
    private readonly audits: ReportingAuditSink,
    private readonly options: AdminLearningOutcomeOptions,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async report(actor: AuthenticatedUser, query: AdminLearningOutcomesQuery, requestId: string) {
    if (actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
      throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
    }
    if (!this.options.enabled) {
      throw new AppError(409, 'FEATURE_NOT_ENABLED', 'Admin learning outcomes are not enabled');
    }
    const asOf = this.now();
    const range = normalizeReportingDateRange(query, {
      timezone: this.options.timezone,
      maxDateRangeDays: this.options.maxDateRangeDays,
      now: asOf,
    });
    const rows = await this.repository.aggregate({
      from: range.from,
      to: range.to,
      courseStatus: query.courseStatus,
    });
    const items = rows.map((row) => {
      const protectedProgress = protectSensitiveAggregate(
        row.studentCount,
        round(row.averageProgressPercentage),
        this.options.privacyMinGroupSize,
      );
      const suppressed = protectedProgress.dataSuppressed;
      return {
        course: { id: row.courseId, title: row.courseTitle, status: row.courseStatus },
        studentCountBucket: groupSizeBucket(row.studentCount, this.options.privacyMinGroupSize),
        averageProgressPercentage: protectedProgress.value,
        completionPercentage: suppressed
          ? null
          : round((row.completedStudentCount / row.studentCount) * 100),
        returnedGradeAverage:
          suppressed || row.gradePointsPossible === 0
            ? null
            : round((row.gradePointsEarned / row.gradePointsPossible) * 100),
        missingActivityCount: suppressed ? null : row.missingActivityCount,
        lateActivityCount: suppressed ? null : row.lateActivityCount,
        dataState: protectedProgress.dataState,
        suppressionReason: protectedProgress.suppressionReason,
      };
    });
    await this.audits.appendReportView({
      actor,
      requestId,
      reportId: 'RPT-ADM-LEARNING-OUTCOMES',
      definitionVersion: ADMIN_LEARNING_OUTCOME_VERSION,
      filterFields: Object.entries(query)
        .filter(([, value]) => value !== undefined)
        .map(([field]) => field),
      dateRangeDays: range.rangeDays,
      rowCount: items.length,
    });
    const sourceChangedAt =
      rows
        .map((row) => row.sourceChangedAt)
        .sort((left, right) => right.getTime() - left.getTime())[0] ?? null;
    return {
      items,
      reporting: toReportMetadataDto({
        reportId: randomUUID(),
        definitionVersion: ADMIN_LEARNING_OUTCOME_VERSION,
        sourceMetricVersion: null,
        descriptorVersion: null,
        dataState:
          items.length === 0
            ? 'NO_DATA'
            : items.every((item) => item.dataState === 'SUPPRESSED')
              ? 'SUPPRESSED'
              : 'READY',
        timezone: range.timezone,
        asOf,
        generatedAt: this.now(),
        freshness: {
          status: 'FRESH',
          recalculatedAt: sourceChangedAt,
          sourceChangedAt,
          staleAfterSeconds: this.options.staleAfterSeconds,
          failedItemsCount: 0,
        },
        filters: {
          from: range.from.toISOString(),
          to: range.to.toISOString(),
          timezone: range.timezone,
          courseStatus: query.courseStatus ?? null,
        },
      }),
    };
  }
}
