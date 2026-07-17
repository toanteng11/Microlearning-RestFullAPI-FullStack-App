import type { CookieOptions } from 'express';

import type { AppConfig } from '../config/environment.js';

export function getRefreshCookieOptions(config: AppConfig): CookieOptions {
  return {
    httpOnly: true,
    secure: config.refreshCookieSecure,
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge: config.refreshTokenTtlSeconds * 1000,
  };
}

export function getClearRefreshCookieOptions(config: AppConfig): CookieOptions {
  const options = getRefreshCookieOptions(config);
  delete options.maxAge;
  return options;
}
