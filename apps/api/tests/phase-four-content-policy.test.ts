import { describe, expect, it } from 'vitest';

import {
  assertContentTransition,
  canTransitionCommonContent,
  canTransitionFlashcard,
  canTransitionModuleContent,
} from '../src/modules/learning-content/content-lifecycle.policy.js';
import {
  assignExactOrder,
  sortCanonical,
} from '../src/modules/learning-content/content-ordering.policy.js';
import {
  assertFutureSchedule,
  resolveEffectiveContentStatus,
} from '../src/modules/learning-content/content-schedule.policy.js';
import type {
  CommonContentStatus,
  FlashcardStatus,
  ModuleContentStatus,
} from '../src/modules/learning-content/content.types.js';
import {
  resolveStudentContentVisibility,
  resolveTeacherAuthoringAccess,
  type StudentContentVisibilityContext,
} from '../src/modules/learning-content/content-visibility.policy.js';

const commonTransitions: Record<CommonContentStatus, readonly CommonContentStatus[]> = {
  DRAFT: ['SCHEDULED', 'PUBLISHED', 'ARCHIVED'],
  SCHEDULED: ['DRAFT', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'],
  PUBLISHED: ['UNPUBLISHED', 'ARCHIVED'],
  UNPUBLISHED: ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'],
  ARCHIVED: [],
};

const moduleTransitions: Record<ModuleContentStatus, readonly ModuleContentStatus[]> = {
  DRAFT: ['PUBLISHED', 'ARCHIVED'],
  PUBLISHED: ['UNPUBLISHED', 'ARCHIVED'],
  UNPUBLISHED: ['PUBLISHED', 'ARCHIVED'],
  ARCHIVED: [],
};

const flashcardTransitions: Record<FlashcardStatus, readonly FlashcardStatus[]> = {
  ACTIVE: ['ARCHIVED'],
  ARCHIVED: [],
};

describe('Phase 04 content lifecycle policy', () => {
  it('implements the complete common lifecycle transition matrix', () => {
    for (const [current, allowedTargets] of Object.entries(commonTransitions) as Array<
      [CommonContentStatus, readonly CommonContentStatus[]]
    >) {
      for (const target of Object.keys(commonTransitions) as CommonContentStatus[]) {
        expect(canTransitionCommonContent(current, target)).toBe(allowedTargets.includes(target));
      }
    }
  });

  it('implements Module and Flashcard lifecycle matrices', () => {
    for (const [current, allowedTargets] of Object.entries(moduleTransitions) as Array<
      [ModuleContentStatus, readonly ModuleContentStatus[]]
    >) {
      for (const target of Object.keys(moduleTransitions) as ModuleContentStatus[]) {
        expect(canTransitionModuleContent(current, target)).toBe(allowedTargets.includes(target));
      }
    }

    for (const [current, allowedTargets] of Object.entries(flashcardTransitions) as Array<
      [FlashcardStatus, readonly FlashcardStatus[]]
    >) {
      for (const target of Object.keys(flashcardTransitions) as FlashcardStatus[]) {
        expect(canTransitionFlashcard(current, target)).toBe(allowedTargets.includes(target));
      }
    }
  });

  it('returns the content state conflict contract for forbidden transitions', () => {
    expect(() => assertContentTransition('COMMON', 'ARCHIVED', 'PUBLISHED')).toThrow(
      expect.objectContaining({ statusCode: 409, code: 'CONTENT_STATE_CONFLICT' }),
    );
    expect(() => assertContentTransition('MODULE', 'DRAFT', 'PUBLISHED')).not.toThrow();
    expect(() => assertContentTransition('FLASHCARD', 'ACTIVE', 'ARCHIVED')).not.toThrow();
    expect(() => assertContentTransition('COMMON', 'ACTIVE', 'ARCHIVED')).toThrow(
      expect.objectContaining({ code: 'CONTENT_STATE_CONFLICT' }),
    );
  });
});

describe('Phase 04 scheduled status policy', () => {
  const scheduledAt = new Date('2026-07-20T08:00:00.000Z');

  it.each([
    ['before', new Date('2026-07-20T07:59:59.999Z'), 'SCHEDULED'],
    ['equal', new Date('2026-07-20T08:00:00.000Z'), 'PUBLISHED'],
    ['after', new Date('2026-07-20T08:00:00.001Z'), 'PUBLISHED'],
  ] as const)('resolves scheduled content %s the boundary', (_label, now, expected) => {
    expect(
      resolveEffectiveContentStatus({ status: 'SCHEDULED', scheduledPublishAt: scheduledAt }, now),
    ).toBe(expected);
  });

  it('keeps non-scheduled state and rejects corrupt scheduled state', () => {
    expect(
      resolveEffectiveContentStatus(
        { status: 'UNPUBLISHED', scheduledPublishAt: scheduledAt },
        new Date('2026-07-21T00:00:00.000Z'),
      ),
    ).toBe('UNPUBLISHED');
    expect(() =>
      resolveEffectiveContentStatus({ status: 'SCHEDULED', scheduledPublishAt: null }, scheduledAt),
    ).toThrow(expect.objectContaining({ code: 'CONTENT_STATE_CONFLICT' }));
  });

  it('accepts only a valid future scheduling timestamp', () => {
    const now = new Date('2026-07-20T08:00:00.000Z');
    expect(() => assertFutureSchedule(new Date('2026-07-20T08:00:00.001Z'), now)).not.toThrow();
    expect(() => assertFutureSchedule(now, now)).toThrow(
      expect.objectContaining({ statusCode: 422, code: 'VALIDATION_ERROR' }),
    );
    expect(() => assertFutureSchedule(new Date('invalid'), now)).toThrow(
      expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    );
  });
});

describe('Phase 04 content visibility policy', () => {
  const asOf = new Date('2026-07-20T08:00:00.000Z');
  const visibleContext: StudentContentVisibilityContext = {
    actorRole: 'STUDENT',
    actorStatus: 'ACTIVE',
    enrollmentStatus: 'ACTIVE',
    classroomStatus: 'ACTIVE',
    course: { status: 'PUBLISHED', scheduledPublishAt: null },
    module: { status: 'PUBLISHED' },
    lesson: { status: 'PUBLISHED', scheduledPublishAt: null },
    asOf,
  };

  it('allows an active enrolled Student through a published ancestor chain', () => {
    expect(resolveStudentContentVisibility(visibleContext)).toEqual({ visible: true });
  });

  it.each([
    [{ actorRole: 'TEACHER' as const }, 'ACTOR_ROLE_NOT_ALLOWED'],
    [{ actorStatus: 'BLOCKED' as const }, 'ACTOR_NOT_ACTIVE'],
    [{ enrollmentStatus: 'REMOVED' as const }, 'ENROLLMENT_NOT_ACTIVE'],
    [{ classroomStatus: 'LOCKED' as const }, 'CLASSROOM_NOT_ACTIVE'],
    [{ course: { status: 'DRAFT' as const, scheduledPublishAt: null } }, 'COURSE_NOT_PUBLISHED'],
    [{ module: { status: 'UNPUBLISHED' as const } }, 'MODULE_NOT_PUBLISHED'],
    [{ lesson: { status: 'ARCHIVED' as const, scheduledPublishAt: null } }, 'LESSON_NOT_PUBLISHED'],
  ] as const)('rejects a hidden ancestor/access condition', (patch, reason) => {
    expect(resolveStudentContentVisibility({ ...visibleContext, ...patch })).toEqual({
      visible: false,
      reason,
    });
  });

  it('uses effective scheduled status at the exact server-time boundary', () => {
    expect(
      resolveStudentContentVisibility({
        ...visibleContext,
        lesson: { status: 'SCHEDULED', scheduledPublishAt: asOf },
      }),
    ).toEqual({ visible: true });
  });

  it('requires permission, current ownership and an active Classroom for authoring', () => {
    const allowed = {
      actorStatus: 'ACTIVE' as const,
      hasPermission: true,
      actorId: 'teacher-1',
      ownerTeacherId: 'teacher-1',
      classroomStatus: 'ACTIVE' as const,
    };
    expect(resolveTeacherAuthoringAccess(allowed)).toEqual({ visible: true });
    expect(resolveTeacherAuthoringAccess({ ...allowed, hasPermission: false })).toEqual({
      visible: false,
      reason: 'PERMISSION_REQUIRED',
    });
    expect(resolveTeacherAuthoringAccess({ ...allowed, ownerTeacherId: 'teacher-2' })).toEqual({
      visible: false,
      reason: 'OWNER_MISMATCH',
    });
    expect(resolveTeacherAuthoringAccess({ ...allowed, classroomStatus: 'ARCHIVED' })).toEqual({
      visible: false,
      reason: 'CLASSROOM_NOT_ACTIVE',
    });
  });
});

describe('Phase 04 ordering policy', () => {
  it('assigns a continuous canonical order from an exact active set', () => {
    expect(assignExactOrder(['lesson-a', 'lesson-b'], ['lesson-b', 'lesson-a'])).toEqual([
      { id: 'lesson-b', displayOrder: 0 },
      { id: 'lesson-a', displayOrder: 1 },
    ]);
  });

  it.each([
    [
      ['lesson-a', 'lesson-b'],
      ['lesson-a', 'lesson-a'],
    ],
    [['lesson-a', 'lesson-b'], ['lesson-a']],
    [
      ['lesson-a', 'lesson-b'],
      ['lesson-a', 'lesson-foreign'],
    ],
    [
      ['lesson-a', 'lesson-a'],
      ['lesson-a', 'lesson-a'],
    ],
  ])('rejects duplicate, missing, foreign, archived or corrupt sets', (activeIds, orderedIds) => {
    expect(() => assignExactOrder(activeIds, orderedIds)).toThrow(
      expect.objectContaining({ statusCode: 422, code: 'ORDER_SET_MISMATCH' }),
    );
  });

  it('sorts by displayOrder with a stable ID tie-breaker without mutating input', () => {
    const items = [
      { id: 'lesson-b', displayOrder: 1 },
      { id: 'lesson-c', displayOrder: 0 },
      { id: 'lesson-a', displayOrder: 1 },
    ];
    expect(sortCanonical(items).map((item) => item.id)).toEqual([
      'lesson-c',
      'lesson-a',
      'lesson-b',
    ]);
    expect(items.map((item) => item.id)).toEqual(['lesson-b', 'lesson-c', 'lesson-a']);
  });
});
