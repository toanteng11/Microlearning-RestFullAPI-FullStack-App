import type { AssessmentFeatureFlagConfig } from '../../shared/config/environment.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { AssignmentRecord } from '../assignments/assignment.model.js';
import type { SubmissionContentPatch } from './submission.types.js';

export function assertSubmissionContent(
  assignment: AssignmentRecord,
  content: SubmissionContentPatch,
  flags: AssessmentFeatureFlagConfig,
  requireComplete: boolean,
): void {
  if (!assignment.allowedSubmissionTypes.includes(content.submissionType))
    throw new AppError(422, 'SUBMISSION_METHOD_NOT_ALLOWED', 'Submission method is not enabled');
  if (content.submissionType === 'LINK' && !flags.assignmentLinkSubmissionEnabled)
    throw new AppError(409, 'FEATURE_NOT_ENABLED', 'LINK submission is disabled');
  if (content.submissionType === 'MARK_DONE' && !flags.assignmentMarkDoneEnabled)
    throw new AppError(409, 'FEATURE_NOT_ENABLED', 'MARK_DONE submission is disabled');

  if (content.submissionType === 'TEXT') {
    if (content.links.length > 0 || content.markDone)
      throw new AppError(
        422,
        'SUBMISSION_METHOD_NOT_ALLOWED',
        'TEXT submission contains incompatible fields',
      );
    if (requireComplete && !content.textAnswer?.trim())
      throw new AppError(422, 'SUBMISSION_INCOMPLETE', 'Text answer is required before turn-in');
  }
  if (content.submissionType === 'LINK') {
    if (content.textAnswer || content.markDone)
      throw new AppError(
        422,
        'SUBMISSION_METHOD_NOT_ALLOWED',
        'LINK submission contains incompatible fields',
      );
    for (const link of content.links) {
      const parsed = new URL(link);
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password)
        throw new AppError(422, 'SUBMISSION_METHOD_NOT_ALLOWED', 'Links must use safe HTTPS URLs');
    }
    if (requireComplete && content.links.length === 0)
      throw new AppError(
        422,
        'SUBMISSION_INCOMPLETE',
        'At least one link is required before turn-in',
      );
  }
  if (content.submissionType === 'MARK_DONE') {
    if (content.textAnswer || content.links.length > 0)
      throw new AppError(
        422,
        'SUBMISSION_METHOD_NOT_ALLOWED',
        'MARK_DONE submission contains incompatible fields',
      );
    if (requireComplete && !content.markDone)
      throw new AppError(422, 'SUBMISSION_INCOMPLETE', 'Completion confirmation is required');
  }
}

export function assertAssignmentAcceptsSubmission(assignment: AssignmentRecord, now: Date): void {
  const effectiveStatus =
    assignment.status === 'SCHEDULED' &&
    assignment.scheduledPublishAt &&
    assignment.scheduledPublishAt <= now
      ? 'PUBLISHED'
      : assignment.status;
  if (effectiveStatus === 'CLOSED' || effectiveStatus === 'ARCHIVED')
    throw new AppError(409, 'ASSIGNMENT_CLOSED', 'Assignment is closed');
  if (
    effectiveStatus !== 'PUBLISHED' ||
    (assignment.availableFrom && now < assignment.availableFrom)
  )
    throw new AppError(409, 'ASSIGNMENT_NOT_AVAILABLE', 'Assignment is not available');
}

export function isLateSubmission(dueDate: Date, now: Date): boolean {
  return now > dueDate;
}
