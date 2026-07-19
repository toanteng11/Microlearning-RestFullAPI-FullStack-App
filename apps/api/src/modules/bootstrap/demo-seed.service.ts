import type { AppConfig } from '../../shared/config/environment.js';
import { hashPassword } from '../../shared/auth/password.js';
import { AppError } from '../../shared/errors/app-error.js';
import { normalizeFullNameForSearch } from '../../shared/identity/normalization.js';
import type { UserRepository } from '../users/user.repository.js';
import type { RegistrationSource, UserRole, UserStatus } from '../users/user.types.js';

interface DemoIdentity {
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  registrationSource: RegistrationSource;
}

export const DEMO_IDENTITIES: readonly DemoIdentity[] = [
  {
    email: 'student.active@example.test',
    fullName: 'Demo Student Active',
    role: 'STUDENT',
    status: 'ACTIVE',
    registrationSource: 'SELF_REGISTRATION',
  },
  {
    email: 'student.active.2@example.test',
    fullName: 'Demo Student Active Two',
    role: 'STUDENT',
    status: 'ACTIVE',
    registrationSource: 'SELF_REGISTRATION',
  },
  {
    email: 'student.active.3@example.test',
    fullName: 'Demo Student Active Three',
    role: 'STUDENT',
    status: 'ACTIVE',
    registrationSource: 'SELF_REGISTRATION',
  },
  {
    email: 'student.active.4@example.test',
    fullName: 'Demo Student Active Four',
    role: 'STUDENT',
    status: 'ACTIVE',
    registrationSource: 'SELF_REGISTRATION',
  },
  {
    email: 'student.blocked@example.test',
    fullName: 'Demo Student Blocked',
    role: 'STUDENT',
    status: 'BLOCKED',
    registrationSource: 'SELF_REGISTRATION',
  },
  {
    email: 'teacher.active@example.test',
    fullName: 'Demo Teacher Active',
    role: 'TEACHER',
    status: 'ACTIVE',
    registrationSource: 'TEACHER_INVITATION',
  },
  {
    email: 'teacher.active.2@example.test',
    fullName: 'Demo Teacher Active Two',
    role: 'TEACHER',
    status: 'ACTIVE',
    registrationSource: 'TEACHER_INVITATION',
  },
  {
    email: 'teacher.blocked@example.test',
    fullName: 'Demo Teacher Blocked',
    role: 'TEACHER',
    status: 'BLOCKED',
    registrationSource: 'TEACHER_INVITATION',
  },
  {
    email: 'admin.active@example.test',
    fullName: 'Demo Admin Active',
    role: 'ADMIN',
    status: 'ACTIVE',
    registrationSource: 'ADMIN_BOOTSTRAP',
  },
  {
    email: 'superadmin.active@example.test',
    fullName: 'Demo Super Admin Active',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    registrationSource: 'ADMIN_BOOTSTRAP',
  },
] as const;

export class DemoSeedService {
  constructor(
    private readonly environment: AppConfig['appEnvironment'],
    private readonly users: UserRepository,
  ) {}

  async execute(password: string) {
    if (this.environment === 'production') {
      throw new AppError(403, 'DEMO_SEED_DISABLED', 'Demo seed is disabled in production');
    }

    const passwordHash = await hashPassword(password);
    const results: Array<{
      id: string;
      email: string;
      role: UserRole;
      status: UserStatus;
      created: boolean;
    }> = [];

    for (const identity of DEMO_IDENTITIES) {
      const existing = await this.users.findByEmail(identity.email);
      if (existing) {
        if (existing.role !== identity.role || existing.status !== identity.status) {
          throw new AppError(
            409,
            'DEMO_SEED_IDENTITY_CONFLICT',
            `Demo identity ${identity.email} has incompatible role or status`,
          );
        }
        results.push({
          id: existing._id.toString(),
          email: existing.email,
          role: existing.role,
          status: existing.status,
          created: false,
        });
        continue;
      }

      const user = await this.users.create({
        ...identity,
        fullNameNormalized: normalizeFullNameForSearch(identity.fullName),
        passwordHash,
        activatedAt: identity.status === 'ACTIVE' ? new Date() : undefined,
      });
      results.push({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        status: user.status,
        created: true,
      });
    }

    return {
      createdCount: results.filter((item) => item.created).length,
      reusedCount: results.filter((item) => !item.created).length,
      users: results,
    };
  }
}
