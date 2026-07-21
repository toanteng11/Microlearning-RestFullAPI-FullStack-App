import { z } from 'zod';

import { COMMON_CONTENT_STATUSES } from '../learning-content/content.types.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/iu, 'Invalid ObjectId');
const timestamp = z.iso.datetime({ offset: true });

function normalizedText(min: number, max: number) {
  return z
    .string()
    .transform((value) => value.normalize('NFKC').trim().replace(/\s+/gu, ' '))
    .pipe(z.string().min(min).max(max));
}

const markdown = z
  .string()
  .transform((value) => value.normalize('NFKC').replace(/\r\n?/gu, '\n').trim())
  .pipe(z.string().min(1).max(500_000));

export const lessonIdSchema = z.object({ lessonId: objectId }).strict();
export const courseIdForLessonsSchema = z.object({ courseId: objectId }).strict();

export const createLessonSchema = z
  .object({
    courseId: objectId,
    moduleId: objectId.nullable().optional(),
    title: normalizedText(2, 150),
    content: markdown,
    contentFormat: z.literal('MARKDOWN').default('MARKDOWN'),
    estimatedMinutes: z.number().int().min(1).max(60),
    isRequired: z.boolean().default(true),
    completionDeadline: timestamp.nullable().optional(),
  })
  .strict();

export const updateLessonSchema = z
  .object({
    title: normalizedText(2, 150).optional(),
    content: markdown.optional(),
    estimatedMinutes: z.number().int().min(1).max(60).optional(),
    isRequired: z.boolean().optional(),
    expectedUpdatedAt: timestamp,
  })
  .strict()
  .refine(
    (value) =>
      'title' in value ||
      'content' in value ||
      'estimatedMinutes' in value ||
      'isRequired' in value,
    { message: 'At least one mutable Lesson field is required' },
  );

export const changeLessonStatusSchema = z
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

export const archiveLessonSchema = z
  .object({ reason: normalizedText(5, 500), expectedUpdatedAt: timestamp })
  .strict();

export const lessonListQuerySchema = z
  .object({
    moduleId: objectId.nullable().optional(),
    status: z.enum(COMMON_CONTENT_STATUSES).optional(),
  })
  .strict();

const lessonContainerSchema = z
  .object({
    moduleId: objectId.nullable(),
    orderedLessonIds: z.array(objectId).max(500),
  })
  .strict();

export const reorderLessonsSchema = z
  .object({
    containers: z.array(lessonContainerSchema).min(1).max(501),
    expectedStructureRevision: z.number().int().min(0),
  })
  .strict()
  .superRefine((value, context) => {
    const lessonIds = value.containers.flatMap((container) => container.orderedLessonIds);
    if (lessonIds.length > 500) {
      context.addIssue({ code: 'custom', path: ['containers'], message: 'At most 500 Lessons' });
    }
    const moduleKeys = value.containers.map((container) => container.moduleId ?? 'ROOT');
    if (new Set(moduleKeys).size !== moduleKeys.length) {
      context.addIssue({
        code: 'custom',
        path: ['containers'],
        message: 'Each Module container may appear only once',
      });
    }
  });

export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
export type ChangeLessonStatusInput = z.infer<typeof changeLessonStatusSchema>;
export type ArchiveLessonInput = z.infer<typeof archiveLessonSchema>;
export type LessonListQueryInput = z.infer<typeof lessonListQuerySchema>;
export type ReorderLessonsInput = z.infer<typeof reorderLessonsSchema>;
