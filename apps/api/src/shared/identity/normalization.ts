import { createHmac } from 'node:crypto';

import { AppError } from '../errors/app-error.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export function normalizeEmail(input: string): string {
  const email = input.normalize('NFKC').trim().toLowerCase();

  if (email.length === 0 || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    throw new AppError(422, 'VALIDATION_ERROR', 'Email is invalid', [
      { field: 'email', code: 'INVALID_EMAIL', message: 'Email is invalid' },
    ]);
  }

  return email;
}

export function normalizeFullName(input: string): string {
  const fullName = input.normalize('NFKC').trim().replace(/\s+/gu, ' ');
  const length = [...fullName].length;

  if (length < 2 || length > 100) {
    throw new AppError(422, 'VALIDATION_ERROR', 'Full name must contain 2 to 100 characters', [
      {
        field: 'fullName',
        code: 'INVALID_LENGTH',
        message: 'Full name must contain 2 to 100 characters',
      },
    ]);
  }

  return fullName;
}

export function normalizeFullNameForSearch(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[đĐ]/gu, 'd')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/gu, ' ');
}

export function createIdentityKey(email: string, pepper: string): string {
  return createHmac('sha256', pepper).update(normalizeEmail(email), 'utf8').digest('hex');
}
