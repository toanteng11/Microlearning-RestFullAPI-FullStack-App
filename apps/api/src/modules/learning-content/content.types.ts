export const COMMON_CONTENT_STATUSES = [
  'DRAFT',
  'SCHEDULED',
  'PUBLISHED',
  'UNPUBLISHED',
  'ARCHIVED',
] as const;
export type CommonContentStatus = (typeof COMMON_CONTENT_STATUSES)[number];

export const MODULE_CONTENT_STATUSES = ['DRAFT', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'] as const;
export type ModuleContentStatus = (typeof MODULE_CONTENT_STATUSES)[number];

export const FLASHCARD_STATUSES = ['ACTIVE', 'ARCHIVED'] as const;
export type FlashcardStatus = (typeof FLASHCARD_STATUSES)[number];

export type ContentLifecycleKind = 'COMMON' | 'MODULE' | 'FLASHCARD';

export const CONTENT_SCHEMA_VERSION = 1 as const;

export interface ScheduledContentState {
  status: CommonContentStatus;
  scheduledPublishAt: Date | null;
}

export function normalizeContentTitle(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/gu, ' ');
}

export function normalizeOptionalContentText(value: string | null | undefined): string {
  if (typeof value !== 'string') return '';
  return value.normalize('NFKC').trim();
}

export function normalizeMarkdown(value: string): string {
  return value.normalize('NFKC').replace(/\r\n?/gu, '\n').trim();
}
