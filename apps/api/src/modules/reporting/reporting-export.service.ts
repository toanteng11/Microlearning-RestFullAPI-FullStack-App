import { AppError } from '../../shared/errors/app-error.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { AdminReportingService } from './admin-reporting.service.js';
import type { GradebookReportingService } from './gradebook-reporting.service.js';
import type {
  AdminAuditExportQuery,
  AdminGovernanceQuery,
  GradebookExportQuery,
  TeacherProgressExportQuery,
} from './reporting.schemas.js';
import { safeCsvFilename, serializeCsv, type CsvRow } from './reporting-csv.js';
import type { ReportingExportAuditSink } from './reporting-export-audit.writer.js';
import type { TeacherReportingService } from './teacher-reporting.service.js';

interface ReportingExportOptions {
  enabled: boolean;
  maxRows: number;
  pageMax: number;
  gradebookActivityMax: number;
}

export interface PreparedCsvExport {
  filename: string;
  content: Iterable<string>;
  rowCount: number;
}

function filterFields(query: object) {
  return Object.entries(query)
    .filter(([, value]) => value !== undefined)
    .map(([key]) => key);
}

export class ReportingExportService {
  constructor(
    private readonly teacher: TeacherReportingService,
    private readonly gradebook: GradebookReportingService,
    private readonly admin: AdminReportingService,
    private readonly audits: ReportingExportAuditSink,
    private readonly options: ReportingExportOptions,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private assertEnabled() {
    if (!this.options.enabled) {
      throw new AppError(409, 'FEATURE_NOT_ENABLED', 'Report export is not enabled');
    }
  }

  private assertRows(totalItems: number) {
    if (totalItems > this.options.maxRows) {
      throw new AppError(
        422,
        'REPORT_LIMIT_EXCEEDED',
        `Report export must not exceed ${this.options.maxRows} rows`,
      );
    }
  }

  private async audit(
    actor: AuthenticatedUser,
    requestId: string,
    status: 'REQUESTED' | 'COMPLETED' | 'FAILED',
    reportId: string,
    definitionVersion: string,
    resourceId: string,
    query: object,
    rowCount: number,
    startedAt: number,
    resultCode?: string,
  ) {
    await this.audits.append({
      actor,
      requestId,
      status,
      reportId,
      definitionVersion,
      resourceId,
      filterFields: filterFields(query),
      rowCount,
      durationMs: Math.max(0, Date.now() - startedAt),
      resultCode,
    });
  }

  async teacherProgress(
    actor: AuthenticatedUser,
    courseId: string,
    query: TeacherProgressExportQuery,
    requestId: string,
  ): Promise<PreparedCsvExport> {
    this.assertEnabled();
    const startedAt = Date.now();
    const stableReportId = 'RPT-TEACHER-PROGRESS';
    await this.audit(
      actor,
      requestId,
      'REQUESTED',
      stableReportId,
      'P06_TEACHER_RANKING_V1',
      courseId,
      query,
      0,
      startedAt,
    );
    try {
      const first = await this.teacher.ranking(actor, courseId, {
        ...query,
        page: 1,
        limit: this.options.pageMax,
      });
      this.assertRows(first.meta.totalItems);
      const items = [...first.data.items];
      for (let page = 2; page <= first.meta.totalPages; page += 1) {
        const result = await this.teacher.ranking(actor, courseId, {
          ...query,
          page,
          limit: this.options.pageMax,
        });
        items.push(...result.data.items);
      }
      const metadata = first.data.reporting;
      const rows: CsvRow[] = items.map((item) => ({
        reportId: metadata.reportId,
        definitionVersion: metadata.definitionVersion,
        generatedAt: metadata.generatedAt,
        timezone: metadata.timezone,
        asOf: metadata.asOf,
        rank: item.rank,
        studentId: item.student.id,
        fullName: item.student.fullName,
        email: item.student.email,
        studentCode: item.student.studentCode,
        progressPercentage: item.progressPercentage,
        processScore: item.processScore,
        progressStatus: item.progressStatus,
        returnedGradeAverage: item.returnedGradeAverage,
        missingCount: item.missingCount,
        lateCount: item.lateCount,
        ungradedCount: item.ungradedCount,
        lastActiveAt: item.lastActiveAt,
      }));
      const headers = [
        'reportId',
        'definitionVersion',
        'generatedAt',
        'timezone',
        'asOf',
        'rank',
        'studentId',
        'fullName',
        'email',
        'studentCode',
        'progressPercentage',
        'processScore',
        'progressStatus',
        'returnedGradeAverage',
        'missingCount',
        'lateCount',
        'ungradedCount',
        'lastActiveAt',
      ] as const;
      await this.audit(
        actor,
        requestId,
        'COMPLETED',
        metadata.reportId,
        metadata.definitionVersion,
        courseId,
        query,
        rows.length,
        startedAt,
      );
      return {
        filename: safeCsvFilename('teacher-progress', courseId, this.now()),
        content: serializeCsv(headers, rows),
        rowCount: rows.length,
      };
    } catch (error) {
      await this.audit(
        actor,
        requestId,
        'FAILED',
        stableReportId,
        'P06_TEACHER_RANKING_V1',
        courseId,
        query,
        0,
        startedAt,
        (error as { code?: string }).code ?? 'EXPORT_FAILED',
      );
      throw error;
    }
  }

  async teacherGradebook(
    actor: AuthenticatedUser,
    courseId: string,
    query: GradebookExportQuery,
    requestId: string,
  ): Promise<PreparedCsvExport> {
    this.assertEnabled();
    const startedAt = Date.now();
    const stableReportId = 'RPT-TEACHER-GRADEBOOK';
    await this.audit(
      actor,
      requestId,
      'REQUESTED',
      stableReportId,
      'P06_GRADEBOOK_V1',
      courseId,
      query,
      0,
      startedAt,
    );
    try {
      const first = await this.gradebook.gradebook(actor, courseId, {
        ...query,
        page: 1,
        limit: this.options.pageMax,
        activityLimit: Math.min(query.activityLimit, this.options.gradebookActivityMax),
      });
      this.assertRows(first.meta.totalItems);
      const rows = [...first.data.rows];
      for (let page = 2; page <= first.meta.totalPages; page += 1) {
        const result = await this.gradebook.gradebook(actor, courseId, {
          ...query,
          page,
          limit: this.options.pageMax,
          activityLimit: Math.min(query.activityLimit, this.options.gradebookActivityMax),
        });
        rows.push(...result.data.rows);
      }
      const metadata = first.data.reporting;
      const activityHeaders = first.data.columns.map((column) => `activity:${column.activityId}`);
      const csvRows: CsvRow[] = rows.map((row) => ({
        reportId: metadata.reportId,
        definitionVersion: metadata.definitionVersion,
        generatedAt: metadata.generatedAt,
        timezone: metadata.timezone,
        asOf: metadata.asOf,
        studentId: row.student.id,
        fullName: row.student.fullName,
        email: row.student.email,
        studentCode: row.student.studentCode,
        processScore: row.processScore,
        progressPercentage: row.progressPercentage,
        returnedGradeAverage: row.returnedGradeAverage,
        missingCount: row.missingCount,
        lateCount: row.lateCount,
        ...Object.fromEntries(
          activityHeaders.map((header, index) => {
            const cell = row.cells[index];
            return [
              header,
              cell
                ? `${cell.completionStatus}|${cell.gradingStatus}|${cell.score ?? ''}/${cell.maxScore ?? ''}`
                : '',
            ];
          }),
        ),
      }));
      const headers = [
        'reportId',
        'definitionVersion',
        'generatedAt',
        'timezone',
        'asOf',
        'studentId',
        'fullName',
        'email',
        'studentCode',
        'processScore',
        'progressPercentage',
        'returnedGradeAverage',
        'missingCount',
        'lateCount',
        ...activityHeaders,
      ];
      await this.audit(
        actor,
        requestId,
        'COMPLETED',
        metadata.reportId,
        metadata.definitionVersion,
        courseId,
        query,
        csvRows.length,
        startedAt,
      );
      return {
        filename: safeCsvFilename('teacher-gradebook', courseId, this.now()),
        content: serializeCsv(headers, csvRows),
        rowCount: csvRows.length,
      };
    } catch (error) {
      await this.audit(
        actor,
        requestId,
        'FAILED',
        stableReportId,
        'P06_GRADEBOOK_V1',
        courseId,
        query,
        0,
        startedAt,
        (error as { code?: string }).code ?? 'EXPORT_FAILED',
      );
      throw error;
    }
  }

  async adminGovernance(
    actor: AuthenticatedUser,
    query: AdminGovernanceQuery,
    requestId: string,
  ): Promise<PreparedCsvExport> {
    this.assertEnabled();
    const startedAt = Date.now();
    const stableReportId = 'RPT-ADM-GOVERNANCE';
    await this.audit(
      actor,
      requestId,
      'REQUESTED',
      stableReportId,
      'P06_ADMIN_GOVERNANCE_V1',
      'governance',
      query,
      0,
      startedAt,
    );
    try {
      const data = await this.admin.governanceReport(actor, query, requestId);
      const row: CsvRow = {
        reportId: data.reporting.reportId,
        definitionVersion: data.reporting.definitionVersion,
        generatedAt: data.reporting.generatedAt,
        timezone: data.reporting.timezone,
        asOf: data.reporting.asOf,
      };
      for (const [role, counts] of Object.entries(data.users)) {
        for (const [status, count] of Object.entries(counts))
          row[`users.${role}.${status}`] = count;
      }
      for (const [group, values] of Object.entries({
        registrationSources: data.registrationSources,
        invitations: data.invitations,
        classrooms: data.classrooms,
        courses: data.courses,
        enrollments: data.enrollments,
      })) {
        for (const [status, count] of Object.entries(values)) row[`${group}.${status}`] = count;
      }
      const headers = Object.keys(row);
      await this.audit(
        actor,
        requestId,
        'COMPLETED',
        data.reporting.reportId,
        data.reporting.definitionVersion,
        'governance',
        query,
        1,
        startedAt,
      );
      return {
        filename: safeCsvFilename('admin-governance', 'system', this.now()),
        content: serializeCsv(headers, [row]),
        rowCount: 1,
      };
    } catch (error) {
      await this.audit(
        actor,
        requestId,
        'FAILED',
        stableReportId,
        'P06_ADMIN_GOVERNANCE_V1',
        'governance',
        query,
        0,
        startedAt,
        (error as { code?: string }).code ?? 'EXPORT_FAILED',
      );
      throw error;
    }
  }

  async adminAudit(
    actor: AuthenticatedUser,
    query: AdminAuditExportQuery,
    requestId: string,
  ): Promise<PreparedCsvExport> {
    this.assertEnabled();
    const startedAt = Date.now();
    const stableReportId = 'RPT-ADM-AUDIT';
    await this.audit(
      actor,
      requestId,
      'REQUESTED',
      stableReportId,
      'P06_ADMIN_GOVERNANCE_V1',
      'audit',
      query,
      0,
      startedAt,
    );
    try {
      const first = await this.admin.auditLogs(
        actor,
        { ...query, page: 1, limit: this.options.pageMax },
        requestId,
      );
      this.assertRows(first.meta.totalItems);
      const items = [...first.data.items];
      for (let page = 2; page <= first.meta.totalPages; page += 1) {
        const result = await this.admin.auditLogs(
          actor,
          { ...query, page, limit: this.options.pageMax },
          requestId,
        );
        items.push(...result.data.items);
      }
      const metadata = first.data.reporting;
      const rows: CsvRow[] = items.map((item) => ({
        reportId: metadata.reportId,
        definitionVersion: metadata.definitionVersion,
        generatedAt: metadata.generatedAt,
        timezone: metadata.timezone,
        asOf: metadata.asOf,
        id: item.id,
        actorId: item.actorId,
        actorRole: item.actorRole,
        action: item.action,
        resourceType: item.resourceType,
        resourceId: item.resourceId,
        requestId: item.requestId,
        createdAt: item.createdAt,
      }));
      const headers = [
        'reportId',
        'definitionVersion',
        'generatedAt',
        'timezone',
        'asOf',
        'id',
        'actorId',
        'actorRole',
        'action',
        'resourceType',
        'resourceId',
        'requestId',
        'createdAt',
      ] as const;
      await this.audit(
        actor,
        requestId,
        'COMPLETED',
        metadata.reportId,
        metadata.definitionVersion,
        'audit',
        query,
        rows.length,
        startedAt,
      );
      return {
        filename: safeCsvFilename('admin-audit', 'system', this.now()),
        content: serializeCsv(headers, rows),
        rowCount: rows.length,
      };
    } catch (error) {
      await this.audit(
        actor,
        requestId,
        'FAILED',
        stableReportId,
        'P06_ADMIN_GOVERNANCE_V1',
        'audit',
        query,
        0,
        startedAt,
        (error as { code?: string }).code ?? 'EXPORT_FAILED',
      );
      throw error;
    }
  }
}
