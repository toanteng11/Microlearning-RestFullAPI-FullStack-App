import { randomUUID } from 'node:crypto';

import type { ClientSession, Types } from 'mongoose';

import { REPORTING_SCHEMA_VERSION } from './reporting.constants.js';
import {
  ReportingInvalidationModel,
  type ReportingInvalidationRecord,
} from './reporting-invalidation.model.js';
import type {
  InvalidationClaim,
  ReportingInvalidationCommand,
  ReportingInvalidationScope,
} from './reporting.types.js';

export function reportingScopeKey(scope: ReportingInvalidationScope): string {
  if (scope.scopeType === 'CLASSROOM') return `CLASSROOM:${scope.classroomId.toString()}:ALL`;
  if (scope.scopeType === 'COURSE') return `COURSE:${scope.courseId.toString()}:ALL`;
  return `COURSE:${scope.courseId.toString()}:STUDENT:${scope.studentId.toString()}`;
}

export class ReportingInvalidationRepository {
  constructor(
    private readonly lockSeconds: number,
    private readonly maxAttempts: number,
    private readonly createClaimToken: () => string = randomUUID,
  ) {}

  async upsert(command: ReportingInvalidationCommand, session?: ClientSession): Promise<void> {
    if (command.reasons.length === 0)
      throw new Error('Reporting invalidation reasons are required');
    const scopeKey = reportingScopeKey(command.scope);
    const now = new Date();
    await ReportingInvalidationModel.findOneAndUpdate(
      { scopeKey },
      [
        {
          $set: {
            schemaVersion: { $ifNull: ['$schemaVersion', REPORTING_SCHEMA_VERSION] },
            scopeKey: { $ifNull: ['$scopeKey', scopeKey] },
            scopeType: { $ifNull: ['$scopeType', command.scope.scopeType] },
            classroomId: { $ifNull: ['$classroomId', command.scope.classroomId] },
            courseId: { $ifNull: ['$courseId', command.scope.courseId] },
            studentId: { $ifNull: ['$studentId', command.scope.studentId] },
            reasons: {
              $setUnion: [{ $ifNull: ['$reasons', []] }, [...command.reasons]],
            },
            sourceChangedAt: {
              $cond: [
                {
                  $gt: [
                    { $ifNull: ['$sourceChangedAt', command.sourceChangedAt] },
                    command.sourceChangedAt,
                  ],
                },
                '$sourceChangedAt',
                command.sourceChangedAt,
              ],
            },
            status: 'PENDING',
            attempts: 0,
            revision: { $add: [{ $ifNull: ['$revision', 0] }, 1] },
            lastErrorCode: null,
            nextRetryAt: null,
            lockedAt: null,
            lockedBy: null,
            claimToken: null,
            createdAt: { $ifNull: ['$createdAt', now] },
            updatedAt: now,
          },
        },
      ],
      { upsert: true, returnDocument: 'after', session, updatePipeline: true },
    ).exec();

    if (command.scope.scopeType === 'COURSE') {
      await ReportingInvalidationModel.deleteMany({
        courseId: command.scope.courseId,
        scopeType: 'STUDENT_COURSE',
      }).session(session ?? null);
    } else if (command.scope.scopeType === 'CLASSROOM') {
      await ReportingInvalidationModel.deleteMany({
        classroomId: command.scope.classroomId,
        scopeType: { $in: ['COURSE', 'STUDENT_COURSE'] },
      }).session(session ?? null);
    }
  }

  async claimBatch(limit: number, workerId: string, now: Date) {
    const claimed: ReportingInvalidationRecord[] = [];
    const lockExpiredBefore = new Date(now.getTime() - this.lockSeconds * 1_000);
    for (let index = 0; index < limit; index += 1) {
      const claimToken = this.createClaimToken();
      const row = await ReportingInvalidationModel.findOneAndUpdate(
        {
          attempts: { $lt: this.maxAttempts },
          $or: [
            {
              status: { $in: ['PENDING', 'FAILED'] },
              $or: [{ nextRetryAt: null }, { nextRetryAt: { $lte: now } }],
            },
            { status: 'PROCESSING', lockedAt: { $lte: lockExpiredBefore } },
          ],
        },
        {
          $set: {
            status: 'PROCESSING',
            lockedAt: now,
            lockedBy: workerId,
            claimToken,
            lastErrorCode: null,
            nextRetryAt: null,
          },
          $inc: { attempts: 1 },
        },
        { sort: { sourceChangedAt: 1, _id: 1 }, returnDocument: 'after' },
      )
        .lean<ReportingInvalidationRecord>()
        .exec();
      if (!row) break;
      claimed.push(row);
    }
    return claimed;
  }

  async resolve(claim: InvalidationClaim): Promise<boolean> {
    const result = await ReportingInvalidationModel.deleteOne({
      _id: claim.id,
      claimToken: claim.claimToken,
      revision: claim.revision,
      status: 'PROCESSING',
    }).exec();
    return result.deletedCount === 1;
  }

  async fail(claim: InvalidationClaim, code: string, nextRetryAt: Date | null): Promise<boolean> {
    const result = await ReportingInvalidationModel.updateOne(
      {
        _id: claim.id,
        claimToken: claim.claimToken,
        revision: claim.revision,
        status: 'PROCESSING',
      },
      {
        $set: {
          status: 'FAILED',
          lastErrorCode: code,
          nextRetryAt,
          lockedAt: null,
          lockedBy: null,
          claimToken: null,
        },
      },
    ).exec();
    return result.modifiedCount === 1;
  }

  findByScope(scope: ReportingInvalidationScope) {
    return ReportingInvalidationModel.findOne({ scopeKey: reportingScopeKey(scope) })
      .lean<ReportingInvalidationRecord>()
      .exec();
  }

  async findRelevantSourceChangedAt(input: {
    classroomId: Types.ObjectId;
    courseId: Types.ObjectId;
    studentId: Types.ObjectId;
  }) {
    const row = await ReportingInvalidationModel.findOne({
      scopeKey: {
        $in: [
          `CLASSROOM:${input.classroomId.toString()}:ALL`,
          `COURSE:${input.courseId.toString()}:ALL`,
          `COURSE:${input.courseId.toString()}:STUDENT:${input.studentId.toString()}`,
        ],
      },
    })
      .select({ sourceChangedAt: 1 })
      .sort({ sourceChangedAt: -1 })
      .lean()
      .exec();
    return row?.sourceChangedAt ?? null;
  }
}
