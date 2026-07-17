import type { ZodType } from 'zod';
import { ZodError } from 'zod';

import { AppError } from '../errors/app-error.js';

export function parseWithSchema<T>(schema: ZodType<T>, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (!(error instanceof ZodError)) throw error;

    throw new AppError(
      422,
      'VALIDATION_ERROR',
      'Request data is invalid',
      error.issues.map((issue) => ({
        field: issue.path.join('.') || undefined,
        code: issue.code.toUpperCase(),
        message: issue.message,
      })),
    );
  }
}
