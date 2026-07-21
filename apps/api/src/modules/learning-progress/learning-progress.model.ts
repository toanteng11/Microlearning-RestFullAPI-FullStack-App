import mongoose, { Schema, model, type Model, type Types } from 'mongoose';

import { CONTENT_SCHEMA_VERSION } from '../learning-content/content.types.js';
import type { LearningProgressStatus } from '../learning-content/learning-progress.reader.js';

export const LEARNING_ACTIVITY_TYPES = ['LESSON'] as const;
export type LearningActivityType = (typeof LEARNING_ACTIVITY_TYPES)[number];
export const LEARNING_PROGRESS_STATUSES = ['IN_PROGRESS', 'COMPLETED'] as const;

export interface LearningProgressRecord {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  classroomId: Types.ObjectId;
  courseId: Types.ObjectId;
  activityType: LearningActivityType;
  activityId: Types.ObjectId;
  status: LearningProgressStatus;
  startedAt: Date;
  completedAt: Date | null;
  lastActiveAt: Date;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const learningProgressSchema = new Schema<LearningProgressRecord>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    classroomId: { type: Schema.Types.ObjectId, ref: 'Classroom', required: true, immutable: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, immutable: true },
    activityType: {
      type: String,
      enum: LEARNING_ACTIVITY_TYPES,
      required: true,
      immutable: true,
    },
    activityId: { type: Schema.Types.ObjectId, required: true, immutable: true },
    status: { type: String, enum: LEARNING_PROGRESS_STATUSES, required: true },
    startedAt: { type: Date, required: true, immutable: true },
    completedAt: { type: Date, default: null },
    lastActiveAt: { type: Date, required: true },
    schemaVersion: {
      type: Number,
      required: true,
      enum: [CONTENT_SCHEMA_VERSION],
      default: CONTENT_SCHEMA_VERSION,
      immutable: true,
    },
  },
  { collection: 'learning_progress', timestamps: true, versionKey: false },
);

learningProgressSchema.pre('validate', function validateCompletionState() {
  if (this.status === 'COMPLETED' && !this.completedAt) {
    this.invalidate('completedAt', 'Completed progress requires completedAt');
  }
  if (this.status === 'IN_PROGRESS' && this.completedAt) {
    this.invalidate('completedAt', 'In-progress state cannot contain completedAt');
  }
  if (this.completedAt && this.completedAt < this.startedAt) {
    this.invalidate('completedAt', 'completedAt cannot be before startedAt');
  }
});

learningProgressSchema.index(
  { studentId: 1, activityType: 1, activityId: 1 },
  { unique: true, name: 'progress_activity_unique' },
);
learningProgressSchema.index(
  { studentId: 1, courseId: 1, status: 1, activityId: 1 },
  { name: 'progress_student_course' },
);
learningProgressSchema.index(
  { courseId: 1, studentId: 1, status: 1, lastActiveAt: -1 },
  { name: 'progress_course_students' },
);

export const LearningProgressModel: Model<LearningProgressRecord> =
  (mongoose.models.LearningProgress as Model<LearningProgressRecord> | undefined) ??
  model<LearningProgressRecord>('LearningProgress', learningProgressSchema);
