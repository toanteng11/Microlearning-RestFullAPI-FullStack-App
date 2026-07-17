import { Router } from 'express';

import { createAuthenticateMiddleware } from '../shared/auth/authenticate.js';
import type { AppConfig } from '../shared/config/environment.js';
import { AuthLoginStateRepository } from './auth/auth-login-state.repository.js';
import { createAuthRouter } from './auth/auth.routes.js';
import { AuthService } from './auth/auth.service.js';
import { AuthSessionRepository } from './sessions/auth-session.repository.js';
import { createCurrentUserRouter } from './users/current-user.routes.js';
import { UserRepository } from './users/user.repository.js';

export function createPhaseTwoRouter(config: AppConfig) {
  const router = Router();
  const users = new UserRepository();
  const sessions = new AuthSessionRepository();
  const loginStates = new AuthLoginStateRepository();
  const authService = new AuthService(config, users, sessions, loginStates);
  const authenticate = createAuthenticateMiddleware(
    authService.accessTokenService,
    users,
    sessions,
  );

  router.use('/auth', createAuthRouter(config, authService));
  router.use('/users', authenticate, createCurrentUserRouter(users));

  return router;
}
