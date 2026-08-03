import mongoose, { Schema, model, type Model, type Types } from 'mongoose';

import {
  REPORTING_INVALIDATION_REASONS,
  REPORTING_INVALIDATION_SCOPE_TYPES,
  REPORTING_INVALIDATION_STATUSES,
  REPORTING_SCHEMA_VERSION,
} from './reporting.constants.js';
import type {
  ReportingInvalidationReason,
  ReportingInvalidationScopeType,
  ReportingInvalidationStatus,
} from './reporting.types.js';

export interface ReportingInvalidationRecord {
  _id: Types.ObjectId;
  schemaVersion: typeof REPORTING_SCHEMA_VERSION;
  scopeKey: string;
  scopeType: ReportingInvalidationScopeType;
  classroomId: Types.ObjectId;
  courseId: Types.ObjectId | null;
  studentId: Types.ObjectId | null;
  reasons: ReportingInvalidationReason[];
  sourceChangedAt: Date;
  status: ReportingInvalidationStatus;
  attempts: number;
  revision: number;
  lastErrorCode: string | null;
  nextRetryAt: Date | null;
  lockedAt: Date | null;
  lockedBy: string | null;
  claimToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const reportingInvalidationSchema = new Schema<ReportingInvalidationRecord>(
  {
    schemaVersion: {
      type: Number,
      required: true,
      enum: [REPORTING_SCHEMA_VERSION],
      default: REPORTING_SCHEMA_VERSION,
      immutable: true,
    },
    scopeKey: { type: String, required: true, maxlength: 200, immutable: true },
    scopeType: {
      type: String,
      enum: REPORTING_INVALIDATION_SCOPE_TYPES,
      required: true,
      immutable: true,
    },
    classroomId: {
      type: Schema.Types.ObjectId,
      ref: 'Classroom',
      required: true,
      immutable: true,
    },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', default: null, immutable: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', default: null, immutable: true },
    reasons: {
      type: [String],
      enum: REPORTING_INVALIDATION_REASONS,
      required: true,
      validate: {
        validator: (value: readonly string[]) => value.length > 0,
        message: 'reasons must not be empty',
      },
    },
    sourceChangedAt: { type: Date, required: true },
    status: {
      type: String,
      enum: REPORTING_INVALIDATION_STATUSES,
      required: true,
      default: 'PENDING',
    },
    attempts: { type: Number, required: true, min: 0, default: 0, validate: Number.isInteger },
    revision: { type: Number, required: true, min: 1, default: 1, validate: Number.isInteger },
    lastErrorCode: { type: String, maxlength: 100, default: null },
    nextRetryAt: { type: Date, default: null },
    lockedAt: { type: Date, default: null },
    lockedBy: { type: String, maxlength: 200, default: null },
    claimToken: { type: String, maxlength: 200, default: null },
  },
  {
    collection: 'reporting_invalidations',
    timestamps: true,
    versionKey: false,
  },
);

reportingInvalidationSchema.pre('validate', function validateScope() {
  const valid =
    (this.scopeType === 'STUDENT_COURSE' && this.courseId && this.studentId) ||
    (this.scopeType === 'COURSE' && this.courseId && !this.studentId) ||
    (this.scopeType === 'CLASSROOM' && !this.courseId && !this.studentId);
  if (!valid) this.invalidate('scopeType', 'Invalid reporting invalidation scope');
  this.reasons = [...new Set(this.reasons)].sort();
});

reportingInvalidationSchema.index(
  { scopeKey: 1 },
  { unique: true, name: 'report_invalidation_scope_unique' },
);
reportingInvalidationSchema.index(
  { status: 1, nextRetryAt: 1, sourceChangedAt: 1 },
  { name: 'report_invalidation_due_claim' },
);
reportingInvalidationSchema.index(
  { classroomId: 1, courseId: 1, studentId: 1 },
  { name: 'report_invalidation_scope_lookup' },
);

export const ReportingInvalidationModel: Model<ReportingInvalidationRecord> =
  (mongoose.models.ReportingInvalidation as Model<ReportingInvalidationRecord> | undefined) ??
  model<ReportingInvalidationRecord>('ReportingInvalidation', reportingInvalidationSchema);
