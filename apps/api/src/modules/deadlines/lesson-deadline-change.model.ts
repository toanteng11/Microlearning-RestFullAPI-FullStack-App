import mongoose, { Schema, model, type Model, type Types } from 'mongoose';

import {
  CONTENT_SCHEMA_VERSION,
  normalizeOptionalContentText,
} from '../learning-content/content.types.js';

export interface LessonDeadlineChangeRecord {
  _id: Types.ObjectId;
  lessonId: Types.ObjectId;
  courseId: Types.ObjectId;
  classroomId: Types.ObjectId;
  fromDeadline: Date | null;
  toDeadline: Date | null;
  fromRevision: number;
  toRevision: number;
  reason: string | null;
  actorId: Types.ObjectId;
  requestId: string;
  changedAt: Date;
  schemaVersion: number;
}

const lessonDeadlineChangeSchema = new Schema<LessonDeadlineChangeRecord>(
  {
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true, immutable: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, immutable: true },
    classroomId: { type: Schema.Types.ObjectId, ref: 'Classroom', required: true, immutable: true },
    fromDeadline: { type: Date, default: null, immutable: true },
    toDeadline: { type: Date, default: null, immutable: true },
    fromRevision: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isInteger,
      immutable: true,
    },
    toRevision: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isInteger,
      immutable: true,
    },
    reason: {
      type: String,
      maxlength: 500,
      default: null,
      set: (value: string | null | undefined) => normalizeOptionalContentText(value) || null,
      immutable: true,
    },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    requestId: { type: String, required: true, maxlength: 200, immutable: true },
    changedAt: { type: Date, required: true, immutable: true },
    schemaVersion: {
      type: Number,
      required: true,
      enum: [CONTENT_SCHEMA_VERSION],
      default: CONTENT_SCHEMA_VERSION,
      immutable: true,
    },
  },
  { collection: 'lesson_deadline_changes', versionKey: false },
);

lessonDeadlineChangeSchema.pre('validate', function validateRevisionSequence() {
  if (this.toRevision !== this.fromRevision + 1) {
    this.invalidate('toRevision', 'Deadline revision must increase by exactly one');
  }
  if (this.fromDeadline?.getTime() === this.toDeadline?.getTime()) {
    this.invalidate('toDeadline', 'Deadline change must modify the current value');
  }
});

lessonDeadlineChangeSchema.index(
  { lessonId: 1, toRevision: 1 },
  { unique: true, name: 'deadline_history_revision_unique' },
);
lessonDeadlineChangeSchema.index(
  { lessonId: 1, changedAt: -1, _id: -1 },
  { name: 'deadline_history_recent' },
);

export const LessonDeadlineChangeModel: Model<LessonDeadlineChangeRecord> =
  (mongoose.models.LessonDeadlineChange as Model<LessonDeadlineChangeRecord> | undefined) ??
  model<LessonDeadlineChangeRecord>('LessonDeadlineChange', lessonDeadlineChangeSchema);
