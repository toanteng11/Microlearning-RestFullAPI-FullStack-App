import { AppError } from '../../shared/errors/app-error.js';
import type { CourseModuleProjection } from '../modules/module.repository.js';
import type { LessonProjection } from './lesson.repository.js';

export function assertLessonPublishPrerequisites(
  lesson: LessonProjection,
  parentModule: CourseModuleProjection | null,
  now: Date,
): void {
  if (!lesson.content.trim() || lesson.completionDeadline === null) {
    throw new AppError(
      409,
      'CONTENT_PUBLISH_PREREQUISITE_FAILED',
      'Lesson requires non-empty content and a completion deadline',
    );
  }
  if (lesson.completionDeadline.getTime() <= now.getTime()) {
    throw new AppError(
      409,
      'CONTENT_PUBLISH_PREREQUISITE_FAILED',
      'Lesson completion deadline must be in the future',
    );
  }
  if (lesson.moduleId && (!parentModule || parentModule.status !== 'PUBLISHED')) {
    throw new AppError(
      409,
      'CONTENT_PUBLISH_PREREQUISITE_FAILED',
      'Lesson parent Module must be published',
    );
  }
}
