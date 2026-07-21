import { AppError } from '../../shared/errors/app-error.js';
import type { CommonContentStatus, ScheduledContentState } from './content.types.js';

function isValidDate(value: Date): boolean {
  return !Number.isNaN(value.getTime());
}

export function assertFutureSchedule(
  scheduledPublishAt: Date | null,
  now: Date,
): asserts scheduledPublishAt is Date {
  if (!scheduledPublishAt || !isValidDate(scheduledPublishAt) || scheduledPublishAt <= now) {
    throw new AppError(422, 'VALIDATION_ERROR', 'Scheduled publish time must be in the future', [
      {
        field: 'scheduledPublishAt',
        code: 'FUTURE_DATE_REQUIRED',
        message: 'Scheduled publish time must be in the future',
      },
    ]);
  }
}

export function resolveEffectiveContentStatus(
  content: ScheduledContentState,
  now: Date,
): CommonContentStatus {
  if (content.status !== 'SCHEDULED') return content.status;

  if (!content.scheduledPublishAt || !isValidDate(content.scheduledPublishAt)) {
    throw new AppError(
      409,
      'CONTENT_STATE_CONFLICT',
      'Scheduled content is missing a valid publish time',
    );
  }

  return content.scheduledPublishAt <= now ? 'PUBLISHED' : 'SCHEDULED';
}
