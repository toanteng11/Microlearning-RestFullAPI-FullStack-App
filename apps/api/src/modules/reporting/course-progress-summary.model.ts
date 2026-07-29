import mongoose, { Schema, model, type Model, type Types } from 'mongoose';

import {
  PROCESS_SCORE_VERSION,
  REPORTING_DESCRIPTOR_VERSION,
  REPORTING_SCHEMA_VERSION,
  REPORTING_SOURCE_METRIC_VERSION,
  REPORTING_SUPPORT_FLAGS,
} from './reporting.constants.js';
import type { ReportingSupportFlag } from './reporting.types.js';

export const COURSE_PROGRESS_REFRESH_STATUSES = ['FRESH', 'STALE', 'PARTIAL', 'FAILED'] as const;
export type CourseProgressRefreshStatus = (typeof COURSE_PROGRESS_REFRESH_STATUSES)[number];

export interface CourseProgressSummaryRecord {
  _id: Types.ObjectId;
  schemaVersion: typeof REPORTING_SCHEMA_VERSION;
  courseId: Types.ObjectId;
  classroomId: Types.ObjectId;
  studentId: Types.ObjectId;
  sourceMetricVersion: typeof REPORTING_SOURCE_METRIC_VERSION;
  descriptorVersion: typeof REPORTING_DESCRIPTOR_VERSION;
  processScoreVersion: typeof PROCESS_SCORE_VERSION;
  requiredActivityCount: number;
  completedRequiredCount: number;
  progressPercentage: number | null;
  processScore: number | null;
  missingActivityCount: number;
  lateActivityCount: number;
  ungradedActivityCount: number;
  returnedGradeCount: number;
  gradePointsEarned: number;
  gradePointsPossible: number;
  returnedGradeAverage: number | null;
  lastActiveAt: Date | null;
  courseCompleted: boolean;
  supportFlags: ReportingSupportFlag[];
  sourceChangedAt: Date;
  recalculatedAt: Date;
  refreshStatus: CourseProgressRefreshStatus;
  revision: number;
  createdAt: Date;
  updatedAt: Date;
}

const nonNegativeInteger = {
  type: Number,
  required: true,
  min: 0,
  validate: Number.isInteger,
} as const;
const nullablePercentage = {
  type: Number,
  default: null,
  min: 0,
  max: 100,
} as const;

const courseProgressSummarySchema = new Schema<CourseProgressSummaryRecord>(
  {
    schemaVersion: {
      type: Number,
      required: true,
      enum: [REPORTING_SCHEMA_VERSION],
      default: REPORTING_SCHEMA_VERSION,
      immutable: true,
    },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, immutable: true },
    classroomId: {
      type: Schema.Types.ObjectId,
      ref: 'Classroom',
      required: true,
      immutable: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    sourceMetricVersion: {
      type: String,
      required: true,
      enum: [REPORTING_SOURCE_METRIC_VERSION],
      default: REPORTING_SOURCE_METRIC_VERSION,
      immutable: true,
    },
    descriptorVersion: {
      type: String,
      required: true,
      enum: [REPORTING_DESCRIPTOR_VERSION],
      default: REPORTING_DESCRIPTOR_VERSION,
      immutable: true,
    },
    processScoreVersion: {
      type: String,
      required: true,
      enum: [PROCESS_SCORE_VERSION],
      default: PROCESS_SCORE_VERSION,
      immutable: true,
    },
    requiredActivityCount: nonNegativeInteger,
    completedRequiredCount: nonNegativeInteger,
    progressPercentage: nullablePercentage,
    processScore: nullablePercentage,
    missingActivityCount: nonNegativeInteger,
    lateActivityCount: nonNegativeInteger,
    ungradedActivityCount: nonNegativeInteger,
    returnedGradeCount: nonNegativeInteger,
    gradePointsEarned: { type: Number, required: true, min: 0 },
    gradePointsPossible: { type: Number, required: true, min: 0 },
    returnedGradeAverage: nullablePercentage,
    lastActiveAt: { type: Date, default: null },
    courseCompleted: { type: Boolean, required: true },
    supportFlags: {
      type: [String],
      enum: REPORTING_SUPPORT_FLAGS,
      required: true,
      default: [],
    },
    sourceChangedAt: { type: Date, required: true },
    recalculatedAt: { type: Date, required: true },
    refreshStatus: {
      type: String,
      enum: COURSE_PROGRESS_REFRESH_STATUSES,
      required: true,
      default: 'FRESH',
    },
    revision: { type: Number, required: true, min: 1, default: 1, validate: Number.isInteger },
  },
  {
    collection: 'course_progress_summaries',
    timestamps: true,
    versionKey: false,
  },
);

courseProgressSummarySchema.pre('validate', function validateSummaryInvariants() {
  if (this.completedRequiredCount > this.requiredActivityCount) {
    this.invalidate(
      'completedRequiredCount',
      'completedRequiredCount cannot exceed requiredActivityCount',
    );
  }
  if (this.gradePointsEarned > this.gradePointsPossible) {
    this.invalidate('gradePointsEarned', 'gradePointsEarned cannot exceed gradePointsPossible');
  }
  if (this.processScore !== this.progressPercentage) {
    this.invalidate('processScore', 'processScore must equal progressPercentage in V1');
  }
  const expectedCourseCompleted =
    this.requiredActivityCount > 0 && this.completedRequiredCount === this.requiredActivityCount;
  if (this.courseCompleted !== expectedCourseCompleted) {
    this.invalidate('courseCompleted', 'courseCompleted is inconsistent with required completion');
  }
  this.supportFlags = [...new Set(this.supportFlags)].sort();
});

courseProgressSummarySchema.index(
  { courseId: 1, studentId: 1, processScoreVersion: 1 },
  { unique: true, name: 'report_summary_course_student_version_unique' },
);
courseProgressSummarySchema.index(
  {
    courseId: 1,
    processScoreVersion: 1,
    processScore: -1,
    completedRequiredCount: -1,
    missingActivityCount: 1,
    lateActivityCount: 1,
    lastActiveAt: -1,
    studentId: 1,
  },
  { name: 'report_summary_course_default_ranking' },
);
courseProgressSummarySchema.index(
  { studentId: 1, courseId: 1, processScoreVersion: 1 },
  { name: 'report_summary_student_courses' },
);
courseProgressSummarySchema.index(
  { courseId: 1, refreshStatus: 1, recalculatedAt: 1 },
  { name: 'report_summary_course_freshness' },
);
courseProgressSummarySchema.index(
  { classroomId: 1, courseId: 1 },
  { name: 'report_summary_classroom_course' },
);

export const CourseProgressSummaryModel: Model<CourseProgressSummaryRecord> =
  (mongoose.models.CourseProgressSummary as Model<CourseProgressSummaryRecord> | undefined) ??
  model<CourseProgressSummaryRecord>('CourseProgressSummary', courseProgressSummarySchema);
