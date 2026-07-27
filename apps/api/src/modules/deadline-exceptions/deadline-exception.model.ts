import mongoose, { Schema, model, type Model, type Types } from 'mongoose';

import { ASSESSMENT_SCHEMA_VERSION } from '../learning-content/assessment.types.js';
import {
  LEARNING_ACTIVITY_TYPES,
  type LearningActivityType,
} from '../learning-content/learning-activity.reader.js';

export interface DeadlineExceptionRecord {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  classroomId: Types.ObjectId;
  courseId: Types.ObjectId;
  activityType: LearningActivityType;
  activityId: Types.ObjectId;
  deadline: Date;
  revision: number;
  active: boolean;
  reason: string;
  defaultDeadlineSnapshot: Date;
  changedBy: Types.ObjectId;
  changedAt: Date;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const deadlineExceptionSchema = new Schema<DeadlineExceptionRecord>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    classroomId: { type: Schema.Types.ObjectId, ref: 'Classroom', required: true, immutable: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, immutable: true },
    activityType: { type: String, enum: LEARNING_ACTIVITY_TYPES, required: true, immutable: true },
    activityId: { type: Schema.Types.ObjectId, required: true, immutable: true },
    deadline: { type: Date, required: true },
    revision: { type: Number, required: true, min: 1, default: 1, validate: Number.isInteger },
    active: { type: Boolean, required: true, default: true },
    reason: { type: String, required: true, minlength: 5, maxlength: 500 },
    defaultDeadlineSnapshot: { type: Date, required: true, immutable: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    changedAt: { type: Date, required: true },
    schemaVersion: {
      type: Number,
      required: true,
      enum: [ASSESSMENT_SCHEMA_VERSION],
      default: ASSESSMENT_SCHEMA_VERSION,
      immutable: true,
    },
  },
  { collection: 'activity_deadline_exceptions', timestamps: true, versionKey: false },
);

deadlineExceptionSchema.index(
  { studentId: 1, activityType: 1, activityId: 1 },
  { unique: true, name: 'deadline_exception_unique' },
);
deadlineExceptionSchema.index(
  { courseId: 1, studentId: 1, active: 1, deadline: 1 },
  { name: 'deadline_exception_course' },
);

export const DeadlineExceptionModel: Model<DeadlineExceptionRecord> =
  (mongoose.models.DeadlineException as Model<DeadlineExceptionRecord> | undefined) ??
  model<DeadlineExceptionRecord>('DeadlineException', deadlineExceptionSchema);
