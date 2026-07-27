import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';

import { toStudentQuestionDto } from '../src/modules/questions/question.dto.js';
import {
  buildNewQuestionShape,
  buildQuestionMedia,
  buildQuestionPatch,
} from '../src/modules/questions/question.policy.js';
import type { QuestionProjection } from '../src/modules/questions/question.repository.js';
import {
  assertQuizPublishPrerequisites,
  assertQuizTransition,
  resolveEffectiveQuizStatus,
} from '../src/modules/quizzes/quiz.domain.js';
import type { QuizProjection } from '../src/modules/quizzes/quiz.repository.js';
import { testConfig } from './test-fixtures.js';

function questionFixture(type: QuestionProjection['type'] = 'SINGLE_CHOICE'): QuestionProjection {
  const now = new Date('2026-08-01T00:00:00.000Z');
  return {
    _id: new Types.ObjectId(),
    quizId: new Types.ObjectId(),
    courseId: new Types.ObjectId(),
    type,
    prompt: 'HTTP method?',
    points: 2,
    isRequired: true,
    options: type.includes('CHOICE')
      ? [
          { id: 'a', label: 'GET', displayOrder: 0 },
          { id: 'b', label: 'POST', displayOrder: 1 },
        ]
      : [],
    correctOptionIds: type.includes('CHOICE') ? ['b'] : [],
    correctBoolean: type === 'TRUE_FALSE' ? true : null,
    rubric: type === 'SHORT_ANSWER' ? 'Explain idempotency' : null,
    explanation: 'Private explanation',
    media: null,
    displayOrder: 0,
    version: 1,
    status: 'ACTIVE',
    archivedAt: null,
    createdBy: new Types.ObjectId(),
    updatedBy: new Types.ObjectId(),
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
  };
}

function quizFixture(): QuizProjection {
  const now = new Date('2026-08-01T00:00:00.000Z');
  return {
    _id: new Types.ObjectId(),
    classroomId: new Types.ObjectId(),
    courseId: new Types.ObjectId(),
    moduleId: null,
    title: 'Quiz',
    instruction: 'Answer all questions',
    isRequired: true,
    status: 'DRAFT',
    availableFrom: null,
    dueDate: new Date('2026-08-10T00:00:00.000Z'),
    attemptLimit: 1,
    timeLimitMinutes: 15,
    resultReleasePolicy: 'AFTER_REVIEW',
    scorePolicy: 'HIGHEST',
    displayOrder: 0,
    contentRevision: 1,
    questionRevision: 0,
    publishedRevision: null,
    maxScore: 0,
    scheduledPublishAt: null,
    publishedAt: null,
    unpublishedAt: null,
    archivedAt: null,
    createdBy: new Types.ObjectId(),
    updatedBy: new Types.ObjectId(),
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
  };
}

describe('Phase 05 Quiz and Question policies', () => {
  it('creates stable choice option IDs and validates exact answer sets', () => {
    const ids = ['opt-a', 'opt-b'];
    const shape = buildNewQuestionShape(
      {
        type: 'SINGLE_CHOICE',
        prompt: 'HTTP method?',
        points: 2,
        isRequired: true,
        explanation: null,
        options: [{ label: 'GET' }, { label: 'POST' }],
        correctOptionIndexes: [1],
        expectedQuestionRevision: 0,
      },
      () => ids.shift()!,
    );
    expect(shape.options).toEqual([
      { id: 'opt-a', label: 'GET', displayOrder: 0 },
      { id: 'opt-b', label: 'POST', displayOrder: 1 },
    ]);
    expect(shape.correctOptionIds).toEqual(['opt-b']);
    expect(() =>
      buildNewQuestionShape(
        {
          type: 'MULTIPLE_CHOICE',
          prompt: 'Choose',
          points: 2,
          isRequired: true,
          explanation: null,
          options: [{ label: 'Same' }, { label: ' same ' }],
          correctOptionIndexes: [0],
          expectedQuestionRevision: 0,
        },
        () => crypto.randomUUID(),
      ),
    ).toThrow('Question options are invalid');
  });

  it('preserves server option IDs and rejects foreign correct IDs on update', () => {
    const current = questionFixture();
    expect(
      buildQuestionPatch(current, { prompt: 'Updated prompt', expectedQuestionRevision: 1 }),
    ).toEqual({ prompt: 'Updated prompt' });
    expect(() =>
      buildQuestionPatch(current, { correctOptionIds: ['foreign'], expectedQuestionRevision: 1 }),
    ).toThrow('Correct option set is invalid');
  });

  it('keeps Student preview free of answer keys, rubric and explanations', () => {
    const serialized = JSON.stringify(toStudentQuestionDto(questionFixture()));
    expect(serialized).not.toMatch(/correctOptionIds|correctBoolean|rubric|explanation/u);
  });

  it('enforces URL-media feature flags and exact HTTPS hostname allowlist', () => {
    const input = {
      kind: 'IMAGE_URL' as const,
      url: 'https://media.example.edu/image.png',
      caption: null,
      altText: 'HTTP response',
      expectedQuestionRevision: 1,
    };
    expect(() => buildQuestionMedia(input, testConfig.assessmentFeatures)).toThrow(
      'Question URL media is disabled',
    );
    expect(
      buildQuestionMedia(input, {
        ...testConfig.assessmentFeatures,
        questionImageUrlEnabled: true,
        questionMediaAllowedHosts: ['media.example.edu'],
      }),
    ).toMatchObject({ provider: 'media.example.edu' });
    expect(() =>
      buildQuestionMedia(
        { ...input, url: 'https://evil.example/image.png' },
        {
          ...testConfig.assessmentFeatures,
          questionImageUrlEnabled: true,
          questionMediaAllowedHosts: ['media.example.edu'],
        },
      ),
    ).toThrow('not allowed');
  });

  it('enforces lifecycle, schedule resolution and publish prerequisites', () => {
    expect(() => assertQuizTransition('DRAFT', 'PUBLISHED')).not.toThrow();
    expect(() => assertQuizTransition('PUBLISHED', 'DRAFT')).toThrow('cannot transition');
    expect(
      resolveEffectiveQuizStatus(
        { status: 'SCHEDULED', scheduledPublishAt: new Date('2026-08-01T00:00:00.000Z') },
        new Date('2026-08-02T00:00:00.000Z'),
      ),
    ).toBe('PUBLISHED');
    expect(() =>
      assertQuizPublishPrerequisites(
        quizFixture(),
        { activeCount: 0, maxScore: 0, hasShortAnswer: false },
        new Date('2026-08-02T00:00:00.000Z'),
      ),
    ).toThrow('not ready to publish');
    expect(() =>
      assertQuizPublishPrerequisites(
        quizFixture(),
        { activeCount: 2, maxScore: 10, hasShortAnswer: false },
        new Date('2026-08-02T00:00:00.000Z'),
      ),
    ).not.toThrow();
  });
});
