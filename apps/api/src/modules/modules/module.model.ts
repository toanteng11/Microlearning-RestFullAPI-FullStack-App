import mongoose, { Schema, model, type Model, type Types } from 'mongoose';

import {
  CONTENT_SCHEMA_VERSION,
  MODULE_CONTENT_STATUSES,
  normalizeContentTitle,
  normalizeOptionalContentText,
  type ModuleContentStatus,
} from '../learning-content/content.types.js';

export interface CourseModuleRecord {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  title: string;
  description: string;
  status: ModuleContentStatus;
  displayOrder: number;
  archivedAt: Date | null;
  schemaVersion: number;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const courseModuleSchema = new Schema<CourseModuleRecord>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, immutable: true },
    title: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 150,
      set: normalizeContentTitle,
    },
    description: {
      type: String,
      maxlength: 2_000,
      default: '',
      set: normalizeOptionalContentText,
    },
    status: { type: String, enum: MODULE_CONTENT_STATUSES, required: true, default: 'DRAFT' },
    displayOrder: { type: Number, required: true, min: 0, validate: Number.isInteger },
    archivedAt: { type: Date, default: null },
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
  { collection: 'course_modules', timestamps: true, versionKey: false },
);

courseModuleSchema.pre('validate', function validateArchivedAt() {
  if (this.status === 'ARCHIVED' && !this.archivedAt) {
    this.invalidate('archivedAt', 'Archived Module requires archivedAt');
  }
});

courseModuleSchema.index(
  { courseId: 1, status: 1, displayOrder: 1, _id: 1 },
  { name: 'module_course_status_order' },
);

export const CourseModuleModel: Model<CourseModuleRecord> =
  (mongoose.models.CourseModule as Model<CourseModuleRecord> | undefined) ??
  model<CourseModuleRecord>('CourseModule', courseModuleSchema);
