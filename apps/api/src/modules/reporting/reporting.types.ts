import type { ClientSession, Types } from 'mongoose';

import type { CommonContentStatus } from '../learning-content/content.types.js';
import type { ClassroomStatus } from '../classrooms/classroom.types.js';
import type { EnrollmentStatus } from '../enrollments/enrollment.model.js';
import type { InvitationStatus } from '../teacher-invitations/teacher-invitation.model.js';
import type { RegistrationSource, UserRole, UserStatus } from '../users/user.types.js';
import type { LearningActivityType } from '../learning-content/learning-activity.reader.js';
import type { GradeStatus } from '../learning-content/assessment.types.js';
import type {
  REPORT_DATA_STATES,
  REPORT_FRESHNESS_STATUSES,
  REPORTING_ACTIVITY_STATUSES,
  REPORTING_ALLOWED_ACTIONS,
  REPORTING_GRADING_STATUSES,
  REPORTING_INVALIDATION_REASONS,
  REPORTING_INVALIDATION_SCOPE_TYPES,
  REPORTING_INVALIDATION_STATUSES,
  REPORTING_PROGRESS_STATUSES,
  REPORTING_SORT_ORDERS,
  REPORTING_SUPPORT_FLAGS,
  ANALYTICS_EVENT_NAMES,
} from './reporting.constants.js';

export type ReportFreshnessStatus = (typeof REPORT_FRESHNESS_STATUSES)[number];
export type ReportDataState = (typeof REPORT_DATA_STATES)[number];
export type ReportingProgressStatus = (typeof REPORTING_PROGRESS_STATUSES)[number];
export type ReportingActivityStatus = (typeof REPORTING_ACTIVITY_STATUSES)[number];
export type ReportingGradingStatus = (typeof REPORTING_GRADING_STATUSES)[number];
export type ReportingSupportFlag = (typeof REPORTING_SUPPORT_FLAGS)[number];
export type ReportingAllowedAction = (typeof REPORTING_ALLOWED_ACTIONS)[number];
export type ReportingInvalidationReason = (typeof REPORTING_INVALIDATION_REASONS)[number];
export type ReportingInvalidationScopeType = (typeof REPORTING_INVALIDATION_SCOPE_TYPES)[number];
export type ReportingInvalidationStatus = (typeof REPORTING_INVALIDATION_STATUSES)[number];
export type ReportingSortOrder = (typeof REPORTING_SORT_ORDERS)[number];
export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];
export type ReportFilterValue = string | number | boolean | null | readonly string[];

export interface ReportFreshness {
  status: ReportFreshnessStatus;
  recalculatedAt: Date | null;
  sourceChangedAt: Date | null;
  staleAfterSeconds: number;
  failedItemsCount: number;
}

export interface ReportMetadata {
  reportId: string;
  definitionVersion: string;
  sourceMetricVersion: string | null;
  descriptorVersion: string | null;
  dataState: ReportDataState;
  timezone: string;
  asOf: Date;
  generatedAt: Date;
  freshness: ReportFreshness;
  filters: Readonly<Record<string, ReportFilterValue>>;
}

export interface ResolvedStudentCourseScope {
  classroomId: string;
  courseId: string;
  studentId: string;
  courseTitle: string;
  classroomName: string;
}

export interface ResolvedTeacherCourseScope {
  classroomId: string;
  courseId: string;
  teacherId: string;
  courseTitle: string;
  courseStatus: CommonContentStatus;
  classroomName: string;
}

export interface ResolvedTeacherStudentScope extends ResolvedTeacherCourseScope {
  studentId: string;
}

export interface ReportingRosterStudent {
  studentId: string;
  enrollmentUpdatedAt: Date;
}

export interface ReportingActivity {
  activityId: string;
  activityType: LearningActivityType;
  classroomId: string;
  courseId: string;
  moduleId: string | null;
  title: string;
  isRequired: boolean;
  lifecycleStatus: CommonContentStatus | 'CLOSED';
  visible: boolean;
  defaultDeadline: Date | null;
  maxScore: number | null;
  displayOrder: number;
  sourceUpdatedAt: Date;
}

export interface ReportingProgress {
  studentId: string;
  courseId: string;
  activityId: string;
  activityType: LearningActivityType;
  status: 'IN_PROGRESS' | 'COMPLETED';
  startedAt: Date;
  completedAt: Date | null;
  lastActiveAt: Date;
  sourceUpdatedAt: Date;
}

export interface ReportingGrade {
  gradeId: string;
  studentId: string;
  courseId: string;
  activityId: string;
  activityType: 'QUIZ' | 'ASSIGNMENT';
  status: GradeStatus;
  score: number;
  maxScore: number;
  returnedAt: Date | null;
  revision: number;
  sourceUpdatedAt: Date;
}

export interface ReportingDeadlineException {
  studentId: string;
  courseId: string;
  activityId: string;
  activityType: LearningActivityType;
  deadline: Date;
  active: boolean;
  revision: number;
  sourceUpdatedAt: Date;
}

export interface ReportingGovernanceCounts {
  userCounts: Readonly<Record<UserRole, Readonly<Record<UserStatus, number>>>>;
  registrationSourceCounts: Readonly<Record<RegistrationSource, number>>;
  classroomCounts: Readonly<Record<ClassroomStatus, number>>;
  courseCounts: Readonly<Record<CommonContentStatus, number>>;
  invitationCounts: Readonly<Record<InvitationStatus, number>>;
  enrollmentCounts: Readonly<Record<EnrollmentStatus, number>>;
}

export interface ReportingAuditRow {
  id: string;
  actorId: string | null;
  actorRole: UserRole | 'SYSTEM';
  action: string;
  resourceType: string;
  resourceId: string;
  requestId: string;
  createdAt: Date;
}

export interface CourseProgressCalculationInput {
  asOf: Date;
  courseId: string;
  classroomId: string;
  studentId: string;
  activities: readonly ReportingActivity[];
  progress: readonly ReportingProgress[];
  grades: readonly ReportingGrade[];
  deadlineExceptions: readonly ReportingDeadlineException[];
}

export interface CourseProgressCalculationResult {
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
  supportFlags: readonly ReportingSupportFlag[];
}

export interface CourseProgressSummaryValues extends CourseProgressCalculationResult {
  courseId: Types.ObjectId;
  classroomId: Types.ObjectId;
  studentId: Types.ObjectId;
  sourceChangedAt: Date;
  recalculatedAt: Date;
  refreshStatus: Exclude<ReportFreshnessStatus, 'REBUILDING'>;
}

export type ReportingInvalidationScope =
  | {
      scopeType: 'STUDENT_COURSE';
      classroomId: Types.ObjectId;
      courseId: Types.ObjectId;
      studentId: Types.ObjectId;
    }
  | {
      scopeType: 'COURSE';
      classroomId: Types.ObjectId;
      courseId: Types.ObjectId;
      studentId: null;
    }
  | {
      scopeType: 'CLASSROOM';
      classroomId: Types.ObjectId;
      courseId: null;
      studentId: null;
    };

export interface ReportingInvalidationCommand {
  scope: ReportingInvalidationScope;
  reasons: readonly ReportingInvalidationReason[];
  sourceChangedAt: Date;
}

export interface InvalidationClaim {
  id: Types.ObjectId;
  claimToken: string;
  revision: number;
}

export interface RankingQuery {
  courseId: Types.ObjectId;
  processScoreVersion: string;
  page: number;
  limit: number;
  sortBy?:
    | 'processScore'
    | 'progressPercentage'
    | 'returnedGradeAverage'
    | 'missingActivityCount'
    | 'lateActivityCount'
    | 'lastActiveAt';
  sortOrder?: ReportingSortOrder;
}

export interface SummaryReplaceInput {
  values: CourseProgressSummaryValues;
  expectedRevision: number | null;
}

export interface ReportingInvalidationStore {
  upsert(command: ReportingInvalidationCommand, session?: ClientSession): Promise<void>;
}
