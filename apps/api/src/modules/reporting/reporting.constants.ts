import { STUDENT_TODO_SCOPE_VERSION } from '../learning-content/assessment.types.js';
import { LEARNING_ACTIVITY_DESCRIPTOR_VERSION } from '../learning-content/learning-activity.reader.js';
import { LEARNING_PROGRESS_METRIC_VERSION } from '../learning-content/learning-progress.reader.js';

export const REPORTING_SCHEMA_VERSION = 1 as const;
export const PROCESS_SCORE_VERSION = 'P06_PROCESS_SCORE_V1' as const;
export const TEACHER_RANKING_VERSION = 'P06_TEACHER_RANKING_V1' as const;
export const GRADEBOOK_VERSION = 'P06_GRADEBOOK_V1' as const;
export const ADMIN_GOVERNANCE_REPORT_VERSION = 'P06_ADMIN_GOVERNANCE_V1' as const;
export const STUDENT_DASHBOARD_VERSION = 'P06_STUDENT_DASHBOARD_V1' as const;
export const STUDENT_PROGRESS_TREND_VERSION = 'P06_STUDENT_PROGRESS_TREND_V1' as const;
export const ADMIN_LEARNING_OUTCOME_VERSION = 'P06_ADMIN_LEARNING_OUTCOME_V1' as const;
export const ANALYTICS_EVENT_SCHEMA_VERSION = 1 as const;

export const REPORTING_SOURCE_METRIC_VERSION = LEARNING_PROGRESS_METRIC_VERSION;
export const REPORTING_DESCRIPTOR_VERSION = LEARNING_ACTIVITY_DESCRIPTOR_VERSION;
export const REPORTING_TODO_SCOPE_VERSION = STUDENT_TODO_SCOPE_VERSION;

export const REPORT_FRESHNESS_STATUSES = [
  'FRESH',
  'STALE',
  'PARTIAL',
  'REBUILDING',
  'FAILED',
] as const;

export const REPORT_DATA_STATES = ['READY', 'NO_DATA', 'SUPPRESSED'] as const;
export const REPORTING_PROGRESS_STATUSES = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'MISSING',
  'COMPLETED',
  'LATE',
] as const;
export const REPORTING_ACTIVITY_STATUSES = [
  'NOT_APPLICABLE',
  'NOT_STARTED',
  'IN_PROGRESS',
  'MISSING',
  'COMPLETED',
  'LATE',
] as const;
export const REPORTING_GRADING_STATUSES = [
  'NOT_GRADABLE',
  'NOT_READY',
  'AWAITING_GRADE',
  'DRAFT',
  'RETURNED',
] as const;

export const REPORTING_SUPPORT_FLAGS = [
  'HAS_MISSING_WORK',
  'HAS_UNGRADED_WORK',
  'NO_RECENT_ACTIVITY',
  'NO_REQUIRED_ACTIVITY',
  'PARTIAL_DATA',
] as const;

export const REPORTING_ALLOWED_ACTIONS = [
  'OPEN_ACTIVITY',
  'VIEW_RETURNED_RESULT',
  'VIEW_STUDENT_PROGRESS',
  'OPEN_GRADING',
  'EXPORT_REPORT',
  'VIEW_SOURCE_LIST',
  'VIEW_PROGRESS_TREND',
  'VIEW_LEARNING_OUTCOMES',
  'VIEW_ANALYTICS_ADOPTION',
] as const;

export const ANALYTICS_EVENT_NAMES = [
  'account_activated',
  'login_succeeded',
  'classroom_created',
  'classroom_joined',
  'course_published',
  'lesson_started',
  'lesson_completed',
  'quiz_started',
  'quiz_submitted',
  'assignment_opened',
  'assignment_submitted',
  'submission_graded',
  'deadline_exception_created',
  'teacher_invitation_created',
  'teacher_invitation_accepted',
  'report_export_requested',
  'report_export_completed',
  'report_viewed',
  'report_filter_changed',
  'report_tab_changed',
] as const;

export const REPORTING_INVALIDATION_REASONS = [
  'ROSTER_CHANGED',
  'GOVERNANCE_CHANGED',
  'ACTIVITY_CHANGED',
  'PROGRESS_CHANGED',
  'ASSESSMENT_CHANGED',
  'GRADE_CHANGED',
  'DEADLINE_EXCEPTION_CHANGED',
  'METRIC_VERSION_CHANGED',
  'MANUAL_REBUILD',
] as const;

export const REPORTING_INVALIDATION_SCOPE_TYPES = [
  'STUDENT_COURSE',
  'COURSE',
  'CLASSROOM',
] as const;
export const REPORTING_INVALIDATION_STATUSES = ['PENDING', 'PROCESSING', 'FAILED'] as const;

export const REPORTING_AUDIT_ACTIONS = [
  'REPORT_VIEWED',
  'REPORT_EXPORT_REQUESTED',
  'REPORT_EXPORT_COMPLETED',
  'REPORT_EXPORT_FAILED',
  'REPORTING_REBUILD_STARTED',
  'REPORTING_REBUILD_COMPLETED',
  'REPORTING_RECONCILIATION_COMPLETED',
  'METRIC_DEFINITION_ACTIVATED',
] as const;

export const REPORTING_ACTIVITY_TYPES = ['LESSON', 'QUIZ', 'ASSIGNMENT'] as const;
export const REPORTING_GRADE_ACTIVITY_TYPES = ['QUIZ', 'ASSIGNMENT'] as const;
export const REPORTING_SORT_ORDERS = ['asc', 'desc'] as const;

export const REPORTING_DEFINITION_IDS = Object.freeze({
  requiredActivityCount: 'P06_REQUIRED_ACTIVITY_COUNT_V1',
  completedRequiredCount: 'P06_COMPLETED_REQUIRED_COUNT_V1',
  progressPercentage: REPORTING_SOURCE_METRIC_VERSION,
  processScore: PROCESS_SCORE_VERSION,
  courseCompletion: 'P06_COURSE_COMPLETION_V1',
  missingActivityCount: 'P06_MISSING_COUNT_V1',
  lateActivityCount: 'P06_LATE_COUNT_V1',
  lastActiveAt: 'P06_LAST_ACTIVE_V1',
  returnedGradeAverage: 'P06_RETURNED_GRADE_AVERAGE_V1',
} as const);
