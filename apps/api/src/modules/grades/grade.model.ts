import mongoose, { Schema, model, type Model, type Types } from 'mongoose';

import {
  ASSESSMENT_SCHEMA_VERSION,
  GRADE_STATUSES,
  type GradeStatus,
} from '../learning-content/assessment.types.js';
import {
  GRADE_ACTIVITY_TYPES,
  GRADE_EVIDENCE_TYPES,
  type GradeActivityType,
  type GradeEvidenceType,
} from './grade.types.js';

export interface GradeRecord {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  classroomId: Types.ObjectId;
  courseId: Types.ObjectId;
  activityType: GradeActivityType;
  activityId: Types.ObjectId;
  evidenceType: GradeEvidenceType;
  evidenceId: Types.ObjectId;
  evidenceRevision: number;
  score: number;
  maxScore: number;
  feedback: string | null;
  status: GradeStatus;
  revision: number;
  gradedBy: Types.ObjectId;
  gradedAt: Date;
  returnedBy: Types.ObjectId | null;
  returnedAt: Date | null;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const gradeSchema = new Schema<GradeRecord>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    classroomId: { type: Schema.Types.ObjectId, ref: 'Classroom', required: true, immutable: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, immutable: true },
    activityType: { type: String, enum: GRADE_ACTIVITY_TYPES, required: true, immutable: true },
    activityId: { type: Schema.Types.ObjectId, required: true, immutable: true },
    evidenceType: { type: String, enum: GRADE_EVIDENCE_TYPES, required: true },
    evidenceId: { type: Schema.Types.ObjectId, required: true },
    evidenceRevision: { type: Number, required: true, min: 1, validate: Number.isInteger },
    score: { type: Number, required: true, min: 0, validate: Number.isInteger },
    maxScore: { type: Number, required: true, min: 1, validate: Number.isInteger },
    feedback: { type: String, default: null, maxlength: 20_000 },
    status: { type: String, enum: GRADE_STATUSES, required: true, default: 'DRAFT' },
    revision: { type: Number, required: true, min: 1, default: 1, validate: Number.isInteger },
    gradedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    gradedAt: { type: Date, required: true },
    returnedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    returnedAt: { type: Date, default: null },
    schemaVersion: {
      type: Number,
      required: true,
      enum: [ASSESSMENT_SCHEMA_VERSION],
      default: ASSESSMENT_SCHEMA_VERSION,
      immutable: true,
    },
  },
  { collection: 'grades', timestamps: true, versionKey: false },
);

gradeSchema.pre('validate', function validateGrade() {
  if (this.score > this.maxScore) this.invalidate('score', 'Grade score cannot exceed maxScore');
  if (this.status === 'RETURNED' && (!this.returnedAt || !this.returnedBy)) {
    this.invalidate('returnedAt', 'Returned Grade requires returnedAt and returnedBy');
  }
});

gradeSchema.index(
  { studentId: 1, activityType: 1, activityId: 1 },
  { unique: true, name: 'grade_identity_unique' },
);
gradeSchema.index(
  { courseId: 1, status: 1, studentId: 1, activityType: 1, activityId: 1 },
  { name: 'grade_course_status' },
);
gradeSchema.index(
  { studentId: 1, status: 1, returnedAt: -1, _id: 1 },
  { name: 'grade_student_returned' },
);

export const GradeModel: Model<GradeRecord> =
  (mongoose.models.Grade as Model<GradeRecord> | undefined) ??
  model<GradeRecord>('Grade', gradeSchema);
