import { randomUUID } from 'node:crypto';

import type { AppConfig } from '../../shared/config/environment.js';
import { isMongoDuplicateKeyError } from '../../shared/database/mongo-errors.js';
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
}
