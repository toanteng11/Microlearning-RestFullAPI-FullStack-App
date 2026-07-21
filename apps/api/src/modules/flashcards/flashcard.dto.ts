import { renderSanitizedMarkdown } from '../learning-content/markdown.policy.js';
import type { FlashcardProjection } from './flashcard.repository.js';

export function toTeacherFlashcardDto(flashcard: FlashcardProjection) {
  return {
    id: flashcard._id.toString(),
    lessonId: flashcard.lessonId.toString(),
    frontText: flashcard.frontText,
    backText: flashcard.backText,
    displayOrder: flashcard.displayOrder,
    status: flashcard.status,
    archivedAt: flashcard.archivedAt?.toISOString() ?? null,
    createdAt: flashcard.createdAt.toISOString(),
    updatedAt: flashcard.updatedAt.toISOString(),
  };
}

export function toStudentFlashcardDto(flashcard: FlashcardProjection) {
  return {
    id: flashcard._id.toString(),
    lessonId: flashcard.lessonId.toString(),
    frontHtml: renderSanitizedMarkdown(flashcard.frontText),
    backHtml: renderSanitizedMarkdown(flashcard.backText),
    displayOrder: flashcard.displayOrder,
  };
}

export function toFlashcardAuditValue(flashcard: FlashcardProjection) {
  return {
    displayOrder: flashcard.displayOrder,
    status: flashcard.status,
    archivedAt: flashcard.archivedAt?.toISOString() ?? null,
    updatedAt: flashcard.updatedAt.toISOString(),
  };
}
