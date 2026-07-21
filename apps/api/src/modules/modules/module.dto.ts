import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { CourseModuleProjection } from './module.repository.js';

function iso(value?: Date | null): string | null {
  return value?.toISOString() ?? null;
}

export function toTeacherModuleDto(module: CourseModuleProjection, actor: AuthenticatedUser) {
  const active = module.status !== 'ARCHIVED';
  return {
    id: module._id.toString(),
    courseId: module.courseId.toString(),
    title: module.title,
    description: module.description,
    status: module.status,
    displayOrder: module.displayOrder,
    archivedAt: iso(module.archivedAt),
    createdAt: module.createdAt.toISOString(),
    updatedAt: module.updatedAt.toISOString(),
    allowedActions:
      actor.role === 'TEACHER'
        ? ['VIEW', ...(active ? ['UPDATE', 'CHANGE_STATUS', 'ARCHIVE'] : [])]
        : [],
  };
}

export function toStudentModuleDto(module: CourseModuleProjection) {
  return {
    id: module._id.toString(),
    courseId: module.courseId.toString(),
    title: module.title,
    description: module.description,
    displayOrder: module.displayOrder,
  };
}

export function toModuleAuditValue(module: CourseModuleProjection) {
  return {
    title: module.title,
    status: module.status,
    displayOrder: module.displayOrder,
    archivedAt: iso(module.archivedAt),
    updatedAt: module.updatedAt.toISOString(),
  };
}
