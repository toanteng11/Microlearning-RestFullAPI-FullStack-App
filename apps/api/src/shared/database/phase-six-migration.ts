import type { Connection } from 'mongoose';

import {
  PROCESS_SCORE_VERSION,
  REPORTING_DESCRIPTOR_VERSION,
  REPORTING_SCHEMA_VERSION,
  REPORTING_SOURCE_METRIC_VERSION,
} from '../../modules/reporting/reporting.constants.js';

const SUMMARY_COLLECTION = 'course_progress_summaries';
const INVALIDATION_COLLECTION = 'reporting_invalidations';
const PROHIBITED_SUMMARY_FIELDS = [
  'fullName',
  'email',
  'studentCode',
  'answers',
  'feedback',
  'submission',
] as const;

export interface PhaseSixMigrationResult {
  existingSummaryCount: number;
  existingInvalidationCount: number;
  incompatibleSummaryCount: number;
  prohibitedProjectionCount: number;
  duplicateSummaryGroups: number;
  invalidInvalidationScopeCount: number;
  safeToActivate: boolean;
  versionActivation: {
    schemaVersion: number;
    sourceMetricVersion: string;
    descriptorVersion: string;
    processScoreVersion: string;
  };
}

function databaseOf(connection: Connection) {
  if (!connection.db) throw new Error('Phase 06 migration requires an active MongoDB connection');
  return connection.db;
}

async function collectionNames(connection: Connection) {
  const collections = await databaseOf(connection)
    .listCollections({}, { nameOnly: true })
    .toArray();
  return new Set(collections.map(({ name }) => name));
}

export async function runPhaseSixMigrationPreflight(
  connection: Connection,
): Promise<PhaseSixMigrationResult> {
  const database = databaseOf(connection);
  const names = await collectionNames(connection);
  const hasSummaries = names.has(SUMMARY_COLLECTION);
  const hasInvalidations = names.has(INVALIDATION_COLLECTION);
  const summaries = database.collection(SUMMARY_COLLECTION);
  const invalidations = database.collection(INVALIDATION_COLLECTION);

  const [
    existingSummaryCount,
    existingInvalidationCount,
    incompatibleSummaryCount,
    prohibitedProjectionCount,
    duplicateSummaryResult,
    invalidInvalidationScopeCount,
  ] = await Promise.all([
    hasSummaries ? summaries.estimatedDocumentCount() : 0,
    hasInvalidations ? invalidations.estimatedDocumentCount() : 0,
    hasSummaries
      ? summaries.countDocuments({
          $or: [
            { schemaVersion: { $ne: REPORTING_SCHEMA_VERSION } },
            { sourceMetricVersion: { $ne: REPORTING_SOURCE_METRIC_VERSION } },
            { descriptorVersion: { $ne: REPORTING_DESCRIPTOR_VERSION } },
            { processScoreVersion: { $ne: PROCESS_SCORE_VERSION } },
          ],
        })
      : 0,
    hasSummaries
      ? summaries.countDocuments({
          $or: PROHIBITED_SUMMARY_FIELDS.map((field) => ({ [field]: { $exists: true } })),
        })
      : 0,
    hasSummaries
      ? summaries
          .aggregate<{ count: number }>([
            {
              $group: {
                _id: {
                  courseId: '$courseId',
                  studentId: '$studentId',
                  processScoreVersion: '$processScoreVersion',
                },
                records: { $sum: 1 },
              },
            },
            { $match: { records: { $gt: 1 } } },
            { $count: 'count' },
          ])
          .next()
      : null,
    hasInvalidations
      ? invalidations.countDocuments({
          $or: [
            { classroomId: null },
            {
              scopeType: 'STUDENT_COURSE',
              $or: [{ courseId: null }, { studentId: null }],
            },
            {
              scopeType: 'COURSE',
              $or: [{ courseId: null }, { studentId: { $ne: null } }],
            },
            {
              scopeType: 'CLASSROOM',
              $or: [{ courseId: { $ne: null } }, { studentId: { $ne: null } }],
            },
            { scopeType: { $nin: ['STUDENT_COURSE', 'COURSE', 'CLASSROOM'] } },
          ],
        })
      : 0,
  ]);

  const duplicateSummaryGroups = duplicateSummaryResult?.count ?? 0;
  const safeToActivate =
    incompatibleSummaryCount === 0 &&
    prohibitedProjectionCount === 0 &&
    duplicateSummaryGroups === 0 &&
    invalidInvalidationScopeCount === 0;

  return {
    existingSummaryCount,
    existingInvalidationCount,
    incompatibleSummaryCount,
    prohibitedProjectionCount,
    duplicateSummaryGroups,
    invalidInvalidationScopeCount,
    safeToActivate,
    versionActivation: {
      schemaVersion: REPORTING_SCHEMA_VERSION,
      sourceMetricVersion: REPORTING_SOURCE_METRIC_VERSION,
      descriptorVersion: REPORTING_DESCRIPTOR_VERSION,
      processScoreVersion: PROCESS_SCORE_VERSION,
    },
  };
}

export function assertPhaseSixMigrationPreflight(result: PhaseSixMigrationResult): void {
  if (result.safeToActivate) return;
  throw new Error(
    `Phase 06 migration preflight failed: ${JSON.stringify({
      incompatibleSummaryCount: result.incompatibleSummaryCount,
      prohibitedProjectionCount: result.prohibitedProjectionCount,
      duplicateSummaryGroups: result.duplicateSummaryGroups,
      invalidInvalidationScopeCount: result.invalidInvalidationScopeCount,
    })}`,
  );
}
