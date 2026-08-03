import { Types } from 'mongoose';

import { AuditLogRepository } from '../audit/audit-log.repository.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';

export interface ReportingExportAuditCommand {
  actor: AuthenticatedUser;
  requestId: string;
  status: 'REQUESTED' | 'COMPLETED' | 'FAILED';
  reportId: string;
  definitionVersion: string;
  resourceId: string;
  filterFields: readonly string[];
  rowCount: number;
  durationMs: number;
  resultCode?: string;
}

export interface ReportingExportAuditSink {
  append(command: ReportingExportAuditCommand): Promise<unknown>;
}

export class ReportingExportAuditWriter implements ReportingExportAuditSink {
  constructor(private readonly audits = new AuditLogRepository()) {}

  append(command: ReportingExportAuditCommand) {
    return this.audits.append({
      actorId: new Types.ObjectId(command.actor.id),
      actorRole: command.actor.role,
      action: `REPORT_EXPORT_${command.status}`,
      resourceType: 'ReportExport',
      resourceId: command.resourceId,
      requestId: command.requestId,
      oldValue: null,
      newValue: null,
      metadata: {
        reportId: command.reportId,
        definitionVersion: command.definitionVersion,
        filterFields: [...command.filterFields].sort(),
        rowCount: command.rowCount,
        durationMs: command.durationMs,
        result: command.status,
        ...(command.resultCode ? { resultCode: command.resultCode } : {}),
      },
    });
  }
}
