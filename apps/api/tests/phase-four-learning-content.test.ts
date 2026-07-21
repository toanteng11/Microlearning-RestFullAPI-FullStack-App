import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';

import { buildPhaseFourAuditInput } from '../src/modules/audit/phase-four-audit.writer.js';
import { assertDeadlineChangeAllowed } from '../src/modules/deadlines/lesson-deadline.policy.js';
import { changeLessonDeadlineSchema } from '../src/modules/deadlines/lesson-deadline.schemas.js';
import { createFlashcardSchema } from '../src/modules/flashcards/flashcard.schemas.js';
import { renderSanitizedMarkdown } from '../src/modules/learning-content/markdown.policy.js';
import { assertLessonPublishPrerequisites } from '../src/modules/lessons/lesson.domain.js';
import { toStudentLessonDto } from '../src/modules/lessons/lesson.dto.js';
import type { LessonProjection } from '../src/modules/lessons/lesson.repository.js';
import {
  createLessonSchema,
  reorderLessonsSchema,
  updateLessonSchema,
} from '../src/modules/lessons/lesson.schemas.js';

function lessonFixture(overrides: Partial<LessonProjection> = {}): LessonProjection {
  const now = new Date('2026-07-20T08:00:00.000Z');
  return {
    _id: new Types.ObjectId(),
    courseId: new Types.ObjectId(),
    moduleId: null,
    title: 'REST Resource Naming',
    content: '## Safe\n\n<script>alert(1)</script>[bad](javascript:alert(1))',
    contentFormat: 'MARKDOWN',
    estimatedMinutes: 8,
    isRequired: true,
    status: 'DRAFT',
    scheduledPublishAt: null,
    publishedAt: null,
    unpublishedAt: null,
    archivedAt: null,
    publishedRevision: null,
    contentRevision: 1,
    completionDeadline: new Date('2026-07-21T08:00:00.000Z'),
    deadlineRevision: 1,
    deadlineLastUpdatedAt: now,
    deadlineLastUpdatedBy: new Types.ObjectId(),
    displayOrder: 0,
    flashcardRevision: 0,
    schemaVersion: 1,
    createdBy: new Types.ObjectId(),
    updatedBy: new Types.ObjectId(),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('Phase 04 Lesson, Flashcard and Deadline policies', () => {
  it('renders Markdown through an HTML allowlist and strips unsafe payloads', () => {
    const html = renderSanitizedMarkdown(
      '# Heading\n<script>alert(1)</script>\n[unsafe](javascript:alert(2))\n[safe](https://example.test)',
    );
    expect(html).toContain('<h1>Heading</h1>');
    expect(html).toContain('https://example.test');
    expect(html).toContain('noopener noreferrer');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('javascript:');
  });

  it('keeps Student Lesson projection free of raw Markdown and internal revisions', () => {
    const dto = toStudentLessonDto(lessonFixture());
    expect(dto).toHaveProperty('contentHtml');
    expect(dto).not.toHaveProperty('content');
    expect(dto).not.toHaveProperty('deadlineRevision');
    expect(dto.contentHtml).not.toContain('<script');
  });

  it('uses strict authoring schemas and bounded exact-set payloads', () => {
    const courseId = new Types.ObjectId().toString();
    expect(
      createLessonSchema.safeParse({
        courseId,
        title: 'Lesson',
        content: '# Content',
        estimatedMinutes: 5,
        status: 'PUBLISHED',
      }).success,
    ).toBe(false);
    expect(
      updateLessonSchema.safeParse({ expectedUpdatedAt: '2026-07-20T08:00:00.000Z' }).success,
    ).toBe(false);
    expect(
      createFlashcardSchema.safeParse({
        frontText: 'Question',
        backText: 'Answer',
        status: 'ARCHIVED',
      }).success,
    ).toBe(false);
    expect(
      reorderLessonsSchema.safeParse({
        containers: [
          { moduleId: null, orderedLessonIds: [new Types.ObjectId().toString()] },
          { moduleId: null, orderedLessonIds: [] },
        ],
        expectedStructureRevision: 1,
      }).success,
    ).toBe(false);
    expect(
      changeLessonDeadlineSchema.safeParse({
        completionDeadline: null,
        expectedDeadlineRevision: 0,
        actorId: new Types.ObjectId().toString(),
      }).success,
    ).toBe(false);
  });

  it('enforces Lesson publish prerequisites including the parent Module state', () => {
    const now = new Date('2026-07-20T08:00:00.000Z');
    expect(() => assertLessonPublishPrerequisites(lessonFixture(), null, now)).not.toThrow();
    expect(() =>
      assertLessonPublishPrerequisites(
        lessonFixture({ completionDeadline: new Date('2026-07-20T08:00:00.000Z') }),
        null,
        now,
      ),
    ).toThrowError(/future/u);
    expect(() =>
      assertLessonPublishPrerequisites(
        lessonFixture({ moduleId: new Types.ObjectId() }),
        null,
        now,
      ),
    ).toThrowError(/Module/u);
  });

  it('enforces deadline clear, shortening and reason rules by lifecycle', () => {
    const now = new Date('2026-07-20T08:00:00.000Z');
    const current = new Date('2026-07-25T08:00:00.000Z');
    expect(() =>
      assertDeadlineChangeAllowed({
        status: 'DRAFT',
        currentDeadline: current,
        nextDeadline: null,
        now,
      }),
    ).not.toThrow();
    expect(() =>
      assertDeadlineChangeAllowed({
        status: 'PUBLISHED',
        currentDeadline: current,
        nextDeadline: new Date('2026-07-24T08:00:00.000Z'),
        reason: 'Valid documented reason',
        now,
      }),
    ).toThrowError(/shortened/u);
    expect(() =>
      assertDeadlineChangeAllowed({
        status: 'PUBLISHED',
        currentDeadline: current,
        nextDeadline: new Date('2026-07-26T08:00:00.000Z'),
        now,
      }),
    ).toThrowError(/Reason/u);
  });

  it('never records Lesson body, Flashcard text or complete reorder sets in audit values', () => {
    const audit = buildPhaseFourAuditInput({
      actorRole: 'TEACHER',
      action: 'LESSON_UPDATED',
      resourceId: new Types.ObjectId().toString(),
      requestId: 'request-p04-learning',
      oldValue: { content: '<script>secret</script>', title: 'Visible title' },
      metadata: { orderedLessonIds: ['secret-id'], lessonCount: 2 },
    });
    expect(audit.oldValue).toEqual({ title: 'Visible title' });
    expect(audit.metadata).toEqual({ lessonCount: 2 });
  });
});
