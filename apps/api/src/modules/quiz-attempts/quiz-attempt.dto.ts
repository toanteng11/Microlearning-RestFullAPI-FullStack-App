import type { QuizAttemptRecord } from './quiz-attempt.model.js';

export function toStudentAttemptDto(attempt: QuizAttemptRecord) {
  const released = attempt.releasedAt !== null;
  return {
    id: attempt._id.toString(),
    quizId: attempt.quizId.toString(),
    attemptNumber: attempt.attemptNumber,
    status: attempt.status,
    assessmentRevision: attempt.assessmentRevision,
    quiz: { ...attempt.quizSnapshot },
    questions: attempt.questionSnapshots.map(({ scoring: _scoring, ...question }) => ({
      ...question,
      questionId: question.questionId.toString(),
    })),
    answers: attempt.answers.map((answer) => ({
      questionId: answer.questionId.toString(),
      selectedOptionIds: [...answer.selectedOptionIds],
      textAnswer: answer.textAnswer,
      savedAt: answer.savedAt.toISOString(),
    })),
    startedAt: attempt.startedAt.toISOString(),
    expiresAt: attempt.expiresAt.toISOString(),
    lastSavedAt: attempt.lastSavedAt?.toISOString() ?? null,
    submittedAt: attempt.submittedAt?.toISOString() ?? null,
    attemptRevision: attempt.attemptRevision,
    progress: {
      answeredCount: attempt.answers.filter(
        (answer) => answer.selectedOptionIds.length > 0 || Boolean(answer.textAnswer?.trim()),
      ).length,
      totalCount: attempt.questionSnapshots.length,
    },
    resultPending:
      attempt.status === 'NEEDS_REVIEW' || (!released && attempt.status !== 'IN_PROGRESS'),
    result: released
      ? {
          score: attempt.totalScore,
          maxScore: attempt.maxScore,
          gradedAt: attempt.gradedAt?.toISOString() ?? null,
          releasedAt: attempt.releasedAt?.toISOString() ?? null,
        }
      : null,
  };
}

export function toStudentAttemptSummaryDto(attempt: QuizAttemptRecord) {
  return {
    id: attempt._id.toString(),
    quizId: attempt.quizId.toString(),
    attemptNumber: attempt.attemptNumber,
    status: attempt.status,
    startedAt: attempt.startedAt.toISOString(),
    submittedAt: attempt.submittedAt?.toISOString() ?? null,
    resultAvailable: attempt.releasedAt !== null,
    score: attempt.releasedAt ? attempt.totalScore : null,
    maxScore: attempt.maxScore,
  };
}

export function toStudentQuizResultDto(attempt: QuizAttemptRecord) {
  const released = attempt.releasedAt !== null;
  return {
    attemptId: attempt._id.toString(),
    quizId: attempt.quizId.toString(),
    title: attempt.quizSnapshot.title,
    attemptNumber: attempt.attemptNumber,
    status: attempt.status,
    submittedAt: attempt.submittedAt?.toISOString() ?? null,
    resultPending: !released,
    result: released
      ? {
          score: attempt.totalScore,
          maxScore: attempt.maxScore,
          gradedAt: attempt.gradedAt?.toISOString() ?? null,
          releasedAt: attempt.releasedAt?.toISOString() ?? null,
        }
      : null,
  };
}
