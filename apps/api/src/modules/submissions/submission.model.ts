import mongoose, { Schema, model, type Model, type Types } from 'mongoose';

import {
  ASSESSMENT_SCHEMA_VERSION,
  SUBMISSION_STATUSES,
  type SubmissionStatus,
} from '../learning-content/assessment.types.js';
import { SUBMISSION_TYPES, type SubmissionType } from '../assignments/assignment.types.js';

export interface SubmissionRecord {
  _id: Types.ObjectId;
  assignmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  classroomId: Types.ObjectId;
  courseId: Types.ObjectId;
  status: SubmissionStatus;
  submissionType: SubmissionType | null;
  textAnswer: string | null;
  links: string[];
  markDone: boolean;
  revision: number;
  submittedRevision: number | null;
  submittedAt: Date | null;
  isLate: boolean;
  effectiveDeadlineAtSubmit: Date | null;
  gradedAt: Date | null;
  returnedAt: Date | null;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const submissionSchema = new Schema<SubmissionRecord>(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      immutable: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    classroomId: { type: Schema.Types.ObjectId, ref: 'Classroom', required: true, immutable: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, immutable: true },
    status: { type: String, enum: SUBMISSION_STATUSES, required: true, default: 'DRAFT' },
    submissionType: { type: String, enum: SUBMISSION_TYPES, default: null },
    textAnswer: { type: String, default: null, maxlength: 100_000 },
    links: { type: [String], required: true, default: [] },
    markDone: { type: Boolean, required: true, default: false },
    revision: { type: Number, required: true, min: 1, default: 1, validate: Number.isInteger },
    submittedRevision: { type: Number, default: null, min: 1 },
    submittedAt: { type: Date, default: null },
    isLate: { type: Boolean, required: true, default: false },
    effectiveDeadlineAtSubmit: { type: Date, default: null },
    gradedAt: { type: Date, default: null },
    returnedAt: { type: Date, default: null },
    schemaVersion: {
      type: Number,
      required: true,
      enum: [ASSESSMENT_SCHEMA_VERSION],
      default: ASSESSMENT_SCHEMA_VERSION,
      immutable: true,
    },
  },
  { collection: 'submissions', timestamps: true, versionKey: false },
);

submissionSchema.index(
  { assignmentId: 1, studentId: 1 },
  { unique: true, name: 'submission_identity_unique' },
);
submissionSchema.index(
  { assignmentId: 1, status: 1, submittedAt: -1, _id: 1 },
  { name: 'submission_assignment_status' },
);
submissionSchema.index(
  { studentId: 1, courseId: 1, updatedAt: -1, _id: 1 },
  { name: 'submission_student_recent' },
);

export const SubmissionModel: Model<SubmissionRecord> =
  (mongoose.models.Submission as Model<SubmissionRecord> | undefined) ??
  model<SubmissionRecord>('Submission', submissionSchema);
