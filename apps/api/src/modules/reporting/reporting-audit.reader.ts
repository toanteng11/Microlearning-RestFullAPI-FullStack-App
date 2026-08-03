import type { ReportingAuditRow } from './reporting.types.js';

export interface ReportingAuditQuery {
  page: number;
  limit: number;
  from?: Date;
  to?: Date;
  actorRole?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  sortOrder: 'asc' | 'desc';
}

export interface ReportingAuditReader {
  listSafe(query: ReportingAuditQuery): Promise<{
    items: readonly ReportingAuditRow[];
    totalItems: number;
  }>;
}
