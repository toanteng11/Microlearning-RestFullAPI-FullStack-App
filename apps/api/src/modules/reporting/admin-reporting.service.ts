import { randomUUID } from 'node:crypto';

import { AppError } from '../../shared/errors/app-error.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { USER_ROLES, USER_STATUSES, type UserRole, type UserStatus } from '../users/user.types.js';
import { ADMIN_GOVERNANCE_REPORT_VERSION } from './reporting.constants.js';
import { toReportMetadataDto } from './reporting.dto.js';
import type { ReportingAuditReader, ReportingAuditQuery } from './reporting-audit.reader.js';
import type { ReportingAuditSink } from './reporting-audit.writer.js';
import type { ReportingGovernanceReader } from './reporting-governance.reader.js';
import type {
  AdminAuditQuery,
  AdminDashboardQuery,
  AdminGovernanceQuery,
} from './reporting.schemas.js';
import type {
  ReportFilterValue,
  ReportingAuditRow,
  ReportingGovernanceCounts,
} from './reporting.types.js';

const DAY_MS = 86_400_000;
const DEFAULT_DATE_RANGE_DAYS = 30;

interface AdminReportingOptions {
  enabled: boolean;
  timezone: string;
  staleAfterSeconds: number;
  maxDateRangeDays: number;
}

interface NormalizedDateRange {
  from: Date;
  to: Date;
  timezone: string;
  rangeDays: number;
}

function assertAdmin(actor: AuthenticatedUser) {
  if (actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
  }
}

function zonedDateStart(value: string, timezone: string): Date {
  const [year, month, day] = value.split('-').map(Number) as [number, number, number];
  const target = Date.UTC(year, month - 1, day);
  let candidate = target;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    calendar: 'iso8601',
    numberingSystem: 'latn',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(candidate))
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, Number(part.value)]),
    );
    const { year: representedYear, month: representedMonth, day: representedDay } = parts;
    const { hour: representedHour, minute: representedMinute, second: representedSecond } = parts;
    if (
      representedYear === undefined ||
      representedMonth === undefined ||
      representedDay === undefined ||
      representedHour === undefined ||
      representedMinute === undefined ||
      representedSecond === undefined
    ) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid reporting timezone');
    }
    const represented = Date.UTC(
      representedYear,
      representedMonth - 1,
      representedDay,
      representedHour,
      representedMinute,
      representedSecond,
    );
    const correction = target - represented;
    candidate += correction;
    if (correction === 0) break;
  }
  return new Date(candidate);
}

function parseBound(value: string, timezone: string): Date {
  const result = /^\d{4}-\d{2}-\d{2}$/u.test(value)
    ? zonedDateStart(value, timezone)
    : new Date(value);
  if (Number.isNaN(result.getTime())) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid reporting date range');
  }
  return result;
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

function auditDto(row: ReportingAuditRow) {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

function userCountsDto(counts: ReportingGovernanceCounts['userCounts']) {
  return Object.fromEntries(
    USER_ROLES.map((role) => [
      role,
      {
        total: USER_STATUSES.reduce((sum, status) => sum + counts[role][status], 0),
        ...counts[role],
      },
    ]),
  ) as Record<UserRole, Record<UserStatus, number> & { total: number }>;
}

function totalGovernanceRecords(counts: ReportingGovernanceCounts) {
  return (
    USER_ROLES.reduce(
      (total, role) =>
        total +
        USER_STATUSES.reduce((roleTotal, status) => roleTotal + counts.userCounts[role][status], 0),
      0,
    ) +
    Object.values(counts.invitationCounts).reduce((total, value) => total + value, 0) +
    Object.values(counts.classroomCounts).reduce((total, value) => total + value, 0) +
    Object.values(counts.courseCounts).reduce((total, value) => total + value, 0) +
    Object.values(counts.enrollmentCounts).reduce((total, value) => total + value, 0)
  );
}

export class AdminReportingService {
  constructor(
    private readonly governance: ReportingGovernanceReader,
    private readonly audits: ReportingAuditReader,
    private readonly auditWriter: ReportingAuditSink,
    private readonly options: AdminReportingOptions,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private assertAvailable(actor: AuthenticatedUser) {
    assertAdmin(actor);
    if (!this.options.enabled) {
      throw new AppError(503, 'REPORTING_DISABLED', 'Reporting is temporarily unavailable');
    }
  }

  private normalizeDateRange(input: {
    from?: string;
    to?: string;
    timezone?: string;
  }): NormalizedDateRange {
    const timezone = input.timezone ?? this.options.timezone;
    const now = this.now();
    const to = input.to ? parseBound(input.to, timezone) : now;
    const from = input.from
      ? parseBound(input.from, timezone)
      : new Date(to.getTime() - DEFAULT_DATE_RANGE_DAYS * DAY_MS);
    if (from >= to) {
      throw new AppError(400, 'VALIDATION_ERROR', 'to must be after from');
    }
    const rangeDays = (to.getTime() - from.getTime()) / DAY_MS;
    if (rangeDays > this.options.maxDateRangeDays) {
      throw new AppError(
        422,
        'REPORT_LIMIT_EXCEEDED',
        `Reporting date range must not exceed ${this.options.maxDateRangeDays} days`,
      );
    }
    return { from, to, timezone, rangeDays };
  }

  private metadata(
    asOf: Date,
    sourceChangedAt: Date | null,
    filters: Readonly<Record<string, ReportFilterValue>>,
    dataState: 'READY' | 'NO_DATA',
    timezone: string,
  ) {
    return toReportMetadataDto({
      reportId: randomUUID(),
      definitionVersion: ADMIN_GOVERNANCE_REPORT_VERSION,
      sourceMetricVersion: null,
      descriptorVersion: null,
      dataState,
      timezone,
      asOf,
      generatedAt: this.now(),
      freshness: {
        status: 'FRESH',
        recalculatedAt: asOf,
        sourceChangedAt,
        staleAfterSeconds: this.options.staleAfterSeconds,
        failedItemsCount: 0,
      },
      filters,
    });
  }

  async dashboard(actor: AuthenticatedUser, query: AdminDashboardQuery) {
    this.assertAvailable(actor);
    const asOf = this.now();
    const [counts, sourceChangedAt, recent] = await Promise.all([
      this.governance.readCounts({ asOf }),
      this.governance.getSourceWatermark(),
      this.audits.listSafe({ page: 1, limit: query.recentLimit, sortOrder: 'desc' }),
    ]);
    return {
      users: userCountsDto(counts.userCounts),
      registrationSources: counts.registrationSourceCounts,
      invitations: counts.invitationCounts,
      classrooms: counts.classroomCounts,
      courses: counts.courseCounts,
      activeEnrollmentCount: counts.enrollmentCounts.ACTIVE,
      recentGovernanceEvents: recent.items.map(auditDto),
      reporting: this.metadata(
        asOf,
        sourceChangedAt,
        { timezone: query.timezone ?? this.options.timezone, recentLimit: query.recentLimit },
        totalGovernanceRecords(counts) === 0 && recent.items.length === 0 ? 'NO_DATA' : 'READY',
        query.timezone ?? this.options.timezone,
      ),
    };
  }

  async governanceReport(actor: AuthenticatedUser, query: AdminGovernanceQuery, requestId: string) {
    this.assertAvailable(actor);
    const range = this.normalizeDateRange(query);
    const asOf = this.now();
    const [counts, sourceChangedAt] = await Promise.all([
      this.governance.readCounts({
        asOf,
        from: range.from,
        to: range.to,
        role: query.role,
        userStatus: query.userStatus,
        invitationStatus: query.invitationStatus,
        classroomStatus: query.classroomStatus,
        courseStatus: query.courseStatus,
      }),
      this.governance.getSourceWatermark(),
    ]);
    const totalRecords = totalGovernanceRecords(counts);
    const filters = {
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      timezone: range.timezone,
      role: query.role ?? null,
      userStatus: query.userStatus ?? null,
      invitationStatus: query.invitationStatus ?? null,
      classroomStatus: query.classroomStatus ?? null,
      courseStatus: query.courseStatus ?? null,
    } as const;
    await this.auditWriter.appendReportView({
      actor,
      requestId,
      reportId: 'RPT-ADM-GOVERNANCE',
      definitionVersion: ADMIN_GOVERNANCE_REPORT_VERSION,
      filterFields: Object.entries(query)
        .filter(([, value]) => value !== undefined)
        .map(([field]) => field),
      dateRangeDays: range.rangeDays,
      rowCount: totalRecords,
    });
    return {
      users: userCountsDto(counts.userCounts),
      registrationSources: counts.registrationSourceCounts,
      invitations: counts.invitationCounts,
      classrooms: counts.classroomCounts,
      courses: counts.courseCounts,
      enrollments: counts.enrollmentCounts,
      reporting: this.metadata(
        asOf,
        sourceChangedAt,
        filters,
        totalRecords === 0 ? 'NO_DATA' : 'READY',
        range.timezone,
      ),
    };
  }

  async auditLogs(actor: AuthenticatedUser, query: AdminAuditQuery, requestId: string) {
    this.assertAvailable(actor);
    const range = this.normalizeDateRange(query);
    const readerQuery: ReportingAuditQuery = {
      page: query.page,
      limit: query.limit,
      from: range.from,
      to: range.to,
      actorRole: query.actorRole,
      action: query.action,
      resourceType: query.resourceType,
      resourceId: query.resourceId,
      sortOrder: query.sortOrder,
    };
    const result = await this.audits.listSafe(readerQuery);
    const asOf = this.now();
    await this.auditWriter.appendReportView({
      actor,
      requestId,
      reportId: 'RPT-ADM-AUDIT',
      definitionVersion: ADMIN_GOVERNANCE_REPORT_VERSION,
      filterFields: Object.entries(query)
        .filter(([, value]) => value !== undefined)
        .map(([field]) => field),
      dateRangeDays: range.rangeDays,
      page: query.page,
      limit: query.limit,
      rowCount: result.items.length,
    });
    return {
      data: {
        items: result.items.map(auditDto),
        reporting: this.metadata(
          asOf,
          result.items[0]?.createdAt ?? null,
          {
            page: query.page,
            limit: query.limit,
            from: range.from.toISOString(),
            to: range.to.toISOString(),
            timezone: range.timezone,
            actorRole: query.actorRole ?? null,
            action: query.action ?? null,
            resourceType: query.resourceType ?? null,
            resourceId: query.resourceId ?? null,
            sortOrder: query.sortOrder,
          },
          result.totalItems === 0 ? 'NO_DATA' : 'READY',
          range.timezone,
        ),
      },
      meta: paginationMeta(query.page, query.limit, result.totalItems),
    };
  }
}
