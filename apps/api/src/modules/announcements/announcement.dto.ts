import type { AuthenticatedUser } from '../auth/auth.types.js';
import { resolveEffectiveContentStatus } from '../learning-content/content-schedule.policy.js';
import { renderSanitizedMarkdown } from '../learning-content/markdown.policy.js';
import type { AnnouncementProjection } from './announcement.repository.js';

function iso(value?: Date | null): string | null {
  return value?.toISOString() ?? null;
}

export function toTeacherAnnouncementDto(
  announcement: AnnouncementProjection,
  actor: AuthenticatedUser,
  asOf: Date,
) {
  const editable = announcement.status === 'DRAFT' || announcement.status === 'UNPUBLISHED';
  const active = announcement.status !== 'ARCHIVED';
  return {
    id: announcement._id.toString(),
    classroomId: announcement.classroomId.toString(),
    content: announcement.content,
    contentHtml: renderSanitizedMarkdown(announcement.content),
    status: announcement.status,
    effectiveStatus: resolveEffectiveContentStatus(announcement, asOf),
    scheduledPublishAt: iso(announcement.scheduledPublishAt),
    publishedAt: iso(announcement.publishedAt),
    unpublishedAt: iso(announcement.unpublishedAt),
    archivedAt: iso(announcement.archivedAt),
    createdAt: announcement.createdAt.toISOString(),
    updatedAt: announcement.updatedAt.toISOString(),
    allowedActions:
      actor.role === 'TEACHER'
        ? ['VIEW', ...(editable ? ['UPDATE'] : []), ...(active ? ['CHANGE_STATUS', 'ARCHIVE'] : [])]
        : [],
  };
}

export function toStudentAnnouncementDto(
  announcement: Pick<
    AnnouncementProjection,
    '_id' | 'classroomId' | 'teacherId' | 'content' | 'scheduledPublishAt' | 'publishedAt'
  >,
) {
  return {
    id: announcement._id.toString(),
    classroomId: announcement.classroomId.toString(),
    teacherId: announcement.teacherId.toString(),
    contentHtml: renderSanitizedMarkdown(announcement.content),
    publishedAt:
      (announcement.publishedAt ?? announcement.scheduledPublishAt)?.toISOString() ?? null,
  };
}

export function toAnnouncementAuditValue(announcement: AnnouncementProjection) {
  return {
    status: announcement.status,
    scheduledPublishAt: iso(announcement.scheduledPublishAt),
    publishedAt: iso(announcement.publishedAt),
    unpublishedAt: iso(announcement.unpublishedAt),
    archivedAt: iso(announcement.archivedAt),
    updatedAt: announcement.updatedAt.toISOString(),
  };
}
