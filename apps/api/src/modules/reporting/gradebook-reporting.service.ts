import { randomUUID } from 'node:crypto';

import { Types } from 'mongoose';

import { AppError } from '../../shared/errors/app-error.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { CourseModuleRepository } from '../modules/module.repository.js';
import { CourseProgressCalculator } from './course-progress.calculator.js';
import { resolveGradebookCell } from './gradebook-cell.policy.js';
import { roundHalfUp } from './metric-definition.policy.js';
import {
  GRADEBOOK_VERSION,
  REPORTING_DESCRIPTOR_VERSION,
  REPORTING_SOURCE_METRIC_VERSION,
} from './reporting.constants.js';
import { toReportMetadataDto } from './reporting.dto.js';
import type { ReportingActivityReader } from './reporting-activity.reader.js';
import type { ReportingGradeReader } from './reporting-grade.reader.js';
import type { ReportingProgressReader } from './reporting-progress.reader.js';
import type { ReportingRosterReader } from './reporting-roster.reader.js';
import type { GradebookQuery } from './reporting.schemas.js';
import type { ReportingScopeReader } from './reporting-scope.reader.js';
import type {
  TeacherAssessmentStates,
  TeacherReportingSource,
  TeacherReportingStudentProfile,
} from './teacher-reporting.source.js';
import type {
  CourseProgressCalculationResult,
  ReportFilterValue,
  ReportingActivity,
  ReportingActivityStatus,
  ReportingDeadlineException,
  ReportingGrade,
  ReportingProgress,
  ResolvedTeacherCourseScope,
} from './reporting.types.js';

interface GradebookReportingOptions {
  enabled: boolean;
  timezone: string;
  staleAfterSeconds: number;
  exportEnabled: boolean;
}

interface GradebookSnapshot {
  asOf: Date;
  scope: ResolvedTeacherCourseScope;
  activities: readonly ReportingActivity[];
  progress: readonly ReportingProgress[];
  grades: readonly ReportingGrade[];
  deadlineExceptions: readonly ReportingDeadlineException[];
  assessmentStates: TeacherAssessmentStates;
  students: readonly {
    student: TeacherReportingStudentProfile;
    summary: CourseProgressCalculationResult;
  }[];
  sourceChangedAt: Date | null;
}

interface GradebookCursor {
  position: number;
  activityType: ReportingActivity['activityType'];
  activityId: string;
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

function sourceKey(
  studentId: string,
  activityType: ReportingActivity['activityType'],
  activityId: string,
) {
  return `${studentId}:${activityType}:${activityId}`;
}

function encodeCursor(activity: ReportingActivity) {
  return Buffer.from(
    JSON.stringify({
      position: activity.displayOrder,
      activityType: activity.activityType,
      activityId: activity.activityId,
    } satisfies GradebookCursor),
  ).toString('base64url');
}

function decodeCursor(value: string): GradebookCursor {
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as GradebookCursor;
    if (
      !Number.isInteger(parsed.position) ||
      parsed.position < 0 ||
      !['LESSON', 'QUIZ', 'ASSIGNMENT'].includes(parsed.activityType) ||
      !Types.ObjectId.isValid(parsed.activityId)
    ) {
      throw new Error('Invalid cursor payload');
    }
    return parsed;
  } catch {
    throw new AppError(400, 'VALIDATION_ERROR', 'activityCursor is invalid');
  }
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

function completionStatus(input: {
  activity: ReportingActivity;
  asOf: Date;
  progress: ReportingProgress | null;
  deadline: Date | null;
  hasEvidence: boolean;
}): ReportingActivityStatus {
  const { progress, deadline } = input;
  if (!input.activity.isRequired && !progress && !input.hasEvidence) return 'NOT_APPLICABLE';
  if (progress?.status === 'COMPLETED') {
    return deadline && progress.completedAt && progress.completedAt > deadline
      ? 'LATE'
      : 'COMPLETED';
  }
  if (input.activity.isRequired && deadline && deadline < input.asOf) return 'MISSING';
  if (progress || input.hasEvidence) return 'IN_PROGRESS';
  return 'NOT_STARTED';
}

export class GradebookReportingService {
  constructor(
    private readonly scopes: ReportingScopeReader,
    private readonly roster: ReportingRosterReader,
    private readonly activities: ReportingActivityReader,
    private readonly progress: ReportingProgressReader,
    private readonly grades: ReportingGradeReader,
    private readonly source: TeacherReportingSource,
    private readonly modules: CourseModuleRepository,
    private readonly calculator: CourseProgressCalculator,
    private readonly options: GradebookReportingOptions,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private assertAvailable(actor: AuthenticatedUser) {
    assertTeacher(actor);
    if (!this.options.enabled) {
      throw new AppError(503, 'FEATURE_DISABLED', 'Reporting is temporarily unavailable');
    }
  }

  private async validateModule(scope: ResolvedTeacherCourseScope, moduleId?: string) {
    if (!moduleId) return;
    const courseModule = await this.modules.findById(new Types.ObjectId(moduleId));
    if (!courseModule || courseModule.courseId.toString() !== scope.courseId) {
      throw new AppError(400, 'VALIDATION_ERROR', 'moduleId does not belong to the Course');
    }
  }

  private async snapshot(scope: ResolvedTeacherCourseScope): Promise<GradebookSnapshot> {
    const asOf = this.now();
    const roster = await this.roster.listActiveByCourse(scope.courseId);
    const studentIds = roster.map((row) => row.studentId);
    const [activities, progress, grades, deadlineExceptions, profiles, assessmentStates] =
      await Promise.all([
        this.activities.listVisibleByCourse(scope.courseId, asOf),
        this.progress.listByCourseAndStudents(scope.courseId, studentIds),
        this.grades.listCurrentByCourseAndStudents(scope.courseId, studentIds, 'TEACHER'),
        this.activities.listDeadlineExceptions(scope.courseId, studentIds),
        this.source.listStudentProfiles(studentIds),
        this.source.listAssessmentStates(scope.courseId, studentIds),
      ]);
    return {
      asOf,
      scope,
      activities,
      progress,
      grades,
      deadlineExceptions,
      assessmentStates,
      students: profiles.map((student) => ({
        student,
        summary: this.calculator.calculate({
          asOf,
          courseId: scope.courseId,
          classroomId: scope.classroomId,
          studentId: student.id,
          activities,
          progress,
          grades,
          deadlineExceptions,
        }),
      })),
      sourceChangedAt: maxDate([
        ...roster.map((row) => row.enrollmentUpdatedAt),
        ...activities.map((row) => row.sourceUpdatedAt),
        ...progress.map((row) => row.sourceUpdatedAt),
        ...grades.map((row) => row.sourceUpdatedAt),
        ...deadlineExceptions.map((row) => row.sourceUpdatedAt),
      ]),
    };
  }

  private metadata(
    snapshot: GradebookSnapshot,
    filters: Readonly<Record<string, ReportFilterValue>>,
    dataState: 'READY' | 'NO_DATA',
  ) {
    return toReportMetadataDto({
      reportId: randomUUID(),
      definitionVersion: GRADEBOOK_VERSION,
      sourceMetricVersion: REPORTING_SOURCE_METRIC_VERSION,
      descriptorVersion: REPORTING_DESCRIPTOR_VERSION,
      dataState,
      timezone: this.options.timezone,
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

  async gradebook(actor: AuthenticatedUser, courseId: string, query: GradebookQuery) {
    this.assertAvailable(actor);
    const scope = await this.scopes.requireTeacherCourse(actor.id, courseId);
    await this.validateModule(scope, query.moduleId);
    const snapshot = await this.snapshot(scope);

    const activityCandidates = [...snapshot.activities].filter((activity) => {
      const defaultIncluded =
        query.activityType === undefined
          ? activity.activityType !== 'LESSON'
          : activity.activityType === query.activityType &&
            (activity.activityType !== 'LESSON' || activity.isRequired);
      return defaultIncluded && (!query.moduleId || activity.moduleId === query.moduleId);
    });

    let activityStart = 0;
    if (query.activityCursor) {
      const cursor = decodeCursor(query.activityCursor);
      const cursorIndex = activityCandidates.findIndex(
        (activity) =>
          activity.displayOrder === cursor.position &&
          activity.activityType === cursor.activityType &&
          activity.activityId === cursor.activityId,
      );
      if (cursorIndex < 0) {
        throw new AppError(400, 'VALIDATION_ERROR', 'activityCursor does not match this Gradebook');
      }
      activityStart = cursorIndex + 1;
    }
    const selectedActivities = activityCandidates.slice(
      activityStart,
      activityStart + query.activityLimit,
    );
    const hasMoreActivities = activityStart + selectedActivities.length < activityCandidates.length;
    const activityPage = {
      limit: query.activityLimit,
      nextCursor:
        hasMoreActivities && selectedActivities.length > 0
          ? encodeCursor(selectedActivities.at(-1)!)
          : null,
      truncated: hasMoreActivities,
    };

    const progressByCell = new Map(
      snapshot.progress.map((row) => [
        sourceKey(row.studentId, row.activityType, row.activityId),
        row,
      ]),
    );
    const gradeByCell = new Map(
      snapshot.grades.map((row) => [
        sourceKey(row.studentId, row.activityType, row.activityId),
        row,
      ]),
    );
    const deadlineByCell = new Map(
      snapshot.deadlineExceptions.map((row) => [
        sourceKey(row.studentId, row.activityType, row.activityId),
        row,
      ]),
    );
    const quizStateByCell = new Map(
      snapshot.assessmentStates.quizAttempts.map((row) => [
        sourceKey(row.studentId, 'QUIZ', row.activityId),
        row,
      ]),
    );
    const assignmentStateByCell = new Map(
      snapshot.assessmentStates.assignmentSubmissions.map((row) => [
        sourceKey(row.studentId, 'ASSIGNMENT', row.activityId),
        row,
      ]),
    );

    const rows = snapshot.students.map((row) => {
      const cells = selectedActivities.map((activity) => {
        const key = sourceKey(row.student.id, activity.activityType, activity.activityId);
        const progress = progressByCell.get(key) ?? null;
        const grade = activity.activityType === 'LESSON' ? null : (gradeByCell.get(key) ?? null);
        const quizState = activity.activityType === 'QUIZ' ? quizStateByCell.get(key) : undefined;
        const assignmentState =
          activity.activityType === 'ASSIGNMENT' ? assignmentStateByCell.get(key) : undefined;
        const deadlineException = deadlineByCell.get(key);
        const deadline = deadlineException?.deadline ?? activity.defaultDeadline;
        const hasEvidence = Boolean(progress || grade || quizState || assignmentState);
        const terminalEvidence = Boolean(
          grade ||
          progress?.status === 'COMPLETED' ||
          (quizState && quizState.status !== 'IN_PROGRESS') ||
          (assignmentState && assignmentState.status !== 'DRAFT'),
        );
        const completion = completionStatus({
          activity,
          asOf: snapshot.asOf,
          progress,
          deadline,
          hasEvidence,
        });
        const resolved = resolveGradebookCell({
          completionStatus: completion,
          gradable: activity.activityType !== 'LESSON' && activity.maxScore !== null,
          terminalEvidence,
          grade,
        });
        const maxScore = grade?.maxScore ?? activity.maxScore;
        return {
          activityId: activity.activityId,
          completionStatus: resolved.completionStatus,
          gradingStatus: resolved.gradingStatus,
          displayStatus: resolved.displayStatus,
          score: resolved.score,
          maxScore,
          normalizedScore:
            resolved.score === null || !maxScore
              ? null
              : roundHalfUp((resolved.score / maxScore) * 100),
          submittedAt:
            quizState?.submittedAt?.toISOString() ??
            assignmentState?.submittedAt?.toISOString() ??
            progress?.completedAt?.toISOString() ??
            null,
          returnedAt:
            grade?.status === 'RETURNED' ? (grade.returnedAt?.toISOString() ?? null) : null,
          effectiveDeadline: deadline?.toISOString() ?? null,
          isDeadlineExceptionApplied: Boolean(deadlineException),
          allowedActions:
            activity.activityType !== 'LESSON' && terminalEvidence
              ? (['OPEN_GRADING'] as const)
              : ([] as const),
        };
      });
      return {
        student: row.student,
        processScore: row.summary.processScore,
        progressPercentage: row.summary.progressPercentage,
        returnedGradeAverage: row.summary.returnedGradeAverage,
        missingCount: row.summary.missingActivityCount,
        lateCount: row.summary.lateActivityCount,
        cells,
      };
    });

    const search = query.search?.toLocaleLowerCase();
    const filteredRows = rows.filter(
      (row) =>
        (!search ||
          row.student.fullName.toLocaleLowerCase().includes(search) ||
          row.student.email.toLocaleLowerCase().includes(search) ||
          row.student.studentCode?.toLocaleLowerCase().includes(search)) &&
        (!query.completionStatus ||
          row.cells.some((cell) => cell.completionStatus === query.completionStatus)) &&
        (!query.gradingStatus ||
          row.cells.some((cell) => cell.gradingStatus === query.gradingStatus)),
    );
    const direction: 1 | -1 = query.sortOrder === 'asc' ? 1 : -1;
    filteredRows.sort((left, right) => {
      let compared: number;
      if (query.sortBy === 'fullName') {
        compared =
          left.student.fullName.localeCompare(right.student.fullName, undefined, {
            sensitivity: 'base',
          }) * direction;
      } else if (query.sortBy === 'progressPercentage') {
        compared = compareNullable(
          left.progressPercentage,
          right.progressPercentage,
          (a, b) => a - b,
          direction,
        );
      } else if (query.sortBy === 'returnedGradeAverage') {
        compared = compareNullable(
          left.returnedGradeAverage,
          right.returnedGradeAverage,
          (a, b) => a - b,
          direction,
        );
      } else if (query.sortBy === 'missingCount') {
        compared = (left.missingCount - right.missingCount) * direction;
      } else if (query.sortBy === 'lateCount') {
        compared = (left.lateCount - right.lateCount) * direction;
      } else {
        compared = compareNullable(
          left.processScore,
          right.processScore,
          (a, b) => a - b,
          direction,
        );
      }
      return compared || left.student.id.localeCompare(right.student.id);
    });

    const rowStart = (query.page - 1) * query.limit;
    const pagedRows = filteredRows.slice(rowStart, rowStart + query.limit);
    const columns = selectedActivities.map((activity) => ({
      activityId: activity.activityId,
      activityType: activity.activityType,
      title: activity.title,
      isRequired: activity.isRequired,
      maxScore: activity.maxScore,
      effectiveDefaultDeadline: activity.defaultDeadline?.toISOString() ?? null,
      lifecycleStatus: activity.lifecycleStatus,
      position: activity.displayOrder,
    }));
    return {
      data: {
        course: { id: scope.courseId, title: scope.courseTitle },
        columns,
        rows: pagedRows,
        activityPage,
        allowedActions: this.options.exportEnabled ? (['EXPORT_REPORT'] as const) : ([] as const),
        reporting: this.metadata(
          snapshot,
          {
            page: query.page,
            limit: query.limit,
            search: query.search ?? null,
            activityType: query.activityType ?? null,
            completionStatus: query.completionStatus ?? null,
            gradingStatus: query.gradingStatus ?? null,
            moduleId: query.moduleId ?? null,
            activityLimit: query.activityLimit,
            activityCursor: query.activityCursor ?? null,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
          },
          columns.length === 0 || filteredRows.length === 0 ? 'NO_DATA' : 'READY',
        ),
      },
      meta: paginationMeta(query.page, query.limit, filteredRows.length),
    };
  }
}
