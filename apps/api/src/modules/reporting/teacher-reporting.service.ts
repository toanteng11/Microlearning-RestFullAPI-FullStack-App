import { randomUUID } from 'node:crypto';

import { AppError } from '../../shared/errors/app-error.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import {
  PROCESS_SCORE_VERSION,
  REPORTING_DESCRIPTOR_VERSION,
  REPORTING_SOURCE_METRIC_VERSION,
  TEACHER_RANKING_VERSION,
} from './reporting.constants.js';
import type { CourseProgressCalculationResult } from './reporting.types.js';
import { CourseProgressCalculator } from './course-progress.calculator.js';
import { calculateReturnedGradeAverage } from './grade-average.policy.js';
import {
  effectiveDeadline,
  findActivityProgress,
  isRequiredReportingActivity,
  roundHalfUp,
} from './metric-definition.policy.js';
import { rankCandidates } from './ranking.policy.js';
import { toReportMetadataDto } from './reporting.dto.js';
import type { ReportingActivityReader } from './reporting-activity.reader.js';
import type { ReportingGradeReader } from './reporting-grade.reader.js';
import type { ReportingProgressReader } from './reporting-progress.reader.js';
import type { ReportingRosterReader } from './reporting-roster.reader.js';
import type {
  TeacherActivityQuery,
  TeacherAssessmentQuery,
  TeacherDashboardQuery,
  TeacherProgressQuery,
  TeacherStudentDetailQuery,
} from './reporting.schemas.js';
import type { ReportingScopeReader } from './reporting-scope.reader.js';
import type {
  TeacherAssessmentStates,
  TeacherReportingSource,
  TeacherReportingStudentProfile,
} from './teacher-reporting.source.js';
import type {
  ReportFilterValue,
  ReportingActivity,
  ReportingDeadlineException,
  ReportingGrade,
  ReportingProgress,
  ReportingProgressStatus,
  ResolvedTeacherCourseScope,
} from './reporting.types.js';

interface TeacherReportingOptions {
  enabled: boolean;
  timezone: string;
  staleAfterSeconds: number;
  dueSoonWindowHours: number;
}

interface TeacherStudentRow {
  student: TeacherReportingStudentProfile;
  summary: CourseProgressCalculationResult;
}

interface TeacherSnapshot {
  asOf: Date;
  scope: ResolvedTeacherCourseScope;
  activities: readonly ReportingActivity[];
  progress: readonly ReportingProgress[];
  grades: readonly ReportingGrade[];
  deadlineExceptions: readonly ReportingDeadlineException[];
  assessmentStates: TeacherAssessmentStates;
  students: readonly TeacherStudentRow[];
  sourceChangedAt: Date | null;
}

function assertTeacher(actor: AuthenticatedUser) {
  if (actor.role !== 'TEACHER') throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
}

function paginationMeta(page: number, limit: number, totalItems: number) {
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && totalPages > 0,
  };
}

function maxDate(values: readonly (Date | null | undefined)[]) {
  return (
    values
      .filter((value): value is Date => value instanceof Date)
      .sort((left, right) => right.getTime() - left.getTime())[0] ?? null
  );
}

function progressStatus(summary: CourseProgressCalculationResult): ReportingProgressStatus {
  if (summary.missingActivityCount > 0) return 'MISSING';
  if (summary.courseCompleted && summary.lateActivityCount > 0) return 'LATE';
  if (summary.courseCompleted) return 'COMPLETED';
  if (summary.completedRequiredCount === 0) return 'NOT_STARTED';
  return 'IN_PROGRESS';
}

function compareNullable<T>(
  left: T | null,
  right: T | null,
  compare: (a: T, b: T) => number,
  direction: 1 | -1,
) {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return compare(left, right) * direction;
}

function activityActionUrl(activity: ReportingActivity) {
  if (activity.activityType === 'QUIZ') return `/teacher/quizzes/${activity.activityId}/results`;
  if (activity.activityType === 'ASSIGNMENT')
    return `/teacher/assignments/${activity.activityId}/submissions`;
  return `/teacher/courses/${activity.courseId}/content`;
}

function percentage(numerator: number, denominator: number) {
  return denominator === 0 ? null : roundHalfUp((numerator / denominator) * 100);
}

export class TeacherReportingService {
  constructor(
    private readonly scopes: ReportingScopeReader,
    private readonly roster: ReportingRosterReader,
    private readonly activities: ReportingActivityReader,
    private readonly progress: ReportingProgressReader,
    private readonly grades: ReportingGradeReader,
    private readonly source: TeacherReportingSource,
    private readonly calculator: CourseProgressCalculator,
    private readonly options: TeacherReportingOptions,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private assertAvailable(actor: AuthenticatedUser) {
    assertTeacher(actor);
    if (!this.options.enabled) {
      throw new AppError(503, 'FEATURE_DISABLED', 'Reporting is temporarily unavailable');
    }
  }

  private async snapshot(
    actor: AuthenticatedUser,
    courseId: string,
    resolvedScope?: ResolvedTeacherCourseScope,
  ): Promise<TeacherSnapshot> {
    this.assertAvailable(actor);
    const scope = resolvedScope ?? (await this.scopes.requireTeacherCourse(actor.id, courseId));
    const asOf = this.now();
    const roster = await this.roster.listActiveByCourse(scope.courseId);
    const rosterIds = roster.map((row) => row.studentId);
    const [activities, progress, grades, deadlineExceptions, profiles, assessmentStates] =
      await Promise.all([
        this.activities.listVisibleByCourse(scope.courseId, asOf),
        this.progress.listByCourseAndStudents(scope.courseId, rosterIds),
        this.grades.listCurrentByCourseAndStudents(scope.courseId, rosterIds, 'TEACHER'),
        this.activities.listDeadlineExceptions(scope.courseId, rosterIds),
        this.source.listStudentProfiles(rosterIds),
        this.source.listAssessmentStates(scope.courseId, rosterIds),
      ]);
    const activeProfileIds = new Set(profiles.map((profile) => profile.id));
    const activeRoster = roster.filter((row) => activeProfileIds.has(row.studentId));
    const students = profiles.map((profile) => ({
      student: profile,
      summary: this.calculator.calculate({
        asOf,
        courseId: scope.courseId,
        classroomId: scope.classroomId,
        studentId: profile.id,
        activities,
        progress,
        grades,
        deadlineExceptions,
      }),
    }));
    return {
      asOf,
      scope,
      activities,
      progress,
      grades,
      deadlineExceptions,
      assessmentStates,
      students,
      sourceChangedAt: maxDate([
        ...activeRoster.map((row) => row.enrollmentUpdatedAt),
        ...activities.map((row) => row.sourceUpdatedAt),
        ...progress.map((row) => row.sourceUpdatedAt),
        ...grades.map((row) => row.sourceUpdatedAt),
        ...deadlineExceptions.map((row) => row.sourceUpdatedAt),
      ]),
    };
  }

  private metadata(
    snapshot: TeacherSnapshot,
    definitionVersion: string,
    filters: Readonly<Record<string, ReportFilterValue>>,
    dataState: 'READY' | 'NO_DATA',
    timezone?: string,
  ) {
    return toReportMetadataDto({
      reportId: randomUUID(),
      definitionVersion,
      sourceMetricVersion: REPORTING_SOURCE_METRIC_VERSION,
      descriptorVersion: REPORTING_DESCRIPTOR_VERSION,
      dataState,
      timezone: timezone ?? this.options.timezone,
      asOf: snapshot.asOf,
      generatedAt: this.now(),
      freshness: {
        status: 'FRESH',
        recalculatedAt: snapshot.asOf,
        sourceChangedAt: snapshot.sourceChangedAt,
        staleAfterSeconds: this.options.staleAfterSeconds,
        failedItemsCount: 0,
      },
      filters,
    });
  }

  private studentDto(row: TeacherStudentRow, rank: number) {
    return {
      rank,
      student: row.student,
      requiredActivityCount: row.summary.requiredActivityCount,
      completedRequiredCount: row.summary.completedRequiredCount,
      progressPercentage: row.summary.progressPercentage,
      processScore: row.summary.processScore,
      progressStatus: progressStatus(row.summary),
      returnedGradeAverage: row.summary.returnedGradeAverage,
      missingCount: row.summary.missingActivityCount,
      lateCount: row.summary.lateActivityCount,
      ungradedCount: row.summary.ungradedActivityCount,
      lastActiveAt: row.summary.lastActiveAt?.toISOString() ?? null,
      courseCompleted: row.summary.courseCompleted,
      supportFlags: [...row.summary.supportFlags],
      allowedActions: ['VIEW_STUDENT_PROGRESS'] as const,
    };
  }

  private rankingRows(snapshot: TeacherSnapshot, query?: TeacherProgressQuery) {
    const search = query?.search?.toLocaleLowerCase();
    const filtered = snapshot.students.filter((row) => {
      const status = progressStatus(row.summary);
      return (
        (!search ||
          row.student.fullName.toLocaleLowerCase().includes(search) ||
          row.student.email.toLocaleLowerCase().includes(search) ||
          row.student.studentCode?.toLocaleLowerCase().includes(search)) &&
        (!query?.progressStatus || status === query.progressStatus) &&
        (!query?.supportFlag || row.summary.supportFlags.includes(query.supportFlag))
      );
    });
    if (!query || (query.sortBy === 'processScore' && query.sortOrder === 'desc')) {
      return rankCandidates(
        filtered.map((row) => ({
          ...row,
          studentId: row.student.id,
          processScore: row.summary.processScore,
          completedRequiredCount: row.summary.completedRequiredCount,
          missingActivityCount: row.summary.missingActivityCount,
          lateActivityCount: row.summary.lateActivityCount,
          lastActiveAt: row.summary.lastActiveAt,
        })),
      );
    }
    const direction: 1 | -1 = query.sortOrder === 'asc' ? 1 : -1;
    const sorted = [...filtered].sort((left, right) => {
      let compared: number;
      if (query.sortBy === 'fullName') {
        compared =
          left.student.fullName.localeCompare(right.student.fullName, undefined, {
            sensitivity: 'base',
          }) * direction;
      } else if (query.sortBy === 'progressPercentage') {
        compared = compareNullable(
          left.summary.progressPercentage,
          right.summary.progressPercentage,
          (a, b) => a - b,
          direction,
        );
      } else if (query.sortBy === 'returnedGradeAverage') {
        compared = compareNullable(
          left.summary.returnedGradeAverage,
          right.summary.returnedGradeAverage,
          (a, b) => a - b,
          direction,
        );
      } else if (query.sortBy === 'missingActivityCount') {
        compared =
          (left.summary.missingActivityCount - right.summary.missingActivityCount) * direction;
      } else if (query.sortBy === 'lateActivityCount') {
        compared = (left.summary.lateActivityCount - right.summary.lateActivityCount) * direction;
      } else if (query.sortBy === 'lastActiveAt') {
        compared = compareNullable(
          left.summary.lastActiveAt,
          right.summary.lastActiveAt,
          (a, b) => a.getTime() - b.getTime(),
          direction,
        );
      } else {
        compared = compareNullable(
          left.summary.processScore,
          right.summary.processScore,
          (a, b) => a - b,
          direction,
        );
      }
      return compared || left.student.id.localeCompare(right.student.id);
    });
    return sorted.map((row, index) => ({ ...row, rank: index + 1 }));
  }

  private activityRows(snapshot: TeacherSnapshot) {
    return snapshot.activities.map((activity) => {
      let completedStudentCount = 0;
      let missingStudentCount = 0;
      let lateStudentCount = 0;
      let ungradedStudentCount = 0;
      for (const row of snapshot.students) {
        const studentProgress = findActivityProgress(activity, row.student.id, snapshot.progress);
        const deadline = effectiveDeadline(activity, row.student.id, snapshot.deadlineExceptions);
        const completed = studentProgress?.status === 'COMPLETED';
        const late = Boolean(completed && deadline && studentProgress.completedAt! > deadline);
        const missing = Boolean(
          isRequiredReportingActivity(activity) &&
          !completed &&
          deadline &&
          deadline < snapshot.asOf,
        );
        if (completed) completedStudentCount += 1;
        if (missing) missingStudentCount += 1;
        if (late) lateStudentCount += 1;
        if (completed && activity.activityType !== 'LESSON') {
          const grade = snapshot.grades.find(
            (item) =>
              item.studentId === row.student.id &&
              item.activityId === activity.activityId &&
              item.activityType === activity.activityType,
          );
          if (!grade || grade.status === 'DRAFT') ungradedStudentCount += 1;
        }
      }
      const gradeAverage = calculateReturnedGradeAverage(
        snapshot.grades.filter(
          (grade) =>
            grade.activityId === activity.activityId &&
            grade.activityType === activity.activityType,
        ),
      );
      const deadlineStatus =
        activity.defaultDeadline === null
          ? ('NO_DEADLINE' as const)
          : activity.defaultDeadline < snapshot.asOf
            ? ('OVERDUE' as const)
            : activity.defaultDeadline.getTime() - snapshot.asOf.getTime() <=
                this.options.dueSoonWindowHours * 3_600_000
              ? ('DUE_SOON' as const)
              : ('UPCOMING' as const);
      return {
        activityId: activity.activityId,
        activityType: activity.activityType,
        title: activity.title,
        isRequired: activity.isRequired,
        lifecycleStatus: activity.lifecycleStatus,
        defaultDeadline: activity.defaultDeadline?.toISOString() ?? null,
        deadlineStatus,
        position: activity.displayOrder,
        eligibleStudentCount: snapshot.students.length,
        completedStudentCount,
        missingStudentCount,
        lateStudentCount,
        ungradedStudentCount,
        completionPercentage: percentage(completedStudentCount, snapshot.students.length),
        returnedGradeAverage: gradeAverage.returnedGradeAverage,
        actionUrl: activityActionUrl(activity),
      };
    });
  }

  private assessmentRows(snapshot: TeacherSnapshot) {
    return snapshot.activities
      .filter(
        (activity): activity is ReportingActivity & { activityType: 'QUIZ' | 'ASSIGNMENT' } =>
          activity.activityType !== 'LESSON',
      )
      .map((activity) => {
        const gradeRows = snapshot.grades.filter(
          (grade) =>
            grade.activityId === activity.activityId &&
            grade.activityType === activity.activityType,
        );
        const returnedGrades = gradeRows.filter((grade) => grade.status === 'RETURNED');
        let inProgressCount = 0;
        let submittedCount = 0;
        let needsReviewCount = 0;
        let missingCount = 0;
        let lateCount = 0;
        const stateStudents = new Set<string>();
        if (activity.activityType === 'QUIZ') {
          const states = snapshot.assessmentStates.quizAttempts.filter(
            (state) => state.activityId === activity.activityId,
          );
          for (const state of states) {
            stateStudents.add(state.studentId);
            if (state.status === 'IN_PROGRESS') inProgressCount += 1;
            else submittedCount += 1;
            if (state.status === 'NEEDS_REVIEW') needsReviewCount += 1;
            const deadline = effectiveDeadline(
              activity,
              state.studentId,
              snapshot.deadlineExceptions,
            );
            if (state.submittedAt && deadline && state.submittedAt > deadline) lateCount += 1;
          }
        } else {
          const states = snapshot.assessmentStates.assignmentSubmissions.filter(
            (state) => state.activityId === activity.activityId,
          );
          for (const state of states) {
            stateStudents.add(state.studentId);
            if (state.status === 'DRAFT') inProgressCount += 1;
            else submittedCount += 1;
            if (state.isLate || state.status === 'LATE') lateCount += 1;
            const hasGrade = gradeRows.some((grade) => grade.studentId === state.studentId);
            if (state.status !== 'DRAFT' && !hasGrade) needsReviewCount += 1;
          }
        }
        for (const row of snapshot.students) {
          const deadline = effectiveDeadline(activity, row.student.id, snapshot.deadlineExceptions);
          if (
            activity.isRequired &&
            deadline &&
            deadline < snapshot.asOf &&
            !stateStudents.has(row.student.id)
          ) {
            missingCount += 1;
          }
        }
        const distribution = {
          '0_49': 0,
          '50_64': 0,
          '65_79': 0,
          '80_89': 0,
          '90_100': 0,
        };
        for (const grade of returnedGrades) {
          const normalized = (grade.score / grade.maxScore) * 100;
          const bucket =
            normalized < 50
              ? '0_49'
              : normalized < 65
                ? '50_64'
                : normalized < 80
                  ? '65_79'
                  : normalized < 90
                    ? '80_89'
                    : '90_100';
          distribution[bucket] += 1;
        }
        return {
          activityId: activity.activityId,
          activityType: activity.activityType,
          title: activity.title,
          lifecycleStatus: activity.lifecycleStatus,
          position: activity.displayOrder,
          eligibleStudentCount: snapshot.students.length,
          notStartedCount: Math.max(0, snapshot.students.length - stateStudents.size),
          inProgressCount,
          submittedCount,
          needsReviewCount,
          draftGradeCount: gradeRows.filter((grade) => grade.status === 'DRAFT').length,
          returnedCount: returnedGrades.length,
          missingCount,
          lateCount,
          submissionPercentage: percentage(submittedCount, snapshot.students.length),
          returnedGradeAverage: calculateReturnedGradeAverage(gradeRows).returnedGradeAverage,
          scoreDistribution: Object.entries(distribution).map(([bucket, count]) => ({
            bucket,
            count,
          })),
          actionUrl: activityActionUrl(activity),
        };
      });
  }

  async dashboard(actor: AuthenticatedUser, courseId: string, query: TeacherDashboardQuery) {
    const snapshot = await this.snapshot(actor, courseId);
    const ranked = this.rankingRows(snapshot);
    const activityRows = this.activityRows(snapshot);
    const average = (values: readonly (number | null)[]) => {
      const available = values.filter((value): value is number => value !== null);
      return available.length === 0
        ? null
        : roundHalfUp(available.reduce((sum, value) => sum + value, 0) / available.length);
    };
    const returnedPoints = snapshot.students.reduce(
      (totals, row) => ({
        earned: totals.earned + row.summary.gradePointsEarned,
        possible: totals.possible + row.summary.gradePointsPossible,
      }),
      { earned: 0, possible: 0 },
    );
    return {
      course: {
        id: snapshot.scope.courseId,
        title: snapshot.scope.courseTitle,
        status: snapshot.scope.courseStatus,
        classroomId: snapshot.scope.classroomId,
        classroomName: snapshot.scope.classroomName,
      },
      summary: {
        totalActivityCount: snapshot.activities.length,
        publishedActivityCount: snapshot.activities.length,
        requiredActivityCount: snapshot.activities.filter(isRequiredReportingActivity).length,
        activeStudentCount: snapshot.students.length,
        averageProgressPercentage: average(
          snapshot.students.map((row) => row.summary.progressPercentage),
        ),
        averageReturnedGrade:
          returnedPoints.possible === 0
            ? null
            : roundHalfUp((returnedPoints.earned / returnedPoints.possible) * 100),
        missingActivityCount: snapshot.students.reduce(
          (sum, row) => sum + row.summary.missingActivityCount,
          0,
        ),
        lateActivityCount: snapshot.students.reduce(
          (sum, row) => sum + row.summary.lateActivityCount,
          0,
        ),
        ungradedActivityCount: snapshot.students.reduce(
          (sum, row) => sum + row.summary.ungradedActivityCount,
          0,
        ),
      },
      topActivities: [...activityRows]
        .sort(
          (left, right) =>
            right.missingStudentCount - left.missingStudentCount ||
            compareNullable(
              left.completionPercentage,
              right.completionPercentage,
              (a, b) => a - b,
              1,
            ) ||
            left.activityId.localeCompare(right.activityId),
        )
        .slice(0, 5),
      topStudents: ranked.slice(0, 5).map((row) => this.studentDto(row, row.rank)),
      allowedActions: ['VIEW_SOURCE_LIST', 'EXPORT_REPORT'] as const,
      reporting: this.metadata(
        snapshot,
        TEACHER_RANKING_VERSION,
        {},
        snapshot.students.length > 0 || snapshot.activities.length > 0 ? 'READY' : 'NO_DATA',
        query.timezone,
      ),
    };
  }

  async ranking(actor: AuthenticatedUser, courseId: string, query: TeacherProgressQuery) {
    const snapshot = await this.snapshot(actor, courseId);
    const ranked = this.rankingRows(snapshot, query);
    const start = (query.page - 1) * query.limit;
    return {
      data: {
        course: { id: snapshot.scope.courseId, title: snapshot.scope.courseTitle },
        items: ranked
          .slice(start, start + query.limit)
          .map((row) => this.studentDto(row, row.rank)),
        reporting: this.metadata(
          snapshot,
          TEACHER_RANKING_VERSION,
          {
            page: query.page,
            limit: query.limit,
            search: query.search ?? null,
            progressStatus: query.progressStatus ?? null,
            supportFlag: query.supportFlag ?? null,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
          },
          ranked.length === 0 ? 'NO_DATA' : 'READY',
        ),
      },
      meta: paginationMeta(query.page, query.limit, ranked.length),
    };
  }

  async activityAnalytics(actor: AuthenticatedUser, courseId: string, query: TeacherActivityQuery) {
    const snapshot = await this.snapshot(actor, courseId);
    const search = query.search?.toLocaleLowerCase();
    const direction: 1 | -1 = query.sortOrder === 'asc' ? 1 : -1;
    const rows = this.activityRows(snapshot)
      .filter(
        (row) =>
          (!search || row.title.toLocaleLowerCase().includes(search)) &&
          (!query.activityType || row.activityType === query.activityType) &&
          (query.isRequired === undefined || row.isRequired === query.isRequired) &&
          (!query.lifecycleStatus || row.lifecycleStatus === query.lifecycleStatus) &&
          (!query.deadlineStatus || row.deadlineStatus === query.deadlineStatus),
      )
      .sort((left, right) => {
        let compared: number;
        if (query.sortBy === 'position') compared = (left.position - right.position) * direction;
        else if (query.sortBy === 'title')
          compared = left.title.localeCompare(right.title) * direction;
        else if (query.sortBy === 'deadline')
          compared = compareNullable(
            left.defaultDeadline,
            right.defaultDeadline,
            (a, b) => Date.parse(a) - Date.parse(b),
            direction,
          );
        else if (query.sortBy === 'completionPercentage')
          compared = compareNullable(
            left.completionPercentage,
            right.completionPercentage,
            (a, b) => a - b,
            direction,
          );
        else compared = (left.missingStudentCount - right.missingStudentCount) * direction;
        return compared || left.activityId.localeCompare(right.activityId);
      });
    const start = (query.page - 1) * query.limit;
    return {
      data: {
        course: { id: snapshot.scope.courseId, title: snapshot.scope.courseTitle },
        items: rows.slice(start, start + query.limit),
        reporting: this.metadata(
          snapshot,
          REPORTING_SOURCE_METRIC_VERSION,
          {
            page: query.page,
            limit: query.limit,
            search: query.search ?? null,
            activityType: query.activityType ?? null,
            isRequired: query.isRequired ?? null,
            lifecycleStatus: query.lifecycleStatus ?? null,
            deadlineStatus: query.deadlineStatus ?? null,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
          },
          rows.length === 0 ? 'NO_DATA' : 'READY',
        ),
      },
      meta: paginationMeta(query.page, query.limit, rows.length),
    };
  }

  async assessmentAnalytics(
    actor: AuthenticatedUser,
    courseId: string,
    query: TeacherAssessmentQuery,
  ) {
    const snapshot = await this.snapshot(actor, courseId);
    const search = query.search?.toLocaleLowerCase();
    const direction: 1 | -1 = query.sortOrder === 'asc' ? 1 : -1;
    const rows = this.assessmentRows(snapshot)
      .filter(
        (row) =>
          (!search || row.title.toLocaleLowerCase().includes(search)) &&
          (!query.activityType || row.activityType === query.activityType) &&
          (!query.lifecycleStatus || row.lifecycleStatus === query.lifecycleStatus),
      )
      .sort((left, right) => {
        let compared: number;
        if (query.sortBy === 'position') compared = (left.position - right.position) * direction;
        else if (query.sortBy === 'title')
          compared = left.title.localeCompare(right.title) * direction;
        else if (query.sortBy === 'submissionPercentage')
          compared = compareNullable(
            left.submissionPercentage,
            right.submissionPercentage,
            (a, b) => a - b,
            direction,
          );
        else if (query.sortBy === 'returnedGradeAverage')
          compared = compareNullable(
            left.returnedGradeAverage,
            right.returnedGradeAverage,
            (a, b) => a - b,
            direction,
          );
        else compared = (left.missingCount - right.missingCount) * direction;
        return compared || left.activityId.localeCompare(right.activityId);
      });
    const start = (query.page - 1) * query.limit;
    return {
      data: {
        course: { id: snapshot.scope.courseId, title: snapshot.scope.courseTitle },
        items: rows.slice(start, start + query.limit),
        reporting: this.metadata(
          snapshot,
          REPORTING_SOURCE_METRIC_VERSION,
          {
            page: query.page,
            limit: query.limit,
            search: query.search ?? null,
            activityType: query.activityType ?? null,
            lifecycleStatus: query.lifecycleStatus ?? null,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
          },
          rows.length === 0 ? 'NO_DATA' : 'READY',
        ),
      },
      meta: paginationMeta(query.page, query.limit, rows.length),
    };
  }

  async studentDetail(
    actor: AuthenticatedUser,
    courseId: string,
    studentId: string,
    query: TeacherStudentDetailQuery,
  ) {
    this.assertAvailable(actor);
    const scope = await this.scopes.requireTeacherStudent(actor.id, courseId, studentId);
    const snapshot = await this.snapshot(actor, courseId, scope);
    const studentRow = snapshot.students.find((row) => row.student.id === scope.studentId);
    if (!studentRow) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Student was not found');
    const ranked = this.rankingRows(snapshot);
    const rankedRow = ranked.find((row) => row.student.id === studentId)!;
    const rankedStudent = this.studentDto(studentRow, rankedRow.rank);
    const studentSummary = {
      requiredActivityCount: rankedStudent.requiredActivityCount,
      completedRequiredCount: rankedStudent.completedRequiredCount,
      progressPercentage: rankedStudent.progressPercentage,
      processScore: rankedStudent.processScore,
      progressStatus: rankedStudent.progressStatus,
      returnedGradeAverage: rankedStudent.returnedGradeAverage,
      missingCount: rankedStudent.missingCount,
      lateCount: rankedStudent.lateCount,
      ungradedCount: rankedStudent.ungradedCount,
      lastActiveAt: rankedStudent.lastActiveAt,
      courseCompleted: rankedStudent.courseCompleted,
      supportFlags: rankedStudent.supportFlags,
    };
    return {
      student: studentRow.student,
      summary: studentSummary,
      activities: snapshot.activities.map((activity) => {
        const progress = findActivityProgress(activity, studentId, snapshot.progress);
        const deadline = effectiveDeadline(activity, studentId, snapshot.deadlineExceptions);
        const grade =
          activity.activityType === 'LESSON'
            ? null
            : (snapshot.grades.find(
                (row) =>
                  row.studentId === studentId &&
                  row.activityId === activity.activityId &&
                  row.activityType === activity.activityType,
              ) ?? null);
        let completionStatus:
          'NOT_APPLICABLE' | 'NOT_STARTED' | 'IN_PROGRESS' | 'MISSING' | 'COMPLETED' | 'LATE';
        if (!activity.isRequired && !progress) completionStatus = 'NOT_APPLICABLE';
        else if (progress?.status === 'COMPLETED')
          completionStatus =
            deadline && progress.completedAt && progress.completedAt > deadline
              ? 'LATE'
              : 'COMPLETED';
        else if (deadline && deadline < snapshot.asOf) completionStatus = 'MISSING';
        else completionStatus = progress ? 'IN_PROGRESS' : 'NOT_STARTED';
        const gradingStatus =
          activity.activityType === 'LESSON'
            ? ('NOT_GRADABLE' as const)
            : !progress || progress.status !== 'COMPLETED'
              ? ('NOT_READY' as const)
              : !grade
                ? ('AWAITING_GRADE' as const)
                : grade.status;
        return {
          activityId: activity.activityId,
          activityType: activity.activityType,
          title: activity.title,
          completionStatus,
          gradingStatus,
          effectiveDeadline: deadline?.toISOString() ?? null,
          completedAt: progress?.completedAt?.toISOString() ?? null,
          score: grade?.score ?? null,
          maxScore: grade?.maxScore ?? activity.maxScore,
          actionUrl: activityActionUrl(activity),
        };
      }),
      reporting: this.metadata(
        snapshot,
        PROCESS_SCORE_VERSION,
        { courseId, studentId },
        'READY',
        query.timezone,
      ),
    };
  }
}
