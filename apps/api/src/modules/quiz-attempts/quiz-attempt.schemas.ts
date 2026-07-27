import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/iu, 'Invalid ObjectId');

export const studentQuizParamsSchema = z.object({ quizId: objectId }).strict();
export const studentAttemptParamsSchema = z.object({ attemptId: objectId }).strict();
export const startQuizAttemptSchema = z.object({}).strict();
export const attemptListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

const attemptAnswerSchema = z
  .object({
    questionId: objectId,
    selectedOptionIds: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
    textAnswer: z
      .string()
      .transform((value) => value.normalize('NFKC').replace(/\r\n?/gu, '\n').trim())
      .pipe(z.string().max(20_000))
      .nullable()
      .default(null),
  })
  .strict();

export const saveQuizAnswersSchema = z
  .object({
    answers: z.array(attemptAnswerSchema).min(1).max(100),
    expectedAttemptRevision: z.number().int().min(1),
  })
  .strict()
  .superRefine((value, context) => {
    const questionIds = value.answers.map((answer) => answer.questionId);
    if (new Set(questionIds).size !== questionIds.length) {
      context.addIssue({
        code: 'custom',
        path: ['answers'],
        message: 'Each Question may occur only once in an answer batch',
      });
    }
  });

export const submitQuizAttemptSchema = z
  .object({
    expectedAttemptRevision: z.number().int().min(1),
    confirmUnanswered: z.boolean().default(false),
  })
  .strict();

export type SaveQuizAnswersInput = z.infer<typeof saveQuizAnswersSchema>;
export type SubmitQuizAttemptInput = z.infer<typeof submitQuizAttemptSchema>;
export type AttemptListQueryInput = z.infer<typeof attemptListQuerySchema>;
