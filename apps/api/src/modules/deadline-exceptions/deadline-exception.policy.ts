import { AppError } from '../../shared/errors/app-error.js';
import type { DeadlineExceptionRecord } from './deadline-exception.model.js';

export function assertDeadlineExceptionRevision(
  current: DeadlineExceptionRecord | null,
  expectedRevision: number,
): void {
  const actual = current?.revision ?? 0;
  if (actual !== expectedRevision)
    throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Deadline exception was modified elsewhere');
}

export function assertExtensionAllowed(
  deadline: Date,
  currentEffectiveDeadline: Date,
  now: Date,
): void {
  if (deadline <= now)
    throw new AppError(422, 'DEADLINE_IN_PAST', 'Deadline must be in the future');
  if (deadline < currentEffectiveDeadline)
    throw new AppError(
      409,
      'DEADLINE_SHORTENING_DENIED',
      'A Student deadline exception can only extend the effective deadline',
    );
}

export function assertRevokeAllowed(defaultDeadline: Date, now: Date): void {
  if (now > defaultDeadline)
    throw new AppError(
      409,
      'DEADLINE_SHORTENING_DENIED',
      'The exception cannot be revoked after the default deadline',
    );
}
