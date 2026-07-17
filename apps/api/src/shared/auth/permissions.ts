import type { UserRole } from '../../modules/users/user.types.js';

export const PERMISSIONS = [
  'profile.view_own',
  'profile.update_own',
  'user.view_students',
  'user.view_teachers',
  'user.view_admins',
  'user.update_status',
  'role.assign_limited',
  'teacher_invitation.create',
  'teacher_invitation.view',
  'teacher_invitation.copy_link',
  'teacher_invitation.revoke',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const PROFILE_PERMISSIONS: readonly Permission[] = ['profile.update_own', 'profile.view_own'];

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  STUDENT: PROFILE_PERMISSIONS,
  TEACHER: PROFILE_PERMISSIONS,
  ADMIN: [
    ...PROFILE_PERMISSIONS,
    'teacher_invitation.copy_link',
    'teacher_invitation.create',
    'teacher_invitation.revoke',
    'teacher_invitation.view',
    'user.update_status',
    'user.view_admins',
    'user.view_students',
    'user.view_teachers',
  ],
  SUPER_ADMIN: PERMISSIONS,
};

export function getCapabilities(role: UserRole): Permission[] {
  return [...ROLE_PERMISSIONS[role]].sort();
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
