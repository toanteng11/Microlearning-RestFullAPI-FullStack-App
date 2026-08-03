import mongoose, { model, Schema, type Model, type Types } from 'mongoose';

import { ANALYTICS_EVENT_NAMES, ANALYTICS_EVENT_SCHEMA_VERSION } from './reporting.constants.js';
import type { AnalyticsEventName } from './reporting.types.js';
import type { UserRole } from '../users/user.types.js';

export interface AnalyticsEventRecord {
  _id: Types.ObjectId;
  eventId: string;
  eventName: AnalyticsEventName;
  schemaVersion: typeof ANALYTICS_EVENT_SCHEMA_VERSION;
  actorId: Types.ObjectId;
  actorRole: UserRole;
  context: {
    classroomId?: Types.ObjectId;
    courseId?: Types.ObjectId;
    activityType?: 'LESSON' | 'QUIZ' | 'ASSIGNMENT';
    activityId?: Types.ObjectId;
  };
  properties: Record<string, string | number | boolean | null>;
  occurredAt: Date;
  receivedAt: Date;
  expiresAt: Date;
  environment: string;
  appVersion: string;
  createdAt: Date;
}

const analyticsEventSchema = new Schema<AnalyticsEventRecord>(
  {
    eventId: { type: String, required: true, immutable: true, maxlength: 36 },
    eventName: { type: String, required: true, enum: ANALYTICS_EVENT_NAMES, immutable: true },
    schemaVersion: {
      type: Number,
      required: true,
      enum: [ANALYTICS_EVENT_SCHEMA_VERSION],
      immutable: true,
    },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    actorRole: { type: String, required: true, immutable: true },
    context: {
      classroomId: { type: Schema.Types.ObjectId, ref: 'Classroom' },
      courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
      activityType: { type: String, enum: ['LESSON', 'QUIZ', 'ASSIGNMENT'] },
      activityId: { type: Schema.Types.ObjectId },
    },
    properties: { type: Schema.Types.Mixed, required: true, default: {} },
    occurredAt: { type: Date, required: true, immutable: true },
    receivedAt: { type: Date, required: true, immutable: true },
    expiresAt: { type: Date, required: true, immutable: true },
    environment: { type: String, required: true, maxlength: 20, immutable: true },
    appVersion: { type: String, required: true, maxlength: 50, immutable: true },
  },
  {
    collection: 'analytics_events',
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

analyticsEventSchema.index({ eventId: 1 }, { unique: true, name: 'uq_analytics_event_id' });
analyticsEventSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: 'ttl_analytics_event' },
);
analyticsEventSchema.index(
  { receivedAt: 1, eventName: 1, actorRole: 1 },
  { name: 'ix_analytics_adoption_period' },
);
analyticsEventSchema.index(
  { actorId: 1, 'context.courseId': 1, receivedAt: -1 },
  { name: 'ix_analytics_actor_course_time' },
);

export const AnalyticsEventModel: Model<AnalyticsEventRecord> =
  (mongoose.models.AnalyticsEvent as Model<AnalyticsEventRecord> | undefined) ??
  model<AnalyticsEventRecord>('AnalyticsEvent', analyticsEventSchema);
