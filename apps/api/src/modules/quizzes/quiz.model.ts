import mongoose, { Schema, model, type Model, type Types } from 'mongoose';

import {
  ASSESSMENT_SCHEMA_VERSION,
  QUIZ_SCORE_POLICIES,
  QUIZ_STATUSES,
  RESULT_RELEASE_POLICIES,
  type QuizScorePolicy,
  type QuizStatus,
  type ResultReleasePolicy,
} from '../learning-content/assessment.types.js';
import { normalizeContentTitle, normalizeMarkdown } from '../learning-content/content.types.js';

export interface QuizRecord {
  _id: Types.ObjectId;
  classroomId: Types.ObjectId;
  courseId: Types.ObjectId;
  moduleId: Types.ObjectId | null;
  title: string;
  instruction: string;
  isRequired: boolean;
  status: QuizStatus;
  availableFrom: Date | null;
  dueDate: Date;
  attemptLimit: number;
  timeLimitMinutes: number | null;
  resultReleasePolicy: ResultReleasePolicy;
  scorePolicy: QuizScorePolicy;
  displayOrder: number;
  contentRevision: number;
  questionRevision: number;
  publishedRevision: number | null;
  maxScore: number;
  scheduledPublishAt: Date | null;
  publishedAt: Date | null;
  unpublishedAt: Date | null;
  archivedAt: Date | null;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const quizSchema = new Schema<QuizRecord>(
  {
    classroomId: { type: Schema.Types.ObjectId, ref: 'Classroom', required: true, immutable: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, immutable: true },
    moduleId: { type: Schema.Types.ObjectId, ref: 'CourseModule', default: null },
    title: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 150,
      set: normalizeContentTitle,
    },
    instruction: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 100_000,
      set: normalizeMarkdown,
    },
    isRequired: { type: Boolean, required: true, default: true },
    status: { type: String, enum: QUIZ_STATUSES, required: true, default: 'DRAFT' },
    availableFrom: { type: Date, default: null },
    dueDate: { type: Date, required: true },
    attemptLimit: { type: Number, required: true, min: 1, max: 10, validate: Number.isInteger },
    timeLimitMinutes: {
      type: Number,
      default: null,
      min: 1,
      max: 180,
      validate: (value: number | null) => value === null || Number.isInteger(value),
    },
    resultReleasePolicy: { type: String, enum: RESULT_RELEASE_POLICIES, required: true },
    scorePolicy: { type: String, enum: QUIZ_SCORE_POLICIES, required: true, default: 'HIGHEST' },
    displayOrder: { type: Number, required: true, min: 0, validate: Number.isInteger },
    contentRevision: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
      validate: Number.isInteger,
    },
    questionRevision: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: Number.isInteger,
    },
    publishedRevision: {
      type: Number,
      default: null,
      min: 1,
      validate: (value: number | null) => value === null || Number.isInteger(value),
    },
    maxScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1_000,
      default: 0,
      validate: Number.isInteger,
    },
    scheduledPublishAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    unpublishedAt: { type: Date, default: null },
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
  { collection: 'quizzes', timestamps: true, versionKey: false },
);

quizSchema.pre('validate', function validateQuizDates() {
  if (this.availableFrom && this.availableFrom >= this.dueDate) {
    this.invalidate('availableFrom', 'availableFrom must be before dueDate');
  }
  if (this.status === 'SCHEDULED' && !this.scheduledPublishAt) {
    this.invalidate('scheduledPublishAt', 'Scheduled Quiz requires scheduledPublishAt');
  }
  if (this.status === 'ARCHIVED' && !this.archivedAt) {
    this.invalidate('archivedAt', 'Archived Quiz requires archivedAt');
  }
});

quizSchema.index(
  { courseId: 1, status: 1, moduleId: 1, displayOrder: 1, _id: 1 },
  { name: 'quiz_course_status_order' },
);
quizSchema.index(
  { courseId: 1, status: 1, isRequired: 1, dueDate: 1, _id: 1 },
  { name: 'quiz_due_visibility' },
);

export const QuizModel: Model<QuizRecord> =
  (mongoose.models.Quiz as Model<QuizRecord> | undefined) ?? model<QuizRecord>('Quiz', quizSchema);
