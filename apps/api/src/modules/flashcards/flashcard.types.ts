import type { Types } from 'mongoose';

export interface NewFlashcard {
  lessonId: Types.ObjectId;
  frontText: string;
  backText: string;
  displayOrder: number;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
}

export interface FlashcardMetadataPatch {
  frontText?: string;
  backText?: string;
}

export interface FlashcardOrderAssignment {
  flashcardId: Types.ObjectId;
  displayOrder: number;
}
