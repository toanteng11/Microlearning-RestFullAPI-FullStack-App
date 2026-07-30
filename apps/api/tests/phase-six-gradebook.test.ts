import { Types } from 'mongoose';
import { describe, expect, it, vi } from 'vitest';

import type { AuthenticatedUser } from '../src/modules/auth/auth.types.js';
import type { CourseModuleRepository } from '../src/modules/modules/module.repository.js';
import { CourseProgressCalculator } from '../src/modules/reporting/course-progress.calculator.js';
import { GradebookReportingService } from '../src/modules/reporting/gradebook-reporting.service.js';
import type { ReportingActivityReader } from '../src/modules/reporting/reporting-activity.reader.js';
import type { ReportingGradeReader } from '../src/modules/reporting/reporting-grade.reader.js';
import type { ReportingProgressReader } from '../src/modules/reporting/reporting-progress.reader.js';
import type { ReportingRosterReader } from '../src/modules/reporting/reporting-roster.reader.js';
import type { GradebookQuery } from '../src/modules/reporting/reporting.schemas.js';
import type { ReportingScopeReader } from '../src/modules/reporting/reporting-scope.reader.js';
import type { TeacherReportingSource } from '../src/modules/reporting/teacher-reporting.source.js';

const now = new Date('2026-07-30T03:00:00.000Z');
const teacherId = new Types.ObjectId().toString();
const courseId = new Types.ObjectId().toString();
const classroomId = new Types.ObjectId().toString();
const moduleId = new Types.ObjectId().toString();
const firstStudentId = new Types.ObjectId().toString();
const secondStudentId = new Types.ObjectId().toString();
const lessonId = new Types.ObjectId().toString();
const quizId = new Types.ObjectId().toString();
const assignmentId = new Types.ObjectId().toString();

const actor: AuthenticatedUser = {
  id: teacherId,
  role: 'TEACHER',
  status: 'ACTIVE',
  familyId: 'gradebook-family',
  capabilities: ['grade.manage_owned'],
};

const defaultQuery: GradebookQuery = {
  page: 1,
  limit: 20,
  activityLimit: 25,
  sortBy: 'processScore',
  sortOrder: 'desc',
};

function fixture() {
  const scopes = {
    requireTeacherCourse: vi.fn().mockResolvedValue({
      classroomId,
      courseId,
      teacherId,
      courseTitle: 'REST API',
      courseStatus: 'PUBLISHED',
      classroomName: 'Backend Classroom',
    }),
  };
  const roster = {
    listActiveByCourse: vi.fn().mockResolvedValue([
      { studentId: firstStudentId, enrollmentUpdatedAt: now },
      { studentId: secondStudentId, enrollmentUpdatedAt: now },
    ]),
  };
  const activities = {
    listVisibleByCourse: vi.fn().mockResolvedValue([
      {
        activityId: lessonId,
        activityType: 'LESSON',
        classroomId,
        courseId,
        moduleId,
        title: 'HTTP lesson',
        isRequired: true,
        lifecycleStatus: 'PUBLISHED',
        visible: true,
        defaultDeadline: null,
        maxScore: null,
        displayOrder: 0,
        sourceUpdatedAt: now,
      },
      {
        activityId: quizId,
        activityType: 'QUIZ',
        classroomId,
        courseId,
        moduleId,
        title: 'REST quiz',
        isRequired: true,
        lifecycleStatus: 'PUBLISHED',
        visible: true,
        defaultDeadline: new Date('2026-07-29T01:00:00.000Z'),
        maxScore: 10,
        displayOrder: 1,
        sourceUpdatedAt: now,
      },
      {
        activityId: assignmentId,
        activityType: 'ASSIGNMENT',
        classroomId,
        courseId,
        moduleId,
        title: 'API assignment',
        isRequired: true,
        lifecycleStatus: 'PUBLISHED',
        visible: true,
        defaultDeadline: new Date('2026-07-31T01:00:00.000Z'),
        maxScore: 20,
        displayOrder: 2,
        sourceUpdatedAt: now,
      },
    ]),
    listDeadlineExceptions: vi.fn().mockResolvedValue([]),
  };
  const progress = {
    listByCourseAndStudents: vi.fn().mockResolvedValue([
      {
        studentId: firstStudentId,
        courseId,
        activityId: quizId,
        activityType: 'QUIZ',
        status: 'COMPLETED',
        startedAt: new Date('2026-07-29T00:00:00.000Z'),
        completedAt: new Date('2026-07-29T02:00:00.000Z'),
        lastActiveAt: now,
        sourceUpdatedAt: now,
      },
      {
        studentId: firstStudentId,
        courseId,
        activityId: assignmentId,
        activityType: 'ASSIGNMENT',
        status: 'COMPLETED',
        startedAt: now,
        completedAt: now,
        lastActiveAt: now,
        sourceUpdatedAt: now,
      },
    ]),
  };
  const grades = {
    listCurrentByCourseAndStudents: vi.fn().mockResolvedValue([
      {
        gradeId: new Types.ObjectId().toString(),
        studentId: firstStudentId,
        courseId,
        activityId: quizId,
        activityType: 'QUIZ',
        status: 'RETURNED',
        score: 8,
        maxScore: 10,
        returnedAt: now,
        revision: 1,
        sourceUpdatedAt: now,
      },
      {
        gradeId: new Types.ObjectId().toString(),
        studentId: firstStudentId,
        courseId,
        activityId: assignmentId,
        activityType: 'ASSIGNMENT',
        status: 'DRAFT',
        score: 15,
        maxScore: 20,
        returnedAt: null,
        revision: 1,
        sourceUpdatedAt: now,
      },
    ]),
  };
  const source = {
    listStudentProfiles: vi.fn().mockResolvedValue([
      {
        id: firstStudentId,
        fullName: 'An Student',
        email: 'an@example.test',
        studentCode: 'S001',
      },
      {
        id: secondStudentId,
        fullName: 'Binh Student',
        email: 'binh@example.test',
        studentCode: 'S002',
      },
    ]),
    listAssessmentStates: vi.fn().mockResolvedValue({
      quizAttempts: [
        {
          studentId: firstStudentId,
          activityId: quizId,
          status: 'RESULT_RELEASED',
          submittedAt: new Date('2026-07-29T02:00:00.000Z'),
        },
      ],
      assignmentSubmissions: [
        {
          studentId: firstStudentId,
          activityId: assignmentId,
          status: 'GRADED',
          submittedAt: now,
          isLate: false,
        },
      ],
    }),
  } satisfies TeacherReportingSource;
  const modules = {
    findById: vi.fn().mockResolvedValue({
      _id: new Types.ObjectId(moduleId),
      courseId: new Types.ObjectId(courseId),
    }),
  };
  const service = new GradebookReportingService(
    scopes as unknown as ReportingScopeReader,
    roster as unknown as ReportingRosterReader,
    activities as unknown as ReportingActivityReader,
    progress as unknown as ReportingProgressReader,
    grades as unknown as ReportingGradeReader,
    source,
    modules as unknown as CourseModuleRepository,
    new CourseProgressCalculator(),
    {
      enabled: true,
      timezone: 'Asia/Ho_Chi_Minh',
      staleAfterSeconds: 300,
    },
    () => now,
  );
  return { service, scopes, roster, activities, progress, grades, source, modules };
}

describe('Phase 06 Gradebook reporting service', () => {
  it('resolves ownership before batched sources and returns bounded orthogonal cells', async () => {
    const current = fixture();
    const result = await current.service.gradebook(actor, courseId, defaultQuery);

    expect(current.scopes.requireTeacherCourse).toHaveBeenCalledWith(teacherId, courseId);
    expect(current.scopes.requireTeacherCourse.mock.invocationCallOrder[0]).toBeLessThan(
      current.roster.listActiveByCourse.mock.invocationCallOrder[0]!,
    );
    expect(result.data.columns.map((column) => column.activityType)).toEqual([
      'QUIZ',
      'ASSIGNMENT',
    ]);
    expect(result.data.rows).toHaveLength(2);
    expect(result.data.rows[0]).toMatchObject({
      student: { id: firstStudentId },
      returnedGradeAverage: 80,
    });
    expect(result.data.rows[0]?.cells[0]).toMatchObject({
      completionStatus: 'LATE',
      gradingStatus: 'RETURNED',
      displayStatus: 'RETURNED',
      normalizedScore: 80,
    });
    expect(result.data.rows[0]?.cells[1]).toMatchObject({
      gradingStatus: 'DRAFT',
      displayStatus: 'DRAFT_GRADE',
      score: 15,
      returnedAt: null,
    });
    expect(JSON.stringify(result)).not.toMatch(/feedback|answers|correctOption/u);
  });

  it('filters on source dimensions and keeps null scores stable and last', async () => {
    const current = fixture();
    const result = await current.service.gradebook(actor, courseId, {
      ...defaultQuery,
      gradingStatus: 'DRAFT',
      sortBy: 'returnedGradeAverage',
      sortOrder: 'asc',
    });

    expect(result.data.rows.map((row) => row.student.id)).toEqual([firstStudentId]);
    expect(result.meta.totalItems).toBe(1);
    expect(result.data.reporting.filters).toMatchObject({
      gradingStatus: 'DRAFT',
      sortBy: 'returnedGradeAverage',
    });
  });

  it('paginates activity columns with an opaque server cursor', async () => {
    const current = fixture();
    const firstPage = await current.service.gradebook(actor, courseId, {
      ...defaultQuery,
      activityLimit: 1,
    });
    expect(firstPage.data.columns).toHaveLength(1);
    expect(firstPage.data.activityPage).toMatchObject({ truncated: true });

    const secondPage = await current.service.gradebook(actor, courseId, {
      ...defaultQuery,
      activityLimit: 1,
      activityCursor: firstPage.data.activityPage.nextCursor!,
    });
    expect(secondPage.data.columns[0]?.activityType).toBe('ASSIGNMENT');
    expect(secondPage.data.activityPage.nextCursor).toBeNull();
  });

  it('rejects a cross-Course module before loading roster data', async () => {
    const current = fixture();
    current.modules.findById.mockResolvedValueOnce(null);

    await expect(
      current.service.gradebook(actor, courseId, { ...defaultQuery, moduleId }),
    ).rejects.toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' });
    expect(current.roster.listActiveByCourse).not.toHaveBeenCalled();
  });

  it('rejects malformed or mismatched activity cursors', async () => {
    const current = fixture();
    await expect(
      current.service.gradebook(actor, courseId, {
        ...defaultQuery,
        activityCursor: 'not-a-gradebook-cursor',
      }),
    ).rejects.toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' });
  });
});
