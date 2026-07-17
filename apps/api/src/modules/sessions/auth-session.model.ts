import { Schema, model, models, type Model, type Types } from 'mongoose';

export const AUTH_SESSION_STATUSES = ['ACTIVE', 'ROTATED', 'REVOKED'] as const;
export type AuthSessionStatus = (typeof AUTH_SESSION_STATUSES)[number];

export const SESSION_REVOKE_REASONS = [
  'LOGOUT',
  'REUSE',
  'PASSWORD_RESET',
  'ACCOUNT_STATUS',
  'ADMIN',
  'EXPIRED',
] as const;
export type SessionRevokeReason = (typeof SESSION_REVOKE_REASONS)[number];

export interface AuthSessionRecord {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  familyId: string;
  tokenHash: string;
  status: AuthSessionStatus;
  expiresAt: Date;
  rotatedAt?: Date | null;
  replacedBySessionId?: Types.ObjectId | null;
  revokedAt?: Date | null;
  revokeReason?: SessionRevokeReason | null;
  lastUsedAt?: Date | null;
  userAgentHash?: string | null;
  ipPrefixHash?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const authSessionSchema = new Schema<AuthSessionRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    familyId: { type: String, required: true },
    tokenHash: { type: String, required: true, select: false },
    status: { type: String, enum: AUTH_SESSION_STATUSES, required: true },
    expiresAt: { type: Date, required: true },
    rotatedAt: { type: Date, default: null },
    replacedBySessionId: { type: Schema.Types.ObjectId, ref: 'AuthSession', default: null },
    revokedAt: { type: Date, default: null },
    revokeReason: { type: String, enum: SESSION_REVOKE_REASONS, default: null },
    lastUsedAt: { type: Date, default: null },
    userAgentHash: { type: String, default: null },
    ipPrefixHash: { type: String, default: null },
  },
  {
    collection: 'auth_sessions',
    timestamps: true,
    versionKey: false,
  },
);

authSessionSchema.index({ tokenHash: 1 }, { unique: true, name: 'uq_auth_sessions_token_hash' });
authSessionSchema.index({ familyId: 1, status: 1 }, { name: 'ix_auth_sessions_family_status' });
authSessionSchema.index(
  { userId: 1, status: 1, expiresAt: 1 },
  { name: 'ix_auth_sessions_user_status_expiry' },
);
authSessionSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: 'ttl_auth_sessions_expiry' },
);

export const AuthSessionModel: Model<AuthSessionRecord> =
  (models.AuthSession as Model<AuthSessionRecord> | undefined) ??
  model<AuthSessionRecord>('AuthSession', authSessionSchema);
