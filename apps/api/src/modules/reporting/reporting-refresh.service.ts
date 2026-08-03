import { Types } from 'mongoose';

import { CourseModel } from '../courses/course.model.js';
import type { ReportingActivityReader } from './reporting-activity.reader.js';
import { CourseProgressCalculator } from './course-progress.calculator.js';
import type { CourseProgressSummaryRepository } from './course-progress-summary.repository.js';
import type { ReportingGradeReader } from './reporting-grade.reader.js';
import type { ReportingInvalidationRecord } from './reporting-invalidation.model.js';
import type { ReportingInvalidationRepository } from './reporting-invalidation.repository.js';
import type { ReportingProgressReader } from './reporting-progress.reader.js';
import type { ReportingRosterReader } from './reporting-roster.reader.js';
import type { CourseProgressSummaryValues, InvalidationClaim } from './reporting.types.js';

function maxDate(values: readonly (Date | null | undefined)[]): Date {
  return (
    values
      .filter((value): value is Date => value instanceof Date)
      .sort((left, right) => right.getTime() - left.getTime())[0] ?? new Date(0)
  );
}

function claimOf(row: ReportingInvalidationRecord): InvalidationClaim {
  if (!row.claimToken) throw new Error('Claimed reporting invalidation has no claim token');
  return { id: row._id, claimToken: row.claimToken, revision: row.revision };
}

export interface ReportingRefreshOptions {
  rebuildBatchSize: number;
  rebuildMaxAttempts: number;
  classroomExpansionBatchSize: number;
  invalidationMaxAttempts: number;
  invalidationRetryBaseSeconds: number;
  invalidationRetryMaxSeconds: number;
}

export class ReportingRefreshService {
  constructor(
    private readonly roster: ReportingRosterReader,
    private readonly activities: ReportingActivityReader,
    private readonly progress: ReportingProgressReader,
    private readonly grades: ReportingGradeReader,
    private readonly summaries: CourseProgressSummaryRepository,
    private readonly invalidations: ReportingInvalidationRepository,
    private readonly calculator = new CourseProgressCalculator(),
    private readonly options: ReportingRefreshOptions,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async listStudentIds(courseId: string): Promise<readonly string[]> {
    return (await this.roster.listActiveByCourse(courseId)).map((row) => row.studentId);
  }

  async calculateStudent(
    courseId: string,
    studentId: string,
    asOf = this.now(),
  ): Promise<CourseProgressSummaryValues | null> {
    const courseObjectId = new Types.ObjectId(courseId);
    const studentObjectId = new Types.ObjectId(studentId);
    const course = await CourseModel.findById(courseObjectId)
      .select({ classroomId: 1 })
      .lean()
      .exec();
    if (!course) return null;
    const roster = await this.roster.listActiveByCourse(courseId);
    const member = roster.find((row) => row.studentId === studentId);
    if (!member) return null;

    const [activities, progress, grades, deadlineExceptions] = await Promise.all([
      this.activities.listVisibleByCourse(courseId, asOf),
      this.progress.listByCourseAndStudents(courseId, [studentId]),
      this.grades.listCurrentByCourseAndStudents(courseId, [studentId], 'TEACHER'),
      this.activities.listDeadlineExceptions(courseId, [studentId]),
    ]);
    const result = this.calculator.calculate({
      asOf,
      courseId,
      classroomId: course.classroomId.toString(),
      studentId,
      activities,
      progress,
      grades,
      deadlineExceptions,
    });
    const sourceChangedAt = maxDate([
      member.enrollmentUpdatedAt,
      ...activities.map((row) => row.sourceUpdatedAt),
      ...progress.map((row) => row.sourceUpdatedAt),
      ...grades.map((row) => row.sourceUpdatedAt),
      ...deadlineExceptions.map((row) => row.sourceUpdatedAt),
    ]);
    return {
      ...result,
      courseId: courseObjectId,
      classroomId: course.classroomId,
      studentId: studentObjectId,
      sourceChangedAt,
      recalculatedAt: this.now(),
      refreshStatus: 'FRESH',
    };
  }

  async refreshStudent(courseId: string, studentId: string, asOf = this.now()) {
    const courseObjectId = new Types.ObjectId(courseId);
    const studentObjectId = new Types.ObjectId(studentId);
    for (let attempt = 1; attempt <= this.options.rebuildMaxAttempts; attempt += 1) {
      const before = maxDate([
        await this.activities.getSourceWatermark(courseId),
        await this.progress.getSourceWatermark(courseId, [studentId]),
        await this.grades.getSourceWatermark(courseId, [studentId]),
      ]);
      const values = await this.calculateStudent(courseId, studentId, asOf);
      if (!values) {
        await this.summaries.deleteStudentCourse(courseObjectId, studentObjectId);
        return null;
      }
      const after = maxDate([
        await this.activities.getSourceWatermark(courseId),
        await this.progress.getSourceWatermark(courseId, [studentId]),
        await this.grades.getSourceWatermark(courseId, [studentId]),
      ]);
      if (after > before && attempt < this.options.rebuildMaxAttempts) continue;
      if (after > values.sourceChangedAt) values.sourceChangedAt = after;
      const existing = await this.summaries.findStudent(courseObjectId, studentObjectId);
      try {
        return await this.summaries.replaceWithRevision({
          values,
          expectedRevision: existing?.revision ?? null,
        });
      } catch (error) {
        if (
          (error as { code?: string }).code !== 'REPORTING_REVISION_CONFLICT' ||
          attempt === this.options.rebuildMaxAttempts
        ) {
          throw error;
        }
      }
    }
    throw new Error('Reporting refresh retry limit exceeded');
  }

  async rebuildCourse(courseId: string, asOf = this.now()) {
    const roster = await this.roster.listActiveByCourse(courseId);
    let refreshed = 0;
    let failed = 0;
    for (let offset = 0; offset < roster.length; offset += this.options.rebuildBatchSize) {
      const batch = roster.slice(offset, offset + this.options.rebuildBatchSize);
      const results = await Promise.allSettled(
        batch.map((row) => this.refreshStudent(courseId, row.studentId, asOf)),
      );
      refreshed += results.filter((result) => result.status === 'fulfilled').length;
      failed += results.filter((result) => result.status === 'rejected').length;
    }
    return { courseId, rosterCount: roster.length, refreshed, failed };
  }

  private async expandClassroom(row: ReportingInvalidationRecord) {
    let afterId: Types.ObjectId | null = null;
    let expanded = 0;
    while (true) {
      const courses = await CourseModel.find({
        classroomId: row.classroomId,
        ...(afterId ? { _id: { $gt: afterId } } : {}),
      })
        .select({ _id: 1 })
        .sort({ _id: 1 })
        .limit(this.options.classroomExpansionBatchSize)
        .lean()
        .exec();
      if (courses.length === 0) break;
      for (const course of courses) {
        await this.invalidations.upsert({
          scope: {
            scopeType: 'COURSE',
            classroomId: row.classroomId,
            courseId: course._id,
            studentId: null,
          },
          reasons: row.reasons,
          sourceChangedAt: row.sourceChangedAt,
        });
        expanded += 1;
      }
      afterId = courses.at(-1)!._id;
      if (courses.length < this.options.classroomExpansionBatchSize) break;
    }
    return expanded;
  }

  private nextRetryAt(attempts: number) {
    const seconds = Math.min(
      this.options.invalidationRetryBaseSeconds * 2 ** Math.max(0, attempts - 1),
      this.options.invalidationRetryMaxSeconds,
    );
    return new Date(this.now().getTime() + seconds * 1_000);
  }

  async processInvalidations(limit: number, workerId: string) {
    const claimed = await this.invalidations.claimBatch(limit, workerId, this.now());
    let resolved = 0;
    let failed = 0;
    for (const row of claimed) {
      const claim = claimOf(row);
      try {
        if (row.scopeType === 'CLASSROOM') await this.expandClassroom(row);
        else if (row.scopeType === 'COURSE' && row.courseId) {
          await this.rebuildCourse(row.courseId.toString());
        } else if (row.scopeType === 'STUDENT_COURSE' && row.courseId && row.studentId) {
          await this.refreshStudent(row.courseId.toString(), row.studentId.toString());
        }
        if (await this.invalidations.resolve(claim)) resolved += 1;
      } catch (error) {
        const code =
          error instanceof Error
            ? error.name
                .replace(/[^A-Za-z0-9_]/gu, '_')
                .toUpperCase()
                .slice(0, 100)
            : 'REPORTING_REFRESH_FAILED';
        const nextRetryAt =
          row.attempts >= this.options.invalidationMaxAttempts
            ? null
            : this.nextRetryAt(row.attempts);
        if (await this.invalidations.fail(claim, code, nextRetryAt)) failed += 1;
      }
    }
    return { claimed: claimed.length, resolved, failed };
  }
}
