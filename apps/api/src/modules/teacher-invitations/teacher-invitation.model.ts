import { Schema, model, models, type Model, type Types } from 'mongoose';

export const INVITATION_STATUSES = ['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export const INVITATION_CHANNELS = [
  'EMAIL',
  'ZALO',
  'FACEBOOK',
  'MESSENGER',
  'TEAMS',
  'OTHER',
] as const;
export type InvitationChannel = (typeof INVITATION_CHANNELS)[number];

export interface TeacherInvitationRecord {
  _id: Types.ObjectId;
  email: string;
  tokenHash: string;
  role: 'TEACHER';
  status: InvitationStatus;
  deliveryMethod: 'MANUAL_COPY';
  invitedBy: Types.ObjectId;
  expiresAt: Date;
  acceptedBy?: Types.ObjectId | null;
  acceptedAt?: Date | null;
  revokedAt?: Date | null;
  revokedBy?: Types.ObjectId | null;
  revokeReason?: string | null;
  copyCount: number;
  lastCopiedAt?: Date | null;
  channelHint?: InvitationChannel | null;
  createdAt: Date;
  updatedAt: Date;
}

const teacherInvitationSchema = new Schema<TeacherInvitationRecord>(
  {
    email: { type: String, required: true, maxlength: 254 },
    tokenHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['TEACHER'], required: true, default: 'TEACHER' },
    status: { type: String, enum: INVITATION_STATUSES, required: true },
    deliveryMethod: {
      type: String,
      enum: ['MANUAL_COPY'],
      required: true,
      default: 'MANUAL_COPY',
    },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    acceptedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    acceptedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
    revokedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    revokeReason: { type: String, maxlength: 500, default: null },
    copyCount: { type: Number, min: 0, default: 0 },
    lastCopiedAt: { type: Date, default: null },
    channelHint: { type: String, enum: INVITATION_CHANNELS, default: null },
  },
  {
    collection: 'teacher_invitations',
    timestamps: true,
    versionKey: false,
  },
);

teacherInvitationSchema.index(
  { tokenHash: 1 },
  { unique: true, name: 'uq_teacher_invitations_token_hash' },
);
teacherInvitationSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'PENDING' },
    name: 'uq_teacher_invitation_pending_email',
  },
);
teacherInvitationSchema.index(
  { email: 1, status: 1, expiresAt: -1 },
  { name: 'ix_teacher_invitations_email_status_expiry' },
);
teacherInvitationSchema.index(
  { status: 1, createdAt: -1, _id: 1 },
  { name: 'ix_teacher_invitations_status_created' },
);

export const TeacherInvitationModel: Model<TeacherInvitationRecord> =
  (models.TeacherInvitation as Model<TeacherInvitationRecord> | undefined) ??
  model<TeacherInvitationRecord>('TeacherInvitation', teacherInvitationSchema);
