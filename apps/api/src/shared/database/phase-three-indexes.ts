import type { Model } from 'mongoose';

import { ClassCodeModel } from '../../modules/classroom-credentials/class-code.model.js';
import { ClassroomInviteLinkModel } from '../../modules/classroom-credentials/classroom-invite-link.model.js';
import { ClassroomModel } from '../../modules/classrooms/classroom.model.js';
import { SystemSettingModel } from '../../modules/enrollment-policy/system-setting.model.js';
import { EnrollmentModel } from '../../modules/enrollments/enrollment.model.js';
import type { AppConfig } from '../config/environment.js';
import { initializeModelIndexes } from './index-compatibility.js';

const PHASE_THREE_MODELS: Model<unknown>[] = [
  ClassroomModel as unknown as Model<unknown>,
  EnrollmentModel as unknown as Model<unknown>,
  ClassCodeModel as unknown as Model<unknown>,
  ClassroomInviteLinkModel as unknown as Model<unknown>,
  SystemSettingModel as unknown as Model<unknown>,
];

export async function initializePhaseThreeIndexes(
  appEnvironment: AppConfig['appEnvironment'],
): Promise<void> {
  await initializeModelIndexes('Phase 03', PHASE_THREE_MODELS, appEnvironment);
}
