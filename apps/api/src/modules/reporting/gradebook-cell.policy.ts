import type {
  ReportingActivityStatus,
  ReportingGrade,
  ReportingGradingStatus,
} from './reporting.types.js';

export interface GradebookCellState {
  completionStatus: ReportingActivityStatus;
  gradingStatus: ReportingGradingStatus;
  displayStatus: ReportingActivityStatus | 'AWAITING_GRADE' | 'DRAFT_GRADE' | 'RETURNED';
  score: number | null;
  maxScore: number | null;
}

export function resolveGradebookDisplayStatus(
  completionStatus: ReportingActivityStatus,
  gradingStatus: ReportingGradingStatus,
): GradebookCellState['displayStatus'] {
  if (gradingStatus === 'RETURNED') return 'RETURNED';
  if (gradingStatus === 'DRAFT') return 'DRAFT_GRADE';
  if (gradingStatus === 'AWAITING_GRADE') return 'AWAITING_GRADE';
  return completionStatus;
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
    displayStatus: resolveGradebookDisplayStatus(input.completionStatus, gradingStatus),
    score: input.grade?.score ?? null,
    maxScore: input.grade?.maxScore ?? null,
  };
}
