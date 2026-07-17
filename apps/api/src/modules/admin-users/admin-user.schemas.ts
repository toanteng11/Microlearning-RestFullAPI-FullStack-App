import { z } from 'zod';

import { USER_ROLES, USER_STATUSES } from '../users/user.types.js';

export const ADMIN_USER_SORT_FIELDS = [
  'fullName',
  'email',
  'role',
  'status',
  'department',
  'lastActiveAt',
  'createdAt',
] as const;

export const adminUserListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    keyword: z.string().trim().min(1).max(100).optional(),
    status: z.enum(USER_STATUSES).optional(),
    sortBy: z.enum(ADMIN_USER_SORT_FIELDS).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict();

export const adminUserIdSchema = z
  .object({ userId: z.string().regex(/^[a-f\d]{24}$/iu, 'Invalid user ID') })
  .strict();

const mutationBase = {
  reason: z.string().trim().min(5).max(500),
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
};

export const changeUserStatusSchema = z
  .object({ ...mutationBase, status: z.enum(USER_STATUSES) })
  .strict();

export const changeUserRoleSchema = z
  .object({ ...mutationBase, role: z.enum(USER_ROLES) })
  .strict();

export type AdminUserListQueryInput = z.infer<typeof adminUserListQuerySchema>;
export type ChangeUserStatusInput = z.infer<typeof changeUserStatusSchema>;
export type ChangeUserRoleInput = z.infer<typeof changeUserRoleSchema>;
