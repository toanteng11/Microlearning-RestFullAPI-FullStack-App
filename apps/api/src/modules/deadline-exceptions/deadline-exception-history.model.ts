import mongoose, { Schema, model, type Model, type Types } from 'mongoose';

import { ASSESSMENT_SCHEMA_VERSION } from '../learning-content/assessment.types.js';
import {
  LEARNING_ACTIVITY_TYPES,
  type LearningActivityType,
} from '../learning-content/learning-activity.reader.js';
import {
  DEADLINE_EXCEPTION_ACTIONS,
  type DeadlineExceptionAction,
} from './deadline-exception.types.js';

export interface DeadlineExceptionHistoryRecord {
  _id: Types.ObjectId;
  deadlineExceptionId: Types.ObjectId;
  studentId: Types.ObjectId;
  activityType: LearningActivityType;
  activityId: Types.ObjectId;
  fromDeadline: Date | null;
  toDeadline: Date | null;
  fromRevision: number;
  toRevision: number;
  action: DeadlineExceptionAction;
  reason: string;
  actorId: Types.ObjectId;
  actorRole: string;
  requestId: string;
  schemaVersion: number;
  createdAt: Date;
}

const deadlineExceptionHistorySchema = new Schema<DeadlineExceptionHistoryRecord>(
  {
    deadlineExceptionId: {
      type: Schema.Types.ObjectId,
      ref: 'DeadlineException',
      required: true,
      immutable: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    activityType: { type: String, enum: LEARNING_ACTIVITY_TYPES, required: true, immutable: true },
    activityId: { type: Schema.Types.ObjectId, required: true, immutable: true },
    fromDeadline: { type: Date, default: null, immutable: true },
    toDeadline: { type: Date, default: null, immutable: true },
    fromRevision: { type: Number, required: true, min: 0, immutable: true },
    toRevision: { type: Number, required: true, min: 1, immutable: true },
    action: { type: String, enum: DEADLINE_EXCEPTION_ACTIONS, required: true, immutable: true },
    reason: { type: String, required: true, minlength: 5, maxlength: 500, immutable: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    actorRole: { type: String, required: true, immutable: true },
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
    collection: 'deadline_exception_history',
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

deadlineExceptionHistorySchema.index(
  { studentId: 1, activityType: 1, activityId: 1, toRevision: 1 },
  { unique: true, name: 'deadline_exception_history_unique' },
);

export const DeadlineExceptionHistoryModel: Model<DeadlineExceptionHistoryRecord> =
  (mongoose.models.DeadlineExceptionHistory as Model<DeadlineExceptionHistoryRecord> | undefined) ??
  model<DeadlineExceptionHistoryRecord>('DeadlineExceptionHistory', deadlineExceptionHistorySchema);
