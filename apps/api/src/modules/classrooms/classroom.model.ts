import mongoose, { Schema, model, type Model, type Types } from 'mongoose';

import { normalizeSearchKeyword } from '../../shared/validation/list-query.js';
import {
  CLASSROOM_ENROLLMENT_STATUSES,
  CLASSROOM_STATUSES,
  type ClassroomEnrollmentStatus,
  type ClassroomStatus,
  normalizeClassroomDisplayName,
} from './classroom.types.js';

export interface ClassroomRecord {
  _id: Types.ObjectId;
  name: string;
  nameNormalized: string;
  description?: string | null;
  subject?: string | null;
  section?: string | null;
  ownerTeacherId: Types.ObjectId;
  status: ClassroomStatus;
  enrollmentStatus: ClassroomEnrollmentStatus;
  allowClassCodeJoin: boolean;
  allowInviteLinkJoin: boolean;
  archivedAt?: Date | null;
  archivedBy?: Types.ObjectId | null;
  lockReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const classroomSchema = new Schema<ClassroomRecord>(
  {
    name: { type: String, required: true, minlength: 2, maxlength: 120 },
    nameNormalized: { type: String, required: true, maxlength: 120 },
    description: { type: String, maxlength: 1000, default: null },
    subject: { type: String, maxlength: 120, default: null },
    section: { type: String, maxlength: 120, default: null },
    ownerTeacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: CLASSROOM_STATUSES, required: true, default: 'ACTIVE' },
    enrollmentStatus: {
      type: String,
      enum: CLASSROOM_ENROLLMENT_STATUSES,
      required: true,
      default: 'OPEN',
    },
    allowClassCodeJoin: { type: Boolean, required: true, default: true },
    allowInviteLinkJoin: { type: Boolean, required: true, default: true },
    archivedAt: { type: Date, default: null },
    archivedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    lockReason: { type: String, maxlength: 500, default: null },
  },
  {
    collection: 'classrooms',
    timestamps: true,
    versionKey: false,
  },
);

classroomSchema.pre('validate', function normalizeName() {
  if (typeof this.name !== 'string') return;
  this.name = normalizeClassroomDisplayName(this.name);
  this.nameNormalized = normalizeSearchKeyword(this.name);
});

classroomSchema.index(
  { ownerTeacherId: 1, status: 1, updatedAt: -1, _id: -1 },
  { name: 'ix_classrooms_owner_status_updated' },
);
classroomSchema.index(
  { status: 1, createdAt: -1, _id: -1 },
  { name: 'ix_classrooms_status_created' },
);
classroomSchema.index(
  { ownerTeacherId: 1, nameNormalized: 1, _id: 1 },
  { name: 'ix_classrooms_owner_name' },
);
classroomSchema.index(
  { nameNormalized: 1, status: 1, _id: 1 },
  { name: 'ix_classrooms_name_status' },
);

export const ClassroomModel: Model<ClassroomRecord> =
  (mongoose.models.Classroom as Model<ClassroomRecord> | undefined) ??
  model<ClassroomRecord>('Classroom', classroomSchema);
