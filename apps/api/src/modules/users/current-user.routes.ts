import { Router } from 'express';
import { z } from 'zod';

import { requirePermission } from '../../shared/auth/authenticate.js';
import { getCapabilities } from '../../shared/auth/permissions.js';
import { AppError } from '../../shared/errors/app-error.js';
import {
  normalizeFullName,
  normalizeFullNameForSearch,
} from '../../shared/identity/normalization.js';
import { parseWithSchema } from '../../shared/validation/parse.js';
import type { UserRepository } from './user.repository.js';
import { toUserSummary } from './user.types.js';

const updateProfileSchema = z.object({ fullName: z.string() }).strict();

function toCurrentUserProfile(user: NonNullable<Awaited<ReturnType<UserRepository['findById']>>>) {
  return {
    ...toUserSummary(user),
    capabilities: getCapabilities(user.role),
    avatarUrl: user.avatarUrl ?? null,
    studentCode: user.studentCode ?? null,
    department: user.department ?? null,
    registrationSource: user.registrationSource,
    activatedAt: user.activatedAt?.toISOString() ?? null,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function createCurrentUserRouter(users: UserRepository) {
  const router = Router();

  router.get('/me', requirePermission('profile.view_own'), async (request, response) => {
    const user = await users.findById(request.auth!.id);
    if (!user) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'User was not found');
    response.json({ success: true, data: { user: toCurrentUserProfile(user) } });
  });

  router.patch('/me', requirePermission('profile.update_own'), async (request, response) => {
    const input = parseWithSchema(updateProfileSchema, request.body);
    const fullName = normalizeFullName(input.fullName);
    const user = await users.updateProfile(
      request.auth!.id,
      fullName,
      normalizeFullNameForSearch(fullName),
    );
    if (!user) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'User was not found');
    response.json({ success: true, data: { user: toCurrentUserProfile(user) } });
  });

  return router;
}
