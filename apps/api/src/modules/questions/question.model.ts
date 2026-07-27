import mongoose, { Schema, model, type Model, type Types } from 'mongoose';

import {
  ASSESSMENT_SCHEMA_VERSION,
  QUESTION_STATUSES,
  QUESTION_TYPES,
  type QuestionStatus,
  type QuestionType,
} from '../learning-content/assessment.types.js';
import { normalizeMarkdown } from '../learning-content/content.types.js';
import { QUESTION_MEDIA_KINDS, type QuestionMedia, type QuestionOption } from './question.types.js';

export interface QuestionRecord {
  _id: Types.ObjectId;
  quizId: Types.ObjectId;
  courseId: Types.ObjectId;
  type: QuestionType;
  prompt: string;
  points: number;
  isRequired: boolean;
  options: QuestionOption[];
  correctOptionIds: string[];
  correctBoolean: boolean | null;
  rubric: string | null;
  explanation: string | null;
  media: QuestionMedia | null;
  displayOrder: number;
  version: number;
  status: QuestionStatus;
  archivedAt: Date | null;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const optionSchema = new Schema<QuestionOption>(
  {
    id: { type: String, required: true },
    label: { type: String, required: true, minlength: 1, maxlength: 1_000 },
    displayOrder: { type: Number, required: true, min: 0, validate: Number.isInteger },
  },
  { _id: false, versionKey: false },
);

const mediaSchema = new Schema<QuestionMedia>(
  {
    kind: { type: String, enum: QUESTION_MEDIA_KINDS, required: true },
    url: { type: String, required: true, maxlength: 2_048 },
    provider: { type: String, default: null, maxlength: 100 },
    caption: { type: String, default: null, maxlength: 1_000 },
    altText: { type: String, default: null, maxlength: 1_000 },
  },
  { _id: false, versionKey: false },
);

function normalizeNullableMarkdown(value: string | null): string | null {
  return value === null ? null : normalizeMarkdown(value);
}

const questionSchema = new Schema<QuestionRecord>(
  {
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true, immutable: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, immutable: true },
    type: { type: String, enum: QUESTION_TYPES, required: true, immutable: true },
    prompt: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 10_000,
      set: normalizeMarkdown,
    },
    points: { type: Number, required: true, min: 1, max: 100, validate: Number.isInteger },
    isRequired: { type: Boolean, required: true, default: true },
    options: { type: [optionSchema], required: true, default: [] },
    correctOptionIds: { type: [String], required: true, default: [] },
    correctBoolean: { type: Boolean, default: null },
    rubric: { type: String, default: null, maxlength: 10_000, set: normalizeNullableMarkdown },
    explanation: { type: String, default: null, maxlength: 10_000, set: normalizeNullableMarkdown },
    media: { type: mediaSchema, default: null },
    displayOrder: { type: Number, required: true, min: 0, validate: Number.isInteger },
    version: { type: Number, required: true, min: 1, default: 1, validate: Number.isInteger },
    status: { type: String, enum: QUESTION_STATUSES, required: true, default: 'ACTIVE' },
    archivedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    schemaVersion: {
      type: Number,
      required: true,
      enum: [ASSESSMENT_SCHEMA_VERSION],
      default: ASSESSMENT_SCHEMA_VERSION,
      immutable: true,
    },
  },
  { collection: 'questions', timestamps: true, versionKey: false },
);

questionSchema.pre('validate', function validateQuestionShape() {
  const optionIds = this.options.map((option) => option.id);
  const normalizedLabels = this.options.map((option) =>
    option.label.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('en-US'),
  );
  if (new Set(optionIds).size !== optionIds.length) {
    this.invalidate('options', 'Question option IDs must be unique');
  }
  if (new Set(normalizedLabels).size !== normalizedLabels.length) {
    this.invalidate('options', 'Question option labels must be unique');
  }
  if (this.correctOptionIds.some((id) => !optionIds.includes(id))) {
    this.invalidate('correctOptionIds', 'Correct option IDs must reference Question options');
  }
  if (new Set(this.correctOptionIds).size !== this.correctOptionIds.length) {
    this.invalidate('correctOptionIds', 'Correct option IDs must be unique');
  }
  if (this.type === 'SINGLE_CHOICE' || this.type === 'MULTIPLE_CHOICE') {
    if (this.options.length < 2 || this.options.length > 10) {
      this.invalidate('options', 'Choice Questions require between 2 and 10 options');
    }
    if (this.correctOptionIds.length < 1) {
      this.invalidate('correctOptionIds', 'Choice Questions require a correct answer');
    }
    if (this.type === 'SINGLE_CHOICE' && this.correctOptionIds.length !== 1) {
      this.invalidate('correctOptionIds', 'Single-choice Questions require exactly one answer');
    }
    if (this.correctBoolean !== null || this.rubric !== null) {
      this.invalidate('type', 'Choice Questions cannot contain boolean or rubric scoring data');
    }
  }
  if (this.type === 'TRUE_FALSE') {
    if (
      this.options.length > 0 ||
      this.correctOptionIds.length > 0 ||
      this.correctBoolean === null
    ) {
      this.invalidate('type', 'True/false Questions require only a boolean answer');
    }
    if (this.rubric !== null)
      this.invalidate('rubric', 'True/false Questions cannot contain a rubric');
  }
  if (this.type === 'SHORT_ANSWER') {
    if (
      this.options.length > 0 ||
      this.correctOptionIds.length > 0 ||
      this.correctBoolean !== null
    ) {
      this.invalidate('type', 'Short-answer Questions cannot contain objective answer keys');
    }
  }
  if (this.status === 'ARCHIVED' && !this.archivedAt) {
    this.invalidate('archivedAt', 'Archived Question requires archivedAt');
  }
});

questionSchema.index(
  { quizId: 1, status: 1, displayOrder: 1, _id: 1 },
  { name: 'question_quiz_status_order' },
);

export const QuestionModel: Model<QuestionRecord> =
  (mongoose.models.Question as Model<QuestionRecord> | undefined) ??
  model<QuestionRecord>('Question', questionSchema);
