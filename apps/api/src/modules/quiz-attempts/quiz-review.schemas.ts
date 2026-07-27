import { z } from 'zod';

import { ATTEMPT_STATUSES } from '../learning-content/assessment.types.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/iu, 'Invalid ObjectId');
const reviewAnswer = z
  .object({
    questionId: objectId,
    awardedPoints: z.number().int().min(0).max(1_000),
    feedback: z
      .string()
      .transform((value) => value.normalize('NFKC').replace(/\r\n?/gu, '\n').trim())
      .pipe(z.string().min(1).max(20_000))
      .nullable()
      .default(null),
  })
  .strict();

export const teacherAttemptParamsSchema = z.object({ attemptId: objectId }).strict();

export const quizResultListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    keyword: z.string().trim().min(1).max(100).optional(),
    status: z.enum(ATTEMPT_STATUSES).optional(),
    sort: z.enum(['score:desc', 'submittedAt:asc', 'studentName:asc']).default('submittedAt:asc'),
  })
  .strict();

export const saveQuizReviewSchema = z
  .object({
    answers: z.array(reviewAnswer).max(100),
    expectedReviewRevision: z.number().int().min(0),
  })
  .strict();

export const finalizeQuizReviewSchema = z
  .object({
    expectedReviewRevision: z.number().int().min(1),
    reason: z.string().trim().min(10).max(500).nullable().default(null),
  })
  .strict();

export const releaseQuizResultSchema = z
  .object({ expectedReviewRevision: z.number().int().min(0) })
  .strict();

export const regradeQuizAttemptSchema = z
  .object({
    answers: z.array(reviewAnswer).max(100),
    reason: z.string().trim().min(10).max(500),
    expectedReviewRevision: z.number().int().min(0),
  })
  .strict();

export type QuizResultListQueryInput = z.infer<typeof quizResultListQuerySchema>;
export type SaveQuizReviewInput = z.infer<typeof saveQuizReviewSchema>;
export type FinalizeQuizReviewInput = z.infer<typeof finalizeQuizReviewSchema>;
export type ReleaseQuizResultInput = z.infer<typeof releaseQuizResultSchema>;
export type RegradeQuizAttemptInput = z.infer<typeof regradeQuizAttemptSchema>;
