import type { QuestionProjection } from './question.repository.js';

function mediaDto(question: QuestionProjection) {
  return question.media ? { ...question.media } : null;
}

export function toTeacherQuestionDto(question: QuestionProjection) {
  return {
    id: question._id.toString(),
    quizId: question.quizId.toString(),
    type: question.type,
    prompt: question.prompt,
    points: question.points,
    isRequired: question.isRequired,
    options: question.options.map((option) => ({ ...option })),
    correctOptionIds: [...question.correctOptionIds],
    correctBoolean: question.correctBoolean,
    rubric: question.rubric,
    explanation: question.explanation,
    media: mediaDto(question),
    displayOrder: question.displayOrder,
    version: question.version,
    status: question.status,
    createdAt: question.createdAt.toISOString(),
    updatedAt: question.updatedAt.toISOString(),
    allowedActions:
      question.status === 'ACTIVE'
        ? ['EDIT', 'MOVE_UP', 'MOVE_DOWN', 'ARCHIVE', 'SET_MEDIA', 'REMOVE_MEDIA']
        : [],
  };
}

export function toStudentQuestionDto(question: QuestionProjection) {
  return {
    id: question._id.toString(),
    type: question.type,
    prompt: question.prompt,
    points: question.points,
    isRequired: question.isRequired,
    options: question.options.map((option) => ({
      id: option.id,
      label: option.label,
      displayOrder: option.displayOrder,
    })),
    media: mediaDto(question),
    displayOrder: question.displayOrder,
  };
}

export function toQuestionAuditValue(question: QuestionProjection) {
  return {
    type: question.type,
    points: question.points,
    isRequired: question.isRequired,
    displayOrder: question.displayOrder,
    version: question.version,
    status: question.status,
    hasMedia: question.media !== null,
  };
}
