import mongoose, { Schema, model, type Model, type Types } from 'mongoose';

export const ENROLLMENT_POLICY_KEY = 'ENROLLMENT_POLICY' as const;

export interface EnrollmentPolicyValue {
  allowClassCodeJoin: boolean;
  allowInviteLinkJoin: boolean;
  defaultInviteLinkLifetimeDays: number;
}

export interface SystemSettingRecord {
  _id: Types.ObjectId;
  key: typeof ENROLLMENT_POLICY_KEY;
  value: EnrollmentPolicyValue;
  revision: number;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentPolicyValueSchema = new Schema<EnrollmentPolicyValue>(
  {
    allowClassCodeJoin: { type: Boolean, required: true },
    allowInviteLinkJoin: { type: Boolean, required: true },
    defaultInviteLinkLifetimeDays: { type: Number, required: true, min: 1, max: 90 },
  },
  { _id: false },
);

const systemSettingSchema = new Schema<SystemSettingRecord>(
  {
    key: { type: String, enum: [ENROLLMENT_POLICY_KEY], required: true },
    value: { type: enrollmentPolicyValueSchema, required: true },
    revision: { type: Number, required: true, min: 1, default: 1 },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    collection: 'system_settings',
    timestamps: true,
    versionKey: false,
  },
);

systemSettingSchema.index({ key: 1 }, { unique: true, name: 'uq_system_settings_key' });

export const SystemSettingModel: Model<SystemSettingRecord> =
  (mongoose.models.SystemSetting as Model<SystemSettingRecord> | undefined) ??
  model<SystemSettingRecord>('SystemSetting', systemSettingSchema);
