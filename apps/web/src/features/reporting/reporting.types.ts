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
