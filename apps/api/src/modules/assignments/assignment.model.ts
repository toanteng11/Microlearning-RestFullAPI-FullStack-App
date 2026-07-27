import mongoose, { Schema, model, type Model, type Types } from 'mongoose';

import {
  ASSESSMENT_SCHEMA_VERSION,
  ASSIGNMENT_STATUSES,
  type AssignmentStatus,
} from '../learning-content/assessment.types.js';
import { normalizeContentTitle, normalizeMarkdown } from '../learning-content/content.types.js';
import { SUBMISSION_TYPES, type SubmissionType } from './assignment.types.js';

export interface AssignmentRecord {
  _id: Types.ObjectId;
  classroomId: Types.ObjectId;
  courseId: Types.ObjectId;
  moduleId: Types.ObjectId | null;
  title: string;
  instruction: string;
  maxScore: number;
  isRequired: boolean;
  allowedSubmissionTypes: SubmissionType[];
  allowLateSubmission: boolean;
  allowUnsubmit: boolean;
  allowResubmit: boolean;
  availableFrom: Date | null;
  dueDate: Date;
  status: AssignmentStatus;
  displayOrder: number;
  contentRevision: number;
  publishedRevision: number | null;
  scheduledPublishAt: Date | null;
  publishedAt: Date | null;
  unpublishedAt: Date | null;
  closedAt: Date | null;
  archivedAt: Date | null;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<AssignmentRecord>(
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
    maxScore: { type: Number, required: true, min: 1, max: 1_000, validate: Number.isInteger },
    isRequired: { type: Boolean, required: true, default: true },
    allowedSubmissionTypes: {
      type: [String],
      enum: SUBMISSION_TYPES,
      required: true,
      default: ['TEXT'],
    },
    allowLateSubmission: { type: Boolean, required: true, default: false },
    allowUnsubmit: { type: Boolean, required: true, default: false },
    allowResubmit: { type: Boolean, required: true, default: false },
    availableFrom: { type: Date, default: null },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ASSIGNMENT_STATUSES, required: true, default: 'DRAFT' },
    displayOrder: { type: Number, required: true, min: 0, validate: Number.isInteger },
    contentRevision: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
      validate: Number.isInteger,
    },
    publishedRevision: { type: Number, default: null, min: 1 },
    scheduledPublishAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    unpublishedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    schemaVersion: {
      type: Number,
      enum: [ASSESSMENT_SCHEMA_VERSION],
      default: ASSESSMENT_SCHEMA_VERSION,
      immutable: true,
    },
  },
  { collection: 'assignments', timestamps: true, versionKey: false },
);

assignmentSchema.pre('validate', function validateAssignment() {
  if (this.availableFrom && this.availableFrom >= this.dueDate) {
    this.invalidate('availableFrom', 'availableFrom must be before dueDate');
  }
  if (!this.allowedSubmissionTypes.includes('TEXT')) {
    this.invalidate('allowedSubmissionTypes', 'TEXT submission must remain enabled in Phase 05');
  }
});

assignmentSchema.index(
  { courseId: 1, status: 1, moduleId: 1, displayOrder: 1, _id: 1 },
  { name: 'assignment_course_status_order' },
);
assignmentSchema.index(
  { courseId: 1, status: 1, isRequired: 1, dueDate: 1, _id: 1 },
  { name: 'assignment_due_visibility' },
);

export const AssignmentModel: Model<AssignmentRecord> =
  (mongoose.models.Assignment as Model<AssignmentRecord> | undefined) ??
  model<AssignmentRecord>('Assignment', assignmentSchema);
