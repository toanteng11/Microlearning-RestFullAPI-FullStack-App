import type { UserRole, UserStatus } from '../users/user.types.js';
import type { ClassroomStatus } from '../classrooms/classroom.types.js';
import type { CommonContentStatus, ModuleContentStatus } from './content.types.js';
import { resolveEffectiveContentStatus } from './content-schedule.policy.js';

export type ContentVisibilityReason =
  | 'ACTOR_ROLE_NOT_ALLOWED'
  | 'ACTOR_NOT_ACTIVE'
  | 'PERMISSION_REQUIRED'
  | 'OWNER_MISMATCH'
  | 'ENROLLMENT_NOT_ACTIVE'
  | 'CLASSROOM_NOT_ACTIVE'
  | 'COURSE_NOT_PUBLISHED'
  | 'MODULE_NOT_PUBLISHED'
  | 'LESSON_NOT_PUBLISHED';

export type ContentVisibilityDecision =
  { visible: true } | { visible: false; reason: ContentVisibilityReason };

interface ScheduledAncestor {
  status: CommonContentStatus;
  scheduledPublishAt: Date | null;
}

export interface StudentContentVisibilityContext {
  actorRole: UserRole;
  actorStatus: UserStatus;
  enrollmentStatus: 'ACTIVE' | 'REMOVED' | 'LEFT' | 'BLOCKED' | null;
  classroomStatus: ClassroomStatus;
  course: ScheduledAncestor;
  module?: { status: ModuleContentStatus } | null;
  lesson?: ScheduledAncestor | null;
  asOf: Date;
}

export interface TeacherAuthoringAccessContext {
  actorStatus: UserStatus;
  hasPermission: boolean;
  actorId: string;
  ownerTeacherId: string;
  classroomStatus: ClassroomStatus;
}

function hidden(reason: ContentVisibilityReason): ContentVisibilityDecision {
  return { visible: false, reason };
}

export function resolveStudentContentVisibility(
  context: StudentContentVisibilityContext,
): ContentVisibilityDecision {
  if (context.actorRole !== 'STUDENT') return hidden('ACTOR_ROLE_NOT_ALLOWED');
  if (context.actorStatus !== 'ACTIVE') return hidden('ACTOR_NOT_ACTIVE');
  if (context.enrollmentStatus !== 'ACTIVE') return hidden('ENROLLMENT_NOT_ACTIVE');
  if (context.classroomStatus !== 'ACTIVE') return hidden('CLASSROOM_NOT_ACTIVE');
  if (resolveEffectiveContentStatus(context.course, context.asOf) !== 'PUBLISHED') {
    return hidden('COURSE_NOT_PUBLISHED');
  }
  if (context.module && context.module.status !== 'PUBLISHED') {
    return hidden('MODULE_NOT_PUBLISHED');
  }
  if (
    context.lesson &&
    resolveEffectiveContentStatus(context.lesson, context.asOf) !== 'PUBLISHED'
  ) {
    return hidden('LESSON_NOT_PUBLISHED');
  }

  return { visible: true };
}

export function resolveTeacherAuthoringAccess(
  context: TeacherAuthoringAccessContext,
): ContentVisibilityDecision {
  if (context.actorStatus !== 'ACTIVE') return hidden('ACTOR_NOT_ACTIVE');
  if (!context.hasPermission) return hidden('PERMISSION_REQUIRED');
  if (context.actorId !== context.ownerTeacherId) return hidden('OWNER_MISMATCH');
  if (context.classroomStatus !== 'ACTIVE') return hidden('CLASSROOM_NOT_ACTIVE');
  return { visible: true };
}
