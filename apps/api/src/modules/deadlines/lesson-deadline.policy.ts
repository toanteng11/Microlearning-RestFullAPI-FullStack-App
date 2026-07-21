import { AppError } from '../../shared/errors/app-error.js';
import type { CommonContentStatus } from '../learning-content/content.types.js';

export interface DeadlinePolicyInput {
  status: CommonContentStatus;
  currentDeadline: Date | null;
  nextDeadline: Date | null;
  reason?: string;
  now: Date;
}

export function assertDeadlineChangeAllowed(input: DeadlinePolicyInput): void {
  if (input.status === 'ARCHIVED') {
    throw new AppError(409, 'CONTENT_ARCHIVED', 'Archived Lesson deadline cannot be changed');
  }
  if (input.nextDeadline?.getTime() === input.currentDeadline?.getTime()) {
    throw new AppError(409, 'CONTENT_STATE_CONFLICT', 'Deadline is unchanged');
  }
  if (input.nextDeadline && input.nextDeadline.getTime() <= input.now.getTime()) {
    throw new AppError(422, 'VALIDATION_ERROR', 'Deadline must be in the future', [
      {
        field: 'completionDeadline',
        code: 'FUTURE_DATE_REQUIRED',
        message: 'Deadline must be in the future',
      },
    ]);
  }

  const published = input.status === 'PUBLISHED' || input.status === 'SCHEDULED';
  if (input.nextDeadline === null && published) {
    throw new AppError(
      409,
      'CONTENT_STATE_CONFLICT',
      'Published Lesson deadline cannot be cleared',
    );
  }
  if (
    published &&
    input.currentDeadline &&
    input.nextDeadline &&
    input.nextDeadline.getTime() < input.currentDeadline.getTime()
  ) {
    throw new AppError(
      409,
      'DEADLINE_SHORTENING_NOT_ALLOWED',
      'Published Lesson deadline cannot be shortened',
    );
  }
  if (published && (!input.reason || input.reason.length < 10)) {
    throw new AppError(
      422,
      'VALIDATION_ERROR',
      'Reason is required for a published deadline change',
      [{ field: 'reason', code: 'REQUIRED', message: 'Reason must contain 10 to 500 characters' }],
    );
  }
}
