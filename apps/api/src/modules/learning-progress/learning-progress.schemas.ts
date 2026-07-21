import { z } from 'zod';

import { DERIVED_LEARNING_STATUSES } from './derived-progress.policy.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/iu, 'Invalid ObjectId');
const timestamp = z.iso.datetime({ offset: true });
const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const studentClassworkParamsSchema = z.object({ classroomId: objectId }).strict();
export const learningLessonParamsSchema = z.object({ lessonId: objectId }).strict();
export const ownCourseProgressQuerySchema = z.object({ courseId: objectId }).strict();

export const studentTodoQuerySchema = z
  .object({
    ...pagination,
    scope: z.enum(['ALL', 'OVERDUE', 'UPCOMING']).default('ALL'),
    classroomId: objectId.optional(),
  })
  .strict();

export const studentDeadlineQuerySchema = z
  .object({
    ...pagination,
    classroomId: objectId.optional(),
    from: timestamp.optional(),
    to: timestamp.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (!value.from || !value.to) return;
    const from = new Date(value.from);
    const to = new Date(value.to);
    if (from > to) {
      context.addIssue({ code: 'custom', path: ['to'], message: 'to must be after from' });
    }
    if (to.getTime() - from.getTime() > 366 * 24 * 60 * 60 * 1_000) {
      context.addIssue({
        code: 'custom',
        path: ['to'],
        message: 'Deadline range cannot exceed 366 days',
      });
    }
  });

export const teacherCourseParamsSchema = z.object({ courseId: objectId }).strict();
export const teacherProgressQuerySchema = z
  .object({
    ...pagination,
    search: z.string().trim().min(1).max(100).optional(),
    progressStatus: z.enum(DERIVED_LEARNING_STATUSES).optional(),
  })
  .strict();

export const teacherActivityQuerySchema = z
  .object({
    ...pagination,
    search: z.string().trim().min(1).max(100).optional(),
    deadlineStatus: z.enum(['NO_DEADLINE', 'UPCOMING', 'OVERDUE']).optional(),
  })
  .strict();

export type StudentTodoQuery = z.infer<typeof studentTodoQuerySchema>;
export type StudentDeadlineQuery = z.infer<typeof studentDeadlineQuerySchema>;
export type TeacherProgressQuery = z.infer<typeof teacherProgressQuerySchema>;
export type TeacherActivityQuery = z.infer<typeof teacherActivityQuerySchema>;
