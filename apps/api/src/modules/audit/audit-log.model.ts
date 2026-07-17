import { Schema, model, models, type Model, type Types } from 'mongoose';

export interface AuditLogRecord {
  _id: Types.ObjectId;
  actorId?: Types.ObjectId | null;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  reason?: string | null;
  requestId: string;
  metadata?: Record<string, unknown> | null;
  idempotencyKey?: string | null;
  createdAt: Date;
}

const auditLogSchema = new Schema<AuditLogRecord>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    actorRole: { type: String, required: true, maxlength: 50 },
    action: { type: String, required: true, maxlength: 100 },
    resourceType: { type: String, required: true, maxlength: 100 },
    resourceId: { type: String, required: true, maxlength: 100 },
    oldValue: { type: Schema.Types.Mixed, default: null },
    newValue: { type: Schema.Types.Mixed, default: null },
    reason: { type: String, maxlength: 500, default: null },
    requestId: { type: String, required: true, maxlength: 200 },
    metadata: { type: Schema.Types.Mixed, default: null },
    idempotencyKey: { type: String, default: null },
  },
  {
    collection: 'audit_logs',
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

auditLogSchema.index({ createdAt: -1 }, { name: 'ix_audit_logs_created' });
auditLogSchema.index({ actorId: 1, createdAt: -1 }, { name: 'ix_audit_logs_actor_created' });
auditLogSchema.index(
  { resourceType: 1, resourceId: 1, createdAt: -1 },
  { name: 'ix_audit_logs_resource_created' },
);
auditLogSchema.index(
  { actorId: 1, action: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: 'string' } },
    name: 'uq_audit_logs_idempotency',
  },
);

export const AuditLogModel: Model<AuditLogRecord> =
  (models.AuditLog as Model<AuditLogRecord> | undefined) ??
  model<AuditLogRecord>('AuditLog', auditLogSchema);
