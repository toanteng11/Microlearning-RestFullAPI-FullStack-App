import { z } from 'zod';

import { INVITATION_CHANNELS, INVITATION_STATUSES } from './teacher-invitation.model.js';

export const createTeacherInvitationSchema = z
  .object({
    email: z.string(),
    expiresInDays: z.number().int().min(1).max(30).optional(),
  })
  .strict();

export const teacherInvitationListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    email: z.string().trim().min(1).max(100).optional(),
    status: z.enum(INVITATION_STATUSES).optional(),
    sortBy: z.enum(['createdAt', 'expiresAt', 'status']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict();

export const teacherInvitationIdSchema = z
  .object({ invitationId: z.string().regex(/^[a-f\d]{24}$/iu, 'Invalid invitation ID') })
  .strict();

export const recordCopyEventSchema = z
  .object({
    eventId: z.uuid(),
    channelHint: z.enum(INVITATION_CHANNELS).optional(),
  })
  .strict();

export const revokeTeacherInvitationSchema = z
  .object({ reason: z.string().trim().min(5).max(500) })
  .strict();

export const previewTeacherInvitationSchema = z
  .object({ token: z.string().min(40).max(512) })
  .strict();

export const acceptTeacherInvitationSchema = z
  .object({
    token: z.string().min(40).max(512),
    fullName: z.string(),
    email: z.string(),
    password: z.string(),
    confirmPassword: z.string(),
  })
  .strict();

export type CreateTeacherInvitationInput = z.infer<typeof createTeacherInvitationSchema>;
export type TeacherInvitationListInput = z.infer<typeof teacherInvitationListQuerySchema>;
export type RecordCopyEventInput = z.infer<typeof recordCopyEventSchema>;
export type AcceptTeacherInvitationInput = z.infer<typeof acceptTeacherInvitationSchema>;
