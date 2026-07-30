import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';

import { CourseProgressSummaryModel } from '../src/modules/reporting/course-progress-summary.model.js';
import { ReportingInvalidationModel } from '../src/modules/reporting/reporting-invalidation.model.js';
import { createReportingQuerySchemas } from '../src/modules/reporting/reporting.schemas.js';
import { PHASE_SIX_MODELS } from '../src/shared/database/phase-six-indexes.js';
import { getCapabilities, hasPermission } from '../src/shared/auth/permissions.js';

describe('Phase 06 reporting foundation', () => {
  it('grants reporting capabilities by role and remains deny-by-default', () => {
    expect(getCapabilities('STUDENT')).toContain('learning.view_enrolled');
    expect(getCapabilities('TEACHER')).toEqual(
      expect.arrayContaining(['course.progress_view_owned', 'report.export_owned']),
    );
    expect(getCapabilities('ADMIN')).toEqual(
      expect.arrayContaining([
        'report.view_governance',
        'report.export_governance',
        'report.audit_view',
      ]),
    );
    expect(hasPermission('STUDENT', 'report.export_owned')).toBe(false);
    expect(hasPermission('TEACHER', 'report.view_governance')).toBe(false);
    expect(hasPermission('ADMIN', 'report.export_owned')).toBe(false);
  });

  it('registers named reporting indexes and excludes prohibited projection fields', () => {
    expect(PHASE_SIX_MODELS).toHaveLength(2);
    const summaryIndexNames = (
      CourseProgressSummaryModel.schema.indexes() as Array<[unknown, { name?: string }]>
    ).map(([, options]) => options.name);
    const invalidationIndexNames = (
      ReportingInvalidationModel.schema.indexes() as Array<[unknown, { name?: string }]>
    ).map(([, options]) => options.name);
    expect(summaryIndexNames).toEqual(
      expect.arrayContaining([
        'report_summary_course_student_version_unique',
        'report_summary_course_default_ranking',
        'report_summary_course_freshness',
      ]),
    );
    expect(invalidationIndexNames).toContain('report_invalidation_scope_unique');
    for (const field of ['fullName', 'email', 'studentCode', 'answers', 'feedback', 'submission']) {
      expect(CourseProgressSummaryModel.schema.path(field)).toBeUndefined();
    }
  });

  it('enforces summary and invalidation invariants before database I/O', async () => {
    const id = new Types.ObjectId();
    const invalidSummary = new CourseProgressSummaryModel({
      courseId: id,
      classroomId: new Types.ObjectId(),
      studentId: new Types.ObjectId(),
      requiredActivityCount: 1,
      completedRequiredCount: 2,
      progressPercentage: 50,
      processScore: 40,
      missingActivityCount: 0,
      lateActivityCount: 0,
      ungradedActivityCount: 0,
      returnedGradeCount: 0,
      gradePointsEarned: 10,
      gradePointsPossible: 5,
      returnedGradeAverage: null,
      lastActiveAt: null,
      courseCompleted: true,
      supportFlags: [],
      sourceChangedAt: new Date(),
      recalculatedAt: new Date(),
      refreshStatus: 'FRESH',
    });
    await expect(invalidSummary.validate()).rejects.toMatchObject({ name: 'ValidationError' });

    const invalidScope = new ReportingInvalidationModel({
      scopeKey: `COURSE:${id.toString()}`,
      scopeType: 'COURSE',
      classroomId: new Types.ObjectId(),
      courseId: null,
      studentId: null,
      reasons: ['ACTIVITY_CHANGED'],
      sourceChangedAt: new Date(),
    });
    await expect(invalidScope.validate()).rejects.toMatchObject({ name: 'ValidationError' });
  });

  it('strictly parses reporting queries and enforces bounded date ranges', () => {
    const schemas = createReportingQuerySchemas({
      pageMax: 50,
      gradebookActivityMax: 50,
      maxDateRangeDays: 30,
      defaultTimezone: 'Asia/Ho_Chi_Minh',
    });
    expect(
      schemas.teacherProgress.parse({
        page: '1',
        limit: '20',
        search: '  Nguyen   Van A  ',
      }),
    ).toMatchObject({ page: 1, limit: 20, search: 'Nguyen Van A' });
    expect(() =>
      schemas.teacherProgress.parse({ page: '1', limit: '20', unknown: 'rejected' }),
    ).toThrow();
    expect(() =>
      schemas.adminAudit.parse({
        from: '2026-01-01T00:00:00.000Z',
        to: '2026-02-15T00:00:00.000Z',
      }),
    ).toThrow();
  });
});
