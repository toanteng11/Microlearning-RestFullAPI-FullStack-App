import type { ClientSession } from 'mongoose';

import { AuditLogRepository, type AuditInput } from './audit-log.repository.js';

export const PHASE_FOUR_AUDIT_ACTIONS = [
  'COURSE_CREATED',
  'COURSE_UPDATED',
  'COURSE_STATUS_CHANGED',
  'COURSE_ARCHIVED',
  'MODULE_CREATED',
  'MODULE_UPDATED',
  'MODULE_STATUS_CHANGED',
  'MODULE_ARCHIVED',
  'MODULES_REORDERED',
  'LESSON_CREATED',
  'LESSON_UPDATED',
  'LESSON_STATUS_CHANGED',
  'LESSON_ARCHIVED',
  'LESSONS_REORDERED',
  'FLASHCARD_CREATED',
  'FLASHCARD_UPDATED',
  'FLASHCARD_ARCHIVED',
  'FLASHCARDS_REORDERED',
  'LESSON_DEADLINE_CHANGED',
  'ANNOUNCEMENT_CREATED',
  'ANNOUNCEMENT_UPDATED',
  'ANNOUNCEMENT_STATUS_CHANGED',
  'ANNOUNCEMENT_ARCHIVED',
] as const;

export type PhaseFourAuditAction = (typeof PHASE_FOUR_AUDIT_ACTIONS)[number];

const RESOURCE_TYPE_BY_ACTION: Record<
  PhaseFourAuditAction,
  'Course' | 'CourseModule' | 'Lesson' | 'Flashcard' | 'Announcement'
> = {
  COURSE_CREATED: 'Course',
  COURSE_UPDATED: 'Course',
  COURSE_STATUS_CHANGED: 'Course',
  COURSE_ARCHIVED: 'Course',
  MODULE_CREATED: 'CourseModule',
  MODULE_UPDATED: 'CourseModule',
  MODULE_STATUS_CHANGED: 'CourseModule',
  MODULE_ARCHIVED: 'CourseModule',
  MODULES_REORDERED: 'Course',
  LESSON_CREATED: 'Lesson',
  LESSON_UPDATED: 'Lesson',
  LESSON_STATUS_CHANGED: 'Lesson',
  LESSON_ARCHIVED: 'Lesson',
  LESSONS_REORDERED: 'Course',
  FLASHCARD_CREATED: 'Flashcard',
  FLASHCARD_UPDATED: 'Flashcard',
  FLASHCARD_ARCHIVED: 'Flashcard',
  FLASHCARDS_REORDERED: 'Lesson',
  LESSON_DEADLINE_CHANGED: 'Lesson',
  ANNOUNCEMENT_CREATED: 'Announcement',
  ANNOUNCEMENT_UPDATED: 'Announcement',
  ANNOUNCEMENT_STATUS_CHANGED: 'Announcement',
  ANNOUNCEMENT_ARCHIVED: 'Announcement',
};

const SAFE_STATE_FIELDS = new Set([
  'archivedAt',
  'displayOrder',
  'completionDeadline',
  'contentRevision',
  'deadlineRevision',
  'estimatedMinutes',
  'flashcardRevision',
  'isRequired',
  'moduleId',
  'publishedAt',
  'scheduledPublishAt',
  'status',
  'structureRevision',
  'title',
  'unpublishedAt',
  'updatedAt',
]);
const SAFE_METADATA_FIELDS = new Set([
  'classroomId',
  'courseId',
  'fromStructureRevision',
  'fromDeadlineRevision',
  'fromFlashcardRevision',
  'flashcardCount',
  'lessonCount',
  'lessonId',
  'moduleCount',
  'moduleId',
  'toStructureRevision',
  'toDeadlineRevision',
  'toFlashcardRevision',
]);

function pickSafeFields(
  value: Record<string, unknown> | null | undefined,
  allowlist: ReadonlySet<string>,
): Record<string, unknown> | null {
  if (!value) return null;
  const fields = Object.entries(value).filter(([key]) => allowlist.has(key));
  return fields.length > 0 ? Object.fromEntries(fields) : null;
}

export type PhaseFourAuditCommand = Omit<
  AuditInput,
  'action' | 'resourceType' | 'oldValue' | 'newValue' | 'metadata'
> & {
  action: PhaseFourAuditAction;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
};

export function buildPhaseFourAuditInput(command: PhaseFourAuditCommand): AuditInput {
  if (!PHASE_FOUR_AUDIT_ACTIONS.includes(command.action)) {
    throw new Error('Unsupported Phase 04 audit action');
  }

  const audit: AuditInput = {
    actorRole: command.actorRole,
    action: command.action,
    resourceType: RESOURCE_TYPE_BY_ACTION[command.action],
    resourceId: command.resourceId,
    requestId: command.requestId,
    oldValue: pickSafeFields(command.oldValue, SAFE_STATE_FIELDS),
    newValue: pickSafeFields(command.newValue, SAFE_STATE_FIELDS),
    metadata: pickSafeFields(command.metadata, SAFE_METADATA_FIELDS),
  };
  if (command.actorId !== undefined) audit.actorId = command.actorId;
  if (command.reason !== undefined) audit.reason = command.reason;
  if (command.idempotencyKey !== undefined) audit.idempotencyKey = command.idempotencyKey;
  return audit;
}

export class PhaseFourAuditWriter {
  constructor(private readonly audits = new AuditLogRepository()) {}

  append(command: PhaseFourAuditCommand, session?: ClientSession) {
    return this.audits.append(buildPhaseFourAuditInput(command), session);
  }
}
