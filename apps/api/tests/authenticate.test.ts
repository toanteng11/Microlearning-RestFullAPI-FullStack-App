import type { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthSessionRepository } from '../src/modules/sessions/auth-session.repository.js';
import type { UserRepository } from '../src/modules/users/user.repository.js';
import type { UserRecord } from '../src/modules/users/user.types.js';
import type { AccessTokenService } from '../src/shared/auth/access-token.js';
import {
  createAuthenticateMiddleware,
  requirePermission,
} from '../src/shared/auth/authenticate.js';

const now = new Date('2026-07-17T10:00:00.000Z');

function buildUser(status: UserRecord['status'] = 'ACTIVE'): UserRecord {
  return {
    _id: new Types.ObjectId(),
    email: 'student@example.com',
    fullName: 'Student Example',
    fullNameNormalized: 'student example',
    passwordHash: 'not-selected',
    role: 'STUDENT',
    status,
    registrationSource: 'SELF_REGISTRATION',
    createdAt: now,
    updatedAt: now,
  };
}

describe('authentication middleware', () => {
  const accessTokens = { verify: vi.fn() };
  const users = { findById: vi.fn() };
  const sessions = { hasActiveFamily: vi.fn() };
  const next = vi.fn() as NextFunction;

  async function invoke(authorization?: string) {
    const request = {
      header: vi.fn().mockReturnValue(authorization),
    } as unknown as Request;
    const middleware = createAuthenticateMiddleware(
      accessTokens as unknown as AccessTokenService,
      users as unknown as UserRepository,
      sessions as unknown as AuthSessionRepository,
      () => now,
    ) as (request: Request, response: Response, next: NextFunction) => Promise<void>;
    await middleware(request, {} as Response, next);
    return request;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    accessTokens.verify.mockResolvedValue({ userId: 'user-id', familyId: 'family-id' });
    users.findById.mockResolvedValue(buildUser());
    sessions.hasActiveFamily.mockResolvedValue(true);
  });

  it('rejects missing and invalid bearer tokens generically', async () => {
    await invoke();
    expect(next).toHaveBeenLastCalledWith(
      expect.objectContaining({ code: 'AUTHENTICATION_REQUIRED' }),
    );

    accessTokens.verify.mockRejectedValue(new Error('invalid'));
    await invoke('Bearer invalid-token');
    expect(next).toHaveBeenLastCalledWith(
      expect.objectContaining({ code: 'AUTHENTICATION_REQUIRED' }),
    );
  });

  it('rejects missing, inactive and session-revoked users', async () => {
    users.findById.mockResolvedValue(null);
    await invoke('Bearer token');
    expect(next).toHaveBeenLastCalledWith(expect.objectContaining({ statusCode: 401 }));

    users.findById.mockResolvedValue(buildUser('BLOCKED'));
    await invoke('Bearer token');
    expect(next).toHaveBeenLastCalledWith(expect.objectContaining({ code: 'ACCOUNT_NOT_ACTIVE' }));

    users.findById.mockResolvedValue(buildUser());
    sessions.hasActiveFamily.mockResolvedValue(false);
    await invoke('Bearer token');
    expect(next).toHaveBeenLastCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('attaches current role capabilities only after every guard passes', async () => {
    const request = await invoke('Bearer token');
    expect(request.auth).toMatchObject({
      role: 'STUDENT',
      familyId: 'family-id',
      capabilities: [
        'classroom.join',
        'classroom.view_enrolled',
        'learning.complete_own',
        'learning.view_enrolled',
        'profile.update_own',
        'profile.view_own',
      ],
    });
    expect(next).toHaveBeenLastCalledWith();
  });

  it('enforces permissions independently of frontend visibility', () => {
    const allowedNext = vi.fn();
    requirePermission('profile.view_own')(
      {
        auth: {
          id: 'user-id',
          role: 'STUDENT',
          status: 'ACTIVE',
          familyId: 'family-id',
          capabilities: [],
        },
      } as unknown as Request,
      {} as Response,
      allowedNext,
    );
    expect(allowedNext).toHaveBeenCalledWith();

    const deniedNext = vi.fn();
    requirePermission('user.view_students')(
      {
        auth: {
          id: 'user-id',
          role: 'STUDENT',
          status: 'ACTIVE',
          familyId: 'family-id',
          capabilities: [],
        },
      } as unknown as Request,
      {} as Response,
      deniedNext,
    );
    expect(deniedNext).toHaveBeenCalledWith(expect.objectContaining({ code: 'ACCESS_DENIED' }));
  });
});
