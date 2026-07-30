import { Types } from 'mongoose';
import { describe, expect, it, vi } from 'vitest';

import type { AuthenticatedUser } from '../src/modules/auth/auth.types.js';
import { CourseProgressCalculator } from '../src/modules/reporting/course-progress.calculator.js';
import type { ReportingActivityReader } from '../src/modules/reporting/reporting-activity.reader.js';
import type { ReportingGradeReader } from '../src/modules/reporting/reporting-grade.reader.js';
import type { ReportingProgressReader } from '../src/modules/reporting/reporting-progress.reader.js';
import type { ReportingRosterReader } from '../src/modules/reporting/reporting-roster.reader.js';
import type { ReportingScopeReader } from '../src/modules/reporting/reporting-scope.reader.js';
import { TeacherReportingService } from '../src/modules/reporting/teacher-reporting.service.js';
import type { TeacherReportingSource } from '../src/modules/reporting/teacher-reporting.source.js';

const now = new Date('2026-07-30T03:00:00.000Z');
const teacherId = new Types.ObjectId().toString();
const courseId = new Types.ObjectId().toString();
const classroomId = new Types.ObjectId().toString();
const firstStudentId = new Types.ObjectId().toString();
const secondStudentId = new Types.ObjectId().toString();
const lessonId = new Types.ObjectId().toString();
const quizId = new Types.ObjectId().toString();
const actor: AuthenticatedUser = {
  id: teacherId,
  role: 'TEACHER',
  status: 'ACTIVE',
  familyId: 'family-teacher',
  capabilities: ['course.progress_view_owned'],
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
    requireTeacherStudent: vi
      .fn()
      .mockImplementation(async (_actor: string, _course: string, studentId: string) => ({
        classroomId,
        courseId,
        teacherId,
        studentId,
        courseTitle: 'REST API',
        courseStatus: 'PUBLISHED',
        classroomName: 'Backend Classroom',
      })),
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
        moduleId: null,
        title: 'HTTP methods',
        isRequired: true,
        lifecycleStatus: 'PUBLISHED',
        visible: true,
        defaultDeadline: new Date('2026-07-29T03:00:00.000Z'),
        maxScore: null,
        displayOrder: 1,
        sourceUpdatedAt: now,
      },
      {
        activityId: quizId,
        activityType: 'QUIZ',
        classroomId,
        courseId,
        moduleId: null,
        title: 'REST Quiz',
        isRequired: true,
        lifecycleStatus: 'PUBLISHED',
        visible: true,
        defaultDeadline: new Date('2026-07-31T03:00:00.000Z'),
        maxScore: 10,
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
        activityId: lessonId,
        activityType: 'LESSON',
        status: 'COMPLETED',
        startedAt: now,
        completedAt: new Date('2026-07-28T03:00:00.000Z'),
        lastActiveAt: now,
        sourceUpdatedAt: now,
      },
      {
        studentId: firstStudentId,
        courseId,
        activityId: quizId,
        activityType: 'QUIZ',
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
    ]),
  };
  const source = {
    listStudentProfiles: vi.fn().mockResolvedValue([
      { id: firstStudentId, fullName: 'An Student', email: 'an@example.com', studentCode: 'S001' },
      {
        id: secondStudentId,
        fullName: 'Binh Student',
        email: 'binh@example.com',
        studentCode: 'S002',
      },
    ]),
    listAssessmentStates: vi.fn().mockResolvedValue({
      quizAttempts: [
        {
          studentId: firstStudentId,
          activityId: quizId,
          status: 'RESULT_RELEASED',
          submittedAt: now,
        },
      ],
      assignmentSubmissions: [],
    }),
  } satisfies TeacherReportingSource;
  const service = new TeacherReportingService(
    scopes as unknown as ReportingScopeReader,
    roster as unknown as ReportingRosterReader,
    activities as unknown as ReportingActivityReader,
    progress as unknown as ReportingProgressReader,
    grades as unknown as ReportingGradeReader,
    source,
    new CourseProgressCalculator(),
    {
      enabled: true,
      timezone: 'Asia/Ho_Chi_Minh',
      staleAfterSeconds: 300,
      dueSoonWindowHours: 72,
    },
    () => now,
  );
  return { service, scopes, roster, activities, progress, grades, source };
}

describe('Phase 06 Teacher reporting service', () => {
  it('resolves owned Course before loading aggregate sources and returns dashboard metrics', async () => {
    const current = fixture();
    const result = await current.service.dashboard(actor, courseId, {});
    expect(current.scopes.requireTeacherCourse).toHaveBeenCalledWith(teacherId, courseId);
    expect(current.scopes.requireTeacherCourse.mock.invocationCallOrder[0]).toBeLessThan(
      current.roster.listActiveByCourse.mock.invocationCallOrder[0]!,
    );
    expect(result.summary).toMatchObject({
      activeStudentCount: 2,
      requiredActivityCount: 2,
      averageProgressPercentage: 50,
      missingActivityCount: 1,
    });
    expect(result.topStudents.map((row) => row.student.id)).toEqual([
      firstStudentId,
      secondStudentId,
    ]);
  });

  it('uses stable server ranking, normalized search and null values last', async () => {
    const current = fixture();
    const result = await current.service.ranking(actor, courseId, {
      page: 1,
      limit: 20,
      search: 'BINH',
      sortBy: 'processScore',
      sortOrder: 'asc',
    });
    expect(result.data.items).toHaveLength(1);
    expect(result.data.items[0]).toMatchObject({
      rank: 1,
      student: { id: secondStudentId },
      processScore: 0,
    });
  });

  it('computes activity and assessment denominators without exposing raw answers', async () => {
    const current = fixture();
    const activities = await current.service.activityAnalytics(actor, courseId, {
      page: 1,
      limit: 20,
      sortBy: 'position',
      sortOrder: 'asc',
    });
    const assessments = await current.service.assessmentAnalytics(actor, courseId, {
      page: 1,
      limit: 20,
      sortBy: 'position',
      sortOrder: 'asc',
    });
    expect(activities.data.items[0]).toMatchObject({
      eligibleStudentCount: 2,
      completedStudentCount: 1,
      missingStudentCount: 1,
      completionPercentage: 50,
    });
    expect(assessments.data.items[0]).toMatchObject({
      submittedCount: 1,
      returnedCount: 1,
      submissionPercentage: 50,
      returnedGradeAverage: 80,
    });
    expect(JSON.stringify(assessments)).not.toMatch(/answers|feedback|correctOption/u);
  });

  it('requires the Student to be in the owned Course roster before returning detail', async () => {
    const current = fixture();
    const result = await current.service.studentDetail(actor, courseId, firstStudentId, {});
    expect(current.scopes.requireTeacherStudent).toHaveBeenCalledWith(
      teacherId,
      courseId,
      firstStudentId,
    );
    expect(result.student.id).toBe(firstStudentId);
    expect(result.activities).toHaveLength(2);
  });
});
