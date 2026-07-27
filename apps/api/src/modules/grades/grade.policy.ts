import { AppError } from '../../shared/errors/app-error.js';
import type { GradeRecord } from './grade.model.js';

export function assertGradeScore(score: number, maxScore: number): void {
  if (!Number.isInteger(score) || score < 0 || score > maxScore) {
    throw new AppError(
      422,
      'INVALID_GRADE_SCORE',
      `Grade score must be an integer between 0 and ${maxScore}`,
    );
  }
}

export function assertGradeRevision(
  grade: GradeRecord | null,
  expectedGradeRevision: number,
): void {
  const actual = grade?.revision ?? 0;
  if (actual !== expectedGradeRevision) {
    throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Grade was modified elsewhere');
  }
}

export function assertEvidenceRevision(actual: number, expected: number): void {
  if (actual !== expected) {
    throw new AppError(
      409,
      'SUBMISSION_REVISION_MISMATCH',
      'Submission changed after the selected grading evidence',
    );
  }
}
