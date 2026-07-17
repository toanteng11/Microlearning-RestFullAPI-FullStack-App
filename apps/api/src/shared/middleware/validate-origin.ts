import type { RequestHandler } from 'express';

import { AppError } from '../errors/app-error.js';

function originFromReferer(referer: string | undefined): string | null {
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

export function validateBrowserOrigin(allowedOrigins: readonly string[]): RequestHandler {
  return (request, _response, next) => {
    const origin = request.header('origin') ?? originFromReferer(request.header('referer'));
    if (!origin || !allowedOrigins.includes(origin)) {
      next(new AppError(403, 'ORIGIN_NOT_ALLOWED', 'Request origin is not allowed'));
      return;
    }
    next();
  };
}
