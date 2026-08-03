import type { ClientSession, Types } from 'mongoose';

import {
  PROCESS_SCORE_VERSION,
  REPORTING_DESCRIPTOR_VERSION,
  REPORTING_SCHEMA_VERSION,
  REPORTING_SOURCE_METRIC_VERSION,
} from './reporting.constants.js';
import {
  CourseProgressSummaryModel,
  type CourseProgressSummaryRecord,
} from './course-progress-summary.model.js';
import { reportingError } from './reporting.errors.js';
import type {
  RankingQuery,
  ReportingInvalidationReason,
  SummaryReplaceInput,
} from './reporting.types.js';
import { CourseProgressSnapshotRepository } from './course-progress-snapshot.repository.js';

function persistenceValues(input: SummaryReplaceInput['values']) {
  return {
    schemaVersion: REPORTING_SCHEMA_VERSION,
    sourceMetricVersion: REPORTING_SOURCE_METRIC_VERSION,
    descriptorVersion: REPORTING_DESCRIPTOR_VERSION,
    processScoreVersion: PROCESS_SCORE_VERSION,
    ...input,
    supportFlags: [...input.supportFlags],
  };
}

export class CourseProgressSummaryRepository {
  constructor(private readonly snapshots = new CourseProgressSnapshotRepository()) {}

  findStudent(
    courseId: Types.ObjectId,
    studentId: Types.ObjectId,
    version = PROCESS_SCORE_VERSION,
    session?: ClientSession,
  ) {
    return CourseProgressSummaryModel.findOne({
      courseId,
      studentId,
      processScoreVersion: version,
    })
      .session(session ?? null)
      .lean<CourseProgressSummaryRecord>()
      .exec();
  }

  async listRanking(query: RankingQuery) {
    if (query.processScoreVersion !== PROCESS_SCORE_VERSION) {
      throw reportingError(
        409,
        'REPORTING_DEFINITION_MISMATCH',
        'Requested reporting definition is not active',
      );
    }
    const sortBy = query.sortBy ?? 'processScore';
    const direction: 1 | -1 = (query.sortOrder ?? 'desc') === 'desc' ? -1 : 1;
    const sort: Record<string, 1 | -1> =
      sortBy === 'processScore' && direction === -1
        ? {
            processScore: -1 as const,
            completedRequiredCount: -1 as const,
            missingActivityCount: 1 as const,
            lateActivityCount: 1 as const,
            lastActiveAt: -1 as const,
            studentId: 1 as const,
          }
        : { [sortBy]: direction, studentId: 1 as const };
    const filter = {
      courseId: query.courseId,
      processScoreVersion: PROCESS_SCORE_VERSION,
    };
    const nullRankField = '__reportingSortIsNull';
    const offset = (query.page - 1) * query.limit;
    const itemsPromise =
      sortBy === 'processScore' && direction === -1
        ? CourseProgressSummaryModel.find(filter)
            .sort(sort)
            .skip(offset)
            .limit(query.limit)
            .lean<CourseProgressSummaryRecord[]>()
            .exec()
        : CourseProgressSummaryModel.aggregate<CourseProgressSummaryRecord>([
            { $match: filter },
            { $set: { [nullRankField]: { $eq: [`$${sortBy}`, null] } } },
            { $sort: { [nullRankField]: 1, ...sort } },
            { $skip: offset },
            { $limit: query.limit },
            { $unset: nullRankField },
          ]).exec();
    const [items, totalItems] = await Promise.all([
      itemsPromise,
      CourseProgressSummaryModel.countDocuments(filter).exec(),
    ]);
    return { items, totalItems, page: query.page, limit: query.limit };
  }

  async replaceWithRevision(input: SummaryReplaceInput, session?: ClientSession) {
    const values = persistenceValues(input.values);
    if (input.expectedRevision === null) {
      try {
        const created = await new CourseProgressSummaryModel({ ...values, revision: 1 }).save({
          session,
        });
        const record = created.toObject();
        await this.snapshots.record(record, session);
        return record;
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
        throw reportingError(
          409,
          'REPORTING_REVISION_CONFLICT',
          'Reporting summary was concurrently created',
        );
      }
    }
    const updated = await CourseProgressSummaryModel.findOneAndUpdate(
      {
        courseId: input.values.courseId,
        studentId: input.values.studentId,
        processScoreVersion: PROCESS_SCORE_VERSION,
        revision: input.expectedRevision,
      },
      { $set: values, $inc: { revision: 1 } },
      { returnDocument: 'after', runValidators: true, session },
    )
      .lean<CourseProgressSummaryRecord>()
      .exec();
    if (!updated) {
      throw reportingError(
        409,
        'REPORTING_REVISION_CONFLICT',
        'Reporting summary was concurrently modified',
      );
    }
    await this.snapshots.record(updated, session);
    return updated;
  }

  async markCourseStale(
    courseId: Types.ObjectId,
    _reasons: readonly ReportingInvalidationReason[],
    changedAt: Date,
    session?: ClientSession,
  ): Promise<void> {
    await CourseProgressSummaryModel.updateMany(
      { courseId, sourceChangedAt: { $lt: changedAt } },
      { $set: { refreshStatus: 'STALE', sourceChangedAt: changedAt } },
      { session, runValidators: true },
    ).exec();
  }

  async deleteStudentCourse(
    courseId: Types.ObjectId,
    studentId: Types.ObjectId,
    session?: ClientSession,
  ) {
    await CourseProgressSummaryModel.deleteMany({ courseId, studentId }).session(session ?? null);
  }

  listByCourse(courseId: Types.ObjectId, session?: ClientSession) {
    return CourseProgressSummaryModel.find({ courseId })
      .sort({ studentId: 1 })
      .session(session ?? null)
      .lean<CourseProgressSummaryRecord[]>()
      .exec();
  }

  listByStudent(studentId: Types.ObjectId, session?: ClientSession) {
    return CourseProgressSummaryModel.find({
      studentId,
      processScoreVersion: PROCESS_SCORE_VERSION,
    })
      .sort({ courseId: 1 })
      .session(session ?? null)
      .lean<CourseProgressSummaryRecord[]>()
      .exec();
  }
}
