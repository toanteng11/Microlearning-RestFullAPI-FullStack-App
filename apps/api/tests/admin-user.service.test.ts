import { Types, type HydratedDocument } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminUserService } from '../src/modules/admin-users/admin-user.service.js';
import type { AuditLogRepository } from '../src/modules/audit/audit-log.repository.js';
import type { AuthenticatedUser } from '../src/modules/auth/auth.types.js';
import type { AuthSessionRepository } from '../src/modules/sessions/auth-session.repository.js';
import type { SystemGuardRepository } from '../src/modules/system-guards/system-guard.repository.js';
import type { UserRepository } from '../src/modules/users/user.repository.js';
import type { UserRecord } from '../src/modules/users/user.types.js';
import { getCapabilities } from '../src/shared/auth/permissions.js';

vi.mock('../src/shared/database/unit-of-work.js', () => ({
  withMongoTransaction: async <T>(operation: (session: never) => Promise<T>) =>
    operation({} as never),
}));

const baseDate = new Date('2026-07-17T08:00:00.000Z');

function user(overrides: Partial<UserRecord> = {}): HydratedDocument<UserRecord> {
  return {
    _id: new Types.ObjectId(),
    email: 'student@example.com',
    fullName: 'Student Example',
    fullNameNormalized: 'student example',
    passwordHash: 'not-selected',
    role: 'STUDENT',
    status: 'ACTIVE',
    registrationSource: 'SELF_REGISTRATION',
    studentCode: null,
    department: null,
    avatarUrl: null,
    activatedAt: null,
    lastLoginAt: null,
    lastActiveAt: null,
    createdAt: baseDate,
    updatedAt: baseDate,
    ...overrides,
  } as HydratedDocument<UserRecord>;
}

function actor(role: AuthenticatedUser['role']): AuthenticatedUser {
  return {
    id: new Types.ObjectId().toString(),
    role,
    status: 'ACTIVE',
    familyId: 'family-one',
    capabilities: getCapabilities(role),
  };
}

describe('AdminUserService', () => {
  const users = {
    listByRoles: vi.fn(),
    findById: vi.fn(),
    updateStatus: vi.fn(),
    updateRole: vi.fn(),
    countActiveSuperAdmins: vi.fn(),
  };
  const sessions = { revokeAllForUser: vi.fn() };
  const audits = { append: vi.fn() };
  const guards = {
    ensureSuperAdminGovernance: vi.fn(),
    touchSuperAdminGovernance: vi.fn(),
  };

  const service = new AdminUserService(
    users as unknown as UserRepository,
    sessions as unknown as AuthSessionRepository,
    audits as unknown as AuditLogRepository,
    guards as unknown as SystemGuardRepository,
    () => new Date('2026-07-17T09:00:00.000Z'),
  );

  beforeEach(() => {
    vi.clearAllMocks();
    guards.ensureSuperAdminGovernance.mockResolvedValue(undefined);
    guards.touchSuperAdminGovernance.mockResolvedValue(undefined);
    sessions.revokeAllForUser.mockResolvedValue(1);
    audits.append.mockResolvedValue({ _id: new Types.ObjectId() });
    users.countActiveSuperAdmins.mockResolvedValue(2);
  });

  it('returns a role-fixed paginated projection and rejects a scope-invalid sort', async () => {
    users.listByRoles.mockResolvedValue({
      items: [user({ studentCode: 'ST-001' })],
      totalItems: 21,
    });
    const result = await service.list('students', {
      page: 2,
      limit: 20,
      keyword: 'Stúdent',
      status: 'ACTIVE',
      sortBy: 'fullName',
      sortOrder: 'asc',
    });

    expect(users.listByRoles).toHaveBeenCalledWith(
      expect.objectContaining({ roles: ['STUDENT'], keyword: 'student' }),
    );
    expect(result.data[0]).toMatchObject({ studentCode: 'ST-001', status: 'ACTIVE' });
    expect(result.pagination).toMatchObject({ totalPages: 2, hasPreviousPage: true });
    expect(JSON.stringify(result)).not.toContain('passwordHash');

    await expect(
      service.list('students', {
        page: 1,
        limit: 20,
        sortBy: 'role',
        sortOrder: 'desc',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('authorizes detail by target role and returns computed actions', async () => {
    const target = user({ role: 'TEACHER', registrationSource: 'TEACHER_INVITATION' });
    users.findById.mockResolvedValue(target);
    const detail = await service.getDetail(actor('ADMIN'), target._id.toString());
    expect(detail.allowedActions).toEqual(['STATUS_BLOCK', 'STATUS_DEACTIVATE']);
    expect(detail).not.toHaveProperty('passwordHash');

    await expect(service.getDetail(actor('STUDENT'), target._id.toString())).rejects.toMatchObject({
      code: 'ACCESS_DENIED',
    });
    users.findById.mockResolvedValueOnce(null);
    await expect(service.getDetail(actor('ADMIN'), target._id.toString())).rejects.toMatchObject({
      code: 'RESOURCE_NOT_FOUND',
    });
  });

  it('changes Student status with optimistic locking, session revoke, and audit', async () => {
    const admin = actor('ADMIN');
    const target = user();
    const updated = user({ _id: target._id, status: 'BLOCKED', updatedAt: new Date() });
    users.findById.mockResolvedValue(target);
    users.updateStatus.mockResolvedValue(updated);

    const result = await service.changeStatus(
      admin,
      target._id.toString(),
      { status: 'BLOCKED', reason: 'Policy violation', expectedUpdatedAt: baseDate.toISOString() },
      'request-one',
    );

    expect(users.updateStatus).toHaveBeenCalledWith(
      target._id.toString(),
      baseDate,
      'BLOCKED',
      new Date('2026-07-17T09:00:00.000Z'),
      expect.anything(),
    );
    expect(sessions.revokeAllForUser).toHaveBeenCalledWith(
      target._id.toString(),
      'ACCOUNT_STATUS',
      expect.any(Date),
      expect.anything(),
    );
    expect(audits.append).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'USER_STATUS_CHANGED',
        oldValue: { status: 'ACTIVE' },
        newValue: { status: 'BLOCKED' },
      }),
      expect.anything(),
    );
    expect(result.user.status).toBe('BLOCKED');
  });

  it('blocks self-management, invalid status transitions, stale versions, and final Super Admin removal', async () => {
    const target = user();
    users.findById.mockResolvedValue(target);
    const self = { ...actor('ADMIN'), id: target._id.toString() };
    const input = {
      status: 'BLOCKED' as const,
      reason: 'Security review',
      expectedUpdatedAt: baseDate.toISOString(),
    };
    await expect(
      service.changeStatus(self, target._id.toString(), input, 'one'),
    ).rejects.toMatchObject({ code: 'ACCESS_DENIED' });

    users.findById.mockResolvedValue(target);
    await expect(
      service.changeStatus(
        actor('ADMIN'),
        target._id.toString(),
        { ...input, status: 'ACTIVE' },
        'two',
      ),
    ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION' });

    users.findById.mockResolvedValue(target);
    await expect(
      service.changeStatus(
        actor('ADMIN'),
        target._id.toString(),
        { ...input, expectedUpdatedAt: new Date(0).toISOString() },
        'three',
      ),
    ).rejects.toMatchObject({ code: 'CONCURRENT_MODIFICATION' });

    const superTarget = user({ role: 'SUPER_ADMIN' });
    users.findById.mockResolvedValue(superTarget);
    users.countActiveSuperAdmins.mockResolvedValue(1);
    await expect(
      service.changeStatus(
        actor('SUPER_ADMIN'),
        superTarget._id.toString(),
        { ...input, expectedUpdatedAt: superTarget.updatedAt.toISOString() },
        'four',
      ),
    ).rejects.toMatchObject({ code: 'FINAL_SUPER_ADMIN_REQUIRED' });
  });

  it('allows only Super Admin role transitions and revokes the target sessions', async () => {
    const target = user({ role: 'ADMIN' });
    const updated = user({ _id: target._id, role: 'SUPER_ADMIN', updatedAt: new Date() });
    users.findById.mockResolvedValue(target);
    users.updateRole.mockResolvedValue(updated);
    const input = {
      role: 'SUPER_ADMIN' as const,
      reason: 'Approved promotion',
      expectedUpdatedAt: baseDate.toISOString(),
    };

    await expect(
      service.changeRole(actor('ADMIN'), target._id.toString(), input, 'request-one'),
    ).rejects.toMatchObject({ code: 'ACCESS_DENIED' });

    const result = await service.changeRole(
      actor('SUPER_ADMIN'),
      target._id.toString(),
      input,
      'request-two',
    );
    expect(guards.touchSuperAdminGovernance).toHaveBeenCalled();
    expect(sessions.revokeAllForUser).toHaveBeenCalledWith(
      target._id.toString(),
      'ADMIN',
      expect.any(Date),
      expect.anything(),
    );
    expect(result.user.role).toBe('SUPER_ADMIN');
  });
});
