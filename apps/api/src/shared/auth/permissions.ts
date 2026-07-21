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
  'classroom.join',
  'classroom.view_enrolled',
  'classroom.create',
  'classroom.view_owned',
  'classroom.update_owned',
  'classroom.archive_owned',
  'classroom.manage_join',
  'classroom.view_roster',
  'classroom.remove_student',
  'enrollment_policy.view',
  'enrollment_policy.update',
  'classroom.governance.view',
  'classroom.governance.lock',
  'classroom.ownership.transfer',
  'course.create',
  'course.view_owned',
  'course.update_owned',
  'course.publish_owned',
  'course.archive_owned',
  'content.reorder_owned',
  'lesson.manage_owned',
  'lesson.deadline_manage_owned',
  'announcement.manage_owned',
  'learning.view_enrolled',
  'learning.complete_own',
  'course.progress_view_owned',
  'content.governance_view',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const PROFILE_PERMISSIONS: readonly Permission[] = ['profile.update_own', 'profile.view_own'];

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  STUDENT: [
    ...PROFILE_PERMISSIONS,
    'classroom.join',
    'classroom.view_enrolled',
    'learning.complete_own',
    'learning.view_enrolled',
  ],
  TEACHER: [
    ...PROFILE_PERMISSIONS,
    'announcement.manage_owned',
    'classroom.archive_owned',
    'classroom.create',
    'classroom.manage_join',
    'classroom.remove_student',
    'classroom.update_owned',
    'classroom.view_owned',
    'classroom.view_roster',
    'content.reorder_owned',
    'course.archive_owned',
    'course.create',
    'course.progress_view_owned',
    'course.publish_owned',
    'course.update_owned',
    'course.view_owned',
    'lesson.deadline_manage_owned',
    'lesson.manage_owned',
  ],
  ADMIN: [
    ...PROFILE_PERMISSIONS,
    'classroom.governance.view',
    'content.governance_view',
    'enrollment_policy.update',
    'enrollment_policy.view',
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
