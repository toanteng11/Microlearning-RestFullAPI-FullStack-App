import argon2 from 'argon2';

import { AppError } from '../errors/app-error.js';

const ARGON2_OPTIONS = Object.freeze({
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  hashLength: 32,
});

export function assertPasswordPolicy(password: string): void {
  const length = [...password].length;
  const hasEdgeWhitespace = password.trim() !== password;

  if (length < 12 || length > 128 || hasEdgeWhitespace) {
    throw new AppError(
      422,
      'PASSWORD_POLICY_FAILED',
      'Password must contain 12 to 128 characters and no leading or trailing whitespace',
      [
        {
          field: 'password',
          code: hasEdgeWhitespace ? 'EDGE_WHITESPACE' : 'INVALID_LENGTH',
          message: 'Password does not meet the password policy',
        },
      ],
    );
  }
}

export async function hashPassword(password: string): Promise<string> {
  assertPasswordPolicy(password);
  return argon2.hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}
