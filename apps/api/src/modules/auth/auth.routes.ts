import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';

import { getRefreshCookieOptions } from '../../shared/auth/cookie-policy.js';
import type { AppConfig } from '../../shared/config/environment.js';
import { AppError } from '../../shared/errors/app-error.js';
import { parseWithSchema } from '../../shared/validation/parse.js';
import { loginSchema, registerSchema } from './auth.schemas.js';
import type { AuthService } from './auth.service.js';

function createLimiter(windowSeconds: number, max: number) {
  return rateLimit({
    windowMs: windowSeconds * 1000,
    limit: max,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_request, _response, next) =>
      next(new AppError(429, 'RATE_LIMITED', 'Too many requests. Try again later')),
  });
}

export function createAuthRouter(config: AppConfig, authService: AuthService) {
  const router = Router();

  router.post(
    '/register',
    createLimiter(config.rateLimits.windowSeconds, config.rateLimits.registerMax),
    async (request, response) => {
      const input = parseWithSchema(registerSchema, request.body);
      const user = await authService.registerStudent(input);
      response.status(201).json({
        success: true,
        data: { user, nextAction: 'LOGIN' },
      });
    },
  );

  router.post(
    '/login',
    createLimiter(config.rateLimits.windowSeconds, config.rateLimits.loginMax),
    async (request, response) => {
      const input = parseWithSchema(loginSchema, request.body);
      const result = await authService.login(input);
      response.cookie(
        config.refreshCookieName,
        result.refreshToken,
        getRefreshCookieOptions(config),
      );
      response.setHeader('Cache-Control', 'no-store');
      response.json({
        success: true,
        data: {
          accessToken: result.accessToken,
          expiresInSeconds: result.expiresInSeconds,
          user: result.user,
        },
      });
    },
  );

  return router;
}
