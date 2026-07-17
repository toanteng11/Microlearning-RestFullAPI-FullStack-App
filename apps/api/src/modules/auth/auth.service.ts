import { randomUUID } from 'node:crypto';

import type { ClientSession } from 'mongoose';
import type { AppConfig } from '../../shared/config/environment.js';
import { isMongoDuplicateKeyError } from '../../shared/database/mongo-errors.js';
import { withMongoTransaction } from '../../shared/database/unit-of-work.js';
import { AppError } from '../../shared/errors/app-error.js';
import {
  createIdentityKey,
  normalizeEmail,
  normalizeFullName,
  normalizeFullNameForSearch,
} from '../../shared/identity/normalization.js';
import { AccessTokenService } from '../../shared/auth/access-token.js';
import { getCapabilities } from '../../shared/auth/permissions.js';
import { hashOpaqueToken, generateOpaqueToken } from '../../shared/auth/opaque-token.js';
import { hashPassword, verifyPassword } from '../../shared/auth/password.js';
import type { AuthLoginStateRepository } from './auth-login-state.repository.js';
import type { AuthSessionRepository } from '../sessions/auth-session.repository.js';
import type { UserRepository } from '../users/user.repository.js';
import { toUserSummary, type UserRecord, type UserSummary } from '../users/user.types.js';
import type { AuthTokenResult, UserContext } from './auth.types.js';
import type { LoginRequest, RegisterRequest } from './auth.schemas.js';

const DUMMY_PASSWORD = 'SyntheticPasswordNeverUsed123!';
const dummyPasswordHash = hashPassword(DUMMY_PASSWORD);
type TransactionRunner = <T>(operation: (session: ClientSession) => Promise<T>) => Promise<T>;

function toUserContext(user: UserRecord): UserContext {
  return {
    ...toUserSummary(user),
    capabilities: getCapabilities(user.role),
  };
}

export class AuthService {
  private readonly accessTokens: AccessTokenService;

  constructor(
    private readonly config: AppConfig,
    private readonly users: UserRepository,
    private readonly sessions: AuthSessionRepository,
    private readonly loginStates: AuthLoginStateRepository,
    private readonly now: () => Date = () => new Date(),
    private readonly transaction: TransactionRunner = withMongoTransaction,
  ) {
    this.accessTokens = new AccessTokenService({
      secret: config.accessTokenSecret,
      issuer: config.accessTokenIssuer,
      audience: config.accessTokenAudience,
      ttlSeconds: config.accessTokenTtlSeconds,
      now,
    });
  }

  get accessTokenService(): AccessTokenService {
    return this.accessTokens;
  }

  async registerStudent(input: RegisterRequest): Promise<UserSummary> {
    const email = normalizeEmail(input.email);
    const fullName = normalizeFullName(input.fullName);

    if (input.password !== input.confirmPassword) {
      throw new AppError(422, 'VALIDATION_ERROR', 'Password confirmation does not match', [
        {
          field: 'confirmPassword',
          code: 'PASSWORD_MISMATCH',
          message: 'Password confirmation does not match',
        },
      ]);
    }

    const passwordHash = await hashPassword(input.password);

    try {
      const user = await this.users.create({
        email,
        fullName,
        fullNameNormalized: normalizeFullNameForSearch(fullName),
        passwordHash,
        role: 'STUDENT',
        status: 'ACTIVE',
        registrationSource: 'SELF_REGISTRATION',
      });
      return toUserSummary(user);
    } catch (error) {
      if (isMongoDuplicateKeyError(error)) {
        throw new AppError(409, 'DUPLICATE_RESOURCE', 'An account already uses this email');
      }
      throw error;
    }
  }

  async login(input: LoginRequest): Promise<AuthTokenResult> {
    const email = normalizeEmail(input.email);
    const identityKey = createIdentityKey(email, this.config.authIdentityPepper);
    const now = this.now();
    const lockedUntil = await this.loginStates.getLockedUntil(identityKey, now);

    if (lockedUntil) {
      throw new AppError(429, 'RATE_LIMITED', 'Too many login attempts. Try again later');
    }

    const user = await this.users.findCredentialByEmail(email);
    const passwordMatches = await verifyPassword(
      user?.passwordHash ?? (await dummyPasswordHash),
      input.password,
    );

    if (!user || !passwordMatches) {
      await this.loginStates.recordFailure(identityKey, now, {
        windowSeconds: this.config.rateLimits.loginFailureWindowSeconds,
        maxAttempts: this.config.rateLimits.loginFailureMaxAttempts,
        cooldownSeconds: this.config.rateLimits.loginCooldownSeconds,
      });
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
    }

    await this.loginStates.reset(identityKey);
    if (user.status !== 'ACTIVE') {
      throw new AppError(403, 'ACCOUNT_NOT_ACTIVE', 'Account is not active');
    }

    const refreshToken = generateOpaqueToken();
    const familyId = randomUUID();
    const expiresAt = new Date(now.getTime() + this.config.refreshTokenTtlSeconds * 1000);
    await this.sessions.create({
      userId: user._id,
      familyId,
      tokenHash: hashOpaqueToken(refreshToken),
      expiresAt,
    });
    await this.users.updateLastLogin(user._id, now);

    return {
      accessToken: await this.accessTokens.sign(user._id.toString(), familyId),
      refreshToken,
      expiresInSeconds: this.config.accessTokenTtlSeconds,
      user: toUserContext(user),
    };
  }

  async refresh(rawRefreshToken: string | undefined): Promise<AuthTokenResult> {
    if (!rawRefreshToken) {
      throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required');
    }

    const now = this.now();
    const replacementToken = generateOpaqueToken();
    const replacementHash = hashOpaqueToken(replacementToken);
    const tokenHash = hashOpaqueToken(rawRefreshToken);

    const outcome = await this.transaction(async (session) => {
      const current = await this.sessions.findByTokenHash(tokenHash, session);
      if (!current) return { kind: 'INVALID' } as const;

      if (current.status === 'ROTATED') {
        const rotatedAt = current.rotatedAt?.getTime() ?? 0;
        const withinGrace =
          now.getTime() - rotatedAt <= this.config.refreshReuseGraceSeconds * 1000;
        if (withinGrace) return { kind: 'RACE' } as const;

        await this.sessions.revokeFamily(current.familyId, 'REUSE', now, session);
        return { kind: 'REUSE' } as const;
      }

      if (current.status !== 'ACTIVE' || current.expiresAt <= now) {
        if (current.status === 'ACTIVE') {
          await this.sessions.revokeFamily(current.familyId, 'EXPIRED', now, session);
        }
        return { kind: 'INVALID' } as const;
      }

      const user = await this.users.findById(current.userId.toString(), session);
      if (!user || user.status !== 'ACTIVE') {
        await this.sessions.revokeFamily(current.familyId, 'ACCOUNT_STATUS', now, session);
        return { kind: 'ACCOUNT_NOT_ACTIVE' } as const;
      }

      const replacement = await this.sessions.create(
        {
          userId: current.userId,
          familyId: current.familyId,
          tokenHash: replacementHash,
          expiresAt: new Date(now.getTime() + this.config.refreshTokenTtlSeconds * 1000),
        },
        session,
      );
      const rotated = await this.sessions.rotate(current._id, replacement._id, now, session);
      if (!rotated) {
        throw new AppError(409, 'REFRESH_RACE_RETRY', 'Refresh already completed; retry once');
      }

      return { kind: 'SUCCESS', user, familyId: current.familyId } as const;
    });

    switch (outcome.kind) {
      case 'RACE':
        throw new AppError(409, 'REFRESH_RACE_RETRY', 'Refresh already completed; retry once');
      case 'REUSE':
        throw new AppError(409, 'REFRESH_TOKEN_REUSE_DETECTED', 'Refresh token reuse was detected');
      case 'ACCOUNT_NOT_ACTIVE':
        throw new AppError(403, 'ACCOUNT_NOT_ACTIVE', 'Account is not active');
      case 'INVALID':
        throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required');
      case 'SUCCESS':
        return {
          accessToken: await this.accessTokens.sign(outcome.user._id.toString(), outcome.familyId),
          refreshToken: replacementToken,
          expiresInSeconds: this.config.accessTokenTtlSeconds,
          user: toUserContext(outcome.user),
        };
    }
  }

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    if (!rawRefreshToken) return;

    const current = await this.sessions.findByTokenHash(hashOpaqueToken(rawRefreshToken));
    if (!current) return;
    await this.sessions.revokeFamily(current.familyId, 'LOGOUT', this.now());
  }
}
