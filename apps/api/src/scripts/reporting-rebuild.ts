import { Types } from 'mongoose';

import { CourseModel } from '../modules/courses/course.model.js';
import { createPhaseSixFoundation } from '../modules/phase-six.foundation.js';
import {
  assertKnownArguments,
  positiveIntegerArgument,
  valueArgument,
  withReportingDatabase,
  writeCliFailure,
  writeCliSuccess,
} from './reporting-cli-support.js';

async function main() {
  const arguments_ = process.argv.slice(2);
  assertKnownArguments(arguments_, ['courseId', 'all', 'batchSize']);
  const courseId = valueArgument(arguments_, 'courseId');
  const rebuildAll = arguments_.includes('--all');
  const batchSize = positiveIntegerArgument(arguments_, 'batchSize');
  if ((courseId ? 1 : 0) + (rebuildAll ? 1 : 0) !== 1) {
    throw new Error('Specify exactly one of --courseId=<id> or --all');
  }
  if (courseId && !Types.ObjectId.isValid(courseId)) throw new Error('--courseId is invalid');

  await withReportingDatabase(async ({ config }) => {
    const effectiveConfig = batchSize
      ? {
          ...config,
          reporting: { ...config.reporting, rebuildBatchSize: batchSize },
        }
      : config;
    const refresh = createPhaseSixFoundation(effectiveConfig).refreshService;
    const courseIds = courseId
      ? [courseId]
      : (await CourseModel.find({}).select({ _id: 1 }).sort({ _id: 1 }).lean().exec()).map(
          (course) => course._id.toString(),
        );
    const totals = { courses: courseIds.length, roster: 0, refreshed: 0, failed: 0 };
    for (const id of courseIds) {
      const result = await refresh.rebuildCourse(id);
      totals.roster += result.rosterCount;
      totals.refreshed += result.refreshed;
      totals.failed += result.failed;
    }
    writeCliSuccess('reporting.rebuild.completed', {
      mode: rebuildAll ? 'ALL' : 'COURSE',
      batchSize: effectiveConfig.reporting.rebuildBatchSize,
      ...totals,
    });
    if (totals.failed > 0) process.exitCode = 1;
  });
}

main().catch((error: unknown) => writeCliFailure('reporting.rebuild.failed', error));
