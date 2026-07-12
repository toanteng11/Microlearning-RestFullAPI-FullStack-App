import type { ErrorRequestHandler } from 'express';
import type { Logger } from 'pino';

import { AppError } from '../errors/app-error.js';

export function createErrorHandler(logger: Logger, exposeStack: boolean): ErrorRequestHandler {
  return (error: unknown, request, response, _next) => {
    const appError =
      error instanceof AppError
        ? error
        : new AppError(500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred');
    const requestId = String(response.getHeader('x-request-id') ?? 'unknown');

    logger.error(
      {
        err: error,
        requestId,
        method: request.method,
        path: request.path,
        statusCode: appError.statusCode,
      },
      'Request failed',
    );

    response.status(appError.statusCode).json({
      success: false,
      error: {
        code: appError.code,
        message: appError.message,
        ...(appError.details ? { details: appError.details } : {}),
        ...(exposeStack && error instanceof Error ? { stack: error.stack } : {}),
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        path: request.originalUrl,
      },
    });
  };
}
