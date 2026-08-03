import type { Pagination } from '../classrooms/classroom.types';
import type { TodoItem } from '../learning/learning.types';

export type ReportFreshnessStatus = 'FRESH' | 'STALE' | 'PARTIAL' | 'REBUILDING' | 'FAILED';
export type ReportDataState = 'READY' | 'NO_DATA' | 'SUPPRESSED';
export type ReportingProgressStatus =
  'NOT_STARTED' | 'IN_PROGRESS' | 'MISSING' | 'COMPLETED' | 'LATE';

export interface ReportMetadata {
  reportId: string;
  definitionVersion: string;
  sourceMetricVersion: string | null;
  descriptorVersion: string | null;
  dataState: ReportDataState;
  timezone: string;
  asOf: string;
  generatedAt: string;
  freshness: {
    status: ReportFreshnessStatus;
    recalculatedAt: string | null;
    sourceChangedAt: string | null;
    staleAfterSeconds: number;
    failedItemsCount: number;
  };
  filters: Record<string, unknown>;
}

export interface StudentCourseProgressSummary {
  classroom: { id: string; name: string };
  course: { id: string; title: string };
  requiredActivityCount: number;
  completedRequiredCount: number;
  progressPercentage: number | null;
  processScore: number | null;
  progressStatus: ReportingProgressStatus;
  missingCount: number;
  lateCount: number;
  returnedGradeAverage: number | null;
  lastActiveAt: string | null;
  courseCompleted: boolean;
  actionUrl: string;
  recalculatedAt: string;
  allowedActions: string[];
}

export interface StudentReturnedGradeSummary {
  gradeId: string;
  activityId: string;
  activityType: 'QUIZ' | 'ASSIGNMENT';
  activityTitle: string;
  score: number;
  maxScore: number;
  normalizedScore: number;
  returnedAt: string;
  actionUrl: string;
}

export interface StudentReportingDashboardEnvelope {
  success: true;
  data: {
    summary: {
      activeClassroomCount: number;
      activeCourseCount: number;
      pendingCount: number;
      dueSoonCount: number;
      missingCount: number;
    };
    todo: {
      items: TodoItem[];
      totalItems: number;
      scopeVersion: 'P05_MIXED_ACTIVITY_TODO_V2';
    };
    courses: StudentCourseProgressSummary[];
    recentGrades: StudentReturnedGradeSummary[];
    reporting: ReportMetadata;
  };
}

export interface StudentCourseProgressEnvelope {
  success: true;
  data: StudentCourseProgressSummary & {
    metricVersion: string;
    descriptorVersion: string;
    reporting: ReportMetadata;
  };
}

export interface StudentCourseProgressListEnvelope {
  success: true;
  data: {
    items: StudentCourseProgressSummary[];
    reporting: ReportMetadata;
  };
  meta: Pagination;
}

export interface StudentCourseProgressQuery {
  page: number;
  limit: number;
  progressStatus?: ReportingProgressStatus;
  sortBy: 'courseTitle' | 'processScore' | 'lastActiveAt';
  sortOrder: 'asc' | 'desc';
}

export type ReportingSupportFlag =
  | 'HAS_MISSING_WORK'
  | 'HAS_UNGRADED_WORK'
  | 'NO_RECENT_ACTIVITY'
  | 'NO_REQUIRED_ACTIVITY'
  | 'PARTIAL_DATA';

export interface TeacherProgressRow {
  rank: number;
  student: {
    id: string;
    fullName: string;
    email: string;
    studentCode: string | null;
  };
  requiredActivityCount: number;
  completedRequiredCount: number;
  progressPercentage: number | null;
  processScore: number | null;
  progressStatus: ReportingProgressStatus;
  returnedGradeAverage: number | null;
  missingCount: number;
  lateCount: number;
  ungradedCount: number;
  lastActiveAt: string | null;
  courseCompleted: boolean;
  supportFlags: ReportingSupportFlag[];
  allowedActions: string[];
}

export interface TeacherActivityAnalyticsRow {
  activityId: string;
  activityType: 'LESSON' | 'QUIZ' | 'ASSIGNMENT';
  title: string;
  isRequired: boolean;
  lifecycleStatus: string;
  defaultDeadline: string | null;
  deadlineStatus: 'NO_DEADLINE' | 'UPCOMING' | 'DUE_SOON' | 'OVERDUE';
  position: number;
  eligibleStudentCount: number;
  completedStudentCount: number;
  missingStudentCount: number;
  lateStudentCount: number;
  ungradedStudentCount: number;
  completionPercentage: number | null;
  returnedGradeAverage: number | null;
  actionUrl: string;
}

export interface TeacherAssessmentAnalyticsRow {
  activityId: string;
  activityType: 'QUIZ' | 'ASSIGNMENT';
  title: string;
  lifecycleStatus: string;
  position: number;
  eligibleStudentCount: number;
  notStartedCount: number;
  inProgressCount: number;
  submittedCount: number;
  needsReviewCount: number;
  draftGradeCount: number;
  returnedCount: number;
  missingCount: number;
  lateCount: number;
  submissionPercentage: number | null;
  returnedGradeAverage: number | null;
  scoreDistribution: Array<{ bucket: string; count: number }>;
  actionUrl: string;
}

export interface TeacherReportingDashboardEnvelope {
  success: true;
  data: {
    course: {
      id: string;
      title: string;
      status: string;
      classroomId: string;
      classroomName: string;
    };
    summary: {
      totalActivityCount: number;
      publishedActivityCount: number;
      requiredActivityCount: number;
      activeStudentCount: number;
      averageProgressPercentage: number | null;
      averageReturnedGrade: number | null;
      missingActivityCount: number;
      lateActivityCount: number;
      ungradedActivityCount: number;
    };
    topActivities: TeacherActivityAnalyticsRow[];
    topStudents: TeacherProgressRow[];
    allowedActions: string[];
    reporting: ReportMetadata;
  };
}

export interface TeacherProgressQuery {
  page: number;
  limit: number;
  search?: string;
  progressStatus?: ReportingProgressStatus;
  supportFlag?: ReportingSupportFlag;
  sortBy:
    | 'processScore'
    | 'progressPercentage'
    | 'returnedGradeAverage'
    | 'missingActivityCount'
    | 'lateActivityCount'
    | 'lastActiveAt'
    | 'fullName';
  sortOrder: 'asc' | 'desc';
}

export interface TeacherActivityQuery {
  page: number;
  limit: number;
  search?: string;
  activityType?: 'LESSON' | 'QUIZ' | 'ASSIGNMENT';
  sortBy: 'position' | 'deadline' | 'completionPercentage' | 'missingCount' | 'title';
  sortOrder: 'asc' | 'desc';
}

export interface TeacherAssessmentQuery {
  page: number;
  limit: number;
  search?: string;
  activityType?: 'QUIZ' | 'ASSIGNMENT';
  sortBy: 'position' | 'title' | 'submissionPercentage' | 'returnedGradeAverage' | 'missingCount';
  sortOrder: 'asc' | 'desc';
}

export interface TeacherProgressListEnvelope {
  success: true;
  data: {
    course: { id: string; title: string };
    items: TeacherProgressRow[];
    reporting: ReportMetadata;
  };
  meta: Pagination;
}

export interface TeacherActivityListEnvelope {
  success: true;
  data: {
    course: { id: string; title: string };
    items: TeacherActivityAnalyticsRow[];
    reporting: ReportMetadata;
  };
  meta: Pagination;
}

export interface TeacherAssessmentListEnvelope {
  success: true;
  data: {
    course: { id: string; title: string };
    items: TeacherAssessmentAnalyticsRow[];
    reporting: ReportMetadata;
  };
  meta: Pagination;
}

export interface TeacherStudentProgressEnvelope {
  success: true;
  data: {
    student: TeacherProgressRow['student'];
    summary: Omit<TeacherProgressRow, 'rank' | 'student' | 'allowedActions'>;
    activities: Array<{
      activityId: string;
      activityType: 'LESSON' | 'QUIZ' | 'ASSIGNMENT';
      title: string;
      completionStatus:
        'NOT_APPLICABLE' | 'NOT_STARTED' | 'IN_PROGRESS' | 'MISSING' | 'COMPLETED' | 'LATE';
      gradingStatus: 'NOT_GRADABLE' | 'NOT_READY' | 'AWAITING_GRADE' | 'DRAFT' | 'RETURNED';
      effectiveDeadline: string | null;
      completedAt: string | null;
      score: number | null;
      maxScore: number | null;
      actionUrl: string;
    }>;
    reporting: ReportMetadata;
  };
}

export type GradebookCompletionStatus =
  'NOT_APPLICABLE' | 'NOT_STARTED' | 'IN_PROGRESS' | 'MISSING' | 'COMPLETED' | 'LATE';
export type GradebookGradingStatus =
  'NOT_GRADABLE' | 'NOT_READY' | 'AWAITING_GRADE' | 'DRAFT' | 'RETURNED';
export type GradebookDisplayStatus =
  GradebookCompletionStatus | 'AWAITING_GRADE' | 'DRAFT_GRADE' | 'RETURNED';

export interface GradebookColumn {
  activityId: string;
  activityType: 'LESSON' | 'QUIZ' | 'ASSIGNMENT';
  title: string;
  isRequired: boolean;
  maxScore: number | null;
  effectiveDefaultDeadline: string | null;
  lifecycleStatus: string;
  position: number;
}

export interface GradebookCell {
  activityId: string;
  completionStatus: GradebookCompletionStatus;
  gradingStatus: GradebookGradingStatus;
  displayStatus: GradebookDisplayStatus;
  score: number | null;
  maxScore: number | null;
  normalizedScore: number | null;
  submittedAt: string | null;
  returnedAt: string | null;
  effectiveDeadline: string | null;
  isDeadlineExceptionApplied: boolean;
  allowedActions: string[];
}

export interface GradebookRow {
  student: TeacherProgressRow['student'];
  processScore: number | null;
  progressPercentage: number | null;
  returnedGradeAverage: number | null;
  missingCount: number;
  lateCount: number;
  cells: GradebookCell[];
}

export interface GradebookQuery {
  page: number;
  limit: number;
  search?: string;
  activityType?: GradebookColumn['activityType'];
  completionStatus?: GradebookCompletionStatus;
  gradingStatus?: GradebookGradingStatus;
  moduleId?: string;
  activityLimit: number;
  activityCursor?: string;
  sortBy:
    | 'processScore'
    | 'progressPercentage'
    | 'returnedGradeAverage'
    | 'missingCount'
    | 'lateCount'
    | 'fullName';
  sortOrder: 'asc' | 'desc';
}

export interface GradebookEnvelope {
  success: true;
  data: {
    course: { id: string; title: string };
    columns: GradebookColumn[];
    rows: GradebookRow[];
    activityPage: {
      limit: number;
      nextCursor: string | null;
      truncated: boolean;
    };
    allowedActions: string[];
    reporting: ReportMetadata;
  };
  meta: Pagination;
}

export type AdminReportRole = 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN';
export type AdminUserStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'DELETED';

export interface AdminUserStatusCounts extends Record<AdminUserStatus, number> {
  total: number;
}

export interface AdminAuditSummary {
  id: string;
  actorId: string | null;
  actorRole: AdminReportRole | 'SYSTEM';
  action: string;
  resourceType: string;
  resourceId: string;
  requestId: string;
  createdAt: string;
}

export interface AdminDashboardEnvelope {
  success: true;
  data: {
    users: Record<AdminReportRole, AdminUserStatusCounts>;
    registrationSources: Record<
      'SELF_REGISTRATION' | 'TEACHER_INVITATION' | 'ADMIN_BOOTSTRAP',
      number
    >;
    invitations: Record<'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED', number>;
    classrooms: Record<'ACTIVE' | 'LOCKED' | 'ARCHIVED', number>;
    courses: Record<'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED', number>;
    activeEnrollmentCount: number;
    recentGovernanceEvents: AdminAuditSummary[];
    allowedActions: string[];
    reporting: ReportMetadata;
  };
}

export interface AdminGovernanceQuery {
  from?: string;
  to?: string;
  timezone?: string;
  role?: AdminReportRole;
  userStatus?: AdminUserStatus;
  invitationStatus?: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  classroomStatus?: 'ACTIVE' | 'LOCKED' | 'ARCHIVED';
  courseStatus?: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED';
}

export interface AdminGovernanceEnvelope {
  success: true;
  data: {
    users: Record<AdminReportRole, AdminUserStatusCounts>;
    registrationSources: AdminDashboardEnvelope['data']['registrationSources'];
    invitations: AdminDashboardEnvelope['data']['invitations'];
    classrooms: AdminDashboardEnvelope['data']['classrooms'];
    courses: AdminDashboardEnvelope['data']['courses'];
    enrollments: Record<'ACTIVE' | 'REMOVED' | 'LEFT' | 'BLOCKED', number>;
    allowedActions: string[];
    reporting: ReportMetadata;
  };
}

export interface AdminAuditQuery {
  page: number;
  limit: number;
  from?: string;
  to?: string;
  timezone?: string;
  actorRole?: AdminReportRole | 'SYSTEM';
  action?: string;
  resourceType?: string;
  resourceId?: string;
  sortOrder: 'asc' | 'desc';
}

export interface AdminAuditEnvelope {
  success: true;
  data: {
    items: AdminAuditSummary[];
    reporting: ReportMetadata;
  };
  meta: Pagination;
}

export interface StudentProgressTrendQuery {
  courseId: string;
  from?: string;
  to?: string;
  timezone?: string;
}

export interface StudentProgressTrendEnvelope {
  success: true;
  data: {
    course: { id: string; title: string };
    points: Array<{
      capturedAt: string;
      progressPercentage: number | null;
      processScore: number | null;
      returnedGradeAverage: number | null;
      completedRequiredCount: number;
      requiredActivityCount: number;
      missingCount: number;
      lateCount: number;
    }>;
    change: {
      progressPercentage: number | null;
      processScore: number | null;
      returnedGradeAverage: number | null;
    };
    noDataReason: 'INSUFFICIENT_SNAPSHOTS' | 'INCOMPATIBLE_VERSION' | null;
    reporting: ReportMetadata;
  };
}

export interface AdminLearningOutcomeQuery {
  from?: string;
  to?: string;
  timezone?: string;
  courseStatus?: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED';
}

export interface AdminLearningOutcomeEnvelope {
  success: true;
  data: {
    items: Array<{
      course: { id: string; title: string; status: string };
      studentCountBucket: string;
      averageProgressPercentage: number | null;
      completionPercentage: number | null;
      returnedGradeAverage: number | null;
      missingActivityCount: number | null;
      lateActivityCount: number | null;
      dataState: 'READY' | 'SUPPRESSED';
      suppressionReason: 'SMALL_GROUP' | null;
    }>;
    reporting: ReportMetadata;
  };
}

export interface AdminAnalyticsAdoptionQuery {
  from?: string;
  to?: string;
  timezone?: string;
  interval: 'DAY' | 'WEEK' | 'MONTH';
}

export interface AdminAnalyticsAdoptionEnvelope {
  success: true;
  data: {
    items: Array<{
      periodStart: string;
      eventName: string;
      actorRole: string;
      eventCount: number | null;
      distinctActorCountBucket: string;
      dataState: 'READY' | 'SUPPRESSED';
      suppressionReason: 'SMALL_GROUP' | null;
    }>;
    reporting: ReportMetadata;
  };
}
