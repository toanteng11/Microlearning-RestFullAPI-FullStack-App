import mongoose, { Schema, model, type Model, type Types } from 'mongoose';

import {
  ASSESSMENT_SCHEMA_VERSION,
  GRADE_STATUSES,
  type GradeStatus,
} from '../learning-content/assessment.types.js';

export interface GradeRevisionRecord {
  _id: Types.ObjectId;
  gradeId: Types.ObjectId;
  revision: number;
  oldScore: number | null;
  newScore: number;
  oldStatus: GradeStatus | null;
  newStatus: GradeStatus;
  evidenceId: Types.ObjectId;
  evidenceRevision: number;
  feedback: string | null;
  reason: string | null;
  actorId: Types.ObjectId;
  requestId: string;
  schemaVersion: number;
  createdAt: Date;
}

const gradeRevisionSchema = new Schema<GradeRevisionRecord>(
  {
    gradeId: { type: Schema.Types.ObjectId, ref: 'Grade', required: true, immutable: true },
    revision: { type: Number, required: true, min: 1, validate: Number.isInteger, immutable: true },
    oldScore: { type: Number, default: null, immutable: true },
    newScore: { type: Number, required: true, min: 0, immutable: true },
    oldStatus: { type: String, enum: GRADE_STATUSES, default: null, immutable: true },
    newStatus: { type: String, enum: GRADE_STATUSES, required: true, immutable: true },
    evidenceId: { type: Schema.Types.ObjectId, required: true, immutable: true },
    evidenceRevision: { type: Number, required: true, min: 1, immutable: true },
    feedback: { type: String, default: null, immutable: true },
    reason: { type: String, default: null, maxlength: 500, immutable: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    requestId: { type: String, required: true, immutable: true },
    schemaVersion: {
      type: Number,
      required: true,
      enum: [ASSESSMENT_SCHEMA_VERSION],
      default: ASSESSMENT_SCHEMA_VERSION,
      immutable: true,
    },
  },
  {
    collection: 'grade_revisions',
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

gradeRevisionSchema.index(
  { gradeId: 1, revision: 1 },
  { unique: true, name: 'grade_revision_unique' },
);

export const GradeRevisionModel: Model<GradeRevisionRecord> =
  (mongoose.models.GradeRevision as Model<GradeRevisionRecord> | undefined) ??
  model<GradeRevisionRecord>('GradeRevision', gradeRevisionSchema);
