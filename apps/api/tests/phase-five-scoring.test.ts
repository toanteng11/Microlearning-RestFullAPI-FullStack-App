import { describe, expect, it } from 'vitest';

import { scoreObjectiveAnswers } from '../src/modules/quiz-scoring/objective-scoring.policy.js';

const questions = [
  {
    questionId: 'single',
    type: 'SINGLE_CHOICE' as const,
    points: 2,
    correctOptionIds: ['b'],
    correctBoolean: null,
  },
  {
    questionId: 'multiple',
    type: 'MULTIPLE_CHOICE' as const,
    points: 3,
    correctOptionIds: ['a', 'c'],
    correctBoolean: null,
  },
  {
    questionId: 'boolean',
    type: 'TRUE_FALSE' as const,
    points: 1,
    correctOptionIds: [],
    correctBoolean: true,
  },
  {
    questionId: 'manual',
    type: 'SHORT_ANSWER' as const,
    points: 4,
    correctOptionIds: [],
    correctBoolean: null,
  },
];

describe('Phase 05 objective scoring policy', () => {
  it('scores single choice, exact multiple set and true/false with integer points', () => {
    const result = scoreObjectiveAnswers(questions, [
      { questionId: 'single', selectedOptionIds: ['b'], textAnswer: null },
      { questionId: 'multiple', selectedOptionIds: ['c', 'a'], textAnswer: null },
      { questionId: 'boolean', selectedOptionIds: ['true'], textAnswer: null },
      { questionId: 'manual', selectedOptionIds: [], textAnswer: 'Idempotent retry.' },
    ]);
    expect(result.objectiveScore).toBe(6);
    expect(result.requiresManualReview).toBe(true);
    expect(result.answers.map((answer) => answer.awardedPoints)).toEqual([2, 3, 1, 0]);
  });

  it('awards no partial multiple-choice credit and normalizes duplicate-free order', () => {
    const partial = scoreObjectiveAnswers(
      [questions[1]!],
      [{ questionId: 'multiple', selectedOptionIds: ['a'], textAnswer: null }],
    );
    const extra = scoreObjectiveAnswers(
      [questions[1]!],
      [{ questionId: 'multiple', selectedOptionIds: ['a', 'c', 'x'], textAnswer: null }],
    );
    expect(partial.objectiveScore).toBe(0);
    expect(extra.objectiveScore).toBe(0);
  });

  it('keeps an unanswered short-answer Question in manual review state', () => {
    const result = scoreObjectiveAnswers([questions[3]!], []);
    expect(result).toMatchObject({ objectiveScore: 0, requiresManualReview: true });
  });
});
