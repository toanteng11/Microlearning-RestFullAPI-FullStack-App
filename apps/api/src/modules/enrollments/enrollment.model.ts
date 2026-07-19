import mongoose, { Schema, model, type Model, type Types } from 'mongoose';

export const ENROLLMENT_STATUSES = ['ACTIVE', 'REMOVED', 'LEFT', 'BLOCKED'] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export const ENROLLMENT_JOIN_METHODS = ['CLASS_CODE', 'INVITE_LINK'] as const;
export type EnrollmentJoinMethod = (typeof ENROLLMENT_JOIN_METHODS)[number];

export interface EnrollmentRecord {
  _id: Types.ObjectId;
  classroomId: Types.ObjectId;
  studentId: Types.ObjectId;
  status: EnrollmentStatus;
  joinedBy: EnrollmentJoinMethod;
  joinedAt: Date;
  sourceCredentialId?: Types.ObjectId | null;
  removedAt?: Date | null;
  removedBy?: Types.ObjectId | null;
  removalReason?: string | null;
  rejoinAllowedAt?: Date | null;
  rejoinAllowedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<EnrollmentRecord>(
  {
    classroomId: { type: Schema.Types.ObjectId, ref: 'Classroom', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ENROLLMENT_STATUSES, required: true, default: 'ACTIVE' },
    joinedBy: { type: String, enum: ENROLLMENT_JOIN_METHODS, required: true },
    joinedAt: { type: Date, required: true, default: Date.now },
    sourceCredentialId: { type: Schema.Types.ObjectId, default: null },
    removedAt: { type: Date, default: null },
    removedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    removalReason: { type: String, minlength: 3, maxlength: 500, default: null },
    rejoinAllowedAt: { type: Date, default: null },
    rejoinAllowedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    collection: 'enrollments',
    timestamps: true,
    versionKey: false,
  },
);

enrollmentSchema.index(
  { classroomId: 1, studentId: 1 },
  { unique: true, name: 'uq_enrollments_classroom_student' },
);
enrollmentSchema.index(
  { classroomId: 1, status: 1, joinedAt: -1, _id: -1 },
  { name: 'ix_enrollments_classroom_status_joined' },
);
enrollmentSchema.index(
  { studentId: 1, status: 1, updatedAt: -1, _id: -1 },
  { name: 'ix_enrollments_student_status_updated' },
);
enrollmentSchema.index(
  { studentId: 1, classroomId: 1, status: 1 },
  { name: 'ix_enrollments_student_classroom_status' },
);

export const EnrollmentModel: Model<EnrollmentRecord> =
  (mongoose.models.Enrollment as Model<EnrollmentRecord> | undefined) ??
  model<EnrollmentRecord>('Enrollment', enrollmentSchema);
