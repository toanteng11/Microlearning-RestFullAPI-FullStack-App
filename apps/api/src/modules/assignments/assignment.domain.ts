import type { AssessmentFeatureFlagConfig } from '../../shared/config/environment.js';
import { AppError, type ErrorDetail } from '../../shared/errors/app-error.js';
import type { AssignmentStatus } from '../learning-content/assessment.types.js';
import type { AssignmentRecord } from './assignment.model.js';
import type { SubmissionType } from './assignment.types.js';

const TRANSITIONS: Readonly<Record<AssignmentStatus, readonly AssignmentStatus[]>> = {
  DRAFT: ['SCHEDULED', 'PUBLISHED', 'ARCHIVED'],
  SCHEDULED: ['PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'],
  PUBLISHED: ['UNPUBLISHED', 'CLOSED', 'ARCHIVED'],
  UNPUBLISHED: ['PUBLISHED', 'ARCHIVED'],
  CLOSED: ['PUBLISHED', 'ARCHIVED'],
  ARCHIVED: [],
};

export function resolveEffectiveAssignmentStatus(
  assignment: Pick<AssignmentRecord, 'status' | 'scheduledPublishAt'>,
  now: Date,
): AssignmentStatus {
  if (assignment.status !== 'SCHEDULED') return assignment.status;
  if (!assignment.scheduledPublishAt)
    throw new AppError(409, 'CONTENT_STATE_CONFLICT', 'Scheduled Assignment has no publish time');
  return assignment.scheduledPublishAt <= now ? 'PUBLISHED' : 'SCHEDULED';
}

export function assertAssignmentTransition(from: AssignmentStatus, to: AssignmentStatus): void {
  if (from === to || !TRANSITIONS[from].includes(to))
    throw new AppError(
      409,
      'INVALID_STATE_TRANSITION',
      `Assignment cannot transition from ${from} to ${to}`,
    );
}

export function assertAssignmentMutable(status: AssignmentStatus): void {
  if (!['DRAFT', 'UNPUBLISHED'].includes(status))
    throw new AppError(409, 'ASSIGNMENT_PUBLISH_LOCKED', 'Assignment is not editable');
}

export function assertSubmissionMethods(
  methods: readonly SubmissionType[],
  flags: AssessmentFeatureFlagConfig,
): void {
  const unique = new Set(methods);
  if (!unique.has('TEXT') || unique.size !== methods.length)
    throw new AppError(422, 'SUBMISSION_METHOD_NOT_ALLOWED', 'TEXT must be enabled exactly once');
  if (unique.has('LINK') && !flags.assignmentLinkSubmissionEnabled)
    throw new AppError(409, 'FEATURE_NOT_ENABLED', 'LINK submission is disabled');
  if (unique.has('MARK_DONE') && !flags.assignmentMarkDoneEnabled)
    throw new AppError(409, 'FEATURE_NOT_ENABLED', 'MARK_DONE submission is disabled');
}

export function assertAssignmentWindow(
  availableFrom: Date | null,
  dueDate: Date,
  now: Date,
  requireFutureDue = true,
): void {
  const details: ErrorDetail[] = [];
  if (requireFutureDue && dueDate <= now)
    details.push({
      field: 'dueDate',
      code: 'FUTURE_DATE_REQUIRED',
      message: 'Due date must be in the future',
    });
  if (availableFrom && availableFrom >= dueDate)
    details.push({
      field: 'availableFrom',
      code: 'INVALID_TIME_WINDOW',
      message: 'availableFrom must precede dueDate',
    });
  if (details.length)
    throw new AppError(
      422,
      'ASSIGNMENT_PUBLISH_PREREQUISITES_FAILED',
      'Assignment timing is invalid',
      details,
    );
}

export function assertAssignmentPublishPrerequisites(
  assignment: AssignmentRecord,
  flags: AssessmentFeatureFlagConfig,
  now: Date,
): void {
  assertSubmissionMethods(assignment.allowedSubmissionTypes, flags);
  assertAssignmentWindow(
    assignment.availableFrom,
    assignment.dueDate,
    now,
    assignment.publishedAt === null,
  );
}
