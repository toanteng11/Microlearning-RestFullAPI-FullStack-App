import type { Model } from 'mongoose';

import type { AppConfig } from '../config/environment.js';
import { initializeModelIndexes } from './index-compatibility.js';
import { PHASE_FIVE_MODELS } from './phase-five-indexes.js';
import { PHASE_FOUR_MODELS } from './phase-four-indexes.js';
import { PHASE_SIX_MODELS } from './phase-six-indexes.js';
import { PHASE_THREE_MODELS } from './phase-three-indexes.js';

const APPLICATION_MODELS: readonly Model<unknown>[] = [
  ...PHASE_THREE_MODELS,
  ...PHASE_FOUR_MODELS,
  ...PHASE_FIVE_MODELS,
  ...PHASE_SIX_MODELS,
];

export async function createApplicationIndexes(): Promise<void> {
  for (const model of APPLICATION_MODELS) await model.createIndexes();
}

export function verifyApplicationIndexes(
  appEnvironment: AppConfig['appEnvironment'],
): Promise<void> {
  return initializeModelIndexes('Phase 03-06', APPLICATION_MODELS, appEnvironment);
}
