import { z } from 'zod';

import { COMMON_CONTENT_STATUSES } from '../learning-content/content.types.js';
import { COURSE_SORT_FIELDS } from './course.types.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/iu, 'Invalid ObjectId');
const timestamp = z.iso.datetime({ offset: true });

function normalizedText(min: number, max: number) {
  return z
    .string()
    .transform((value) => value.normalize('NFKC').trim().replace(/\s+/gu, ' '))
    .pipe(z.string().min(min).max(max));
}

export const courseIdSchema = z.object({ courseId: objectId }).strict();
export const courseModuleParamsSchema = z
  .object({ courseId: objectId.optional(), moduleId: objectId.optional() })
  .strict();

export const createCourseSchema = z
  .object({
    classroomId: objectId,
    title: normalizedText(2, 150),
    description: z.string().normalize().trim().max(5_000).optional(),
  })
  .strict();

export const updateCourseSchema = z
  .object({
    title: normalizedText(2, 150).optional(),
    description: z.string().normalize().trim().max(5_000).optional(),
    expectedUpdatedAt: timestamp,
  })
  .strict()
  .refine((value) => 'title' in value || 'description' in value, {
    message: 'At least one mutable Course field is required',
  });

export const changeCourseStatusSchema = z
  .object({
    targetStatus: z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED', 'UNPUBLISHED']),
    scheduledPublishAt: timestamp.nullable().optional(),
    expectedUpdatedAt: timestamp,
  })
  .strict()
  .superRefine((value, context) => {
    if (value.targetStatus === 'SCHEDULED' && !value.scheduledPublishAt) {
      context.addIssue({
        code: 'custom',
        path: ['scheduledPublishAt'],
        message: 'scheduledPublishAt is required for SCHEDULED status',
      });
    }
    if (value.targetStatus !== 'SCHEDULED' && value.scheduledPublishAt) {
      context.addIssue({
        code: 'custom',
        path: ['scheduledPublishAt'],
        message: 'scheduledPublishAt is only allowed for SCHEDULED status',
      });
    }
  });

export const archiveCourseSchema = z
  .object({ reason: normalizedText(5, 500), expectedUpdatedAt: timestamp })
  .strict();

export const courseListQuerySchema = z
  .object({
    classroomId: objectId,
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: normalizedText(1, 100).optional(),
    status: z.enum(COMMON_CONTENT_STATUSES).optional(),
    sortBy: z.enum(COURSE_SORT_FIELDS).default('displayOrder'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  })
  .strict();

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type ChangeCourseStatusInput = z.infer<typeof changeCourseStatusSchema>;
export type ArchiveCourseInput = z.infer<typeof archiveCourseSchema>;
export type CourseListQueryInput = z.infer<typeof courseListQuerySchema>;
