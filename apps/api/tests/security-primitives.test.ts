import { describe, expect, it } from 'vitest';

import { AccessTokenService } from '../src/shared/auth/access-token.js';
import {
  getClearRefreshCookieOptions,
  getRefreshCookieOptions,
} from '../src/shared/auth/cookie-policy.js';
import { getCapabilities, hasPermission } from '../src/shared/auth/permissions.js';
import { generateOpaqueToken, hashOpaqueToken } from '../src/shared/auth/opaque-token.js';
import { assertPasswordPolicy, hashPassword, verifyPassword } from '../src/shared/auth/password.js';
import {
  createIdentityKey,
  normalizeEmail,
  normalizeFullName,
  normalizeFullNameForSearch,
} from '../src/shared/identity/normalization.js';
import { testConfig } from './test-fixtures.js';
import { isMongoDuplicateKeyError } from '../src/shared/database/mongo-errors.js';
import { parseWithSchema } from '../src/shared/validation/parse.js';
import { z } from 'zod';

describe('Phase 02 security primitives', () => {
  it('normalizes email and Vietnamese full names consistently', () => {
    expect(normalizeEmail('  STUDENT@Example.COM ')).toBe('student@example.com');
    expect(normalizeFullName('  Trần   Thị  Bình  ')).toBe('Trần Thị Bình');
    expect(normalizeFullNameForSearch('Đặng Ánh')).toBe('dang anh');
    expect(createIdentityKey('student@example.com', 'pepper')).toHaveLength(64);
    expect(() => normalizeEmail('invalid email')).toThrow('Email is invalid');
  });

  it('enforces exact password boundaries and Argon2id verification', async () => {
    expect(() => assertPasswordPolicy('a'.repeat(11))).toThrow('12 to 128');
    expect(() => assertPasswordPolicy(` ${'a'.repeat(12)}`)).toThrow('no leading');
    expect(() => assertPasswordPolicy('a'.repeat(129))).toThrow('12 to 128');
    expect(() => assertPasswordPolicy('a'.repeat(12))).not.toThrow();
    expect(() => assertPasswordPolicy('a'.repeat(128))).not.toThrow();

    const hash = await hashPassword('StrongPassword123!');
    expect(hash).toMatch(/^\$argon2id\$/u);
    await expect(verifyPassword(hash, 'StrongPassword123!')).resolves.toBe(true);
    await expect(verifyPassword(hash, 'wrong-password')).resolves.toBe(false);
    await expect(verifyPassword('invalid-hash', 'StrongPassword123!')).resolves.toBe(false);
  });

  it('generates opaque tokens and deterministic one-way hashes', () => {
    const first = generateOpaqueToken();
    const second = generateOpaqueToken();
    expect(first).not.toBe(second);
    expect(Buffer.from(first, 'base64url')).toHaveLength(32);
    expect(hashOpaqueToken(first)).toHaveLength(64);
    expect(hashOpaqueToken(first)).toBe(hashOpaqueToken(first));
  });

  it('signs and verifies issuer-bound short-lived access tokens', async () => {
    const now = new Date('2026-07-17T10:00:00.000Z');
    const service = new AccessTokenService({
      secret: testConfig.accessTokenSecret,
      issuer: testConfig.accessTokenIssuer,
      audience: testConfig.accessTokenAudience,
      ttlSeconds: 900,
      now: () => now,
      createTokenId: () => 'test-token-id',
    });
    const token = await service.sign('user-id', 'family-id');
    await expect(service.verify(token)).resolves.toEqual({
      userId: 'user-id',
      familyId: 'family-id',
      tokenId: 'test-token-id',
    });
  });

  it('resolves stable capabilities and secure refresh-cookie attributes', () => {
    expect(getCapabilities('STUDENT')).toEqual([
      'classroom.join',
      'classroom.view_enrolled',
      'learning.complete_own',
      'learning.view_enrolled',
      'profile.update_own',
      'profile.view_own',
    ]);
    expect(hasPermission('ADMIN', 'teacher_invitation.create')).toBe(true);
    expect(hasPermission('ADMIN', 'classroom.governance.view')).toBe(true);
    expect(hasPermission('ADMIN', 'classroom.governance.lock')).toBe(false);
    expect(hasPermission('TEACHER', 'classroom.create')).toBe(true);
    expect(hasPermission('STUDENT', 'user.view_students')).toBe(false);
    expect(getRefreshCookieOptions(testConfig)).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/api/v1/auth',
    });
    expect(getClearRefreshCookieOptions(testConfig)).not.toHaveProperty('maxAge');
  });

  it('maps validation and duplicate-key errors without leaking input', () => {
    const schema = z.object({ name: z.string().min(2) }).strict();
    expect(parseWithSchema(schema, { name: 'Valid' })).toEqual({ name: 'Valid' });
    expect(() => parseWithSchema(schema, { name: '' })).toThrow('Request data is invalid');
    expect(isMongoDuplicateKeyError({ code: 11_000 })).toBe(true);
    expect(isMongoDuplicateKeyError(new Error('other'))).toBe(false);
  });
});
