import mongoose, { Schema, model, type Model, type Types } from 'mongoose';

export const CLASS_CODE_STATUSES = ['ACTIVE', 'DISABLED', 'REGENERATED', 'EXPIRED'] as const;
export type ClassCodeStatus = (typeof CLASS_CODE_STATUSES)[number];

export interface ClassCodeRecord {
  _id: Types.ObjectId;
  classroomId: Types.ObjectId;
  codeDigest: string;
  maskedCode: string;
  status: ClassCodeStatus;
  generatedBy: Types.ObjectId;
  generatedAt: Date;
  disabledAt?: Date | null;
  disabledBy?: Types.ObjectId | null;
  replacedById?: Types.ObjectId | null;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const classCodeSchema = new Schema<ClassCodeRecord>(
  {
    classroomId: { type: Schema.Types.ObjectId, ref: 'Classroom', required: true },
    codeDigest: { type: String, required: true, select: false, minlength: 64, maxlength: 64 },
    maskedCode: {
      type: String,
      required: true,
      match: /^\*{4}-[A-HJ-NP-Z2-9]{4}$/u,
    },
    status: { type: String, enum: CLASS_CODE_STATUSES, required: true, default: 'ACTIVE' },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    generatedAt: { type: Date, required: true, default: Date.now },
    disabledAt: { type: Date, default: null },
    disabledBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    replacedById: { type: Schema.Types.ObjectId, ref: 'ClassCode', default: null },
    expiresAt: { type: Date, default: null },
  },
  {
    collection: 'class_codes',
    timestamps: true,
    versionKey: false,
  },
);

classCodeSchema.index({ codeDigest: 1 }, { unique: true, name: 'uq_class_codes_digest' });
classCodeSchema.index(
  { classroomId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'ACTIVE' },
    name: 'uq_class_codes_active_classroom',
  },
);
classCodeSchema.index(
  { classroomId: 1, createdAt: -1 },
  { name: 'ix_class_codes_classroom_created' },
);

export const ClassCodeModel: Model<ClassCodeRecord> =
  (mongoose.models.ClassCode as Model<ClassCodeRecord> | undefined) ??
  model<ClassCodeRecord>('ClassCode', classCodeSchema);
