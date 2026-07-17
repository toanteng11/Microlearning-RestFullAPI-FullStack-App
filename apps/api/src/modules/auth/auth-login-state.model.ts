import mongoose, { Schema, model, type Model, type Types } from 'mongoose';

export interface AuthLoginStateRecord {
  _id: Types.ObjectId;
  identityKey: string;
  failureCount: number;
  windowStartedAt: Date;
  lockedUntil?: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const authLoginStateSchema = new Schema<AuthLoginStateRecord>(
  {
    identityKey: { type: String, required: true },
    failureCount: { type: Number, required: true, min: 0 },
    windowStartedAt: { type: Date, required: true },
    lockedUntil: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
  },
  {
    collection: 'auth_login_states',
    timestamps: true,
    versionKey: false,
  },
);

authLoginStateSchema.index(
  { identityKey: 1 },
  { unique: true, name: 'uq_auth_login_states_identity' },
);
authLoginStateSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: 'ttl_auth_login_states_expiry' },
);

export const AuthLoginStateModel: Model<AuthLoginStateRecord> =
  (mongoose.models.AuthLoginState as Model<AuthLoginStateRecord> | undefined) ??
  model<AuthLoginStateRecord>('AuthLoginState', authLoginStateSchema);
