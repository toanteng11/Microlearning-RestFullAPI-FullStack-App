import { z } from 'zod';

import { COMMON_CONTENT_STATUSES } from '../learning-content/content.types.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/iu, 'Invalid ObjectId');
const search = z
  .string()
  .transform((value) => value.normalize('NFKC').trim().replace(/\s+/gu, ' '))
  .pipe(z.string().min(1).max(100));

export const adminCourseParamsSchema = z.object({ courseId: objectId }).strict();
export const adminCourseListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: search.optional(),
    status: z.enum(COMMON_CONTENT_STATUSES).optional(),
    classroomId: objectId.optional(),
    ownerTeacherId: objectId.optional(),
    sortBy: z.enum(['title', 'status', 'createdAt', 'updatedAt']).default('updatedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict();

export type AdminCourseListQueryInput = z.infer<typeof adminCourseListQuerySchema>;
