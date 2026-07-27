import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';

import {
  assertAssignmentTransition,
  assertSubmissionMethods,
  resolveEffectiveAssignmentStatus,
} from '../src/modules/assignments/assignment.domain.js';
import type { AssignmentRecord } from '../src/modules/assignments/assignment.model.js';
import {
  assertSubmissionContent,
  isLateSubmission,
} from '../src/modules/submissions/submission.policy.js';
import { testConfig } from './test-fixtures.js';

function assignmentFixture(): AssignmentRecord {
  const now = new Date('2026-08-01T00:00:00.000Z');
  return {
    _id: new Types.ObjectId(),
    classroomId: new Types.ObjectId(),
    courseId: new Types.ObjectId(),
    moduleId: null,
    title: 'REST Assignment',
    instruction: 'Design an endpoint.',
    maxScore: 10,
    isRequired: true,
    allowedSubmissionTypes: ['TEXT'],
    allowLateSubmission: false,
    allowUnsubmit: true,
    allowResubmit: true,
    availableFrom: null,
    dueDate: new Date('2026-08-10T00:00:00.000Z'),
    status: 'DRAFT',
    displayOrder: 0,
    contentRevision: 1,
    publishedRevision: null,
    scheduledPublishAt: null,
    publishedAt: null,
    unpublishedAt: null,
    closedAt: null,
    archivedAt: null,
    createdBy: new Types.ObjectId(),
    updatedBy: new Types.ObjectId(),
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
  };
}

describe('Phase 05 Assignment and Submission policies', () => {
  it('enforces lifecycle transitions and resolves scheduled publication by server time', () => {
    expect(() => assertAssignmentTransition('DRAFT', 'PUBLISHED')).not.toThrow();
    expect(() => assertAssignmentTransition('PUBLISHED', 'DRAFT')).toThrow('cannot transition');
    expect(
      resolveEffectiveAssignmentStatus(
        {
          status: 'SCHEDULED',
          scheduledPublishAt: new Date('2026-08-02T00:00:00.000Z'),
        },
        new Date('2026-08-03T00:00:00.000Z'),
      ),
    ).toBe('PUBLISHED');
  });

  it('keeps TEXT mandatory and conditional methods behind feature flags', () => {
    expect(() => assertSubmissionMethods(['TEXT'], testConfig.assessmentFeatures)).not.toThrow();
    expect(() => assertSubmissionMethods(['LINK'], testConfig.assessmentFeatures)).toThrow(
      'TEXT must be enabled',
    );
    expect(() => assertSubmissionMethods(['TEXT', 'LINK'], testConfig.assessmentFeatures)).toThrow(
      'disabled',
    );
  });

  it('permits incomplete safe drafts but requires complete matching content at turn-in', () => {
    const assignment = assignmentFixture();
    const emptyText = {
      submissionType: 'TEXT' as const,
      textAnswer: null,
      links: [],
      markDone: false,
    };
    expect(() =>
      assertSubmissionContent(assignment, emptyText, testConfig.assessmentFeatures, false),
    ).not.toThrow();
    expect(() =>
      assertSubmissionContent(assignment, emptyText, testConfig.assessmentFeatures, true),
    ).toThrow('required');
    expect(() =>
      assertSubmissionContent(
        assignment,
        { ...emptyText, textAnswer: 'POST /api/v1/books' },
        testConfig.assessmentFeatures,
        true,
      ),
    ).not.toThrow();
  });

  it('uses an exact server-time late boundary', () => {
    const due = new Date('2026-08-10T00:00:00.000Z');
    expect(isLateSubmission(due, new Date('2026-08-10T00:00:00.000Z'))).toBe(false);
    expect(isLateSubmission(due, new Date('2026-08-10T00:00:00.001Z'))).toBe(true);
  });
});
