import { z } from 'zod';

import { COMMON_CONTENT_STATUSES } from '../learning-content/content.types.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/iu, 'Invalid ObjectId');
const timestamp = z.iso.datetime({ offset: true });
const content = z
  .string()
  .transform((value) => value.normalize('NFKC').replace(/\r\n?/gu, '\n').trim())
  .pipe(z.string().min(1).max(10_000));
const reason = z
  .string()
  .transform((value) => value.normalize('NFKC').trim().replace(/\s+/gu, ' '))
  .pipe(z.string().min(5).max(500));

export const classroomAnnouncementParamsSchema = z.object({ classroomId: objectId }).strict();
export const announcementParamsSchema = z.object({ announcementId: objectId }).strict();
export const createAnnouncementSchema = z.object({ content }).strict();
export const updateAnnouncementSchema = z
  .object({ content, expectedUpdatedAt: timestamp })
  .strict();
export const changeAnnouncementStatusSchema = z
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
export const archiveAnnouncementSchema = z
  .object({ reason, expectedUpdatedAt: timestamp })
  .strict();
export const announcementListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(COMMON_CONTENT_STATUSES).optional(),
  })
  .strict();

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
export type ChangeAnnouncementStatusInput = z.infer<typeof changeAnnouncementStatusSchema>;
export type ArchiveAnnouncementInput = z.infer<typeof archiveAnnouncementSchema>;
export type AnnouncementListQueryInput = z.infer<typeof announcementListQuerySchema>;
