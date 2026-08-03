import { Types } from 'mongoose';

import { AuditLogRepository, type AuditInput } from '../audit/audit-log.repository.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';

export interface ReportingViewAuditCommand {
  actor: AuthenticatedUser;
  requestId: string;
  reportId:
    'RPT-ADM-GOVERNANCE' | 'RPT-ADM-AUDIT' | 'RPT-ADM-LEARNING-OUTCOMES' | 'RPT-ADM-ADOPTION';
  definitionVersion: string;
  filterFields: readonly string[];
  dateRangeDays: number;
  page?: number;
  limit?: number;
  rowCount: number;
}

export interface ReportingAuditSink {
  appendReportView(command: ReportingViewAuditCommand): Promise<unknown>;
}

export function buildReportingViewAuditInput(command: ReportingViewAuditCommand): AuditInput {
  return {
    actorId: new Types.ObjectId(command.actor.id),
    actorRole: command.actor.role,
    action: 'REPORT_VIEWED',
    resourceType: 'AdminReport',
    resourceId: command.reportId,
    requestId: command.requestId,
    oldValue: null,
    newValue: null,
    metadata: {
      reportId: command.reportId,
      definitionVersion: command.definitionVersion,
      filterFields: [...command.filterFields].sort(),
      dateRangeDays: command.dateRangeDays,
      ...(command.page === undefined ? {} : { page: command.page }),
      ...(command.limit === undefined ? {} : { limit: command.limit }),
      rowCount: command.rowCount,
      result: 'SUCCESS',
    },
  };
}

export class ReportingAuditWriter implements ReportingAuditSink {
  constructor(private readonly audits = new AuditLogRepository()) {}

  appendReportView(command: ReportingViewAuditCommand) {
    return this.audits.append(buildReportingViewAuditInput(command));
  }
}
