import type { Connection } from 'mongoose';

import { ASSESSMENT_SCHEMA_VERSION } from '../../modules/learning-content/assessment.types.js';
import { PHASE_FIVE_MODELS } from './phase-five-indexes.js';

const KNOWN_ACTIVITY_TYPES = ['LESSON', 'QUIZ', 'ASSIGNMENT'] as const;

interface DuplicateCheck {
  collection: string;
  match?: Record<string, unknown>;
  group: Record<string, string>;
}

export interface PhaseFiveMigrationPreflight {
  replicaSetName: string | null;
  unknownLearningProgressRecords: number;
  incompatibleSchemaRecords: number;
  duplicateActiveAttemptGroups: number;
  duplicateSubmissionGroups: number;
  duplicateGradeGroups: number;
  safeToExpand: boolean;
}

export interface PhaseFiveRollbackPlan {
  dryRun: true;
  retainedDocumentsByCollection: Readonly<Record<string, number>>;
  retainedLessonProgressRecords: number;
  destructiveActions: readonly never[];
  actions: readonly string[];
}

function getDatabase(connection: Connection) {
  if (!connection.db) throw new Error('Phase 05 migration requires an active MongoDB connection');
  return connection.db;
}

async function countDuplicateGroups(
  connection: Connection,
  check: DuplicateCheck,
  existingCollections: ReadonlySet<string>,
): Promise<number> {
  if (!existingCollections.has(check.collection)) return 0;
  const database = getDatabase(connection);
  const result = await database
    .collection(check.collection)
    .aggregate<{ count: number }>([
      ...(check.match ? [{ $match: check.match }] : []),
      { $group: { _id: check.group, records: { $sum: 1 } } },
      { $match: { records: { $gt: 1 } } },
      { $count: 'count' },
    ])
    .next();
  return result?.count ?? 0;
}

async function listCollectionNames(connection: Connection): Promise<ReadonlySet<string>> {
  const collections = await getDatabase(connection)
    .listCollections({}, { nameOnly: true })
    .toArray();
  return new Set(collections.map(({ name }) => name));
}

export async function runPhaseFiveMigrationPreflight(
  connection: Connection,
): Promise<PhaseFiveMigrationPreflight> {
  const database = getDatabase(connection);
  const hello = (await database.admin().command({ hello: 1 })) as { setName?: unknown };
  const existingCollections = await listCollectionNames(connection);

  const unknownLearningProgressRecords = existingCollections.has('learning_progress')
    ? await database.collection('learning_progress').countDocuments({
        activityType: { $nin: KNOWN_ACTIVITY_TYPES },
      })
    : 0;

  let incompatibleSchemaRecords = 0;
  for (const model of PHASE_FIVE_MODELS) {
    const collectionName = model.collection.collectionName;
    if (!existingCollections.has(collectionName)) continue;
    incompatibleSchemaRecords += await database.collection(collectionName).countDocuments({
      $or: [
        { schemaVersion: { $exists: false } },
        { schemaVersion: { $ne: ASSESSMENT_SCHEMA_VERSION } },
      ],
    });
  }

  const [duplicateActiveAttemptGroups, duplicateSubmissionGroups, duplicateGradeGroups] =
    await Promise.all([
      countDuplicateGroups(
        connection,
        {
          collection: 'quiz_attempts',
          match: { status: 'IN_PROGRESS' },
          group: { quizId: '$quizId', studentId: '$studentId' },
        },
        existingCollections,
      ),
      countDuplicateGroups(
        connection,
        {
          collection: 'submissions',
          group: { assignmentId: '$assignmentId', studentId: '$studentId' },
        },
        existingCollections,
      ),
      countDuplicateGroups(
        connection,
        {
          collection: 'grades',
          group: {
            studentId: '$studentId',
            activityType: '$activityType',
            activityId: '$activityId',
          },
        },
        existingCollections,
      ),
    ]);

  const replicaSetName = typeof hello.setName === 'string' ? hello.setName : null;
  const blockerCount =
    unknownLearningProgressRecords +
    incompatibleSchemaRecords +
    duplicateActiveAttemptGroups +
    duplicateSubmissionGroups +
    duplicateGradeGroups;

  return {
    replicaSetName,
    unknownLearningProgressRecords,
    incompatibleSchemaRecords,
    duplicateActiveAttemptGroups,
    duplicateSubmissionGroups,
    duplicateGradeGroups,
    safeToExpand: replicaSetName !== null && blockerCount === 0,
  };
}

export function assertPhaseFiveMigrationPreflight(result: PhaseFiveMigrationPreflight): void {
  if (result.safeToExpand) return;
  throw new Error(
    `Phase 05 migration preflight failed: ${JSON.stringify({
      replicaSet: result.replicaSetName !== null,
      unknownLearningProgressRecords: result.unknownLearningProgressRecords,
      incompatibleSchemaRecords: result.incompatibleSchemaRecords,
      duplicateActiveAttemptGroups: result.duplicateActiveAttemptGroups,
      duplicateSubmissionGroups: result.duplicateSubmissionGroups,
      duplicateGradeGroups: result.duplicateGradeGroups,
    })}`,
  );
}

export async function planPhaseFiveRollback(
  connection: Connection,
): Promise<PhaseFiveRollbackPlan> {
  const database = getDatabase(connection);
  const existingCollections = await listCollectionNames(connection);
  const retainedDocumentsByCollection: Record<string, number> = {};

  for (const model of PHASE_FIVE_MODELS) {
    const collectionName = model.collection.collectionName;
    retainedDocumentsByCollection[collectionName] = existingCollections.has(collectionName)
      ? await database.collection(collectionName).estimatedDocumentCount()
      : 0;
  }

  const retainedLessonProgressRecords = existingCollections.has('learning_progress')
    ? await database.collection('learning_progress').countDocuments({ activityType: 'LESSON' })
    : 0;

  return Object.freeze({
    dryRun: true as const,
    retainedDocumentsByCollection: Object.freeze(retainedDocumentsByCollection),
    retainedLessonProgressRecords,
    destructiveActions: Object.freeze([]) as readonly never[],
    actions: Object.freeze([
      'Disable Phase 05 routes and navigation before application rollback.',
      'Retain all Phase 05 collections, histories and learning progress records.',
      'Drop a named Phase 05 index only after an explicit impact review.',
      'Run Phase 04 smoke tests against the retained database.',
    ]),
  });
}
