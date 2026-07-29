import type { AppConfig } from '../shared/config/environment.js';
import { MongoReportingActivityReader } from './reporting/adapters/mongo-reporting-activity.reader.js';
import { MongoReportingAuditReader } from './reporting/adapters/mongo-reporting-audit.reader.js';
import { MongoReportingGovernanceReader } from './reporting/adapters/mongo-reporting-governance.reader.js';
import { MongoReportingGradeReader } from './reporting/adapters/mongo-reporting-grade.reader.js';
import { MongoReportingInvalidationWriter } from './reporting/adapters/mongo-reporting-invalidation.writer.js';
import { MongoReportingProgressReader } from './reporting/adapters/mongo-reporting-progress.reader.js';
import { MongoReportingRosterReader } from './reporting/adapters/mongo-reporting-roster.reader.js';
import { MongoReportingScopeReader } from './reporting/adapters/mongo-reporting-scope.reader.js';
import { CourseProgressCalculator } from './reporting/course-progress.calculator.js';
import { CourseProgressSummaryRepository } from './reporting/course-progress-summary.repository.js';
import { ReportingInvalidationRepository } from './reporting/reporting-invalidation.repository.js';
import { ReportingReconciliationService } from './reporting/reporting-reconciliation.service.js';
import { ReportingRefreshService } from './reporting/reporting-refresh.service.js';

export function createPhaseSixFoundation(config: AppConfig) {
  const summaries = new CourseProgressSummaryRepository();
  const invalidations = new ReportingInvalidationRepository(
    config.reporting.invalidationLockSeconds,
    config.reporting.invalidationMaxAttempts,
  );
  const rosterReader = new MongoReportingRosterReader();
  const activityReader = new MongoReportingActivityReader(
    config.reporting.onDemandCourseRefreshMaxStudents,
  );
  const progressReader = new MongoReportingProgressReader(
    config.reporting.onDemandCourseRefreshMaxStudents,
  );
  const gradeReader = new MongoReportingGradeReader(
    config.reporting.onDemandCourseRefreshMaxStudents,
  );
  const calculator = new CourseProgressCalculator();
  const refreshService = new ReportingRefreshService(
    rosterReader,
    activityReader,
    progressReader,
    gradeReader,
    summaries,
    invalidations,
    calculator,
    {
      rebuildBatchSize: config.reporting.rebuildBatchSize,
      rebuildMaxAttempts: config.reporting.rebuildMaxAttempts,
      classroomExpansionBatchSize: config.reporting.classroomExpansionBatchSize,
      invalidationMaxAttempts: config.reporting.invalidationMaxAttempts,
      invalidationRetryBaseSeconds: config.reporting.invalidationRetryBaseSeconds,
      invalidationRetryMaxSeconds: config.reporting.invalidationRetryMaxSeconds,
    },
  );
  return Object.freeze({
    reportingInvalidationWriter: new MongoReportingInvalidationWriter(invalidations),
    summaries,
    invalidations,
    scopeReader: new MongoReportingScopeReader(),
    rosterReader,
    activityReader,
    progressReader,
    gradeReader,
    governanceReader: new MongoReportingGovernanceReader(),
    auditReader: new MongoReportingAuditReader(),
    calculator,
    refreshService,
    reconciliationService: new ReportingReconciliationService(summaries, refreshService),
  });
}

export type PhaseSixFoundation = ReturnType<typeof createPhaseSixFoundation>;
