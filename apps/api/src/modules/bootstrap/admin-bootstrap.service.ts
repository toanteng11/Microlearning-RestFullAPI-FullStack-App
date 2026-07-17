import type { HydratedDocument } from 'mongoose';

import { hashPassword } from '../../shared/auth/password.js';
import { isMongoDuplicateKeyError } from '../../shared/database/mongo-errors.js';
import { withMongoTransaction } from '../../shared/database/unit-of-work.js';
import { AppError } from '../../shared/errors/app-error.js';
import {
  normalizeEmail,
  normalizeFullName,
  normalizeFullNameForSearch,
} from '../../shared/identity/normalization.js';
import type { AuditLogRepository } from '../audit/audit-log.repository.js';
import type { SystemGuardRepository } from '../system-guards/system-guard.repository.js';
import type { UserRepository } from '../users/user.repository.js';
import type { UserRecord } from '../users/user.types.js';

export interface BootstrapAdminInput {
  email: string;
  fullName: string;
  password: string;
  requestId: string;
}

function safeUser(user: HydratedDocument<UserRecord>) {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    status: user.status,
  };
}

function isIdempotentSuperAdmin(user: HydratedDocument<UserRecord>) {
  return user.role === 'SUPER_ADMIN' && user.status === 'ACTIVE';
}

export class AdminBootstrapService {
  constructor(
    private readonly enabled: boolean,
    private readonly users: UserRepository,
    private readonly audits: AuditLogRepository,
    private readonly systemGuards: SystemGuardRepository,
  ) {}

  async execute(input: BootstrapAdminInput) {
    if (!this.enabled) {
      throw new AppError(
        403,
        'BOOTSTRAP_DISABLED',
        'Super Admin bootstrap is disabled by environment policy',
      );
    }

    const email = normalizeEmail(input.email);
    const fullName = normalizeFullName(input.fullName);
    const passwordHash = await hashPassword(input.password);
    await this.systemGuards.ensureSuperAdminGovernance();

    try {
      return await withMongoTransaction(async (session) => {
        await this.systemGuards.touchSuperAdminGovernance(session);
        const existingByEmail = await this.users.findByEmail(email, session);
        if (existingByEmail) {
          if (isIdempotentSuperAdmin(existingByEmail)) {
            return { created: false, user: safeUser(existingByEmail), auditId: null };
          }
          throw new AppError(
            409,
            'BOOTSTRAP_IDENTITY_CONFLICT',
            'Bootstrap email belongs to an incompatible account',
          );
        }

        const activeSuperAdmin = await this.users.findActiveSuperAdmin(session);
        if (activeSuperAdmin) {
          throw new AppError(
            409,
            'ACTIVE_SUPER_ADMIN_EXISTS',
            'An active Super Admin already exists; use governed account administration',
          );
        }

        const user = await this.users.create(
          {
            email,
            fullName,
            fullNameNormalized: normalizeFullNameForSearch(fullName),
            passwordHash,
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
            registrationSource: 'ADMIN_BOOTSTRAP',
            activatedAt: new Date(),
          },
          session,
        );
        const audit = await this.audits.append(
          {
            actorId: null,
            actorRole: 'SYSTEM',
            action: 'SUPER_ADMIN_BOOTSTRAPPED',
            resourceType: 'USER',
            resourceId: user._id.toString(),
            requestId: input.requestId,
            metadata: { email, source: 'ADMIN_BOOTSTRAP' },
          },
          session,
        );
        return { created: true, user: safeUser(user), auditId: audit._id.toString() };
      });
    } catch (error) {
      if (isMongoDuplicateKeyError(error)) {
        const current = await this.users.findByEmail(email);
        if (current && isIdempotentSuperAdmin(current)) {
          return { created: false, user: safeUser(current), auditId: null };
        }
        throw new AppError(
          409,
          'BOOTSTRAP_IDENTITY_CONFLICT',
          'Bootstrap identity changed concurrently',
        );
      }
      throw error;
    }
  }
}
