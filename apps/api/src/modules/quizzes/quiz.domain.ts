import { AppError, type ErrorDetail } from '../../shared/errors/app-error.js';
import type { QuestionAggregate } from '../questions/question.types.js';
import type { QuizProjection } from './quiz.repository.js';
import type { QuizStatus } from '../learning-content/assessment.types.js';

const TRANSITIONS: Readonly<Record<QuizStatus, readonly QuizStatus[]>> = {
  DRAFT: ['SCHEDULED', 'PUBLISHED', 'ARCHIVED'],
  SCHEDULED: ['PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'],
  PUBLISHED: ['UNPUBLISHED', 'ARCHIVED'],
  UNPUBLISHED: ['PUBLISHED', 'ARCHIVED'],
  ARCHIVED: [],
};

export function resolveEffectiveQuizStatus(
  quiz: Pick<QuizProjection, 'status' | 'scheduledPublishAt'>,
  now: Date,
): QuizStatus {
  if (quiz.status !== 'SCHEDULED') return quiz.status;
  if (!quiz.scheduledPublishAt)
    throw new AppError(409, 'CONTENT_STATE_CONFLICT', 'Scheduled Quiz has no publish time');
  return quiz.scheduledPublishAt <= now ? 'PUBLISHED' : 'SCHEDULED';
}

export function assertQuizMutable(quiz: Pick<QuizProjection, 'status'>): void {
  if (!['DRAFT', 'UNPUBLISHED'].includes(quiz.status)) {
    throw new AppError(409, 'QUIZ_PUBLISH_LOCKED', 'Published or archived Quiz cannot be edited');
  }
}

export function assertQuizTransition(from: QuizStatus, to: QuizStatus): void {
  if (from === to)
    throw new AppError(409, 'INVALID_STATE_TRANSITION', 'Quiz already has the requested status');
  if (!TRANSITIONS[from].includes(to)) {
    throw new AppError(
      409,
      'INVALID_STATE_TRANSITION',
      `Quiz cannot transition from ${from} to ${to}`,
    );
  }
}

export function assertQuizPublishPrerequisites(
  quiz: QuizProjection,
  aggregate: QuestionAggregate,
  now: Date,
): void {
  const details: ErrorDetail[] = [];
  if (quiz.dueDate <= now)
    details.push({
      field: 'dueDate',
      code: 'FUTURE_DATE_REQUIRED',
      message: 'Quiz due date must be in the future',
    });
  if (quiz.availableFrom && quiz.availableFrom >= quiz.dueDate)
    details.push({
      field: 'availableFrom',
      code: 'INVALID_TIME_WINDOW',
      message: 'availableFrom must be before dueDate',
    });
  if (aggregate.activeCount < 1 || aggregate.activeCount > 100)
    details.push({
      field: 'questions',
      code: 'QUESTION_COUNT_OUT_OF_RANGE',
      message: 'Published Quiz requires 1 to 100 active Questions',
    });
  if (aggregate.maxScore < 1 || aggregate.maxScore > 1_000)
    details.push({
      field: 'maxScore',
      code: 'SCORE_OUT_OF_RANGE',
      message: 'Quiz max score must be between 1 and 1000',
    });
  if (aggregate.hasShortAnswer && quiz.resultReleasePolicy === 'IMMEDIATE')
    details.push({
      field: 'resultReleasePolicy',
      code: 'MANUAL_REVIEW_REQUIRED',
      message: 'Short-answer Quiz cannot release results immediately',
    });
  if (details.length > 0)
    throw new AppError(
      422,
      'QUIZ_PUBLISH_PREREQUISITES_FAILED',
      'Quiz is not ready to publish',
      details,
    );
}
