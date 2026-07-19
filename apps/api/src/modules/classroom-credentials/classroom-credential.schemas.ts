import { z } from 'zod';

import { normalizeClassCode } from './classroom-credential.crypto.js';

const timestamp = z.iso.datetime({ offset: true });
const reason = z.string().trim().min(5).max(500);
const token = z.string().trim().min(43).max(512);
const objectId = z.string().regex(/^[a-f\d]{24}$/iu, 'Invalid ObjectId');

export const classroomCredentialParamsSchema = z
  .object({ classroomId: objectId, linkId: objectId.optional() })
  .strict();

const normalizedClassCode = z.string().transform((value, context) => {
  try {
    return normalizeClassCode(value);
  } catch {
    context.addIssue({ code: 'custom', message: 'Class Code format is invalid' });
    return z.NEVER;
  }
});

export const regenerateClassCodeSchema = z
  .object({ expectedCredentialUpdatedAt: timestamp, reason })
  .strict();

export const createInviteLinkSchema = z
  .object({ expiresInDays: z.number().int().min(1).max(90).optional() })
  .strict();

export const regenerateInviteLinkSchema = regenerateClassCodeSchema
  .extend({ expiresInDays: z.number().int().min(1).max(90).optional() })
  .strict();

export const disableCredentialSchema = regenerateClassCodeSchema;
export const previewClassroomInviteSchema = z.object({ token }).strict();
export const joinClassroomByCodeSchema = z.object({ code: normalizedClassCode }).strict();
export const joinClassroomByTokenSchema = z.object({ token }).strict();

export type JoinClassroomByCodeInput = z.infer<typeof joinClassroomByCodeSchema>;
export type JoinClassroomByTokenInput = z.infer<typeof joinClassroomByTokenSchema>;
export type RegenerateClassCodeInput = z.infer<typeof regenerateClassCodeSchema>;
export type CreateInviteLinkInput = z.infer<typeof createInviteLinkSchema>;
export type RegenerateInviteLinkInput = z.infer<typeof regenerateInviteLinkSchema>;
export type DisableCredentialInput = z.infer<typeof disableCredentialSchema>;
