import type { Model } from 'mongoose';

import { AnnouncementModel } from '../../modules/announcements/announcement.model.js';
import { CourseModel } from '../../modules/courses/course.model.js';
import { LessonDeadlineChangeModel } from '../../modules/deadlines/lesson-deadline-change.model.js';
import { FlashcardModel } from '../../modules/flashcards/flashcard.model.js';
import { LearningProgressModel } from '../../modules/learning-progress/learning-progress.model.js';
import { LessonModel } from '../../modules/lessons/lesson.model.js';
import { CourseModuleModel } from '../../modules/modules/module.model.js';
import type { AppConfig } from '../config/environment.js';
import { initializeModelIndexes } from './index-compatibility.js';

export const PHASE_FOUR_MODELS: readonly Model<unknown>[] = [
  CourseModel as unknown as Model<unknown>,
  CourseModuleModel as unknown as Model<unknown>,
  LessonModel as unknown as Model<unknown>,
  FlashcardModel as unknown as Model<unknown>,
  LessonDeadlineChangeModel as unknown as Model<unknown>,
  AnnouncementModel as unknown as Model<unknown>,
  LearningProgressModel as unknown as Model<unknown>,
];

export function initializePhaseFourIndexes(
  appEnvironment: AppConfig['appEnvironment'],
): Promise<void> {
  return initializeModelIndexes('Phase 04', PHASE_FOUR_MODELS, appEnvironment);
}
