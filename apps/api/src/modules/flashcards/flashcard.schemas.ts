import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/iu, 'Invalid ObjectId');
const timestamp = z.iso.datetime({ offset: true });

const markdownText = (max: number) =>
  z
    .string()
    .transform((value) => value.normalize('NFKC').replace(/\r\n?/gu, '\n').trim())
    .pipe(z.string().min(1).max(max));

export const lessonIdForFlashcardsSchema = z.object({ lessonId: objectId }).strict();
export const flashcardIdSchema = z.object({ flashcardId: objectId }).strict();

export const createFlashcardSchema = z
  .object({ frontText: markdownText(2_000), backText: markdownText(5_000) })
  .strict();

export const updateFlashcardSchema = z
  .object({
    frontText: markdownText(2_000).optional(),
    backText: markdownText(5_000).optional(),
    expectedUpdatedAt: timestamp,
  })
  .strict()
  .refine((value) => 'frontText' in value || 'backText' in value, {
    message: 'At least one mutable Flashcard field is required',
  });

export const archiveFlashcardSchema = z
  .object({
    reason: z.string().normalize().trim().min(5).max(500).optional(),
    expectedUpdatedAt: timestamp,
  })
  .strict();

export const reorderFlashcardsSchema = z
  .object({
    orderedFlashcardIds: z.array(objectId).min(1).max(500),
    expectedFlashcardRevision: z.number().int().min(0),
  })
  .strict();

export type CreateFlashcardInput = z.infer<typeof createFlashcardSchema>;
export type UpdateFlashcardInput = z.infer<typeof updateFlashcardSchema>;
export type ArchiveFlashcardInput = z.infer<typeof archiveFlashcardSchema>;
export type ReorderFlashcardsInput = z.infer<typeof reorderFlashcardsSchema>;
