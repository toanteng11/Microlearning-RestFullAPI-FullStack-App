import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/iu, 'Invalid ObjectId');
const timestamp = z.iso.datetime({ offset: true });

function normalizedText(min: number, max: number) {
  return z
    .string()
    .transform((value) => value.normalize('NFKC').trim().replace(/\s+/gu, ' '))
    .pipe(z.string().min(min).max(max));
}

export const moduleIdSchema = z.object({ moduleId: objectId }).strict();
export const courseIdForModulesSchema = z.object({ courseId: objectId }).strict();

export const createModuleSchema = z
  .object({
    title: normalizedText(2, 150),
    description: z
      .string()
      .transform((value) => value.normalize('NFKC').trim())
      .pipe(z.string().max(2_000))
      .optional(),
  })
  .strict();

export const updateModuleSchema = z
  .object({
    title: normalizedText(2, 150).optional(),
    description: z
      .string()
      .transform((value) => value.normalize('NFKC').trim())
      .pipe(z.string().max(2_000))
      .optional(),
    expectedUpdatedAt: timestamp,
  })
  .strict()
  .refine((value) => 'title' in value || 'description' in value, {
    message: 'At least one mutable Module field is required',
  });

export const changeModuleStatusSchema = z
  .object({
    targetStatus: z.enum(['DRAFT', 'PUBLISHED', 'UNPUBLISHED']),
    expectedUpdatedAt: timestamp,
  })
  .strict();

export const archiveModuleSchema = z
  .object({ reason: normalizedText(5, 500).optional(), expectedUpdatedAt: timestamp })
  .strict();

export const reorderModulesSchema = z
  .object({
    orderedModuleIds: z.array(objectId).min(1).max(500),
    expectedStructureRevision: z.number().int().min(0),
  })
  .strict();

export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
export type ChangeModuleStatusInput = z.infer<typeof changeModuleStatusSchema>;
export type ArchiveModuleInput = z.infer<typeof archiveModuleSchema>;
export type ReorderModulesInput = z.infer<typeof reorderModulesSchema>;
