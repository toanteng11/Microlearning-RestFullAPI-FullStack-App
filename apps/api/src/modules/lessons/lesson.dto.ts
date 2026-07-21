import type { AuthenticatedUser } from '../auth/auth.types.js';
import { resolveEffectiveContentStatus } from '../learning-content/content-schedule.policy.js';
import { renderSanitizedMarkdown } from '../learning-content/markdown.policy.js';
import type { LessonProjection } from './lesson.repository.js';

function iso(value?: Date | null): string | null {
  return value?.toISOString() ?? null;
}

export function toTeacherLessonDto(lesson: LessonProjection, actor: AuthenticatedUser, asOf: Date) {
  const editable = lesson.status === 'DRAFT' || lesson.status === 'UNPUBLISHED';
  const active = lesson.status !== 'ARCHIVED';
  return {
    id: lesson._id.toString(),
    courseId: lesson.courseId.toString(),
    moduleId: lesson.moduleId?.toString() ?? null,
    title: lesson.title,
    content: lesson.content,
    contentFormat: lesson.contentFormat,
    estimatedMinutes: lesson.estimatedMinutes,
    isRequired: lesson.isRequired,
    status: lesson.status,
    effectiveStatus: resolveEffectiveContentStatus(lesson, asOf),
    scheduledPublishAt: iso(lesson.scheduledPublishAt),
    publishedAt: iso(lesson.publishedAt),
    unpublishedAt: iso(lesson.unpublishedAt),
    archivedAt: iso(lesson.archivedAt),
    completionDeadline: iso(lesson.completionDeadline),
    deadlineRevision: lesson.deadlineRevision,
    deadlineLastUpdatedAt: iso(lesson.deadlineLastUpdatedAt),
    displayOrder: lesson.displayOrder,
    contentRevision: lesson.contentRevision,
    publishedRevision: lesson.publishedRevision,
    flashcardRevision: lesson.flashcardRevision,
    createdAt: lesson.createdAt.toISOString(),
    updatedAt: lesson.updatedAt.toISOString(),
    allowedActions:
      actor.role === 'TEACHER'
        ? [
            'VIEW',
            'PREVIEW',
            ...(editable ? ['UPDATE', 'MANAGE_FLASHCARDS'] : []),
            ...(active ? ['CHANGE_STATUS', 'CHANGE_DEADLINE', 'ARCHIVE'] : []),
          ]
        : [],
  };
}

export function toStudentLessonDto(lesson: LessonProjection) {
  return {
    id: lesson._id.toString(),
    courseId: lesson.courseId.toString(),
    moduleId: lesson.moduleId?.toString() ?? null,
    title: lesson.title,
    contentHtml: renderSanitizedMarkdown(lesson.content),
    contentFormat: lesson.contentFormat,
    estimatedMinutes: lesson.estimatedMinutes,
    isRequired: lesson.isRequired,
    completionDeadline: iso(lesson.completionDeadline),
    displayOrder: lesson.displayOrder,
    publishedRevision: lesson.publishedRevision,
  };
}

export function toLessonAuditValue(lesson: LessonProjection) {
  return {
    moduleId: lesson.moduleId?.toString() ?? null,
    title: lesson.title,
    status: lesson.status,
    estimatedMinutes: lesson.estimatedMinutes,
    isRequired: lesson.isRequired,
    scheduledPublishAt: iso(lesson.scheduledPublishAt),
    publishedAt: iso(lesson.publishedAt),
    unpublishedAt: iso(lesson.unpublishedAt),
    archivedAt: iso(lesson.archivedAt),
    completionDeadline: iso(lesson.completionDeadline),
    deadlineRevision: lesson.deadlineRevision,
    displayOrder: lesson.displayOrder,
    contentRevision: lesson.contentRevision,
    flashcardRevision: lesson.flashcardRevision,
    updatedAt: lesson.updatedAt.toISOString(),
  };
}
