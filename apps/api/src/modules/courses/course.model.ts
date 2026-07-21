import mongoose, { Schema, model, type Model, type Types } from 'mongoose';

import {
  COMMON_CONTENT_STATUSES,
  CONTENT_SCHEMA_VERSION,
  normalizeContentTitle,
  normalizeOptionalContentText,
  type CommonContentStatus,
} from '../learning-content/content.types.js';

export interface CourseRecord {
  _id: Types.ObjectId;
  classroomId: Types.ObjectId;
  ownerTeacherId: Types.ObjectId;
  title: string;
  description: string;
  status: CommonContentStatus;
  scheduledPublishAt: Date | null;
  publishedAt: Date | null;
  unpublishedAt: Date | null;
  archivedAt: Date | null;
  displayOrder: number;
  structureRevision: number;
  schemaVersion: number;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<CourseRecord>(
  {
    classroomId: { type: Schema.Types.ObjectId, ref: 'Classroom', required: true, immutable: true },
    ownerTeacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 150,
      set: normalizeContentTitle,
    },
    description: {
      type: String,
      maxlength: 5_000,
      default: '',
      set: normalizeOptionalContentText,
    },
    status: { type: String, enum: COMMON_CONTENT_STATUSES, required: true, default: 'DRAFT' },
    scheduledPublishAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    unpublishedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
    displayOrder: { type: Number, required: true, min: 0, validate: Number.isInteger },
    structureRevision: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: Number.isInteger,
    },
    schemaVersion: {
      type: Number,
      required: true,
      enum: [CONTENT_SCHEMA_VERSION],
      default: CONTENT_SCHEMA_VERSION,
      immutable: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { collection: 'courses', timestamps: true, versionKey: false },
);

courseSchema.pre('validate', function validateLifecycleFields() {
  if (this.status === 'SCHEDULED' && !this.scheduledPublishAt) {
    this.invalidate('scheduledPublishAt', 'Scheduled Course requires scheduledPublishAt');
  }
  if (this.status === 'ARCHIVED' && !this.archivedAt) {
    this.invalidate('archivedAt', 'Archived Course requires archivedAt');
  }
});

courseSchema.index(
  { classroomId: 1, status: 1, displayOrder: 1, _id: 1 },
  { name: 'course_classroom_status_order' },
);
courseSchema.index(
  { ownerTeacherId: 1, status: 1, updatedAt: -1, _id: 1 },
  { name: 'course_owner_status_updated' },
);

export const CourseModel: Model<CourseRecord> =
  (mongoose.models.Course as Model<CourseRecord> | undefined) ??
  model<CourseRecord>('Course', courseSchema);
