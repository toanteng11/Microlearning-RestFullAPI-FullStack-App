import type {
  AssignmentStatus,
  AttemptStatus,
  QuizStatus,
  SubmissionStatus,
} from '../assessment.types';
import {
  assignmentStatusLabels,
  attemptStatusLabels,
  quizStatusLabels,
  submissionStatusLabels,
} from '../assessment-format';

type ActivityStatus = QuizStatus | AssignmentStatus | AttemptStatus | SubmissionStatus;

export function ActivityStatusBadge({ status }: { status: ActivityStatus }) {
  const label =
    (quizStatusLabels as Partial<Record<ActivityStatus, string>>)[status] ??
    (assignmentStatusLabels as Partial<Record<ActivityStatus, string>>)[status] ??
    (attemptStatusLabels as Partial<Record<ActivityStatus, string>>)[status] ??
    (submissionStatusLabels as Partial<Record<ActivityStatus, string>>)[status] ??
    status;
  return (
    <span className={`assessment-status assessment-status--${status.toLowerCase()}`}>{label}</span>
  );
}
