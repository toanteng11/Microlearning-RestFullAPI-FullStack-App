import { randomUUID } from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

const validRequestId = /^[a-zA-Z0-9._:-]{1,100}$/;

export function requestIdMiddleware(request: Request, response: Response, next: NextFunction) {
  const incomingRequestId = request.header('x-request-id');
  const requestId =
    incomingRequestId && validRequestId.test(incomingRequestId) ? incomingRequestId : randomUUID();

  response.setHeader('x-request-id', requestId);
  next();
}
