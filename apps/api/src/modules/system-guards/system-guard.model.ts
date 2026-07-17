import mongoose, { Schema, model, type Model } from 'mongoose';

export interface SystemGuardRecord {
  _id: string;
  revision: number;
  updatedAt: Date;
}

const systemGuardSchema = new Schema<SystemGuardRecord>(
  {
    _id: { type: String, required: true },
    revision: { type: Number, required: true, min: 0, default: 0 },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: 'system_guards',
    versionKey: false,
  },
);

export const SystemGuardModel: Model<SystemGuardRecord> =
  (mongoose.models.SystemGuard as Model<SystemGuardRecord> | undefined) ??
  model<SystemGuardRecord>('SystemGuard', systemGuardSchema);
