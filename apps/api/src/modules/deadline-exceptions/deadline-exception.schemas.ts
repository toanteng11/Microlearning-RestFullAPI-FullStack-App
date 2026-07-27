import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/iu, 'Invalid ObjectId');
const reason = z.string().trim().min(10).max(500);

export const activityDeadlineParamsSchema = z
  .object({
    activityType: z.enum(['lessons', 'quizzes', 'assignments']),
    activityId: objectId,
  })
  .strict();

export const studentActivityDeadlineParamsSchema = activityDeadlineParamsSchema
  .extend({ studentId: objectId })
  .strict();

export const deadlineExceptionListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export const setDeadlineExceptionSchema = z
  .object({
    deadline: z.iso.datetime({ offset: true }),
    reason,
    expectedRevision: z.number().int().min(0),
  })
  .strict();

export const revokeDeadlineExceptionSchema = z
  .object({
    reason,
    expectedRevision: z.number().int().min(1),
  })
  .strict();

export type ActivityDeadlineParams = z.infer<typeof activityDeadlineParamsSchema>;
export type DeadlineExceptionListQueryInput = z.infer<typeof deadlineExceptionListQuerySchema>;
export type SetDeadlineExceptionInput = z.infer<typeof setDeadlineExceptionSchema>;
export type RevokeDeadlineExceptionInput = z.infer<typeof revokeDeadlineExceptionSchema>;
