import { AppError } from '../../shared/errors/app-error.js';
import {
  COMMON_CONTENT_STATUSES,
  FLASHCARD_STATUSES,
  MODULE_CONTENT_STATUSES,
  type CommonContentStatus,
  type ContentLifecycleKind,
  type FlashcardStatus,
  type ModuleContentStatus,
} from './content.types.js';

type LifecycleStatus = CommonContentStatus | ModuleContentStatus | FlashcardStatus;

const COMMON_TRANSITIONS: Readonly<Record<CommonContentStatus, readonly CommonContentStatus[]>> = {
  DRAFT: ['SCHEDULED', 'PUBLISHED', 'ARCHIVED'],
  SCHEDULED: ['DRAFT', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'],
  PUBLISHED: ['UNPUBLISHED', 'ARCHIVED'],
  UNPUBLISHED: ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'],
  ARCHIVED: [],
};

const MODULE_TRANSITIONS: Readonly<Record<ModuleContentStatus, readonly ModuleContentStatus[]>> = {
  DRAFT: ['PUBLISHED', 'ARCHIVED'],
  PUBLISHED: ['UNPUBLISHED', 'ARCHIVED'],
  UNPUBLISHED: ['PUBLISHED', 'ARCHIVED'],
  ARCHIVED: [],
};

const FLASHCARD_TRANSITIONS: Readonly<Record<FlashcardStatus, readonly FlashcardStatus[]>> = {
  ACTIVE: ['ARCHIVED'],
  ARCHIVED: [],
};

export function canTransitionCommonContent(
  currentStatus: CommonContentStatus,
  targetStatus: CommonContentStatus,
): boolean {
  return COMMON_TRANSITIONS[currentStatus].includes(targetStatus);
}

export function canTransitionModuleContent(
  currentStatus: ModuleContentStatus,
  targetStatus: ModuleContentStatus,
): boolean {
  return MODULE_TRANSITIONS[currentStatus].includes(targetStatus);
}

export function canTransitionFlashcard(
  currentStatus: FlashcardStatus,
  targetStatus: FlashcardStatus,
): boolean {
  return FLASHCARD_TRANSITIONS[currentStatus].includes(targetStatus);
}

export function assertContentTransition(
  kind: ContentLifecycleKind,
  currentStatus: LifecycleStatus,
  targetStatus: LifecycleStatus,
): void {
  const allowed =
    kind === 'COMMON'
      ? COMMON_CONTENT_STATUSES.includes(currentStatus as CommonContentStatus) &&
        COMMON_CONTENT_STATUSES.includes(targetStatus as CommonContentStatus) &&
        canTransitionCommonContent(
          currentStatus as CommonContentStatus,
          targetStatus as CommonContentStatus,
        )
      : kind === 'MODULE'
        ? MODULE_CONTENT_STATUSES.includes(currentStatus as ModuleContentStatus) &&
          MODULE_CONTENT_STATUSES.includes(targetStatus as ModuleContentStatus) &&
          canTransitionModuleContent(
            currentStatus as ModuleContentStatus,
            targetStatus as ModuleContentStatus,
          )
        : FLASHCARD_STATUSES.includes(currentStatus as FlashcardStatus) &&
          FLASHCARD_STATUSES.includes(targetStatus as FlashcardStatus) &&
          canTransitionFlashcard(currentStatus as FlashcardStatus, targetStatus as FlashcardStatus);

  if (!allowed) {
    throw new AppError(409, 'CONTENT_STATE_CONFLICT', 'Content status transition is not allowed');
  }
}
