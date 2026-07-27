import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';

import {
  resolveQuizEligibility,
  type QuizEligibility,
} from '../src/modules/quiz-attempts/quiz-eligibility.policy.js';
import {
  isAttemptExpired,
  resolveAttemptExpiry,
} from '../src/modules/quiz-attempts/quiz-timeout.policy.js';
import type { QuizProjection } from '../src/modules/quizzes/quiz.repository.js';

function quizFixture(overrides: Partial<QuizProjection> = {}): QuizProjection {
  const createdAt = new Date('2026-08-01T00:00:00.000Z');
  return {
    _id: new Types.ObjectId(),
    classroomId: new Types.ObjectId(),
    courseId: new Types.ObjectId(),
    moduleId: null,
    title: 'Quiz eligibility',
    instruction: 'Verify server-side availability.',
    isRequired: true,
    status: 'PUBLISHED',
    availableFrom: null,
    dueDate: new Date('2026-08-10T00:00:00.000Z'),
    attemptLimit: 2,
    timeLimitMinutes: 15,
    resultReleasePolicy: 'IMMEDIATE',
    scorePolicy: 'HIGHEST',
    displayOrder: 0,
    contentRevision: 2,
    questionRevision: 1,
    publishedRevision: 2,
    maxScore: 10,
    scheduledPublishAt: null,
    publishedAt: createdAt,
    unpublishedAt: null,
    archivedAt: null,
    createdBy: new Types.ObjectId(),
    updatedBy: new Types.ObjectId(),
    schemaVersion: 1,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

function expectEligibility(
  actual: QuizEligibility,
  canStart: boolean,
  unavailableReason: QuizEligibility['unavailableReason'],
) {
  expect(actual).toEqual({ canStart, unavailableReason });
}

describe('Phase 05 Quiz eligibility and timeout policies', () => {
  it('rejects an unpublished or not-yet-available Quiz', () => {
    const now = new Date('2026-08-05T00:00:00.000Z');
    expectEligibility(
      resolveQuizEligibility(quizFixture({ status: 'DRAFT' }), 0, false, now),
      false,
      'QUIZ_NOT_AVAILABLE',
    );
    expectEligibility(
      resolveQuizEligibility(
        quizFixture({ availableFrom: new Date('2026-08-06T00:00:00.000Z') }),
        0,
        false,
        now,
      ),
      false,
      'QUIZ_NOT_AVAILABLE',
    );
  });

  it('treats the exact due instant as closed', () => {
    const dueDate = new Date('2026-08-10T00:00:00.000Z');
    expectEligibility(
      resolveQuizEligibility(quizFixture({ dueDate }), 0, false, dueDate),
      false,
      'QUIZ_DUE_PASSED',
    );
  });

  it('enforces the attempt limit while still allowing an active Attempt to resume', () => {
    const quiz = quizFixture();
    const now = new Date('2026-08-05T00:00:00.000Z');
    expectEligibility(
      resolveQuizEligibility(quiz, quiz.attemptLimit, false, now),
      false,
      'ATTEMPT_LIMIT_REACHED',
    );
    expectEligibility(resolveQuizEligibility(quiz, quiz.attemptLimit, true, now), true, null);
  });

  it('uses the earliest server deadline and expires at the exact boundary', () => {
    const startedAt = new Date('2026-08-05T00:00:00.000Z');
    const dueDate = new Date('2026-08-05T00:10:00.000Z');
    const expiry = resolveAttemptExpiry(startedAt, dueDate, 15);
    expect(expiry).toEqual(dueDate);
    expect(isAttemptExpired(expiry, new Date('2026-08-05T00:09:59.999Z'))).toBe(false);
    expect(isAttemptExpired(expiry, dueDate)).toBe(true);
    expect(resolveAttemptExpiry(startedAt, dueDate, null)).toEqual(dueDate);
  });
});
