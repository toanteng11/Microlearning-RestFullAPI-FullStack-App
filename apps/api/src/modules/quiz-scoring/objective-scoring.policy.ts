import type { ObjectiveScoringResult, ScoringAnswer, ScoringQuestion } from './scoring.types.js';

function normalizedSet(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  const normalizedLeft = normalizedSet(left);
  const normalizedRight = normalizedSet(right);
  return (
    normalizedLeft.length === normalizedRight.length &&
    normalizedLeft.every((value, index) => value === normalizedRight[index])
  );
}

export function scoreObjectiveAnswers(
  questions: readonly ScoringQuestion[],
  answers: readonly ScoringAnswer[],
): ObjectiveScoringResult {
  const answerByQuestion = new Map(answers.map((answer) => [answer.questionId, answer]));
  const scored = questions.map((question) => {
    const answer = answerByQuestion.get(question.questionId);
    const answered = Boolean(
      answer && (answer.selectedOptionIds.length > 0 || Boolean(answer.textAnswer?.trim())),
    );
    if (question.type === 'SHORT_ANSWER') {
      return {
        questionId: question.questionId,
        awardedPoints: 0,
        requiresManualReview: true,
        answered,
      };
    }
    if (!answer) {
      return {
        questionId: question.questionId,
        awardedPoints: 0,
        requiresManualReview: false,
        answered: false,
      };
    }
    const correctIds =
      question.type === 'TRUE_FALSE'
        ? [String(question.correctBoolean)]
        : question.correctOptionIds;
    return {
      questionId: question.questionId,
      awardedPoints: sameSet(answer.selectedOptionIds, correctIds) ? question.points : 0,
      requiresManualReview: false,
      answered,
    };
  });
  return {
    objectiveScore: scored.reduce((sum, answer) => sum + answer.awardedPoints, 0),
    requiresManualReview: scored.some((answer) => answer.requiresManualReview),
    answers: scored,
  };
}
