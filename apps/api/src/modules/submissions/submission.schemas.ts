import { z } from 'zod';

import { SUBMISSION_TYPES } from '../assignments/assignment.types.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/iu, 'Invalid ObjectId');
export const studentAssignmentParamsSchema = z.object({ assignmentId: objectId }).strict();
export const studentSubmissionParamsSchema = z.object({ submissionId: objectId }).strict();

export const saveSubmissionDraftSchema = z
  .object({
    submissionType: z.enum(SUBMISSION_TYPES),
    textAnswer: z
      .string()
      .transform((value) => value.normalize('NFKC').replace(/\r\n?/gu, '\n').trim())
      .pipe(z.string().max(100_000))
      .nullable()
      .default(null),
    links: z.array(z.url().max(2_048)).max(5).default([]),
    markDone: z.boolean().default(false),
    expectedSubmissionRevision: z.number().int().min(0),
  })
  .strict();

export const submissionTransitionSchema = z
  .object({ expectedSubmissionRevision: z.number().int().min(1) })
  .strict();

export const resubmitSubmissionSchema = z
  .object({
    reason: z.string().trim().min(5).max(500),
    expectedSubmissionRevision: z.number().int().min(1),
  })
  .strict();

export const submissionHistoryQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export const assignmentRosterQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    keyword: z.string().trim().min(1).max(100).optional(),
    status: z
      .enum(['ASSIGNED', 'IN_PROGRESS', 'MISSING', 'SUBMITTED', 'LATE', 'GRADED', 'RETURNED'])
      .optional(),
  })
  .strict();

export type SaveSubmissionDraftInput = z.infer<typeof saveSubmissionDraftSchema>;
export type SubmissionTransitionInput = z.infer<typeof submissionTransitionSchema>;
export type ResubmitSubmissionInput = z.infer<typeof resubmitSubmissionSchema>;
export type SubmissionHistoryQueryInput = z.infer<typeof submissionHistoryQuerySchema>;
export type AssignmentRosterQueryInput = z.infer<typeof assignmentRosterQuerySchema>;
