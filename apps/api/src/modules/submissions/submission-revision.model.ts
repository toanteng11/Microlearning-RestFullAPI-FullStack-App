import mongoose, { Schema, model, type Model, type Types } from 'mongoose';

import {
  ASSESSMENT_SCHEMA_VERSION,
  SUBMISSION_STATUSES,
  type SubmissionStatus,
} from '../learning-content/assessment.types.js';
import { SUBMISSION_TYPES, type SubmissionType } from '../assignments/assignment.types.js';
import { SUBMISSION_EVENTS, type SubmissionEventType } from './submission.types.js';

export interface SubmissionRevisionRecord {
  _id: Types.ObjectId;
  submissionId: Types.ObjectId;
  assignmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  revision: number;
  eventType: SubmissionEventType;
  status: SubmissionStatus;
  submissionType: SubmissionType | null;
  textAnswer: string | null;
  links: string[];
  markDone: boolean;
  submittedAt: Date | null;
  isLate: boolean;
  effectiveDeadline: Date | null;
  actorId: Types.ObjectId;
  actorRole: string;
  reason: string | null;
  requestId: string;
  schemaVersion: number;
  createdAt: Date;
}

const submissionRevisionSchema = new Schema<SubmissionRevisionRecord>(
  {
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: 'Submission',
      required: true,
      immutable: true,
    },
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      immutable: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    revision: { type: Number, required: true, min: 1, validate: Number.isInteger, immutable: true },
    eventType: { type: String, enum: SUBMISSION_EVENTS, required: true, immutable: true },
    status: { type: String, enum: SUBMISSION_STATUSES, required: true, immutable: true },
    submissionType: { type: String, enum: SUBMISSION_TYPES, default: null, immutable: true },
    textAnswer: { type: String, default: null, immutable: true },
    links: { type: [String], required: true, default: [], immutable: true },
    markDone: { type: Boolean, required: true, default: false, immutable: true },
    submittedAt: { type: Date, default: null, immutable: true },
    isLate: { type: Boolean, required: true, immutable: true },
    effectiveDeadline: { type: Date, default: null, immutable: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    actorRole: { type: String, required: true, immutable: true },
    reason: { type: String, default: null, maxlength: 500, immutable: true },
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
    collection: 'submission_revisions',
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

submissionRevisionSchema.index(
  { submissionId: 1, revision: 1 },
  { unique: true, name: 'submission_revision_unique' },
);

export const SubmissionRevisionModel: Model<SubmissionRevisionRecord> =
  (mongoose.models.SubmissionRevision as Model<SubmissionRevisionRecord> | undefined) ??
  model<SubmissionRevisionRecord>('SubmissionRevision', submissionRevisionSchema);
