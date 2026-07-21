import mongoose, { Schema, model, type Model, type Types } from 'mongoose';

import {
  COMMON_CONTENT_STATUSES,
  CONTENT_SCHEMA_VERSION,
  normalizeMarkdown,
  type CommonContentStatus,
} from '../learning-content/content.types.js';

export interface AnnouncementRecord {
  _id: Types.ObjectId;
  classroomId: Types.ObjectId;
  teacherId: Types.ObjectId;
  content: string;
  status: CommonContentStatus;
  scheduledPublishAt: Date | null;
  publishedAt: Date | null;
  unpublishedAt: Date | null;
  archivedAt: Date | null;
  schemaVersion: number;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<AnnouncementRecord>(
  {
    classroomId: { type: Schema.Types.ObjectId, ref: 'Classroom', required: true, immutable: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    content: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 10_000,
      set: normalizeMarkdown,
    },
    status: { type: String, enum: COMMON_CONTENT_STATUSES, required: true, default: 'DRAFT' },
    scheduledPublishAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    unpublishedAt: { type: Date, default: null },
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
  { collection: 'announcements', timestamps: true, versionKey: false },
);

announcementSchema.pre('validate', function validateLifecycleFields() {
  if (this.status === 'SCHEDULED' && !this.scheduledPublishAt) {
    this.invalidate('scheduledPublishAt', 'Scheduled Announcement requires scheduledPublishAt');
  }
  if (this.status === 'ARCHIVED' && !this.archivedAt) {
    this.invalidate('archivedAt', 'Archived Announcement requires archivedAt');
  }
});

announcementSchema.index(
  { classroomId: 1, status: 1, publishedAt: -1, _id: -1 },
  { name: 'announcement_stream' },
);
announcementSchema.index(
  { classroomId: 1, status: 1, scheduledPublishAt: 1, _id: -1 },
  { name: 'announcement_scheduled_visibility' },
);

export const AnnouncementModel: Model<AnnouncementRecord> =
  (mongoose.models.Announcement as Model<AnnouncementRecord> | undefined) ??
  model<AnnouncementRecord>('Announcement', announcementSchema);
