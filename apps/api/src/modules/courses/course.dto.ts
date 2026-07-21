import type { AuthenticatedUser } from '../auth/auth.types.js';
import { resolveEffectiveContentStatus } from '../learning-content/content-schedule.policy.js';
import type { CourseProjection } from './course.repository.js';

function iso(value?: Date | null): string | null {
  return value?.toISOString() ?? null;
}

export function toTeacherCourseDto(course: CourseProjection, actor: AuthenticatedUser, asOf: Date) {
  const editable = course.status === 'DRAFT' || course.status === 'UNPUBLISHED';
  const active = course.status !== 'ARCHIVED';
  return {
    id: course._id.toString(),
    classroomId: course.classroomId.toString(),
    title: course.title,
    description: course.description,
    status: course.status,
    effectiveStatus: resolveEffectiveContentStatus(course, asOf),
    scheduledPublishAt: iso(course.scheduledPublishAt),
    publishedAt: iso(course.publishedAt),
    unpublishedAt: iso(course.unpublishedAt),
    archivedAt: iso(course.archivedAt),
    displayOrder: course.displayOrder,
    structureRevision: course.structureRevision,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
    allowedActions:
      actor.role === 'TEACHER'
        ? [
            'VIEW',
            ...(editable ? ['UPDATE'] : []),
            ...(active ? ['CHANGE_STATUS', 'MANAGE_STRUCTURE', 'ARCHIVE'] : []),
          ]
        : [],
  };
}

export function toStudentCourseDto(course: CourseProjection) {
  return {
    id: course._id.toString(),
    classroomId: course.classroomId.toString(),
    title: course.title,
    description: course.description,
    displayOrder: course.displayOrder,
    publishedAt: iso(course.publishedAt ?? course.scheduledPublishAt),
  };
}

export function toCourseAuditValue(course: CourseProjection) {
  return {
    title: course.title,
    status: course.status,
    scheduledPublishAt: iso(course.scheduledPublishAt),
    publishedAt: iso(course.publishedAt),
    unpublishedAt: iso(course.unpublishedAt),
    archivedAt: iso(course.archivedAt),
    displayOrder: course.displayOrder,
    structureRevision: course.structureRevision,
    updatedAt: course.updatedAt.toISOString(),
  };
}
