import type { EnrollmentPolicyValue } from '../enrollment-policy/system-setting.model.js';
import type { ClassroomRecord } from './classroom.model.js';
import { AppError } from '../../shared/errors/app-error.js';

export type ClassroomJoinMethod = 'CLASS_CODE' | 'INVITE_LINK';

export interface EffectiveClassroomSettings {
  enrollmentStatus: ClassroomRecord['enrollmentStatus'];
  allowClassCodeJoin: boolean;
  allowInviteLinkJoin: boolean;
}

export function getEffectiveClassroomSettings(
  classroom: Pick<
    ClassroomRecord,
    'enrollmentStatus' | 'allowClassCodeJoin' | 'allowInviteLinkJoin'
  >,
  policy: EnrollmentPolicyValue,
): EffectiveClassroomSettings {
  return {
    enrollmentStatus: classroom.enrollmentStatus,
    allowClassCodeJoin: policy.allowClassCodeJoin && classroom.allowClassCodeJoin,
    allowInviteLinkJoin: policy.allowInviteLinkJoin && classroom.allowInviteLinkJoin,
  };
}

export function assertClassroomMutable(classroom: Pick<ClassroomRecord, 'status'>): void {
  if (classroom.status === 'ARCHIVED') {
    throw new AppError(409, 'INVALID_STATE_TRANSITION', 'Archived Classroom cannot be changed');
  }
  if (classroom.status === 'LOCKED') {
    throw new AppError(409, 'INVALID_STATE_TRANSITION', 'Locked Classroom cannot be changed');
  }
}

export function assertClassroomJoinAllowed(
  classroom: Pick<
    ClassroomRecord,
    'status' | 'enrollmentStatus' | 'allowClassCodeJoin' | 'allowInviteLinkJoin'
  >,
  policy: EnrollmentPolicyValue,
  method: ClassroomJoinMethod,
): void {
  const globalEnabled =
    method === 'CLASS_CODE' ? policy.allowClassCodeJoin : policy.allowInviteLinkJoin;
  if (!globalEnabled) {
    throw new AppError(422, 'JOIN_METHOD_DISABLED', 'This join method is disabled');
  }

  if (classroom.status !== 'ACTIVE') {
    throw new AppError(409, 'CLASSROOM_NOT_JOINABLE', 'Classroom is not available for joining');
  }
  if (classroom.enrollmentStatus !== 'OPEN') {
    throw new AppError(409, 'ENROLLMENT_CLOSED', 'Classroom enrollment is not open');
  }

  const localEnabled =
    method === 'CLASS_CODE' ? classroom.allowClassCodeJoin : classroom.allowInviteLinkJoin;
  if (!localEnabled) {
    throw new AppError(422, 'JOIN_METHOD_DISABLED', 'This join method is disabled');
  }
}
