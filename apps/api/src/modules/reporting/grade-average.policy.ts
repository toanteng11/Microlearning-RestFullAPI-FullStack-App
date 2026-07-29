import { roundHalfUp } from './metric-definition.policy.js';
import type { ReportingGrade } from './reporting.types.js';

export function calculateReturnedGradeAverage(grades: readonly ReportingGrade[]) {
  const eligible = grades.filter(
    (grade) =>
      grade.status === 'RETURNED' &&
      grade.maxScore > 0 &&
      grade.score >= 0 &&
      grade.score <= grade.maxScore,
  );
  const gradePointsEarned = eligible.reduce((sum, grade) => sum + grade.score, 0);
  const gradePointsPossible = eligible.reduce((sum, grade) => sum + grade.maxScore, 0);
  return {
    returnedGradeCount: eligible.length,
    gradePointsEarned,
    gradePointsPossible,
    returnedGradeAverage:
      gradePointsPossible === 0
        ? null
        : roundHalfUp((gradePointsEarned / gradePointsPossible) * 100),
  };
}
