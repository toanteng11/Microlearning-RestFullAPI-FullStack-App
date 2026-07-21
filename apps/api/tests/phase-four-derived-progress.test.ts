import { describe, expect, it } from 'vitest';

import {
  deriveLearningStatus,
  isCompletedDerived,
  progressPercentage,
} from '../src/modules/learning-progress/derived-progress.policy.js';

const deadline = new Date('2026-07-20T10:00:00.000Z');

describe('Phase 04 derived learning progress policy', () => {
  it('derives not-started, in-progress and missing at the deadline boundary', () => {
    expect(deriveLearningStatus(null, deadline, new Date('2026-07-20T09:59:59.999Z'))).toBe(
      'NOT_STARTED',
    );
    expect(
      deriveLearningStatus(
        { status: 'IN_PROGRESS', completedAt: null },
        deadline,
        new Date('2026-07-20T09:59:59.999Z'),
      ),
    ).toBe('IN_PROGRESS');
    expect(deriveLearningStatus(null, deadline, deadline)).toBe('MISSING');
    expect(
      deriveLearningStatus({ status: 'IN_PROGRESS', completedAt: null }, deadline, deadline),
    ).toBe('MISSING');
  });

  it('derives completed and late from the immutable first completion time', () => {
    expect(
      deriveLearningStatus(
        { status: 'COMPLETED', completedAt: deadline },
        deadline,
        new Date('2026-07-21T00:00:00.000Z'),
      ),
    ).toBe('COMPLETED');
    expect(
      deriveLearningStatus(
        { status: 'COMPLETED', completedAt: new Date('2026-07-20T10:00:00.001Z') },
        deadline,
        new Date('2026-07-21T00:00:00.000Z'),
      ),
    ).toBe('LATE');
  });

  it('counts completed and late states and rounds percentages to one decimal', () => {
    expect(isCompletedDerived('COMPLETED')).toBe(true);
    expect(isCompletedDerived('LATE')).toBe(true);
    expect(isCompletedDerived('MISSING')).toBe(false);
    expect(progressPercentage(2, 3)).toBe(66.7);
    expect(progressPercentage(0, 0)).toBe(0);
  });
});
