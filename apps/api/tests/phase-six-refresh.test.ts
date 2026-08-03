import { Types } from 'mongoose';
import { describe, expect, it, vi } from 'vitest';

import type { CourseProgressSummaryRepository } from '../src/modules/reporting/course-progress-summary.repository.js';
import type { ReportingActivityReader } from '../src/modules/reporting/reporting-activity.reader.js';
import type { ReportingGradeReader } from '../src/modules/reporting/reporting-grade.reader.js';
import type { ReportingInvalidationRecord } from '../src/modules/reporting/reporting-invalidation.model.js';
import type { ReportingInvalidationRepository } from '../src/modules/reporting/reporting-invalidation.repository.js';
import type { ReportingProgressReader } from '../src/modules/reporting/reporting-progress.reader.js';
import { ReportingRefreshService } from '../src/modules/reporting/reporting-refresh.service.js';
import type { ReportingRosterReader } from '../src/modules/reporting/reporting-roster.reader.js';

describe('Phase 06 reporting refresh service', () => {
  it('stops automatic invalidation retry at its own configured attempt limit', async () => {
    const now = new Date('2026-08-01T12:00:00.000Z');
    const row = {
      _id: new Types.ObjectId(),
      classroomId: new Types.ObjectId(),
      courseId: new Types.ObjectId(),
      studentId: null,
      scopeType: 'COURSE',
      attempts: 2,
      revision: 1,
      claimToken: 'claim-token',
      reasons: ['ACTIVITY_CHANGED'],
      sourceChangedAt: now,
    } as ReportingInvalidationRecord;
    const invalidations = {
      claimBatch: vi.fn().mockResolvedValue([row]),
      resolve: vi.fn(),
      fail: vi.fn().mockResolvedValue(true),
    } as unknown as ReportingInvalidationRepository;
    const service = new ReportingRefreshService(
      {} as ReportingRosterReader,
      {} as ReportingActivityReader,
      {} as ReportingProgressReader,
      {} as ReportingGradeReader,
      {} as CourseProgressSummaryRepository,
      invalidations,
      undefined,
      {
        rebuildBatchSize: 50,
        rebuildMaxAttempts: 5,
        classroomExpansionBatchSize: 50,
        invalidationMaxAttempts: 2,
        invalidationRetryBaseSeconds: 30,
        invalidationRetryMaxSeconds: 300,
      },
      () => now,
    );
    vi.spyOn(service, 'rebuildCourse').mockRejectedValue(new Error('refresh fault'));

    const result = await service.processInvalidations(1, 'worker-a');

    expect(result).toEqual({ claimed: 1, resolved: 0, failed: 1 });
    expect(invalidations.fail).toHaveBeenCalledWith(
      { id: row._id, claimToken: 'claim-token', revision: 1 },
      'ERROR',
      null,
    );
  });
});
