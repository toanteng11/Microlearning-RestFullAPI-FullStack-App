import { Types } from 'mongoose';

import { CourseModel } from '../modules/courses/course.model.js';
import { createPhaseSixFoundation } from '../modules/phase-six.foundation.js';
import {
  assertKnownArguments,
  valueArgument,
  withReportingDatabase,
  writeCliFailure,
  writeCliSuccess,
} from './reporting-cli-support.js';

async function main() {
  const arguments_ = process.argv.slice(2);
  assertKnownArguments(arguments_, ['courseId', 'all', 'repair']);
  const courseId = valueArgument(arguments_, 'courseId');
  const reconcileAll = arguments_.includes('--all');
  const repair = arguments_.includes('--repair');
  if ((courseId ? 1 : 0) + (reconcileAll ? 1 : 0) !== 1) {
    throw new Error('Specify exactly one of --courseId=<id> or --all');
  }
  if (courseId && !Types.ObjectId.isValid(courseId)) throw new Error('--courseId is invalid');

  await withReportingDatabase(async ({ config }) => {
    const reconciliation = createPhaseSixFoundation(config).reconciliationService;
    const courseIds = courseId
      ? [courseId]
      : (await CourseModel.find({}).select({ _id: 1 }).sort({ _id: 1 }).lean().exec()).map(
          (course) => course._id.toString(),
        );
    const totals = {
      courses: courseIds.length,
      scanned: 0,
      differences: 0,
      missing: 0,
      mismatched: 0,
      orphaned: 0,
    };
    for (const id of courseIds) {
      const result = await reconciliation.reconcileCourse(id, repair);
      totals.scanned += result.scanned;
      totals.differences += result.differenceCount;
      for (const difference of result.differences) {
        if (difference.kind === 'MISSING') totals.missing += 1;
        else if (difference.kind === 'MISMATCH') totals.mismatched += 1;
        else totals.orphaned += 1;
      }
    }
    writeCliSuccess('reporting.reconcile.completed', {
      mode: reconcileAll ? 'ALL' : 'COURSE',
      repair,
      ...totals,
    });
  });
}

main().catch((error: unknown) => writeCliFailure('reporting.reconcile.failed', error));
