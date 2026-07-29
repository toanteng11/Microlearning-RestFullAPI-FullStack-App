import type {
  ReportingActivityStatus,
  ReportingGrade,
  ReportingGradingStatus,
} from './reporting.types.js';

export interface GradebookCellState {
  completionStatus: ReportingActivityStatus;
  gradingStatus: ReportingGradingStatus;
  score: number | null;
  maxScore: number | null;
}

export function resolveGradebookCell(input: {
  completionStatus: ReportingActivityStatus;
  gradable: boolean;
  terminalEvidence: boolean;
  grade: ReportingGrade | null;
}): GradebookCellState {
  let gradingStatus: ReportingGradingStatus;
  if (!input.gradable) gradingStatus = 'NOT_GRADABLE';
  else if (!input.terminalEvidence) gradingStatus = 'NOT_READY';
  else if (!input.grade) gradingStatus = 'AWAITING_GRADE';
  else gradingStatus = input.grade.status;

  return {
    completionStatus: input.completionStatus,
    gradingStatus,
    score: input.grade?.score ?? null,
    maxScore: input.grade?.maxScore ?? null,
  };
}
