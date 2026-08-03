import mongoose, { model, Schema, type Model, type Types } from 'mongoose';

import {
  PROCESS_SCORE_VERSION,
  REPORTING_DESCRIPTOR_VERSION,
  REPORTING_SCHEMA_VERSION,
  REPORTING_SOURCE_METRIC_VERSION,
} from './reporting.constants.js';

export interface CourseProgressSnapshotRecord {
  _id: Types.ObjectId;
  schemaVersion: typeof REPORTING_SCHEMA_VERSION;
  courseId: Types.ObjectId;
  classroomId: Types.ObjectId;
  studentId: Types.ObjectId;
  sourceMetricVersion: typeof REPORTING_SOURCE_METRIC_VERSION;
  descriptorVersion: typeof REPORTING_DESCRIPTOR_VERSION;
  processScoreVersion: typeof PROCESS_SCORE_VERSION;
  summaryRevision: number;
  progressPercentage: number | null;
  processScore: number | null;
  returnedGradeAverage: number | null;
  completedRequiredCount: number;
  requiredActivityCount: number;
  missingActivityCount: number;
  lateActivityCount: number;
  capturedAt: Date;
  createdAt: Date;
}

const nullablePercentage = { type: Number, default: null, min: 0, max: 100 } as const;

const courseProgressSnapshotSchema = new Schema<CourseProgressSnapshotRecord>(
  {
    schemaVersion: {
      type: Number,
      required: true,
      enum: [REPORTING_SCHEMA_VERSION],
      immutable: true,
    },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, immutable: true },
    classroomId: {
      type: Schema.Types.ObjectId,
      ref: 'Classroom',
      required: true,
      immutable: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    sourceMetricVersion: {
      type: String,
      enum: [REPORTING_SOURCE_METRIC_VERSION],
      required: true,
      immutable: true,
    },
    descriptorVersion: {
      type: String,
      enum: [REPORTING_DESCRIPTOR_VERSION],
      required: true,
      immutable: true,
    },
    processScoreVersion: {
      type: String,
      enum: [PROCESS_SCORE_VERSION],
      required: true,
      immutable: true,
    },
    summaryRevision: { type: Number, required: true, min: 1, validate: Number.isInteger },
    progressPercentage: nullablePercentage,
    processScore: nullablePercentage,
    returnedGradeAverage: nullablePercentage,
    completedRequiredCount: { type: Number, required: true, min: 0, validate: Number.isInteger },
    requiredActivityCount: { type: Number, required: true, min: 0, validate: Number.isInteger },
    missingActivityCount: { type: Number, required: true, min: 0, validate: Number.isInteger },
    lateActivityCount: { type: Number, required: true, min: 0, validate: Number.isInteger },
    capturedAt: { type: Date, required: true, immutable: true },
  },
  {
    collection: 'course_progress_snapshots',
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

courseProgressSnapshotSchema.index(
  { courseId: 1, studentId: 1, processScoreVersion: 1, summaryRevision: 1 },
  { unique: true, name: 'uq_progress_snapshot_summary_revision' },
);
courseProgressSnapshotSchema.index(
  { studentId: 1, courseId: 1, capturedAt: 1, _id: 1 },
  { name: 'ix_progress_snapshot_student_course_time' },
);

export const CourseProgressSnapshotModel: Model<CourseProgressSnapshotRecord> =
  (mongoose.models.CourseProgressSnapshot as Model<CourseProgressSnapshotRecord> | undefined) ??
  model<CourseProgressSnapshotRecord>('CourseProgressSnapshot', courseProgressSnapshotSchema);
