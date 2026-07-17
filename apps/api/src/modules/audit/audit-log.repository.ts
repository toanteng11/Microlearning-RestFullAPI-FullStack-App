import { type ClientSession, type Types } from 'mongoose';

import { AuditLogModel, type AuditLogRecord } from './audit-log.model.js';

export type AuditInput = Pick<
  AuditLogRecord,
  'actorRole' | 'action' | 'resourceType' | 'resourceId' | 'requestId'
> & {
  actorId?: Types.ObjectId | null;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
  idempotencyKey?: string | null;
};

export class AuditLogRepository {
  async append(input: AuditInput, session?: ClientSession) {
    const audit = new AuditLogModel(input);
    return audit.save({ session });
  }

  async findIdempotent(
    actorId: Types.ObjectId,
    action: string,
    idempotencyKey: string,
    session?: ClientSession,
  ) {
    return AuditLogModel.findOne({ actorId, action, idempotencyKey })
      .session(session ?? null)
      .exec();
  }
}
