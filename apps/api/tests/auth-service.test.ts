import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../src/modules/auth/auth.service.js';
import type { AuthLoginStateRepository } from '../src/modules/auth/auth-login-state.repository.js';
import type { AuthSessionRepository } from '../src/modules/sessions/auth-session.repository.js';
import type { UserRepository } from '../src/modules/users/user.repository.js';
import type { UserRecord } from '../src/modules/users/user.types.js';
import { hashPassword } from '../src/shared/auth/password.js';
import { testConfig } from './test-fixtures.js';

const now = new Date('2026-07-17T10:00:00.000Z');
const userId = new Types.ObjectId();

function buildUser(overrides: Partial<UserRecord> = {}): UserRecord {
  return {
    _id: userId,
    email: 'student@example.com',
    fullName: 'Student Example',
    fullNameNormalized: 'student example',
    passwordHash: '',
    role: 'STUDENT',
    status: 'ACTIVE',
    registrationSource: 'SELF_REGISTRATION',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('AuthService', () => {
  const users = {
    create: vi.fn(),
    findCredentialByEmail: vi.fn(),
    updateLastLogin: vi.fn(),
  };
  const sessions = { create: vi.fn() };
  const loginStates = {
    getLockedUntil: vi.fn(),
    recordFailure: vi.fn(),
    reset: vi.fn(),
  };

  function createService() {
    return new AuthService(
      testConfig,
      users as unknown as UserRepository,
      sessions as unknown as AuthSessionRepository,
      loginStates as unknown as AuthLoginStateRepository,
      () => now,
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    loginStates.getLockedUntil.mockResolvedValue(null);
    loginStates.recordFailure.mockResolvedValue(null);
    loginStates.reset.mockResolvedValue(undefined);
    users.updateLastLogin.mockResolvedValue(undefined);
  });

  it('registers only an ACTIVE Student and returns no capabilities or credential', async () => {
    users.create.mockImplementation(async (input: object) => buildUser(input));
    const result = await createService().registerStudent({
      fullName: ' Student Example ',
      email: ' STUDENT@example.com ',
      password: 'StrongPassword123!',
      confirmPassword: 'StrongPassword123!',
    });

    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'student@example.com',
        role: 'STUDENT',
        status: 'ACTIVE',
        registrationSource: 'SELF_REGISTRATION',
        passwordHash: expect.stringMatching(/^\$argon2id\$/u),
      }),
    );
    expect(result).not.toHaveProperty('passwordHash');
    expect(result).not.toHaveProperty('capabilities');
  });

  it('rejects password mismatch before persistence', async () => {
    await expect(
      createService().registerStudent({
        fullName: 'Student Example',
        email: 'student@example.com',
        password: 'StrongPassword123!',
        confirmPassword: 'DifferentPassword123!',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(users.create).not.toHaveBeenCalled();
  });

  it('returns generic invalid credentials and records identity failure', async () => {
    users.findCredentialByEmail.mockResolvedValue(null);
    await expect(
      createService().login({ email: 'missing@example.com', password: 'WrongPassword123!' }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS', statusCode: 401 });
    expect(loginStates.recordFailure).toHaveBeenCalledOnce();
  });

  it('blocks login during cooldown without reading credentials', async () => {
    loginStates.getLockedUntil.mockResolvedValue(new Date(now.getTime() + 60_000));
    await expect(
      createService().login({ email: 'student@example.com', password: 'StrongPassword123!' }),
    ).rejects.toMatchObject({ code: 'RATE_LIMITED', statusCode: 429 });
    expect(users.findCredentialByEmail).not.toHaveBeenCalled();
  });

  it('rejects a valid password for a non-active account', async () => {
    const passwordHash = await hashPassword('StrongPassword123!');
    users.findCredentialByEmail.mockResolvedValue(buildUser({ passwordHash, status: 'BLOCKED' }));
    await expect(
      createService().login({ email: 'student@example.com', password: 'StrongPassword123!' }),
    ).rejects.toMatchObject({ code: 'ACCOUNT_NOT_ACTIVE', statusCode: 403 });
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it('creates an opaque refresh session and access context for ACTIVE user', async () => {
    const passwordHash = await hashPassword('StrongPassword123!');
    users.findCredentialByEmail.mockResolvedValue(buildUser({ passwordHash }));
    sessions.create.mockResolvedValue({});

    const result = await createService().login({
      email: 'student@example.com',
      password: 'StrongPassword123!',
    });

    expect(sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        familyId: expect.any(String),
        tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
      }),
    );
    expect(result.refreshToken).not.toBe(result.accessToken);
    expect(result.user.capabilities).toEqual(['profile.update_own', 'profile.view_own']);
  });
});
