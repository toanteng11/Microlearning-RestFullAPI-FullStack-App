import { Router, type RequestHandler } from 'express';

import { requirePermission } from '../../shared/auth/authenticate.js';
import { parseWithSchema } from '../../shared/validation/parse.js';
import {
  adminUserIdSchema,
  adminUserListQuerySchema,
  changeUserRoleSchema,
  changeUserStatusSchema,
} from './admin-user.schemas.js';
import type { AdminUserListScope, AdminUserService } from './admin-user.service.js';

function requestIdFrom(response: {
  getHeader(name: string): number | string | string[] | undefined;
}) {
  return String(response.getHeader('x-request-id') ?? 'unknown');
}

export function createAdminUserRouter(service: AdminUserService) {
  const router = Router();

  const listRoute = (
    scope: AdminUserListScope,
    permission: Parameters<typeof requirePermission>[0],
  ) => {
    const handler: RequestHandler = async (request, response) => {
      const input = parseWithSchema(adminUserListQuerySchema, request.query);
      const result = await service.list(scope, input);
      response.json({ success: true, ...result });
    };
    return [requirePermission(permission), handler] as const;
  };

  router.get('/students', ...listRoute('students', 'user.view_students'));
  router.get('/teachers', ...listRoute('teachers', 'user.view_teachers'));
  router.get('/admins', ...listRoute('admins', 'user.view_admins'));

  router.get('/:userId', async (request, response) => {
    const { userId } = parseWithSchema(adminUserIdSchema, request.params);
    const user = await service.getDetail(request.auth!, userId);
    response.json({ success: true, data: { user } });
  });

  router.patch(
    '/:userId/status',
    requirePermission('user.update_status'),
    async (request, response) => {
      const { userId } = parseWithSchema(adminUserIdSchema, request.params);
      const input = parseWithSchema(changeUserStatusSchema, request.body);
      const result = await service.changeStatus(
        request.auth!,
        userId,
        input,
        requestIdFrom(response),
      );
      response.json({ success: true, data: result });
    },
  );

  router.patch(
    '/:userId/role',
    requirePermission('role.assign_limited'),
    async (request, response) => {
      const { userId } = parseWithSchema(adminUserIdSchema, request.params);
      const input = parseWithSchema(changeUserRoleSchema, request.body);
      const result = await service.changeRole(
        request.auth!,
        userId,
        input,
        requestIdFrom(response),
      );
      response.json({ success: true, data: result });
    },
  );

  return router;
}
