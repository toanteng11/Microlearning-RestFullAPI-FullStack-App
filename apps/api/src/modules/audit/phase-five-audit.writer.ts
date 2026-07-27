import type { ClientSession } from 'mongoose';

import { AuditLogRepository, type AuditInput } from './audit-log.repository.js';

export const PHASE_FIVE_AUDIT_ACTIONS = [
  'QUIZ_CREATED',
  'QUIZ_UPDATED',
  'QUIZ_STATUS_CHANGED',
  'QUESTION_CREATED',
  'QUESTION_UPDATED',
  'QUESTION_ARCHIVED',
  'QUESTIONS_REORDERED',
  'QUESTION_MEDIA_CHANGED',
  'ATTEMPT_STARTED',
  'ATTEMPT_FINALIZED',
  'ASSIGNMENT_CREATED',
  'ASSIGNMENT_UPDATED',
  'ASSIGNMENT_STATUS_CHANGED',
  'SUBMISSION_SAVED',
  'SUBMISSION_TURNED_IN',
  'SUBMISSION_UNSUBMITTED',
  'SUBMISSION_RESUBMITTED',
  'QUIZ_REVIEW_SAVED',
  'QUIZ_REVIEW_FINALIZED',
  'QUIZ_RESULT_RELEASED',
  'QUIZ_REGRADED',
  'GRADE_SAVED',
  'WORK_RETURNED',
  'GRADE_REVISED',
  'DEADLINE_EXCEPTION_SET',
  'DEADLINE_EXCEPTION_REVOKED',
] as const;
export type PhaseFiveAuditAction = (typeof PHASE_FIVE_AUDIT_ACTIONS)[number];

const RESOURCE_TYPE_BY_ACTION: Record<
  PhaseFiveAuditAction,
  'Quiz' | 'Question' | 'QuizAttempt' | 'Assignment' | 'Submission' | 'Grade' | 'DeadlineException'
> = {
  QUIZ_CREATED: 'Quiz',
  QUIZ_UPDATED: 'Quiz',
  QUIZ_STATUS_CHANGED: 'Quiz',
  QUESTION_CREATED: 'Question',
  QUESTION_UPDATED: 'Question',
  QUESTION_ARCHIVED: 'Question',
  QUESTIONS_REORDERED: 'Quiz',
  QUESTION_MEDIA_CHANGED: 'Question',
  ATTEMPT_STARTED: 'QuizAttempt',
  ATTEMPT_FINALIZED: 'QuizAttempt',
  ASSIGNMENT_CREATED: 'Assignment',
  ASSIGNMENT_UPDATED: 'Assignment',
  ASSIGNMENT_STATUS_CHANGED: 'Assignment',
  SUBMISSION_SAVED: 'Submission',
  SUBMISSION_TURNED_IN: 'Submission',
  SUBMISSION_UNSUBMITTED: 'Submission',
  SUBMISSION_RESUBMITTED: 'Submission',
  QUIZ_REVIEW_SAVED: 'QuizAttempt',
  QUIZ_REVIEW_FINALIZED: 'QuizAttempt',
  QUIZ_RESULT_RELEASED: 'QuizAttempt',
  QUIZ_REGRADED: 'QuizAttempt',
  GRADE_SAVED: 'Grade',
  WORK_RETURNED: 'Grade',
  GRADE_REVISED: 'Grade',
  DEADLINE_EXCEPTION_SET: 'DeadlineException',
  DEADLINE_EXCEPTION_REVOKED: 'DeadlineException',
};
const SAFE_STATE_FIELDS = new Set([
  'moduleId',
  'title',
  'status',
  'isRequired',
  'availableFrom',
  'dueDate',
  'attemptLimit',
  'timeLimitMinutes',
  'resultReleasePolicy',
  'scorePolicy',
  'displayOrder',
  'contentRevision',
  'questionRevision',
  'publishedRevision',
  'maxScore',
  'scheduledPublishAt',
  'archivedAt',
  'type',
  'points',
  'version',
  'hasMedia',
  'revision',
  'attemptRevision',
  'attemptNumber',
  'objectiveScore',
  'totalScore',
  'submissionType',
  'isLate',
  'reviewRevision',
  'manualScore',
  'gradeRevision',
  'gradeStatus',
  'deadline',
  'active',
  'exceptionRevision',
]);
const SAFE_METADATA_FIELDS = new Set([
  'classroomId',
  'courseId',
  'quizId',
  'questionCount',
  'fromQuestionRevision',
  'toQuestionRevision',
  'fromContentRevision',
  'toContentRevision',
  'assignmentId',
  'attemptNumber',
  'answeredCount',
  'resultReleased',
  'submissionRevision',
  'activityId',
  'activityType',
  'evidenceRevision',
]);

function pick(value: Record<string, unknown> | null | undefined, fields: ReadonlySet<string>) {
  if (!value) return null;
  const safe = Object.entries(value).filter(([key]) => fields.has(key));
  return safe.length === 0 ? null : Object.fromEntries(safe);
}

export type PhaseFiveAuditCommand = Omit<
  AuditInput,
  'action' | 'resourceType' | 'oldValue' | 'newValue' | 'metadata'
> & {
  action: PhaseFiveAuditAction;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
};

export function buildPhaseFiveAuditInput(command: PhaseFiveAuditCommand): AuditInput {
  if (!PHASE_FIVE_AUDIT_ACTIONS.includes(command.action))
    throw new Error('Unsupported Phase 05 audit action');
  const result: AuditInput = {
    actorRole: command.actorRole,
    action: command.action,
    resourceType: RESOURCE_TYPE_BY_ACTION[command.action],
    resourceId: command.resourceId,
    requestId: command.requestId,
    oldValue: pick(command.oldValue, SAFE_STATE_FIELDS),
    newValue: pick(command.newValue, SAFE_STATE_FIELDS),
    metadata: pick(command.metadata, SAFE_METADATA_FIELDS),
  };
  if (command.actorId !== undefined) result.actorId = command.actorId;
  if (command.reason !== undefined) result.reason = command.reason;
  return result;
}

export class PhaseFiveAuditWriter {
  constructor(private readonly audits = new AuditLogRepository()) {}
  append(command: PhaseFiveAuditCommand, session?: ClientSession) {
    return this.audits.append(buildPhaseFiveAuditInput(command), session);
  }
}
