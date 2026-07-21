import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/iu, 'Invalid ObjectId');

export const teacherLessonIdSchema = z.object({ lessonId: objectId }).strict();

export const changeLessonDeadlineSchema = z
  .object({
    completionDeadline: z.iso.datetime({ offset: true }).nullable(),
    reason: z.string().normalize().trim().min(1).max(500).optional(),
    expectedDeadlineRevision: z.number().int().min(0),
  })
  .strict();

export const deadlineHistoryQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export type ChangeLessonDeadlineInput = z.infer<typeof changeLessonDeadlineSchema>;
export type DeadlineHistoryQueryInput = z.infer<typeof deadlineHistoryQuerySchema>;
