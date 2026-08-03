import type { ClientSession, Types } from 'mongoose';

import {
  PROCESS_SCORE_VERSION,
  REPORTING_DESCRIPTOR_VERSION,
  REPORTING_SCHEMA_VERSION,
  REPORTING_SOURCE_METRIC_VERSION,
} from './reporting.constants.js';
import type { CourseProgressSummaryRecord } from './course-progress-summary.model.js';
import {
  CourseProgressSnapshotModel,
  type CourseProgressSnapshotRecord,
} from './course-progress-snapshot.model.js';

export class CourseProgressSnapshotRepository {
  async record(summary: CourseProgressSummaryRecord, session?: ClientSession) {
    await CourseProgressSnapshotModel.updateOne(
      {
        courseId: summary.courseId,
        studentId: summary.studentId,
        processScoreVersion: PROCESS_SCORE_VERSION,
        summaryRevision: summary.revision,
      },
      {
        $setOnInsert: {
          schemaVersion: REPORTING_SCHEMA_VERSION,
          courseId: summary.courseId,
          classroomId: summary.classroomId,
          studentId: summary.studentId,
          sourceMetricVersion: REPORTING_SOURCE_METRIC_VERSION,
          descriptorVersion: REPORTING_DESCRIPTOR_VERSION,
          processScoreVersion: PROCESS_SCORE_VERSION,
          summaryRevision: summary.revision,
          progressPercentage: summary.progressPercentage,
          processScore: summary.processScore,
          returnedGradeAverage: summary.returnedGradeAverage,
          completedRequiredCount: summary.completedRequiredCount,
          requiredActivityCount: summary.requiredActivityCount,
          missingActivityCount: summary.missingActivityCount,
          lateActivityCount: summary.lateActivityCount,
          capturedAt: summary.recalculatedAt,
        },
      },
      { upsert: true, session, runValidators: true },
    ).exec();
  }

  listCompatible(
    courseId: Types.ObjectId,
    studentId: Types.ObjectId,
    from: Date,
    to: Date,
    session?: ClientSession,
  ) {
    return CourseProgressSnapshotModel.find({
      courseId,
      studentId,
      schemaVersion: REPORTING_SCHEMA_VERSION,
      sourceMetricVersion: REPORTING_SOURCE_METRIC_VERSION,
      descriptorVersion: REPORTING_DESCRIPTOR_VERSION,
      processScoreVersion: PROCESS_SCORE_VERSION,
      capturedAt: { $gte: from, $lt: to },
    })
      .sort({ capturedAt: 1, _id: 1 })
      .session(session ?? null)
      .lean<CourseProgressSnapshotRecord[]>()
      .exec();
  }

  countAll(courseId: Types.ObjectId, studentId: Types.ObjectId, from: Date, to: Date) {
    return CourseProgressSnapshotModel.countDocuments({
      courseId,
      studentId,
      capturedAt: { $gte: from, $lt: to },
    }).exec();
  }
}
