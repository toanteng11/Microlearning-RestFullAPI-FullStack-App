import type { NextFunction, Request, RequestHandler, Response } from 'express';

import type { AuthSessionRepository } from '../../modules/sessions/auth-session.repository.js';
import type { UserRepository } from '../../modules/users/user.repository.js';
import type { Permission } from './permissions.js';
import { getCapabilities, hasPermission } from './permissions.js';
import type { AccessTokenService } from './access-token.js';
import { AppError } from '../errors/app-error.js';

export function createAuthenticateMiddleware(
  accessTokens: AccessTokenService,
  users: UserRepository,
  sessions: AuthSessionRepository,
  now: () => Date = () => new Date(),
): RequestHandler {
  return async (request: Request, _response: Response, next: NextFunction) => {
    try {
      const authorization = request.header('authorization');
      const match = authorization?.match(/^Bearer ([^\s]+)$/u);
      if (!match?.[1]) {
        throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required');
      }

      let payload;
      try {
        payload = await accessTokens.verify(match[1]);
      } catch {
        throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required');
      }

      const user = await users.findById(payload.userId);
      if (!user) {
        throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required');
      }
      if (user.status !== 'ACTIVE') {
        throw new AppError(403, 'ACCOUNT_NOT_ACTIVE', 'Account is not active');
      }
      if (!(await sessions.hasActiveFamily(payload.userId, payload.familyId, now()))) {
        throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required');
      }

      request.auth = {
        id: user._id.toString(),
        role: user.role,
        status: user.status,
        familyId: payload.familyId,
        capabilities: getCapabilities(user.role),
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requirePermission(permission: Permission): RequestHandler {
  return (request, _response, next) => {
    if (!request.auth) {
      next(new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required'));
      return;
    }
    if (!hasPermission(request.auth.role, permission)) {
      next(new AppError(403, 'ACCESS_DENIED', 'Access is denied'));
      return;
    }
    next();
  };
}
