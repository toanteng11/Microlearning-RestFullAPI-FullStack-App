import { AppError } from '../../shared/errors/app-error.js';
import type { QuizProjection } from '../quizzes/quiz.repository.js';
import { resolveEffectiveQuizStatus } from '../quizzes/quiz.domain.js';

export interface QuizEligibility {
  canStart: boolean;
  unavailableReason: 'QUIZ_NOT_AVAILABLE' | 'QUIZ_DUE_PASSED' | 'ATTEMPT_LIMIT_REACHED' | null;
}

export function resolveQuizEligibility(
  quiz: QuizProjection,
  attemptsUsed: number,
  hasActiveAttempt: boolean,
  now: Date,
): QuizEligibility {
  if (
    resolveEffectiveQuizStatus(quiz, now) !== 'PUBLISHED' ||
    (quiz.availableFrom && now < quiz.availableFrom)
  ) {
    return { canStart: false, unavailableReason: 'QUIZ_NOT_AVAILABLE' };
  }
  if (now >= quiz.dueDate) return { canStart: false, unavailableReason: 'QUIZ_DUE_PASSED' };
  if (!hasActiveAttempt && attemptsUsed >= quiz.attemptLimit) {
    return { canStart: false, unavailableReason: 'ATTEMPT_LIMIT_REACHED' };
  }
  return { canStart: true, unavailableReason: null };
}

export function assertQuizEligible(eligibility: QuizEligibility): void {
  if (!eligibility.unavailableReason) return;
  const messages = {
    QUIZ_NOT_AVAILABLE: 'Quiz is not available',
    QUIZ_DUE_PASSED: 'Quiz deadline has passed',
    ATTEMPT_LIMIT_REACHED: 'Quiz attempt limit has been reached',
  } as const;
  throw new AppError(409, eligibility.unavailableReason, messages[eligibility.unavailableReason]);
}
