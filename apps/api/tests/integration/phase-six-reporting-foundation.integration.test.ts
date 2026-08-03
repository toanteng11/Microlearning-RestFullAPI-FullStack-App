import mongoose, { Types } from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { CourseModel } from '../../src/modules/courses/course.model.js';
import { CourseProgressSummaryModel } from '../../src/modules/reporting/course-progress-summary.model.js';
import { CourseProgressSnapshotModel } from '../../src/modules/reporting/course-progress-snapshot.model.js';
import { AnalyticsEventModel } from '../../src/modules/reporting/analytics-event.model.js';
import { CourseProgressSummaryRepository } from '../../src/modules/reporting/course-progress-summary.repository.js';
import type { ReportingActivityReader } from '../../src/modules/reporting/reporting-activity.reader.js';
import type { ReportingGradeReader } from '../../src/modules/reporting/reporting-grade.reader.js';
import { ReportingInvalidationModel } from '../../src/modules/reporting/reporting-invalidation.model.js';
import { ReportingInvalidationRepository } from '../../src/modules/reporting/reporting-invalidation.repository.js';
import type { ReportingProgressReader } from '../../src/modules/reporting/reporting-progress.reader.js';
import { ReportingRefreshService } from '../../src/modules/reporting/reporting-refresh.service.js';
import type { ReportingRosterReader } from '../../src/modules/reporting/reporting-roster.reader.js';
import {
  PROCESS_SCORE_VERSION,
  REPORTING_DESCRIPTOR_VERSION,
  REPORTING_SCHEMA_VERSION,
  REPORTING_SOURCE_METRIC_VERSION,
} from '../../src/modules/reporting/reporting.constants.js';
import {
  ensurePhaseSixIndexes,
  initializePhaseSixIndexes,
} from '../../src/shared/database/phase-six-indexes.js';
import {
  assertPhaseSixMigrationPreflight,
  runPhaseSixMigrationPreflight,
} from '../../src/shared/database/phase-six-migration.js';

const integrationUri = process.env.MONGODB_INTEGRATION_URI;
if (!integrationUri) {
  throw new Error('MONGODB_INTEGRATION_URI is required for Phase 06 reporting integration tests');
}

function summaryValues(input: {
  classroomId: Types.ObjectId;
  courseId: Types.ObjectId;
  studentId: Types.ObjectId;
  processScore?: number | null;
  recalculatedAt?: Date;
}) {
  const processScore = input.processScore === undefined ? 50 : input.processScore;
  const recalculatedAt = input.recalculatedAt ?? new Date('2026-08-01T10:00:00.000Z');
  return {
    ...input,
    requiredActivityCount: 2,
    completedRequiredCount: processScore === null ? 0 : 1,
    progressPercentage: processScore,
    processScore,
    missingActivityCount: 1,
    lateActivityCount: 0,
    ungradedActivityCount: 0,
    returnedGradeCount: 0,
    gradePointsEarned: 0,
    gradePointsPossible: 0,
    returnedGradeAverage: null,
    lastActiveAt: null,
    courseCompleted: false,
    supportFlags: ['HAS_MISSING_WORK' as const, 'NO_RECENT_ACTIVITY' as const],
    sourceChangedAt: recalculatedAt,
    recalculatedAt,
    refreshStatus: 'FRESH' as const,
  };
}

function refreshService(input: {
  roster: ReportingRosterReader;
  activities: ReportingActivityReader;
  progress: ReportingProgressReader;
  grades: ReportingGradeReader;
  summaries?: CourseProgressSummaryRepository;
}) {
  return new ReportingRefreshService(
    input.roster,
    input.activities,
    input.progress,
    input.grades,
    input.summaries ?? new CourseProgressSummaryRepository(),
    new ReportingInvalidationRepository(120, 3),
    undefined,
    {
      rebuildBatchSize: 1,
      rebuildMaxAttempts: 3,
      classroomExpansionBatchSize: 50,
      invalidationMaxAttempts: 3,
      invalidationRetryBaseSeconds: 30,
      invalidationRetryMaxSeconds: 300,
    },
    () => new Date('2026-08-01T12:00:00.000Z'),
  );
}

describe('Phase 06 reporting data foundation on MongoDB replica set', () => {
  beforeAll(async () => {
    await mongoose.connect(integrationUri, { serverSelectionTimeoutMS: 15_000 });
    await initializePhaseSixIndexes('test');
  });

  beforeEach(async () => {
    await Promise.all([
      CourseProgressSummaryModel.deleteMany({}),
      CourseProgressSnapshotModel.deleteMany({}),
      AnalyticsEventModel.deleteMany({}),
      ReportingInvalidationModel.deleteMany({}),
      CourseModel.deleteMany({}),
    ]);
  });

  afterAll(async () => mongoose.disconnect());

  it('creates named indexes idempotently and passes migration preflight twice', async () => {
    await ensurePhaseSixIndexes();
    await ensurePhaseSixIndexes();
    const summaryIndexes = (await CourseProgressSummaryModel.collection.indexes()).map(
      (index) => index.name,
    );
    const invalidationIndexes = (await ReportingInvalidationModel.collection.indexes()).map(
      (index) => index.name,
    );
    const snapshotIndexes = (await CourseProgressSnapshotModel.collection.indexes()).map(
      (index) => index.name,
    );
    const analyticsIndexes = (await AnalyticsEventModel.collection.indexes()).map(
      (index) => index.name,
    );
    expect(summaryIndexes).toContain('report_summary_course_student_version_unique');
    expect(invalidationIndexes).toContain('report_invalidation_scope_unique');
    expect(snapshotIndexes).toContain('uq_progress_snapshot_summary_revision');
    expect(analyticsIndexes).toEqual(
      expect.arrayContaining(['uq_analytics_event_id', 'ttl_analytics_event']),
    );

    const first = await runPhaseSixMigrationPreflight(mongoose.connection);
    const second = await runPhaseSixMigrationPreflight(mongoose.connection);
    expect(first).toEqual(second);
    expect(first).toMatchObject({
      incompatibleSummaryCount: 0,
      prohibitedProjectionCount: 0,
      duplicateSummaryGroups: 0,
      invalidInvalidationScopeCount: 0,
      safeToActivate: true,
      versionActivation: {
        schemaVersion: REPORTING_SCHEMA_VERSION,
        sourceMetricVersion: REPORTING_SOURCE_METRIC_VERSION,
        descriptorVersion: REPORTING_DESCRIPTOR_VERSION,
        processScoreVersion: PROCESS_SCORE_VERSION,
      },
    });
    expect(() => assertPhaseSixMigrationPreflight(first)).not.toThrow();
  });

  it('creates and updates summary rows with compare-and-swap revision protection', async () => {
    const repository = new CourseProgressSummaryRepository();
    const identity = {
      classroomId: new Types.ObjectId(),
      courseId: new Types.ObjectId(),
      studentId: new Types.ObjectId(),
    };
    const created = await repository.replaceWithRevision({
      values: summaryValues(identity),
      expectedRevision: null,
    });
    expect(created.revision).toBe(1);

    const updated = await repository.replaceWithRevision({
      values: summaryValues({ ...identity, processScore: 100 }),
      expectedRevision: 1,
    });
    expect(updated).toMatchObject({ revision: 2, processScore: 100 });
    await expect(
      repository.replaceWithRevision({
        values: summaryValues({ ...identity, processScore: 50 }),
        expectedRevision: 1,
      }),
    ).rejects.toMatchObject({ code: 'REPORTING_REVISION_CONFLICT' });
  });

  it('returns a stable indexed default ranking with null scores last', async () => {
    const repository = new CourseProgressSummaryRepository();
    const classroomId = new Types.ObjectId();
    const courseId = new Types.ObjectId();
    const students = [new Types.ObjectId(), new Types.ObjectId(), new Types.ObjectId()].sort(
      (a, b) => a.toString().localeCompare(b.toString()),
    );
    await Promise.all([
      repository.replaceWithRevision({
        values: summaryValues({
          classroomId,
          courseId,
          studentId: students[1]!,
          processScore: 50,
        }),
        expectedRevision: null,
      }),
      repository.replaceWithRevision({
        values: summaryValues({
          classroomId,
          courseId,
          studentId: students[0]!,
          processScore: 50,
        }),
        expectedRevision: null,
      }),
      repository.replaceWithRevision({
        values: summaryValues({
          classroomId,
          courseId,
          studentId: students[2]!,
          processScore: null,
        }),
        expectedRevision: null,
      }),
    ]);

    const page = await repository.listRanking({
      courseId,
      processScoreVersion: PROCESS_SCORE_VERSION,
      page: 1,
      limit: 10,
    });

    expect(page.items.map((item) => item.studentId.toString())).toEqual(
      students.map((student) => student.toString()),
    );
    expect(page.items.map((item) => item.processScore)).toEqual([50, 50, null]);

    const explanation = await CourseProgressSummaryModel.find({
      courseId,
      processScoreVersion: PROCESS_SCORE_VERSION,
    })
      .sort({
        processScore: -1,
        completedRequiredCount: -1,
        missingActivityCount: 1,
        lateActivityCount: 1,
        lastActiveAt: -1,
        studentId: 1,
      })
      .explain('queryPlanner');
    expect(JSON.stringify(explanation)).toContain('report_summary_course_default_ranking');
  });

  it('rebuilds a student summary and removes it after the student leaves the roster', async () => {
    const classroomId = new Types.ObjectId();
    const courseId = new Types.ObjectId();
    const teacherId = new Types.ObjectId();
    const studentId = new Types.ObjectId();
    await CourseModel.create({
      _id: courseId,
      classroomId,
      ownerTeacherId: teacherId,
      title: 'Reporting course',
      description: '',
      status: 'PUBLISHED',
      publishedAt: new Date('2026-07-01T00:00:00.000Z'),
      displayOrder: 0,
      createdBy: teacherId,
      updatedBy: teacherId,
    });
    const rosterRows = [
      {
        studentId: studentId.toString(),
        enrollmentUpdatedAt: new Date('2026-07-01T00:00:00.000Z'),
      },
    ];
    const roster = {
      listActiveByCourse: vi.fn().mockImplementation(async () => rosterRows),
      listActiveByClassroom: vi.fn(),
      getSourceWatermark: vi.fn(),
    } satisfies ReportingRosterReader;
    const sourceUpdatedAt = new Date('2026-07-02T00:00:00.000Z');
    const activities = {
      listVisibleByCourse: vi.fn().mockResolvedValue([
        {
          activityId: new Types.ObjectId().toString(),
          activityType: 'LESSON',
          classroomId: classroomId.toString(),
          courseId: courseId.toString(),
          moduleId: null,
          title: 'Required lesson',
          isRequired: true,
          lifecycleStatus: 'PUBLISHED',
          visible: true,
          defaultDeadline: new Date('2026-07-31T00:00:00.000Z'),
          maxScore: null,
          displayOrder: 0,
          sourceUpdatedAt,
        },
      ]),
      listDeadlineExceptions: vi.fn().mockResolvedValue([]),
      getSourceWatermark: vi.fn().mockResolvedValue(sourceUpdatedAt),
    } satisfies ReportingActivityReader;
    const activityId = (await activities.listVisibleByCourse(courseId.toString(), new Date()))[0]!
      .activityId;
    const progress = {
      listByCourseAndStudents: vi.fn().mockResolvedValue([
        {
          studentId: studentId.toString(),
          courseId: courseId.toString(),
          activityId,
          activityType: 'LESSON',
          status: 'COMPLETED',
          startedAt: new Date('2026-07-03T00:00:00.000Z'),
          completedAt: new Date('2026-07-04T00:00:00.000Z'),
          lastActiveAt: new Date('2026-07-04T00:00:00.000Z'),
          sourceUpdatedAt: new Date('2026-07-04T00:00:00.000Z'),
        },
      ]),
      getSourceWatermark: vi.fn().mockResolvedValue(new Date('2026-07-04T00:00:00.000Z')),
    } satisfies ReportingProgressReader;
    const grades = {
      listCurrentByCourseAndStudents: vi.fn().mockResolvedValue([]),
      getSourceWatermark: vi.fn().mockResolvedValue(null),
    } satisfies ReportingGradeReader;
    const summaries = new CourseProgressSummaryRepository();
    const service = refreshService({ roster, activities, progress, grades, summaries });

    const rebuilt = await service.refreshStudent(courseId.toString(), studentId.toString());

    expect(rebuilt).toMatchObject({
      requiredActivityCount: 1,
      completedRequiredCount: 1,
      processScore: 100,
      refreshStatus: 'FRESH',
    });
    rosterRows.splice(0);
    expect(await service.refreshStudent(courseId.toString(), studentId.toString())).toBeNull();
    expect(await summaries.findStudent(courseId, studentId)).toBeNull();
  });

  it('retries a student rebuild when the source watermark changes during calculation', async () => {
    const classroomId = new Types.ObjectId();
    const courseId = new Types.ObjectId();
    const teacherId = new Types.ObjectId();
    const studentId = new Types.ObjectId();
    await CourseModel.create({
      _id: courseId,
      classroomId,
      ownerTeacherId: teacherId,
      title: 'Concurrent reporting course',
      description: '',
      status: 'PUBLISHED',
      publishedAt: new Date('2026-07-01T00:00:00.000Z'),
      displayOrder: 0,
      createdBy: teacherId,
      updatedBy: teacherId,
    });
    const roster = {
      listActiveByCourse: vi.fn().mockResolvedValue([
        {
          studentId: studentId.toString(),
          enrollmentUpdatedAt: new Date('2026-07-01T00:00:00.000Z'),
        },
      ]),
      listActiveByClassroom: vi.fn(),
      getSourceWatermark: vi.fn(),
    } satisfies ReportingRosterReader;
    const oldWatermark = new Date('2026-07-02T00:00:00.000Z');
    const newWatermark = new Date('2026-07-03T00:00:00.000Z');
    const activities = {
      listVisibleByCourse: vi.fn().mockResolvedValue([]),
      listDeadlineExceptions: vi.fn().mockResolvedValue([]),
      getSourceWatermark: vi
        .fn()
        .mockResolvedValueOnce(oldWatermark)
        .mockResolvedValueOnce(newWatermark)
        .mockResolvedValue(newWatermark),
    } satisfies ReportingActivityReader;
    const progress = {
      listByCourseAndStudents: vi.fn().mockResolvedValue([]),
      getSourceWatermark: vi.fn().mockResolvedValue(null),
    } satisfies ReportingProgressReader;
    const grades = {
      listCurrentByCourseAndStudents: vi.fn().mockResolvedValue([]),
      getSourceWatermark: vi.fn().mockResolvedValue(null),
    } satisfies ReportingGradeReader;
    const service = refreshService({ roster, activities, progress, grades });

    const rebuilt = await service.refreshStudent(courseId.toString(), studentId.toString());

    expect(rebuilt).toMatchObject({ sourceChangedAt: newWatermark, processScore: null });
    expect(activities.listVisibleByCourse).toHaveBeenCalledTimes(2);
  });

  it('rebuilds the full roster in bounded batches after required activity changes', async () => {
    const classroomId = new Types.ObjectId();
    const courseId = new Types.ObjectId();
    const teacherId = new Types.ObjectId();
    const studentIds = [new Types.ObjectId(), new Types.ObjectId()];
    await CourseModel.create({
      _id: courseId,
      classroomId,
      ownerTeacherId: teacherId,
      title: 'Course-wide reporting rebuild',
      description: '',
      status: 'PUBLISHED',
      publishedAt: new Date('2026-07-01T00:00:00.000Z'),
      displayOrder: 0,
      createdBy: teacherId,
      updatedBy: teacherId,
    });
    const sourceUpdatedAt = new Date('2026-07-02T00:00:00.000Z');
    const activity = {
      activityId: new Types.ObjectId().toString(),
      activityType: 'LESSON' as const,
      classroomId: classroomId.toString(),
      courseId: courseId.toString(),
      moduleId: null,
      title: 'Optional then required',
      isRequired: false,
      lifecycleStatus: 'PUBLISHED' as const,
      visible: true,
      defaultDeadline: new Date('2026-07-31T00:00:00.000Z'),
      maxScore: null,
      displayOrder: 0,
      sourceUpdatedAt,
    };
    const roster = {
      listActiveByCourse: vi.fn().mockResolvedValue(
        studentIds.map((studentId) => ({
          studentId: studentId.toString(),
          enrollmentUpdatedAt: new Date('2026-07-01T00:00:00.000Z'),
        })),
      ),
      listActiveByClassroom: vi.fn(),
      getSourceWatermark: vi.fn(),
    } satisfies ReportingRosterReader;
    const activities = {
      listVisibleByCourse: vi.fn().mockImplementation(async () => [activity]),
      listDeadlineExceptions: vi.fn().mockResolvedValue([]),
      getSourceWatermark: vi.fn().mockImplementation(async () => activity.sourceUpdatedAt),
    } satisfies ReportingActivityReader;
    const progress = {
      listByCourseAndStudents: vi.fn().mockResolvedValue([]),
      getSourceWatermark: vi.fn().mockResolvedValue(null),
    } satisfies ReportingProgressReader;
    const grades = {
      listCurrentByCourseAndStudents: vi.fn().mockResolvedValue([]),
      getSourceWatermark: vi.fn().mockResolvedValue(null),
    } satisfies ReportingGradeReader;
    const summaries = new CourseProgressSummaryRepository();
    const service = refreshService({ roster, activities, progress, grades, summaries });

    expect(await service.rebuildCourse(courseId.toString())).toEqual({
      courseId: courseId.toString(),
      rosterCount: 2,
      refreshed: 2,
      failed: 0,
    });
    expect((await summaries.listByCourse(courseId)).map((row) => row.processScore)).toEqual([
      null,
      null,
    ]);

    activity.isRequired = true;
    activity.sourceUpdatedAt = new Date('2026-07-03T00:00:00.000Z');
    const invalidations = new ReportingInvalidationRepository(120, 3);
    await invalidations.upsert({
      scope: { scopeType: 'COURSE', classroomId, courseId, studentId: null },
      reasons: ['ACTIVITY_CHANGED'],
      sourceChangedAt: activity.sourceUpdatedAt,
    });

    expect(await service.processInvalidations(1, 'worker-a')).toEqual({
      claimed: 1,
      resolved: 1,
      failed: 0,
    });
    expect(
      (await summaries.listByCourse(courseId)).map((row) => ({
        processScore: row.processScore,
        missingActivityCount: row.missingActivityCount,
      })),
    ).toEqual([
      { processScore: 0, missingActivityCount: 1 },
      { processScore: 0, missingActivityCount: 1 },
    ]);
  });

  it('coalesces reasons, keeps the newest watermark and rejects stale worker resolution', async () => {
    const repository = new ReportingInvalidationRepository(120, 3, () => 'claim-token');
    const scope = {
      scopeType: 'STUDENT_COURSE' as const,
      classroomId: new Types.ObjectId(),
      courseId: new Types.ObjectId(),
      studentId: new Types.ObjectId(),
    };
    const older = new Date('2026-08-01T10:00:00.000Z');
    const newer = new Date('2026-08-01T11:00:00.000Z');
    await repository.upsert({ scope, reasons: ['PROGRESS_CHANGED'], sourceChangedAt: older });
    await repository.upsert({ scope, reasons: ['GRADE_CHANGED'], sourceChangedAt: newer });
    const coalesced = await repository.findByScope(scope);
    expect(coalesced).toMatchObject({
      reasons: expect.arrayContaining(['PROGRESS_CHANGED', 'GRADE_CHANGED']),
      sourceChangedAt: newer,
      revision: 2,
      status: 'PENDING',
    });

    const [claimed] = await repository.claimBatch(1, 'worker-a', newer);
    expect(claimed).toBeDefined();
    await repository.upsert({
      scope,
      reasons: ['DEADLINE_EXCEPTION_CHANGED'],
      sourceChangedAt: new Date('2026-08-01T12:00:00.000Z'),
    });
    expect(
      await repository.resolve({
        id: claimed!._id,
        claimToken: claimed!.claimToken!,
        revision: claimed!.revision,
      }),
    ).toBe(false);
    expect(await repository.findByScope(scope)).toMatchObject({
      status: 'PENDING',
      revision: 3,
      reasons: expect.arrayContaining([
        'PROGRESS_CHANGED',
        'GRADE_CHANGED',
        'DEADLINE_EXCEPTION_CHANGED',
      ]),
    });
  });

  it('lets a broader invalidation supersede narrower pending work', async () => {
    const repository = new ReportingInvalidationRepository(120, 3);
    const classroomId = new Types.ObjectId();
    const courseId = new Types.ObjectId();
    await repository.upsert({
      scope: {
        scopeType: 'STUDENT_COURSE',
        classroomId,
        courseId,
        studentId: new Types.ObjectId(),
      },
      reasons: ['PROGRESS_CHANGED'],
      sourceChangedAt: new Date(),
    });
    await repository.upsert({
      scope: { scopeType: 'COURSE', classroomId, courseId, studentId: null },
      reasons: ['ACTIVITY_CHANGED'],
      sourceChangedAt: new Date(),
    });
    expect(await ReportingInvalidationModel.countDocuments({ scopeType: 'STUDENT_COURSE' })).toBe(
      0,
    );
    expect(await ReportingInvalidationModel.countDocuments({ scopeType: 'COURSE' })).toBe(1);
  });

  it('blocks migration activation when a summary projection contains prohibited fields', async () => {
    await CourseProgressSummaryModel.collection.insertOne({
      schemaVersion: REPORTING_SCHEMA_VERSION,
      sourceMetricVersion: REPORTING_SOURCE_METRIC_VERSION,
      descriptorVersion: REPORTING_DESCRIPTOR_VERSION,
      processScoreVersion: PROCESS_SCORE_VERSION,
      courseId: new Types.ObjectId(),
      classroomId: new Types.ObjectId(),
      studentId: new Types.ObjectId(),
      email: 'must-not-exist@example.test',
    });
    const result = await runPhaseSixMigrationPreflight(mongoose.connection);
    expect(result).toMatchObject({ prohibitedProjectionCount: 1, safeToActivate: false });
    expect(() => assertPhaseSixMigrationPreflight(result)).toThrow(
      'Phase 06 migration preflight failed',
    );
  });

  it('blocks migration activation when an invalidation is missing its classroom scope', async () => {
    await ReportingInvalidationModel.collection.insertOne({
      schemaVersion: REPORTING_SCHEMA_VERSION,
      scopeKey: `COURSE:${new Types.ObjectId().toString()}:ALL`,
      scopeType: 'COURSE',
      classroomId: null,
      courseId: new Types.ObjectId(),
      studentId: null,
      reasons: ['ACTIVITY_CHANGED'],
      sourceChangedAt: new Date(),
      status: 'PENDING',
      attempts: 0,
      revision: 1,
      lastErrorCode: null,
      nextRetryAt: null,
      lockedAt: null,
      lockedBy: null,
      claimToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await runPhaseSixMigrationPreflight(mongoose.connection);

    expect(result).toMatchObject({ invalidInvalidationScopeCount: 1, safeToActivate: false });
    expect(() => assertPhaseSixMigrationPreflight(result)).toThrow(
      'Phase 06 migration preflight failed',
    );
  });

  it('commits or rolls back a source marker and invalidation as one transaction', async () => {
    const repository = new ReportingInvalidationRepository(120, 3);
    const scope = {
      scopeType: 'COURSE' as const,
      classroomId: new Types.ObjectId(),
      courseId: new Types.ObjectId(),
      studentId: null,
    };
    const source = mongoose.connection.collection('p06_atomic_source_markers');
    const rollbackSession = await mongoose.startSession();
    try {
      await expect(
        rollbackSession.withTransaction(async () => {
          await source.insertOne({ marker: 'rollback' }, { session: rollbackSession });
          await repository.upsert(
            { scope, reasons: ['ACTIVITY_CHANGED'], sourceChangedAt: new Date() },
            rollbackSession,
          );
          throw new Error('intentional reporting rollback');
        }),
      ).rejects.toThrow('intentional reporting rollback');
    } finally {
      await rollbackSession.endSession();
    }
    expect(await source.countDocuments({ marker: 'rollback' })).toBe(0);
    expect(await repository.findByScope(scope)).toBeNull();

    const commitSession = await mongoose.startSession();
    try {
      await commitSession.withTransaction(async () => {
        await source.insertOne({ marker: 'commit' }, { session: commitSession });
        await repository.upsert(
          { scope, reasons: ['ACTIVITY_CHANGED'], sourceChangedAt: new Date() },
          commitSession,
        );
      });
    } finally {
      await commitSession.endSession();
    }
    expect(await source.countDocuments({ marker: 'commit' })).toBe(1);
    expect(await repository.findByScope(scope)).toMatchObject({
      status: 'PENDING',
      reasons: ['ACTIVITY_CHANGED'],
    });
    const failingRefresh = refreshService({
      roster: {
        listActiveByCourse: vi.fn().mockRejectedValue(new Error('source reader unavailable')),
        listActiveByClassroom: vi.fn(),
        getSourceWatermark: vi.fn(),
      },
      activities: {
        listVisibleByCourse: vi.fn(),
        listDeadlineExceptions: vi.fn(),
        getSourceWatermark: vi.fn(),
      },
      progress: {
        listByCourseAndStudents: vi.fn(),
        getSourceWatermark: vi.fn(),
      },
      grades: {
        listCurrentByCourseAndStudents: vi.fn(),
        getSourceWatermark: vi.fn(),
      },
    });

    expect(await failingRefresh.processInvalidations(1, 'worker-a')).toEqual({
      claimed: 1,
      resolved: 0,
      failed: 1,
    });
    expect(await source.countDocuments({ marker: 'commit' })).toBe(1);
    expect(await repository.findByScope(scope)).toMatchObject({ status: 'FAILED', attempts: 1 });
    await source.deleteMany({});
  });
});
