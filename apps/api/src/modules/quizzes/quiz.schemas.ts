import { z } from 'zod';

import { QUIZ_STATUSES, RESULT_RELEASE_POLICIES } from '../learning-content/assessment.types.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/iu, 'Invalid ObjectId');
const timestamp = z.iso.datetime({ offset: true });
const title = z
  .string()
  .transform((value) => value.normalize('NFKC').trim().replace(/\s+/gu, ' '))
  .pipe(z.string().min(2).max(150));
const markdown = z
  .string()
  .transform((value) => value.normalize('NFKC').replace(/\r\n?/gu, '\n').trim())
  .pipe(z.string().min(1).max(100_000));

export const teacherCourseQuizParamsSchema = z.object({ courseId: objectId }).strict();
export const teacherQuizParamsSchema = z.object({ quizId: objectId }).strict();
export const previewQuizBodySchema = z.object({}).strict();

export const quizListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(QUIZ_STATUSES).optional(),
    search: z
      .string()
      .transform((value) => value.normalize('NFKC').trim())
      .pipe(z.string().min(1).max(100))
      .optional(),
  })
  .strict();

export const createQuizSchema = z
  .object({
    moduleId: objectId.nullable().default(null),
    title,
    instruction: markdown,
    isRequired: z.boolean().default(true),
    availableFrom: timestamp.nullable().default(null),
    dueDate: timestamp,
    attemptLimit: z.number().int().min(1).max(10).default(1),
    timeLimitMinutes: z.number().int().min(1).max(180).nullable().default(null),
    resultReleasePolicy: z.enum(RESULT_RELEASE_POLICIES).default('AFTER_REVIEW'),
    scorePolicy: z.literal('HIGHEST').default('HIGHEST'),
  })
  .strict();

export const updateQuizSchema = z
  .object({
    moduleId: objectId.nullable().optional(),
    title: title.optional(),
    instruction: markdown.optional(),
    isRequired: z.boolean().optional(),
    availableFrom: timestamp.nullable().optional(),
    dueDate: timestamp.optional(),
    attemptLimit: z.number().int().min(1).max(10).optional(),
    timeLimitMinutes: z.number().int().min(1).max(180).nullable().optional(),
    resultReleasePolicy: z.enum(RESULT_RELEASE_POLICIES).optional(),
    scorePolicy: z.literal('HIGHEST').optional(),
    expectedContentRevision: z.number().int().min(1),
  })
  .strict()
  .refine((value) => Object.keys(value).some((key) => key !== 'expectedContentRevision'), {
    message: 'At least one mutable Quiz field is required',
  });

export const changeQuizStatusSchema = z
  .object({
    status: z.enum(QUIZ_STATUSES),
    scheduledPublishAt: timestamp.nullable().default(null),
    reason: z
      .string()
      .transform((value) => value.normalize('NFKC').trim())
      .pipe(z.string().min(5).max(500)),
    expectedContentRevision: z.number().int().min(1),
    expectedQuestionRevision: z.number().int().min(0),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.status === 'SCHEDULED' && !value.scheduledPublishAt) {
      context.addIssue({
        code: 'custom',
        path: ['scheduledPublishAt'],
        message: 'scheduledPublishAt is required for SCHEDULED status',
      });
    }
    if (value.status !== 'SCHEDULED' && value.scheduledPublishAt) {
      context.addIssue({
        code: 'custom',
        path: ['scheduledPublishAt'],
        message: 'scheduledPublishAt is only allowed for SCHEDULED status',
      });
    }
  });

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
export type ChangeQuizStatusInput = z.infer<typeof changeQuizStatusSchema>;
export type QuizListQueryInput = z.infer<typeof quizListQuerySchema>;
