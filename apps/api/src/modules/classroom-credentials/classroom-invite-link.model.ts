import mongoose, { Schema, model, type Model, type Types } from 'mongoose';

export const CLASSROOM_INVITE_LINK_STATUSES = [
  'ACTIVE',
  'DISABLED',
  'REGENERATED',
  'EXPIRED',
] as const;
export type ClassroomInviteLinkStatus = (typeof CLASSROOM_INVITE_LINK_STATUSES)[number];

export interface ClassroomInviteLinkRecord {
  _id: Types.ObjectId;
  classroomId: Types.ObjectId;
  tokenHash: string;
  status: ClassroomInviteLinkStatus;
  createdBy: Types.ObjectId;
  expiresAt: Date;
  disabledAt?: Date | null;
  disabledBy?: Types.ObjectId | null;
  replacedById?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const classroomInviteLinkSchema = new Schema<ClassroomInviteLinkRecord>(
  {
    classroomId: { type: Schema.Types.ObjectId, ref: 'Classroom', required: true },
    tokenHash: { type: String, required: true, select: false, minlength: 64, maxlength: 64 },
    status: {
      type: String,
      enum: CLASSROOM_INVITE_LINK_STATUSES,
      required: true,
      default: 'ACTIVE',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    disabledAt: { type: Date, default: null },
    disabledBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    replacedById: { type: Schema.Types.ObjectId, ref: 'ClassroomInviteLink', default: null },
  },
  {
    collection: 'classroom_invite_links',
    timestamps: true,
    versionKey: false,
  },
);

classroomInviteLinkSchema.index(
  { tokenHash: 1 },
  { unique: true, name: 'uq_classroom_invite_links_hash' },
);
classroomInviteLinkSchema.index(
  { classroomId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'ACTIVE' },
    name: 'uq_classroom_invite_links_active_classroom',
  },
);
classroomInviteLinkSchema.index(
  { status: 1, expiresAt: 1 },
  { name: 'ix_classroom_invite_links_expiry' },
);
classroomInviteLinkSchema.index(
  { classroomId: 1, createdAt: -1 },
  { name: 'ix_classroom_invite_links_classroom_created' },
);

export const ClassroomInviteLinkModel: Model<ClassroomInviteLinkRecord> =
  (mongoose.models.ClassroomInviteLink as Model<ClassroomInviteLinkRecord> | undefined) ??
  model<ClassroomInviteLinkRecord>('ClassroomInviteLink', classroomInviteLinkSchema);
