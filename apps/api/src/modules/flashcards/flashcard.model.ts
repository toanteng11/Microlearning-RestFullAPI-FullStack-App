import mongoose, { Schema, model, type Model, type Types } from 'mongoose';

import {
  CONTENT_SCHEMA_VERSION,
  FLASHCARD_STATUSES,
  normalizeMarkdown,
  type FlashcardStatus,
} from '../learning-content/content.types.js';

export interface FlashcardRecord {
  _id: Types.ObjectId;
  lessonId: Types.ObjectId;
  frontText: string;
  backText: string;
  displayOrder: number;
  status: FlashcardStatus;
  archivedAt: Date | null;
  schemaVersion: number;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const flashcardSchema = new Schema<FlashcardRecord>(
  {
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true, immutable: true },
    frontText: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 2_000,
      set: normalizeMarkdown,
    },
    backText: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 5_000,
      set: normalizeMarkdown,
    },
    displayOrder: { type: Number, required: true, min: 0, validate: Number.isInteger },
    status: { type: String, enum: FLASHCARD_STATUSES, required: true, default: 'ACTIVE' },
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
  { collection: 'flashcards', timestamps: true, versionKey: false },
);

flashcardSchema.pre('validate', function validateArchivedAt() {
  if (this.status === 'ARCHIVED' && !this.archivedAt) {
    this.invalidate('archivedAt', 'Archived Flashcard requires archivedAt');
  }
});

flashcardSchema.index(
  { lessonId: 1, status: 1, displayOrder: 1, _id: 1 },
  { name: 'flashcard_lesson_status_order' },
);

export const FlashcardModel: Model<FlashcardRecord> =
  (mongoose.models.Flashcard as Model<FlashcardRecord> | undefined) ??
  model<FlashcardRecord>('Flashcard', flashcardSchema);
