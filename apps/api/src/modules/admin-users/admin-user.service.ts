import { type HydratedDocument, Types } from 'mongoose';

import type { AuditLogRepository } from '../audit/audit-log.repository.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { AuthSessionRepository } from '../sessions/auth-session.repository.js';
import type { SystemGuardRepository } from '../system-guards/system-guard.repository.js';
import type { UserRepository } from '../users/user.repository.js';
import type { UserRecord, UserRole, UserStatus } from '../users/user.types.js';
import type { ClassroomOwnershipReader } from '../classrooms/classroom-ownership.reader.js';
import { hasPermission, type Permission } from '../../shared/auth/permissions.js';
import { withMongoTransaction } from '../../shared/database/unit-of-work.js';
import { AppError } from '../../shared/errors/app-error.js';
import { normalizeFullNameForSearch } from '../../shared/identity/normalization.js';
import {
  type AdminUserListQueryInput,
  type ChangeUserRoleInput,
  type ChangeUserStatusInput,
} from './admin-user.schemas.js';

export type AdminUserListScope = 'students' | 'teachers' | 'admins';

type UserDocument = HydratedDocument<UserRecord>;

const SCOPE_ROLES: Record<AdminUserListScope, UserRole[]> = {
  students: ['STUDENT'],
  teachers: ['TEACHER'],
  admins: ['ADMIN', 'SUPER_ADMIN'],
};

const SCOPE_SORT_FIELDS: Record<AdminUserListScope, readonly string[]> = {
  students: ['fullName', 'email', 'status', 'lastActiveAt', 'createdAt'],
  teachers: ['fullName', 'email', 'status', 'department', 'lastActiveAt', 'createdAt'],
  admins: ['fullName', 'email', 'role', 'status', 'lastActiveAt', 'createdAt'],
};

const TARGET_VIEW_PERMISSION: Record<UserRole, Permission> = {
  STUDENT: 'user.view_students',
  TEACHER: 'user.view_teachers',
  ADMIN: 'user.view_admins',
  SUPER_ADMIN: 'user.view_admins',
};

const STATUS_TRANSITIONS: Record<UserStatus, readonly UserStatus[]> = {
  PENDING: [],
  ACTIVE: ['BLOCKED', 'INACTIVE'],
  BLOCKED: ['ACTIVE'],
  INACTIVE: ['ACTIVE'],
  DELETED: [],
};

const ROLE_TRANSITIONS: Record<UserRole, readonly UserRole[]> = {
  STUDENT: ['ADMIN'],
  TEACHER: ['ADMIN'],
  ADMIN: ['STUDENT', 'TEACHER', 'SUPER_ADMIN'],
  SUPER_ADMIN: ['ADMIN'],
};

function iso(value?: Date | null): string | null {
  return value?.toISOString() ?? null;
}

function baseListItem(user: UserDocument) {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    status: user.status,
    lastActiveAt: iso(user.lastActiveAt),
    createdAt: user.createdAt.toISOString(),
  };
}

function toListItem(scope: AdminUserListScope, user: UserDocument) {
  const base = baseListItem(user);
  if (scope === 'students') return { ...base, studentCode: user.studentCode ?? null };
  if (scope === 'teachers') {
    return {
      ...base,
      department: user.department ?? null,
      registrationSource: user.registrationSource,
      activatedAt: iso(user.activatedAt),
    };
  }
  return { ...base, role: user.role, department: user.department ?? null };
}

function canManageStatus(actor: AuthenticatedUser, target: UserDocument): boolean {
  if (actor.id === target._id.toString() || target.status === 'DELETED') return false;
  if (actor.role === 'SUPER_ADMIN') return true;
  return actor.role === 'ADMIN' && (target.role === 'STUDENT' || target.role === 'TEACHER');
}

function allowedActions(actor: AuthenticatedUser, target: UserDocument): string[] {
  const actions: string[] = [];
  if (canManageStatus(actor, target)) {
    if (target.status === 'ACTIVE') actions.push('STATUS_BLOCK', 'STATUS_DEACTIVATE');
    if (target.status === 'BLOCKED' || target.status === 'INACTIVE') {
      actions.push('STATUS_ACTIVATE');
    }
  }
  if (
    actor.role === 'SUPER_ADMIN' &&
    actor.id !== target._id.toString() &&
    target.status !== 'DELETED' &&
    ROLE_TRANSITIONS[target.role].length > 0
  ) {
    actions.push('ROLE_CHANGE');
  }
  return actions;
}

function toDetail(actor: AuthenticatedUser, user: UserDocument) {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    status: user.status,
    avatarUrl: user.avatarUrl ?? null,
    studentCode: user.studentCode ?? null,
    department: user.department ?? null,
    registrationSource: user.registrationSource,
    activatedAt: iso(user.activatedAt),
    lastLoginAt: iso(user.lastLoginAt),
    lastActiveAt: iso(user.lastActiveAt),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    allowedActions: allowedActions(actor, user),
  };
}

function assertExpectedVersion(target: UserDocument, expectedUpdatedAt: string): Date {
  const expected = new Date(expectedUpdatedAt);
  if (target.updatedAt.getTime() !== expected.getTime()) {
    throw new AppError(409, 'CONCURRENT_MODIFICATION', 'User was modified by another request');
  }
  return expected;
}

export class AdminUserService {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: AuthSessionRepository,
    private readonly audits: AuditLogRepository,
    private readonly systemGuards: SystemGuardRepository,
    private readonly now: () => Date = () => new Date(),
    private readonly classroomOwnershipReader?: ClassroomOwnershipReader,
  ) {}

  async list(scope: AdminUserListScope, input: AdminUserListQueryInput) {
    if (!SCOPE_SORT_FIELDS[scope].includes(input.sortBy)) {
      throw new AppError(422, 'VALIDATION_ERROR', 'Sort field is not allowed for this user list', [
        { field: 'sortBy', code: 'INVALID_ENUM_VALUE', message: 'Sort field is not allowed' },
      ]);
    }
    const query = {
      ...input,
      roles: SCOPE_ROLES[scope],
      keyword: input.keyword ? normalizeFullNameForSearch(input.keyword) : undefined,
    };
    const { items, totalItems } = await this.users.listByRoles(query);
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / input.limit);
    return {
      data: items.map((item) => toListItem(scope, item)),
      pagination: {
        page: input.page,
        limit: input.limit,
        totalItems,
        totalPages,
        hasNextPage: input.page < totalPages,
        hasPreviousPage: input.page > 1 && totalPages > 0,
      },
      filters: { keyword: input.keyword ?? null, status: input.status ?? null },
    };
  }

  async getDetail(actor: AuthenticatedUser, userId: string) {
    const target = await this.users.findById(userId);
    if (!target) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'User was not found');
    if (!hasPermission(actor.role, TARGET_VIEW_PERMISSION[target.role])) {
      throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
    }
    return toDetail(actor, target);
  }

  async changeStatus(
    actor: AuthenticatedUser,
    userId: string,
    input: ChangeUserStatusInput,
    requestId: string,
  ) {
    await this.systemGuards.ensureSuperAdminGovernance();
    return withMongoTransaction(async (session) => {
      const target = await this.users.findById(userId, session);
      if (!target) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'User was not found');
      if (!canManageStatus(actor, target)) {
        throw new AppError(403, 'ACCESS_DENIED', 'This account status cannot be changed');
      }
      const transitionAllowed = STATUS_TRANSITIONS[target.status].includes(input.status);
      const restrictedDelete = input.status === 'DELETED' && actor.role === 'SUPER_ADMIN';
      if (!transitionAllowed && !restrictedDelete) {
        throw new AppError(409, 'INVALID_STATE_TRANSITION', 'User status transition is invalid');
      }
      const expectedUpdatedAt = assertExpectedVersion(target, input.expectedUpdatedAt);

      if (
        target.role === 'TEACHER' &&
        target.status === 'ACTIVE' &&
        input.status !== 'ACTIVE' &&
        this.classroomOwnershipReader &&
        (await this.classroomOwnershipReader.countActiveOwnedClassrooms(target._id.toString())) > 0
      ) {
        throw new AppError(
          409,
          'TEACHER_HAS_ACTIVE_CLASSROOM',
          'Teacher still owns an active Classroom',
        );
      }

      if (target.role === 'SUPER_ADMIN' || input.status === 'DELETED') {
        await this.systemGuards.touchSuperAdminGovernance(session);
      }
      if (
        target.role === 'SUPER_ADMIN' &&
        target.status === 'ACTIVE' &&
        input.status !== 'ACTIVE' &&
        (await this.users.countActiveSuperAdmins(session)) <= 1
      ) {
        throw new AppError(
          409,
          'FINAL_SUPER_ADMIN_REQUIRED',
          'At least one active Super Admin is required',
        );
      }

      const changedAt = this.now();
      const updated = await this.users.updateStatus(
        userId,
        expectedUpdatedAt,
        input.status,
        changedAt,
        session,
      );
      if (!updated) {
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'User was modified by another request');
      }
      if (input.status !== 'ACTIVE') {
        await this.sessions.revokeAllForUser(userId, 'ACCOUNT_STATUS', changedAt, session);
      }
      const audit = await this.audits.append(
        {
          actorId: new Types.ObjectId(actor.id),
          actorRole: actor.role,
          action: 'USER_STATUS_CHANGED',
          resourceType: 'USER',
          resourceId: userId,
          oldValue: { status: target.status },
          newValue: { status: updated.status },
          reason: input.reason,
          requestId,
        },
        session,
      );
      return { user: toDetail(actor, updated), auditId: audit._id.toString() };
    });
  }

  async changeRole(
    actor: AuthenticatedUser,
    userId: string,
    input: ChangeUserRoleInput,
    requestId: string,
  ) {
    if (actor.role !== 'SUPER_ADMIN') {
      throw new AppError(403, 'ACCESS_DENIED', 'Only a Super Admin can change primary roles');
    }
    await this.systemGuards.ensureSuperAdminGovernance();
    return withMongoTransaction(async (session) => {
      const target = await this.users.findById(userId, session);
      if (!target) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'User was not found');
      if (actor.id === target._id.toString() || target.status === 'DELETED') {
        throw new AppError(403, 'ACCESS_DENIED', 'This account role cannot be changed');
      }
      if (!ROLE_TRANSITIONS[target.role].includes(input.role)) {
        throw new AppError(409, 'INVALID_STATE_TRANSITION', 'User role transition is invalid');
      }
      const expectedUpdatedAt = assertExpectedVersion(target, input.expectedUpdatedAt);

      if (target.role === 'SUPER_ADMIN' || input.role === 'SUPER_ADMIN') {
        await this.systemGuards.touchSuperAdminGovernance(session);
      }
      if (
        target.role === 'SUPER_ADMIN' &&
        target.status === 'ACTIVE' &&
        (await this.users.countActiveSuperAdmins(session)) <= 1
      ) {
        throw new AppError(
          409,
          'FINAL_SUPER_ADMIN_REQUIRED',
          'At least one active Super Admin is required',
        );
      }

      const updated = await this.users.updateRole(userId, expectedUpdatedAt, input.role, session);
      if (!updated) {
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'User was modified by another request');
      }
      const changedAt = this.now();
      await this.sessions.revokeAllForUser(userId, 'ADMIN', changedAt, session);
      const audit = await this.audits.append(
        {
          actorId: new Types.ObjectId(actor.id),
          actorRole: actor.role,
          action: 'USER_ROLE_CHANGED',
          resourceType: 'USER',
          resourceId: userId,
          oldValue: { role: target.role },
          newValue: { role: updated.role },
          reason: input.reason,
          requestId,
        },
        session,
      );
      return { user: toDetail(actor, updated), auditId: audit._id.toString() };
    });
  }
}
