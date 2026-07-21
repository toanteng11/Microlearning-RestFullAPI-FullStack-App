import mongoose, { Schema, model, type Model, type Types } from 'mongoose';

import {
  COMMON_CONTENT_STATUSES,
  CONTENT_SCHEMA_VERSION,
  normalizeContentTitle,
  normalizeMarkdown,
  type CommonContentStatus,
} from '../learning-content/content.types.js';

export const LESSON_CONTENT_FORMATS = ['MARKDOWN'] as const;
export type LessonContentFormat = (typeof LESSON_CONTENT_FORMATS)[number];

export interface LessonRecord {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  moduleId: Types.ObjectId | null;
  title: string;
  content: string;
  contentFormat: LessonContentFormat;
  estimatedMinutes: number;
  isRequired: boolean;
  status: CommonContentStatus;
  scheduledPublishAt: Date | null;
  publishedAt: Date | null;
  unpublishedAt: Date | null;
  archivedAt: Date | null;
  publishedRevision: number | null;
  contentRevision: number;
  completionDeadline: Date | null;
  deadlineRevision: number;
  deadlineLastUpdatedAt: Date | null;
  deadlineLastUpdatedBy: Types.ObjectId | null;
  displayOrder: number;
  flashcardRevision: number;
  schemaVersion: number;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new Schema<LessonRecord>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, immutable: true },
    moduleId: { type: Schema.Types.ObjectId, ref: 'CourseModule', default: null },
    title: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 150,
      set: normalizeContentTitle,
    },
    content: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 500_000,
      set: normalizeMarkdown,
    },
    contentFormat: {
      type: String,
      enum: LESSON_CONTENT_FORMATS,
      required: true,
      default: 'MARKDOWN',
      immutable: true,
    },
    estimatedMinutes: {
      type: Number,
      required: true,
      min: 1,
      max: 60,
      validate: Number.isInteger,
    },
    isRequired: { type: Boolean, required: true, default: true },
    status: { type: String, enum: COMMON_CONTENT_STATUSES, required: true, default: 'DRAFT' },
    scheduledPublishAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    unpublishedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
    publishedRevision: {
      type: Number,
      min: 1,
      default: null,
      validate: (value: number | null) => value === null || Number.isInteger(value),
    },
    contentRevision: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
      validate: Number.isInteger,
    },
    completionDeadline: { type: Date, default: null },
    deadlineRevision: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: Number.isInteger,
    },
    deadlineLastUpdatedAt: { type: Date, default: null },
    deadlineLastUpdatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    displayOrder: { type: Number, required: true, min: 0, validate: Number.isInteger },
    flashcardRevision: {
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
  { collection: 'lessons', timestamps: true, versionKey: false },
);

lessonSchema.pre('validate', function validateLifecycleFields() {
  if (this.status === 'SCHEDULED' && !this.scheduledPublishAt) {
    this.invalidate('scheduledPublishAt', 'Scheduled Lesson requires scheduledPublishAt');
  }
  if (['SCHEDULED', 'PUBLISHED'].includes(this.status)) {
    if (!this.completionDeadline) {
      this.invalidate('completionDeadline', 'Published Lesson requires completionDeadline');
    }
    if (this.publishedRevision === null) {
      this.invalidate('publishedRevision', 'Published Lesson requires publishedRevision');
    }
  }
  if (this.status === 'ARCHIVED' && !this.archivedAt) {
    this.invalidate('archivedAt', 'Archived Lesson requires archivedAt');
  }
});

lessonSchema.index(
  { courseId: 1, status: 1, moduleId: 1, displayOrder: 1, _id: 1 },
  { name: 'lesson_course_status_order' },
);
lessonSchema.index(
  { moduleId: 1, status: 1, displayOrder: 1, _id: 1 },
  { name: 'lesson_module_status_order' },
);
lessonSchema.index(
  { courseId: 1, status: 1, isRequired: 1, completionDeadline: 1, _id: 1 },
  { name: 'lesson_due_visibility' },
);

export const LessonModel: Model<LessonRecord> =
  (mongoose.models.Lesson as Model<LessonRecord> | undefined) ??
  model<LessonRecord>('Lesson', lessonSchema);
