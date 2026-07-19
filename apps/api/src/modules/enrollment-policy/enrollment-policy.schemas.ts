import { z } from 'zod';

export const updateEnrollmentPolicySchema = z
  .object({
    allowClassCodeJoin: z.boolean(),
    allowInviteLinkJoin: z.boolean(),
    defaultInviteLinkLifetimeDays: z.number().int().min(1).max(90),
    expectedRevision: z.number().int().min(1),
    reason: z.string().trim().min(5).max(500),
  })
  .strict();

export type UpdateEnrollmentPolicyInput = z.infer<typeof updateEnrollmentPolicySchema>;
