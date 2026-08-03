import { Types } from 'mongoose';

import type { CourseProgressSummaryRepository } from './course-progress-summary.repository.js';
import type { ReportingRefreshService } from './reporting-refresh.service.js';

const COMPARED_FIELDS = [
  'requiredActivityCount',
  'completedRequiredCount',
  'progressPercentage',
  'processScore',
  'missingActivityCount',
  'lateActivityCount',
  'ungradedActivityCount',
  'returnedGradeCount',
  'gradePointsEarned',
  'gradePointsPossible',
  'returnedGradeAverage',
  'lastActiveAt',
  'courseCompleted',
] as const;

function comparable(value: unknown): unknown {
  return value instanceof Date ? value.toISOString() : value;
}

export class ReportingReconciliationService {
  constructor(
    private readonly summaries: CourseProgressSummaryRepository,
    private readonly refresh: ReportingRefreshService,
  ) {}

  async reconcileCourse(courseId: string, repair = false) {
    const existing = await this.summaries.listByCourse(new Types.ObjectId(courseId));
    const existingByStudent = new Map(existing.map((row) => [row.studentId.toString(), row]));
    const studentIds = await this.refresh.listStudentIds(courseId);
    const differences: Array<{
      studentId: string;
      fields: string[];
      kind: 'MISSING' | 'MISMATCH' | 'ORPHAN';
    }> = [];

    for (const studentId of studentIds) {
      const calculated = await this.refresh.calculateStudent(courseId, studentId);
      if (!calculated) continue;
      const before = existingByStudent.get(studentId);
      if (!before) {
        differences.push({ studentId, fields: [], kind: 'MISSING' });
        if (repair) await this.refresh.refreshStudent(courseId, studentId);
        continue;
      }
      const fields = COMPARED_FIELDS.filter(
        (field) => comparable(before[field]) !== comparable(calculated[field]),
      );
      if (fields.length > 0) {
        differences.push({ studentId, fields: [...fields], kind: 'MISMATCH' });
        if (repair) await this.refresh.refreshStudent(courseId, studentId);
      }
      existingByStudent.delete(studentId);
    }
    for (const orphan of existingByStudent.values()) {
      differences.push({ studentId: orphan.studentId.toString(), fields: [], kind: 'ORPHAN' });
      if (repair) {
        await this.summaries.deleteStudentCourse(orphan.courseId, orphan.studentId);
      }
    }

    return {
      courseId,
      repair,
      scanned: Math.max(existing.length, studentIds.length),
      differenceCount: differences.length,
      differences,
    };
  }
}
