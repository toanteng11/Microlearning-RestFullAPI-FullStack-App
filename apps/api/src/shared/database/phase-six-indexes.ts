import type { Model } from 'mongoose';

import { CourseProgressSummaryModel } from '../../modules/reporting/course-progress-summary.model.js';
import { ReportingInvalidationModel } from '../../modules/reporting/reporting-invalidation.model.js';
import type { AppConfig } from '../config/environment.js';
import { initializeModelIndexes } from './index-compatibility.js';

export const PHASE_SIX_MODELS: readonly Model<unknown>[] = [
  CourseProgressSummaryModel as Model<unknown>,
  ReportingInvalidationModel as Model<unknown>,
];

export async function ensurePhaseSixIndexes(): Promise<void> {
  for (const model of PHASE_SIX_MODELS) await model.createIndexes();
}

export function initializePhaseSixIndexes(
  appEnvironment: AppConfig['appEnvironment'],
): Promise<void> {
  return initializeModelIndexes('Phase 06', PHASE_SIX_MODELS, appEnvironment);
}
