import { z } from 'zod';

import { createListQuerySchema } from '../../shared/validation/list-query.js';
import {
  CLASSROOM_ENROLLMENT_STATUSES,
  CLASSROOM_SORT_FIELDS,
  CLASSROOM_STATUSES,
} from './classroom.types.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/iu, 'Invalid ObjectId');
const timestamp = z.iso.datetime({ offset: true });

function normalizedText(min: number, max: number) {
  return z
    .string()
    .transform((value) => value.normalize('NFKC').trim().replace(/\s+/gu, ' '))
    .pipe(z.string().min(min).max(max));
}

const nullableDescription = normalizedText(1, 1000).nullable().optional();
const nullableShortText = normalizedText(1, 120).nullable().optional();

export const classroomIdSchema = z.object({ classroomId: objectId }).strict();

export const createClassroomSchema = z
  .object({
    name: normalizedText(2, 120),
    description: nullableDescription,
    subject: nullableShortText,
    section: nullableShortText,
  })
  .strict();

export const updateClassroomSchema = z
  .object({
    name: normalizedText(2, 120).optional(),
    description: nullableDescription,
    subject: nullableShortText,
    section: nullableShortText,
    expectedUpdatedAt: timestamp,
  })
  .strict()
  .refine(
    (value) => ['name', 'description', 'subject', 'section'].some((field) => field in value),
    { message: 'At least one mutable Classroom field is required' },
  );

export const archiveClassroomSchema = z
  .object({
    reason: normalizedText(5, 500),
    expectedUpdatedAt: timestamp,
  })
  .strict();

export const updateClassroomSettingsSchema = z
  .object({
    enrollmentStatus: z.enum(CLASSROOM_ENROLLMENT_STATUSES).optional(),
    allowClassCodeJoin: z.boolean().optional(),
    allowInviteLinkJoin: z.boolean().optional(),
    expectedUpdatedAt: timestamp,
  })
  .strict()
  .refine(
    (value) =>
      ['enrollmentStatus', 'allowClassCodeJoin', 'allowInviteLinkJoin'].some(
        (field) => field in value,
      ),
    { message: 'At least one Classroom setting is required' },
  );

export const classroomListQuerySchema = createListQuerySchema(CLASSROOM_SORT_FIELDS, 'updatedAt')
  .extend({
    status: z.enum(CLASSROOM_STATUSES).optional(),
    enrollmentStatus: z.enum(CLASSROOM_ENROLLMENT_STATUSES).optional(),
  })
  .strict();

export const studentClassroomListQuerySchema = createListQuerySchema(
  ['name', 'joinedAt', 'updatedAt'] as const,
  'updatedAt',
)
  .extend({ status: z.enum(CLASSROOM_STATUSES).optional() })
  .strict();

export const adminClassroomListQuerySchema = classroomListQuerySchema
  .extend({ ownerTeacherId: objectId.optional() })
  .strict();

export type CreateClassroomInput = z.infer<typeof createClassroomSchema>;
export type UpdateClassroomInput = z.infer<typeof updateClassroomSchema>;
export type ArchiveClassroomInput = z.infer<typeof archiveClassroomSchema>;
export type UpdateClassroomSettingsInput = z.infer<typeof updateClassroomSettingsSchema>;
export type ClassroomListQueryInput = z.infer<typeof classroomListQuerySchema>;
export type StudentClassroomListQueryInput = z.infer<typeof studentClassroomListQuerySchema>;
