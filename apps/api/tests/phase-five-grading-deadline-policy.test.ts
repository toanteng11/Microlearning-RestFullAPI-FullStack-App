import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';

import type { DeadlineExceptionRecord } from '../src/modules/deadline-exceptions/deadline-exception.model.js';
import {
  assertDeadlineExceptionRevision,
  assertExtensionAllowed,
  assertRevokeAllowed,
} from '../src/modules/deadline-exceptions/deadline-exception.policy.js';
import type { GradeRecord } from '../src/modules/grades/grade.model.js';
import {
  assertEvidenceRevision,
  assertGradeRevision,
  assertGradeScore,
} from '../src/modules/grades/grade.policy.js';

describe('Phase 05 grading and deadline policies', () => {
  it('bounds integer Grades and protects evidence and Grade revisions', () => {
    expect(() => assertGradeScore(8, 10)).not.toThrow();
    expect(() => assertGradeScore(11, 10)).toThrowError(
      expect.objectContaining({ code: 'INVALID_GRADE_SCORE' }),
    );
    expect(() => assertEvidenceRevision(3, 2)).toThrowError(
      expect.objectContaining({ code: 'SUBMISSION_REVISION_MISMATCH' }),
    );
    expect(() => assertGradeRevision({ revision: 2 } as GradeRecord, 1)).toThrowError(
      expect.objectContaining({ code: 'CONCURRENT_MODIFICATION' }),
    );
  });

  it('allows only future non-shortening deadline updates', () => {
    const now = new Date('2026-08-01T00:00:00.000Z');
    const current = new Date('2026-08-03T00:00:00.000Z');
    expect(() =>
      assertExtensionAllowed(new Date('2026-08-04T00:00:00.000Z'), current, now),
    ).not.toThrow();
    expect(() =>
      assertExtensionAllowed(new Date('2026-08-02T00:00:00.000Z'), current, now),
    ).toThrowError(expect.objectContaining({ code: 'DEADLINE_SHORTENING_DENIED' }));
    expect(() =>
      assertExtensionAllowed(new Date('2026-07-31T00:00:00.000Z'), current, now),
    ).toThrowError(expect.objectContaining({ code: 'DEADLINE_IN_PAST' }));
  });

  it('protects exception revisions and denies harmful late revoke', () => {
    const current = {
      _id: new Types.ObjectId(),
      revision: 3,
    } as DeadlineExceptionRecord;
    expect(() => assertDeadlineExceptionRevision(current, 2)).toThrowError(
      expect.objectContaining({ code: 'CONCURRENT_MODIFICATION' }),
    );
    expect(() =>
      assertRevokeAllowed(
        new Date('2026-08-01T00:00:00.000Z'),
        new Date('2026-08-02T00:00:00.000Z'),
      ),
    ).toThrowError(expect.objectContaining({ code: 'DEADLINE_SHORTENING_DENIED' }));
  });
});
