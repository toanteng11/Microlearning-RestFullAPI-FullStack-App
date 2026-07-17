import mongoose, { Schema, model, type Model } from 'mongoose';

import { REGISTRATION_SOURCES, USER_ROLES, USER_STATUSES, type UserRecord } from './user.types.js';

const userSchema = new Schema<UserRecord>(
  {
    email: { type: String, required: true, maxlength: 254 },
    fullName: { type: String, required: true, maxlength: 200 },
    fullNameNormalized: { type: String, required: true, maxlength: 200 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, required: true },
    status: { type: String, enum: USER_STATUSES, required: true },
    registrationSource: { type: String, enum: REGISTRATION_SOURCES, required: true },
    studentCode: { type: String, default: null },
    department: { type: String, default: null },
    avatarUrl: { type: String, default: null },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    activatedAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    lastActiveAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  {
    collection: 'users',
    timestamps: true,
    versionKey: false,
  },
);

userSchema.index({ email: 1 }, { unique: true, name: 'uq_users_email' });
userSchema.index(
  { role: 1, status: 1, createdAt: -1, _id: 1 },
  { name: 'ix_users_role_status_created' },
);
userSchema.index({ role: 1, fullNameNormalized: 1, _id: 1 }, { name: 'ix_users_role_name' });
userSchema.index({ role: 1, email: 1, _id: 1 }, { name: 'ix_users_role_email' });
userSchema.index(
  { studentCode: 1 },
  {
    unique: true,
    partialFilterExpression: { studentCode: { $type: 'string' } },
    name: 'uq_users_student_code',
  },
);

export const UserModel: Model<UserRecord> =
  (mongoose.models.User as Model<UserRecord> | undefined) ?? model<UserRecord>('User', userSchema);
