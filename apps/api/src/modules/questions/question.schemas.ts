import { z } from 'zod';

import { QUESTION_MEDIA_KINDS } from './question.types.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/iu, 'Invalid ObjectId');
const normalized = (max: number) =>
  z
    .string()
    .transform((value) => value.normalize('NFKC').trim().replace(/\s+/gu, ' '))
    .pipe(z.string().min(1).max(max));
const markdown = (max: number) =>
  z
    .string()
    .transform((value) => value.normalize('NFKC').replace(/\r\n?/gu, '\n').trim())
    .pipe(z.string().min(1).max(max));
const createOption = z.object({ label: normalized(1_000) }).strict();
const updateOption = z
  .object({ id: z.string().min(1).max(100), label: normalized(1_000) })
  .strict();

export const quizQuestionParamsSchema = z.object({ quizId: objectId }).strict();
export const questionParamsSchema = z.object({ questionId: objectId }).strict();

const createBase = {
  prompt: markdown(10_000),
  points: z.number().int().min(1).max(100),
  isRequired: z.boolean().default(true),
  explanation: markdown(10_000).nullable().default(null),
  expectedQuestionRevision: z.number().int().min(0),
};

export const createQuestionSchema = z.discriminatedUnion('type', [
  z
    .object({
      ...createBase,
      type: z.literal('SINGLE_CHOICE'),
      options: z.array(createOption).min(2).max(10),
      correctOptionIndexes: z.array(z.number().int().min(0)).length(1),
    })
    .strict(),
  z
    .object({
      ...createBase,
      type: z.literal('MULTIPLE_CHOICE'),
      options: z.array(createOption).min(2).max(10),
      correctOptionIndexes: z.array(z.number().int().min(0)).min(1).max(10),
    })
    .strict(),
  z.object({ ...createBase, type: z.literal('TRUE_FALSE'), correctBoolean: z.boolean() }).strict(),
  z
    .object({
      ...createBase,
      type: z.literal('SHORT_ANSWER'),
      rubric: markdown(10_000).nullable().default(null),
    })
    .strict(),
]);

export const updateQuestionSchema = z
  .object({
    prompt: markdown(10_000).optional(),
    points: z.number().int().min(1).max(100).optional(),
    isRequired: z.boolean().optional(),
    explanation: markdown(10_000).nullable().optional(),
    options: z.array(updateOption).min(2).max(10).optional(),
    correctOptionIds: z.array(z.string().min(1).max(100)).min(1).max(10).optional(),
    correctBoolean: z.boolean().optional(),
    rubric: markdown(10_000).nullable().optional(),
    expectedQuestionRevision: z.number().int().min(0),
  })
  .strict()
  .refine((value) => Object.keys(value).some((key) => key !== 'expectedQuestionRevision'), {
    message: 'At least one mutable Question field is required',
  });

export const archiveQuestionSchema = z
  .object({
    reason: normalized(500).pipe(z.string().min(5)),
    expectedQuestionRevision: z.number().int().min(0),
  })
  .strict();

export const reorderQuestionsSchema = z
  .object({
    orderedQuestionIds: z.array(objectId).min(1).max(100),
    expectedQuestionRevision: z.number().int().min(0),
  })
  .strict()
  .refine((value) => new Set(value.orderedQuestionIds).size === value.orderedQuestionIds.length, {
    message: 'orderedQuestionIds must not contain duplicates',
  });

export const setQuestionMediaSchema = z
  .object({
    kind: z.enum(QUESTION_MEDIA_KINDS),
    url: z.url().max(2_048),
    caption: normalized(1_000).nullable().default(null),
    altText: normalized(1_000).nullable().default(null),
    expectedQuestionRevision: z.number().int().min(0),
  })
  .strict();

export const removeQuestionMediaSchema = z
  .object({
    expectedQuestionRevision: z.number().int().min(0),
  })
  .strict();

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type ArchiveQuestionInput = z.infer<typeof archiveQuestionSchema>;
export type ReorderQuestionsInput = z.infer<typeof reorderQuestionsSchema>;
export type SetQuestionMediaInput = z.infer<typeof setQuestionMediaSchema>;
export type RemoveQuestionMediaInput = z.infer<typeof removeQuestionMediaSchema>;
