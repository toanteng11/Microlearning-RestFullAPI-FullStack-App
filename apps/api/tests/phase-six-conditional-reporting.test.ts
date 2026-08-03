import { Types } from 'mongoose';
import { describe, expect, it, vi } from 'vitest';

import type { AuthenticatedUser } from '../src/modules/auth/auth.types.js';
import { AdminLearningOutcomeService } from '../src/modules/reporting/admin-learning-outcome.service.js';
import type { AdminLearningOutcomeRepository } from '../src/modules/reporting/admin-learning-outcome.repository.js';
import { AnalyticsEventService } from '../src/modules/reporting/analytics-event.service.js';
import type { AnalyticsEventRepository } from '../src/modules/reporting/analytics-event.repository.js';
import {
  encodeCsvCell,
  neutralizeSpreadsheetFormula,
  serializeCsv,
} from '../src/modules/reporting/reporting-csv.js';
import type { ReportingAuditSink } from '../src/modules/reporting/reporting-audit.writer.js';
import type { ReportingExportAuditSink } from '../src/modules/reporting/reporting-export-audit.writer.js';
import { ReportingExportService } from '../src/modules/reporting/reporting-export.service.js';
import type { TeacherReportingService } from '../src/modules/reporting/teacher-reporting.service.js';
import type { GradebookReportingService } from '../src/modules/reporting/gradebook-reporting.service.js';
import type { AdminReportingService } from '../src/modules/reporting/admin-reporting.service.js';
import { createReportingQuerySchemas } from '../src/modules/reporting/reporting.schemas.js';
import type { ReportingScopeReader } from '../src/modules/reporting/reporting-scope.reader.js';
import { StudentProgressTrendService } from '../src/modules/reporting/student-progress-trend.service.js';
import type { CourseProgressSnapshotRepository } from '../src/modules/reporting/course-progress-snapshot.repository.js';
import type { ReportingRefreshService } from '../src/modules/reporting/reporting-refresh.service.js';

const now = new Date('2026-08-03T03:00:00.000Z');
const studentId = new Types.ObjectId().toString();
const courseId = new Types.ObjectId().toString();
const classroomId = new Types.ObjectId().toString();
const student: AuthenticatedUser = {
  id: studentId,
  role: 'STUDENT',
  status: 'ACTIVE',
  familyId: 'family-student',
  capabilities: ['learning.view_enrolled'],
};
const admin: AuthenticatedUser = {
  ...student,
  id: new Types.ObjectId().toString(),
  role: 'ADMIN',
  familyId: 'family-admin',
  capabilities: ['report.view_governance'],
};

const schemas = createReportingQuerySchemas({
  pageMax: 50,
  gradebookActivityMax: 50,
  maxDateRangeDays: 365,
  defaultTimezone: 'Asia/Ho_Chi_Minh',
});

describe('Phase 06 conditional CSV safety', () => {
  it('neutralizes formulas after leading whitespace and remains RFC 4180 compatible', () => {
    for (const value of [
      '=HYPERLINK("x")',
      ' +1+1',
      '-2+3',
      '@SUM(A1:A2)',
      '\tpayload',
      '\rvalue',
    ]) {
      expect(neutralizeSpreadsheetFormula(value)).toBe(`'${value}`);
    }
    expect(encodeCsvCell('Nguyen, "An"\r\nStudent')).toBe('"Nguyen, ""An""\r\nStudent"');
    expect([...serializeCsv(['name', 'value'], [{ name: '=CMD()', value: 2 }])].join('')).toBe(
      '"name","value"\r\n"\'=CMD()","2"\r\n',
    );
  });

  it('exports a bounded Admin governance projection and records request/completion audits', async () => {
    const governanceReport = vi.fn().mockResolvedValue({
      users: {
        STUDENT: { total: 5, PENDING: 0, ACTIVE: 5, INACTIVE: 0, BLOCKED: 0, DELETED: 0 },
        TEACHER: { total: 1, PENDING: 0, ACTIVE: 1, INACTIVE: 0, BLOCKED: 0, DELETED: 0 },
        ADMIN: { total: 1, PENDING: 0, ACTIVE: 1, INACTIVE: 0, BLOCKED: 0, DELETED: 0 },
        SUPER_ADMIN: {
          total: 0,
          PENDING: 0,
          ACTIVE: 0,
          INACTIVE: 0,
          BLOCKED: 0,
          DELETED: 0,
        },
      },
      registrationSources: {
        SELF_REGISTRATION: 5,
        TEACHER_INVITATION: 1,
        ADMIN_BOOTSTRAP: 1,
      },
      invitations: { PENDING: 0, ACCEPTED: 1, EXPIRED: 0, REVOKED: 0 },
      classrooms: { ACTIVE: 1, LOCKED: 0, ARCHIVED: 0 },
      courses: { DRAFT: 0, SCHEDULED: 0, PUBLISHED: 1, UNPUBLISHED: 0, ARCHIVED: 0 },
      enrollments: { ACTIVE: 5, REMOVED: 0, LEFT: 0, BLOCKED: 0 },
      allowedActions: ['EXPORT_REPORT'],
      reporting: {
        reportId: 'report-admin-export',
        definitionVersion: 'P06_ADMIN_GOVERNANCE_V1',
        generatedAt: now.toISOString(),
        timezone: 'Asia/Ho_Chi_Minh',
        asOf: now.toISOString(),
      },
    });
    const audits = { append: vi.fn().mockResolvedValue(undefined) };
    const service = new ReportingExportService(
      {} as TeacherReportingService,
      {} as GradebookReportingService,
      { governanceReport } as unknown as AdminReportingService,
      audits as ReportingExportAuditSink,
      { enabled: true, maxRows: 5_000, pageMax: 50, gradebookActivityMax: 50 },
      () => now,
    );

    const result = await service.adminGovernance(admin, { role: 'STUDENT' }, 'request-export-1');
    const csv = [...result.content].join('');
    expect(result.rowCount).toBe(1);
    expect(result.filename).toMatch(/^microlearning-admin-governance-system-/u);
    expect(csv).toContain('"users.STUDENT.ACTIVE"');
    expect(csv).toContain('"5"');
    expect(governanceReport).toHaveBeenCalledWith(admin, { role: 'STUDENT' }, 'request-export-1');
    expect(audits.append).toHaveBeenCalledTimes(2);
    expect(audits.append).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'COMPLETED', rowCount: 1 }),
    );
  });

  it('fails closed before querying when CSV export is disabled', async () => {
    const service = new ReportingExportService(
      {} as TeacherReportingService,
      {} as GradebookReportingService,
      {} as AdminReportingService,
      { append: vi.fn() } as unknown as ReportingExportAuditSink,
      { enabled: false, maxRows: 5_000, pageMax: 50, gradebookActivityMax: 50 },
    );
    await expect(service.adminGovernance(admin, {}, 'request-export-2')).rejects.toMatchObject({
      code: 'FEATURE_NOT_ENABLED',
    });
  });
});

describe('Phase 06 conditional analytics events', () => {
  function analyticsFixture(overrides?: {
    enabled?: boolean;
    repositoryResult?: 'STORED' | 'DUPLICATE';
  }) {
    const repository = {
      create: vi.fn().mockResolvedValue(overrides?.repositoryResult ?? 'STORED'),
      aggregateAdoption: vi.fn().mockResolvedValue([]),
    };
    const scopes = {
      requireStudentCourse: vi.fn().mockResolvedValue({
        studentId,
        courseId,
        classroomId,
        courseTitle: 'REST API',
        classroomName: 'Backend',
      }),
    };
    const service = new AnalyticsEventService(
      repository as unknown as AnalyticsEventRepository,
      scopes as unknown as ReportingScopeReader,
      {
        enabled: overrides?.enabled ?? true,
        retentionDays: 90,
        environment: 'test',
        appVersion: '0.1.0',
        timezone: 'Asia/Ho_Chi_Minh',
        maxDateRangeDays: 365,
        privacyMinGroupSize: 5,
        staleAfterSeconds: 300,
      },
      () => now,
    );
    return { service, repository, scopes };
  }

  const input = {
    eventId: '8d69872a-3524-4b85-a733-5b530edc4a51',
    eventName: 'report_viewed' as const,
    schemaVersion: '1' as const,
    occurredAt: now.toISOString(),
    context: { classroomId, courseId },
    properties: { reportId: 'RPT-STUDENT-PROGRESS', surface: 'student-progress' },
  };

  it('derives actor identity, validates scope and handles duplicate idempotently', async () => {
    const fixture = analyticsFixture({ repositoryResult: 'DUPLICATE' });
    await expect(fixture.service.ingest(student, input)).resolves.toEqual({
      accepted: true,
      stored: true,
      duplicate: true,
    });
    expect(fixture.scopes.requireStudentCourse).toHaveBeenCalledWith(student.id, courseId);
    expect(fixture.repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: new Types.ObjectId(student.id),
        actorRole: 'STUDENT',
        eventName: 'report_viewed',
      }),
    );
  });

  it('rejects PII/unknown properties, invalid time and disabled ingestion', async () => {
    expect(() =>
      schemas.analyticsEvent.parse({ ...input, properties: { email: 'x@test.local' } }),
    ).toThrow();
    const enabled = analyticsFixture();
    await expect(
      enabled.service.ingest(student, {
        ...input,
        occurredAt: '2025-01-01T00:00:00.000Z',
      }),
    ).rejects.toMatchObject({ code: 'ANALYTICS_EVENT_TIME_INVALID' });
    await expect(
      analyticsFixture({ enabled: false }).service.ingest(student, input),
    ).rejects.toMatchObject({ code: 'FEATURE_NOT_ENABLED' });
  });

  it('isolates storage failure from the accepted event request', async () => {
    const fixture = analyticsFixture();
    fixture.repository.create.mockRejectedValueOnce(new Error('storage unavailable'));
    await expect(fixture.service.ingest(student, input)).resolves.toEqual({
      accepted: true,
      stored: false,
      duplicate: false,
    });
  });
});

describe('Phase 06 conditional Student trend', () => {
  function trendFixture(points: Array<Record<string, unknown>>) {
    const snapshots = {
      listCompatible: vi.fn().mockResolvedValue(points),
      countAll: vi.fn().mockResolvedValue(points.length),
    };
    const scopes = {
      requireStudentCourse: vi.fn().mockResolvedValue({
        studentId,
        courseId,
        classroomId,
        courseTitle: 'REST API',
        classroomName: 'Backend',
      }),
    };
    const refresh = { refreshStudent: vi.fn().mockResolvedValue({}) };
    const service = new StudentProgressTrendService(
      scopes as unknown as ReportingScopeReader,
      snapshots as unknown as CourseProgressSnapshotRepository,
      refresh as unknown as ReportingRefreshService,
      {
        enabled: true,
        timezone: 'Asia/Ho_Chi_Minh',
        maxDateRangeDays: 365,
        staleAfterSeconds: 300,
      },
      () => now,
    );
    return { service, snapshots };
  }

  const point = (capturedAt: string, progressPercentage: number) => ({
    capturedAt: new Date(capturedAt),
    progressPercentage,
    processScore: progressPercentage,
    returnedGradeAverage: 80,
    completedRequiredCount: progressPercentage === 50 ? 2 : 3,
    requiredActivityCount: 4,
    missingActivityCount: 1,
    lateActivityCount: 0,
  });

  it('returns real versioned points and calculated endpoint change without interpolation', async () => {
    const fixture = trendFixture([
      point('2026-08-01T03:00:00.000Z', 50),
      point('2026-08-03T02:00:00.000Z', 75),
    ]);
    const result = await fixture.service.trend(student, {
      courseId,
      from: '2026-08-01T00:00:00.000Z',
      to: '2026-08-04T00:00:00.000Z',
      timezone: 'Asia/Ho_Chi_Minh',
    });
    expect(result.points).toHaveLength(2);
    expect(result.change.progressPercentage).toBe(25);
    expect(result.noDataReason).toBeNull();
    expect(result.reporting.dataState).toBe('READY');
  });

  it('returns NO_DATA instead of fabricating a trend from one snapshot', async () => {
    const fixture = trendFixture([point('2026-08-03T02:00:00.000Z', 50)]);
    const result = await fixture.service.trend(student, { courseId });
    expect(result.points).toEqual([]);
    expect(result.change.progressPercentage).toBeNull();
    expect(result.noDataReason).toBe('INSUFFICIENT_SNAPSHOTS');
    expect(result.reporting.dataState).toBe('NO_DATA');
  });
});

describe('Phase 06 conditional Admin learning outcomes', () => {
  function outcomeFixture(studentCount: number) {
    const repository = {
      aggregate: vi.fn().mockResolvedValue([
        {
          courseId,
          courseTitle: 'REST API',
          courseStatus: 'PUBLISHED',
          studentCount,
          averageProgressPercentage: 76.25,
          completedStudentCount: 3,
          gradePointsEarned: 320,
          gradePointsPossible: 400,
          missingActivityCount: 2,
          lateActivityCount: 1,
          sourceChangedAt: now,
        },
      ]),
    };
    const audits = { appendReportView: vi.fn().mockResolvedValue(undefined) };
    const service = new AdminLearningOutcomeService(
      repository as unknown as AdminLearningOutcomeRepository,
      audits as ReportingAuditSink,
      {
        enabled: true,
        timezone: 'Asia/Ho_Chi_Minh',
        maxDateRangeDays: 365,
        privacyMinGroupSize: 5,
        staleAfterSeconds: 300,
      },
      () => now,
    );
    return { service, audits };
  }

  it('suppresses every sensitive aggregate and exact group size below five', async () => {
    const result = await outcomeFixture(4).service.report(admin, {}, 'request-1');
    expect(result.items[0]).toMatchObject({
      studentCountBucket: '<5',
      averageProgressPercentage: null,
      completionPercentage: null,
      returnedGradeAverage: null,
      missingActivityCount: null,
      lateActivityCount: null,
      dataState: 'SUPPRESSED',
    });
    expect(result.reporting.dataState).toBe('SUPPRESSED');
  });

  it('returns rounded aggregates for a group meeting the privacy threshold and audits the view', async () => {
    const fixture = outcomeFixture(5);
    const result = await fixture.service.report(admin, {}, 'request-2');
    expect(result.items[0]).toMatchObject({
      studentCountBucket: '5-9',
      averageProgressPercentage: 76.3,
      completionPercentage: 60,
      returnedGradeAverage: 80,
      dataState: 'READY',
    });
    expect(fixture.audits.appendReportView).toHaveBeenCalledWith(
      expect.objectContaining({ reportId: 'RPT-ADM-LEARNING-OUTCOMES', rowCount: 1 }),
    );
  });
});
