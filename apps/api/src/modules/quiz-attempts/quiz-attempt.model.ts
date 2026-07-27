import mongoose, { Schema, model, type Model, type Types } from 'mongoose';

import {
  ASSESSMENT_SCHEMA_VERSION,
  ATTEMPT_STATUSES,
  type AttemptStatus,
  type ResultReleasePolicy,
} from '../learning-content/assessment.types.js';
import type {
  AttemptAnswer,
  AttemptManualReview,
  AttemptQuestionSnapshot,
} from './quiz-attempt.types.js';

export interface QuizAttemptRecord {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  classroomId: Types.ObjectId;
  courseId: Types.ObjectId;
  quizId: Types.ObjectId;
  attemptNumber: number;
  status: AttemptStatus;
  assessmentRevision: number;
  quizSnapshot: {
    title: string;
    resultReleasePolicy: ResultReleasePolicy;
    maxScore: number;
    timeLimitMinutes: number | null;
  };
  questionSnapshots: AttemptQuestionSnapshot[];
  answers: AttemptAnswer[];
  manualReviews: AttemptManualReview[];
  objectiveScore: number;
  manualScore: number;
  totalScore: number;
  maxScore: number;
  startedAt: Date;
  expiresAt: Date;
  lastSavedAt: Date | null;
  submittedAt: Date | null;
  gradedAt: Date | null;
  releasedAt: Date | null;
  attemptRevision: number;
  reviewRevision: number;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const optionSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    displayOrder: { type: Number, required: true },
  },
  { _id: false },
);
const mediaSchema = new Schema(
  {
    kind: { type: String, enum: ['IMAGE_URL', 'VIDEO_URL'], required: true },
    url: { type: String, required: true },
    provider: { type: String, default: null },
    caption: { type: String, default: null },
    altText: { type: String, default: null },
  },
  { _id: false },
);
const questionSnapshotSchema = new Schema<AttemptQuestionSnapshot>(
  {
    questionId: { type: Schema.Types.ObjectId, required: true },
    questionRevision: { type: Number, required: true, min: 1 },
    type: { type: String, required: true } as { type: StringConstructor; required: true },
    prompt: { type: String, required: true },
    points: { type: Number, required: true, min: 1 },
    isRequired: { type: Boolean, required: true },
    displayOrder: { type: Number, required: true, min: 0 },
    options: { type: [optionSchema], required: true, default: [] },
    media: { type: mediaSchema, default: null },
    scoring: {
      type: new Schema(
        {
          correctOptionIds: { type: [String], required: true, default: [] },
          correctBoolean: { type: Boolean, default: null },
          rubric: { type: String, default: null },
        },
        { _id: false },
      ),
      required: true,
    },
  },
  { _id: false },
);
const answerSchema = new Schema<AttemptAnswer>(
  {
    questionId: { type: Schema.Types.ObjectId, required: true },
    selectedOptionIds: { type: [String], required: true, default: [] },
    textAnswer: { type: String, default: null, maxlength: 20_000 },
    savedAt: { type: Date, required: true },
  },
  { _id: false },
);
const manualReviewSchema = new Schema<AttemptManualReview>(
  {
    questionId: { type: Schema.Types.ObjectId, required: true },
    awardedPoints: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isInteger,
    },
    feedback: { type: String, default: null, maxlength: 20_000 },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reviewedAt: { type: Date, required: true },
  },
  { _id: false },
);

const quizAttemptSchema = new Schema<QuizAttemptRecord>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    classroomId: { type: Schema.Types.ObjectId, ref: 'Classroom', required: true, immutable: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, immutable: true },
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true, immutable: true },
    attemptNumber: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isInteger,
      immutable: true,
    },
    status: { type: String, enum: ATTEMPT_STATUSES, required: true, default: 'IN_PROGRESS' },
    assessmentRevision: { type: Number, required: true, min: 1, immutable: true },
    quizSnapshot: {
      type: new Schema(
        {
          title: { type: String, required: true },
          resultReleasePolicy: { type: String, required: true },
          maxScore: { type: Number, required: true, min: 1 },
          timeLimitMinutes: { type: Number, default: null },
        },
        { _id: false },
      ),
      required: true,
      immutable: true,
    },
    questionSnapshots: { type: [questionSnapshotSchema], required: true, immutable: true },
    answers: { type: [answerSchema], required: true, default: [] },
    manualReviews: { type: [manualReviewSchema], required: true, default: [] },
    objectiveScore: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: Number.isInteger,
    },
    manualScore: { type: Number, required: true, min: 0, default: 0, validate: Number.isInteger },
    totalScore: { type: Number, required: true, min: 0, default: 0, validate: Number.isInteger },
    maxScore: { type: Number, required: true, min: 1, validate: Number.isInteger },
    startedAt: { type: Date, required: true, immutable: true },
    expiresAt: { type: Date, required: true, immutable: true },
    lastSavedAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
    gradedAt: { type: Date, default: null },
    releasedAt: { type: Date, default: null },
    attemptRevision: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
      validate: Number.isInteger,
    },
    reviewRevision: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: Number.isInteger,
    },
    schemaVersion: {
      type: Number,
      required: true,
      enum: [ASSESSMENT_SCHEMA_VERSION],
      default: ASSESSMENT_SCHEMA_VERSION,
      immutable: true,
    },
  },
  { collection: 'quiz_attempts', timestamps: true, versionKey: false },
);

quizAttemptSchema.pre('validate', function validateAttemptScore() {
  if (
    this.totalScore > this.maxScore ||
    this.objectiveScore + this.manualScore !== this.totalScore
  ) {
    this.invalidate('totalScore', 'Attempt score must be internally consistent and bounded');
  }
  if (this.expiresAt < this.startedAt)
    this.invalidate('expiresAt', 'expiresAt cannot precede startedAt');
});

quizAttemptSchema.index(
  { quizId: 1, studentId: 1, attemptNumber: 1 },
  { unique: true, name: 'attempt_identity_unique' },
);
quizAttemptSchema.index(
  { quizId: 1, studentId: 1 },
  { unique: true, partialFilterExpression: { status: 'IN_PROGRESS' }, name: 'attempt_one_active' },
);
quizAttemptSchema.index(
  { studentId: 1, quizId: 1, createdAt: -1, _id: -1 },
  { name: 'attempt_student_recent' },
);
quizAttemptSchema.index(
  { quizId: 1, status: 1, totalScore: -1, submittedAt: 1, _id: 1 },
  { name: 'attempt_quiz_results' },
);
quizAttemptSchema.index(
  { status: 1, expiresAt: 1, _id: 1 },
  { partialFilterExpression: { status: 'IN_PROGRESS' }, name: 'attempt_expiry' },
);

export const QuizAttemptModel: Model<QuizAttemptRecord> =
  (mongoose.models.QuizAttempt as Model<QuizAttemptRecord> | undefined) ??
  model<QuizAttemptRecord>('QuizAttempt', quizAttemptSchema);
