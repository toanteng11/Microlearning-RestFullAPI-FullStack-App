import { AuditLogModel } from '../../audit/audit-log.model.js';
import { USER_ROLES, type UserRole } from '../../users/user.types.js';
import type { ReportingAuditQuery, ReportingAuditReader } from '../reporting-audit.reader.js';

const SAFE_ACTOR_ROLES = new Set<string>([...USER_ROLES, 'SYSTEM']);

function safeActorRole(value: string): UserRole | 'SYSTEM' {
  return SAFE_ACTOR_ROLES.has(value) ? (value as UserRole | 'SYSTEM') : 'SYSTEM';
}

export class MongoReportingAuditReader implements ReportingAuditReader {
  async listSafe(query: ReportingAuditQuery) {
    const filter: Record<string, unknown> = {};
    if (query.from || query.to) {
      filter.createdAt = {
        ...(query.from ? { $gte: query.from } : {}),
        ...(query.to ? { $lt: query.to } : {}),
      };
    }
    if (query.actorRole) filter.actorRole = query.actorRole;
    if (query.action) filter.action = query.action;
    if (query.resourceType) filter.resourceType = query.resourceType;
    if (query.resourceId) filter.resourceId = query.resourceId;
    const direction = query.sortOrder === 'asc' ? 1 : -1;
    const [rows, totalItems] = await Promise.all([
      AuditLogModel.find(filter)
        .select({
          actorId: 1,
          actorRole: 1,
          action: 1,
          resourceType: 1,
          resourceId: 1,
          requestId: 1,
          createdAt: 1,
        })
        .sort({ createdAt: direction, _id: direction })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean()
        .exec(),
      AuditLogModel.countDocuments(filter).exec(),
    ]);
    return {
      items: rows.map((row) => ({
        id: row._id.toString(),
        actorId: row.actorId?.toString() ?? null,
        actorRole: safeActorRole(row.actorRole),
        action: row.action,
        resourceType: row.resourceType,
        resourceId: row.resourceId,
        requestId: row.requestId,
        createdAt: row.createdAt,
      })),
      totalItems,
    };
  }
}
