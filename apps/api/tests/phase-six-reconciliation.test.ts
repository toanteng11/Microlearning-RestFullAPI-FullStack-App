import { Types } from 'mongoose';
import { describe, expect, it, vi } from 'vitest';

import type { CourseProgressSummaryRecord } from '../src/modules/reporting/course-progress-summary.model.js';
import type { CourseProgressSummaryRepository } from '../src/modules/reporting/course-progress-summary.repository.js';
import type { ReportingRefreshService } from '../src/modules/reporting/reporting-refresh.service.js';
import { ReportingReconciliationService } from '../src/modules/reporting/reporting-reconciliation.service.js';

function summary(courseId: Types.ObjectId, studentId: Types.ObjectId) {
  return {
    courseId,
    studentId,
    requiredActivityCount: 2,
    completedRequiredCount: 1,
    progressPercentage: 50,
    processScore: 50,
    missingActivityCount: 1,
    lateActivityCount: 0,
    ungradedActivityCount: 0,
    returnedGradeCount: 0,
    gradePointsEarned: 0,
    gradePointsPossible: 0,
    returnedGradeAverage: null,
    lastActiveAt: null,
    courseCompleted: false,
  } as CourseProgressSummaryRecord;
}

describe('Phase 06 reconciliation service', () => {
  it('detects missing, mismatched and orphan rows without writing in dry-run mode', async () => {
    const courseId = new Types.ObjectId();
    const matchingStudent = new Types.ObjectId();
    const mismatchedStudent = new Types.ObjectId();
    const orphanStudent = new Types.ObjectId();
    const existing = [
      summary(courseId, matchingStudent),
      summary(courseId, mismatchedStudent),
      summary(courseId, orphanStudent),
    ];
    const summaries = {
      listByCourse: vi.fn().mockResolvedValue(existing),
      deleteStudentCourse: vi.fn(),
    } as unknown as CourseProgressSummaryRepository;
    const refresh = {
      listStudentIds: vi
        .fn()
        .mockResolvedValue([
          matchingStudent.toString(),
          mismatchedStudent.toString(),
          new Types.ObjectId().toString(),
        ]),
      calculateStudent: vi.fn(async (_courseId: string, studentId: string) => {
        const calculated = summary(courseId, new Types.ObjectId(studentId));
        if (studentId === mismatchedStudent.toString()) calculated.processScore = 75;
        return calculated;
      }),
      refreshStudent: vi.fn(),
    } as unknown as ReportingRefreshService;

    const result = await new ReportingReconciliationService(summaries, refresh).reconcileCourse(
      courseId.toString(),
    );

    expect(result.repair).toBe(false);
    expect(result.differences.map(({ kind }) => kind).sort()).toEqual([
      'MISMATCH',
      'MISSING',
      'ORPHAN',
    ]);
    expect(refresh.refreshStudent).not.toHaveBeenCalled();
    expect(summaries.deleteStudentCourse).not.toHaveBeenCalled();
  });

  it('repairs only the read model when repair mode is explicit', async () => {
    const courseId = new Types.ObjectId();
    const activeStudent = new Types.ObjectId();
    const orphanStudent = new Types.ObjectId();
    const summaries = {
      listByCourse: vi.fn().mockResolvedValue([summary(courseId, orphanStudent)]),
      deleteStudentCourse: vi.fn().mockResolvedValue(undefined),
    } as unknown as CourseProgressSummaryRepository;
    const refresh = {
      listStudentIds: vi.fn().mockResolvedValue([activeStudent.toString()]),
      calculateStudent: vi.fn().mockResolvedValue(summary(courseId, activeStudent)),
      refreshStudent: vi.fn().mockResolvedValue(summary(courseId, activeStudent)),
    } as unknown as ReportingRefreshService;

    const result = await new ReportingReconciliationService(summaries, refresh).reconcileCourse(
      courseId.toString(),
      true,
    );

    expect(result).toMatchObject({ repair: true, differenceCount: 2 });
    expect(refresh.refreshStudent).toHaveBeenCalledWith(
      courseId.toString(),
      activeStudent.toString(),
    );
    expect(summaries.deleteStudentCourse).toHaveBeenCalledWith(courseId, orphanStudent);
  });
});
