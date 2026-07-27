import { z } from 'zod';

import { GRADE_ACTIVITY_TYPES } from './grade.types.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/iu, 'Invalid ObjectId');
const feedback = z
  .string()
  .transform((value) => value.normalize('NFKC').replace(/\r\n?/gu, '\n').trim())
  .pipe(z.string().min(1).max(20_000))
  .nullable()
  .default(null);

export const gradeParamsSchema = z.object({ gradeId: objectId }).strict();
export const gradeCourseParamsSchema = z.object({ courseId: objectId }).strict();

export const saveSubmissionGradeSchema = z
  .object({
    score: z.number().int().min(0).max(1_000),
    feedback,
    expectedEvidenceRevision: z.number().int().min(1),
    expectedGradeRevision: z.number().int().min(0),
  })
  .strict();

export const returnSubmissionSchema = z
  .object({ expectedGradeRevision: z.number().int().min(1) })
  .strict();

export const regradeSchema = z
  .object({
    score: z.number().int().min(0).max(1_000),
    feedback,
    reason: z.string().trim().min(10).max(500),
    expectedGradeRevision: z.number().int().min(1),
  })
  .strict();

export const gradeHistoryQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export const ownGradeListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    classroomId: objectId.optional(),
    courseId: objectId.optional(),
    activityType: z.enum(GRADE_ACTIVITY_TYPES).optional(),
    status: z.literal('RETURNED').optional(),
  })
  .strict();

export type SaveSubmissionGradeInput = z.infer<typeof saveSubmissionGradeSchema>;
export type ReturnSubmissionInput = z.infer<typeof returnSubmissionSchema>;
export type RegradeInput = z.infer<typeof regradeSchema>;
export type GradeHistoryQueryInput = z.infer<typeof gradeHistoryQuerySchema>;
export type OwnGradeListQueryInput = z.infer<typeof ownGradeListQuerySchema>;
