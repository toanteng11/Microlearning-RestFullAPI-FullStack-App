import { Router } from 'express';

import { createAuthenticateMiddleware } from '../shared/auth/authenticate.js';
import type { AppConfig } from '../shared/config/environment.js';
import { AdminUserService } from './admin-users/admin-user.service.js';
import { createAdminUserRouter } from './admin-users/admin-user.routes.js';
import { AuditLogRepository } from './audit/audit-log.repository.js';
import { AuthLoginStateRepository } from './auth/auth-login-state.repository.js';
import { createAuthRouter } from './auth/auth.routes.js';
import { AuthService } from './auth/auth.service.js';
import { AuthSessionRepository } from './sessions/auth-session.repository.js';
import { SystemGuardRepository } from './system-guards/system-guard.repository.js';
import { createCurrentUserRouter } from './users/current-user.routes.js';
import { UserRepository } from './users/user.repository.js';

export function createPhaseTwoRouter(config: AppConfig) {
  const router = Router();
  const users = new UserRepository();
  const sessions = new AuthSessionRepository();
  const loginStates = new AuthLoginStateRepository();
  const audits = new AuditLogRepository();
  const systemGuards = new SystemGuardRepository();
  const authService = new AuthService(config, users, sessions, loginStates);
  const adminUserService = new AdminUserService(users, sessions, audits, systemGuards);
  const authenticate = createAuthenticateMiddleware(
    authService.accessTokenService,
    users,
    sessions,
  );

  router.use('/auth', createAuthRouter(config, authService));
  router.use('/users', authenticate, createCurrentUserRouter(users));
  router.use('/admin/users', authenticate, createAdminUserRouter(adminUserService));

  return router;
}
