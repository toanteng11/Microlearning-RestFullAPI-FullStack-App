import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { EnrollmentPolicyValue } from '../enrollment-policy/system-setting.model.js';
import type { EnrollmentRecord } from '../enrollments/enrollment.model.js';
import type { UserRecord } from '../users/user.types.js';
import type { ClassroomRecord } from './classroom.model.js';
import { getEffectiveClassroomSettings } from './classroom.domain.js';

export interface ClassroomOwnerSummary {
  id: string;
  fullName: string;
}

function iso(value?: Date | null): string | null {
  return value?.toISOString() ?? null;
}

export function toEnrollmentSummary(
  enrollment: Pick<
    EnrollmentRecord,
    '_id' | 'classroomId' | 'studentId' | 'status' | 'joinedBy' | 'joinedAt' | 'updatedAt'
  >,
) {
  return {
    id: enrollment._id.toString(),
    classroomId: enrollment.classroomId.toString(),
    studentId: enrollment.studentId.toString(),
    status: enrollment.status,
    joinedBy: enrollment.joinedBy,
    joinedAt: enrollment.joinedAt.toISOString(),
    updatedAt: enrollment.updatedAt.toISOString(),
  };
}

export function classroomAllowedActions(
  actor: AuthenticatedUser,
  classroom: Pick<ClassroomRecord, 'ownerTeacherId' | 'status'>,
): string[] {
  if (actor.role === 'STUDENT') return ['VIEW'];
  if (actor.role !== 'TEACHER' || classroom.ownerTeacherId.toString() !== actor.id) return [];
  if (classroom.status !== 'ACTIVE') return ['VIEW'];
  return ['VIEW', 'UPDATE', 'UPDATE_SETTINGS', 'MANAGE_JOIN', 'VIEW_ROSTER', 'ARCHIVE'];
}

export function toClassroomSummary(
  classroom: ClassroomRecord,
  owner: Pick<UserRecord, '_id' | 'fullName'>,
  membership: EnrollmentRecord | null = null,
) {
  return {
    id: classroom._id.toString(),
    name: classroom.name,
    description: classroom.description ?? null,
    subject: classroom.subject ?? null,
    section: classroom.section ?? null,
    owner: { id: owner._id.toString(), fullName: owner.fullName },
    status: classroom.status,
    enrollmentStatus: classroom.enrollmentStatus,
    membership: membership ? toEnrollmentSummary(membership) : null,
    archivedAt: iso(classroom.archivedAt),
    createdAt: classroom.createdAt.toISOString(),
    updatedAt: classroom.updatedAt.toISOString(),
  };
}

export function toClassroomDetail(
  actor: AuthenticatedUser,
  classroom: ClassroomRecord,
  owner: Pick<UserRecord, '_id' | 'fullName'>,
  policy: EnrollmentPolicyValue,
  membership: EnrollmentRecord | null = null,
) {
  return {
    ...toClassroomSummary(classroom, owner, membership),
    configuredSettings: {
      enrollmentStatus: classroom.enrollmentStatus,
      allowClassCodeJoin: classroom.allowClassCodeJoin,
      allowInviteLinkJoin: classroom.allowInviteLinkJoin,
    },
    effectiveSettings: getEffectiveClassroomSettings(classroom, policy),
    allowedActions: classroomAllowedActions(actor, classroom),
  };
}

export function toClassroomStateAuditValue(classroom: ClassroomRecord) {
  return {
    name: classroom.name,
    subject: classroom.subject ?? null,
    section: classroom.section ?? null,
    status: classroom.status,
    enrollmentStatus: classroom.enrollmentStatus,
    allowClassCodeJoin: classroom.allowClassCodeJoin,
    allowInviteLinkJoin: classroom.allowInviteLinkJoin,
    ownerTeacherId: classroom.ownerTeacherId.toString(),
    updatedAt: classroom.updatedAt.toISOString(),
  };
}
