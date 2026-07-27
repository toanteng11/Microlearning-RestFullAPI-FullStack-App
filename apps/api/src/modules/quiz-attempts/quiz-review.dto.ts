import type { QuizAttemptRecord } from './quiz-attempt.model.js';

export function toTeacherAttemptReviewDto(attempt: QuizAttemptRecord) {
  const answerByQuestion = new Map(
    attempt.answers.map((answer) => [answer.questionId.toString(), answer]),
  );
  const reviewByQuestion = new Map(
    attempt.manualReviews.map((review) => [review.questionId.toString(), review]),
  );
  return {
    id: attempt._id.toString(),
    quizId: attempt.quizId.toString(),
    studentId: attempt.studentId.toString(),
    classroomId: attempt.classroomId.toString(),
    courseId: attempt.courseId.toString(),
    attemptNumber: attempt.attemptNumber,
    status: attempt.status,
    title: attempt.quizSnapshot.title,
    objectiveScore: attempt.objectiveScore,
    manualScore: attempt.manualScore,
    totalScore: attempt.totalScore,
    maxScore: attempt.maxScore,
    attemptRevision: attempt.attemptRevision,
    reviewRevision: attempt.reviewRevision,
    submittedAt: attempt.submittedAt?.toISOString() ?? null,
    gradedAt: attempt.gradedAt?.toISOString() ?? null,
    releasedAt: attempt.releasedAt?.toISOString() ?? null,
    questions: attempt.questionSnapshots.map((question) => {
      const answer = answerByQuestion.get(question.questionId.toString());
      const review = reviewByQuestion.get(question.questionId.toString());
      return {
        questionId: question.questionId.toString(),
        type: question.type,
        prompt: question.prompt,
        points: question.points,
        rubric: question.scoring.rubric,
        answer: answer
          ? {
              selectedOptionIds: [...answer.selectedOptionIds],
              textAnswer: answer.textAnswer,
              savedAt: answer.savedAt.toISOString(),
            }
          : null,
        review: review
          ? {
              awardedPoints: review.awardedPoints,
              feedback: review.feedback,
              reviewedAt: review.reviewedAt.toISOString(),
            }
          : null,
      };
    }),
  };
}
