import type { LessonProjection } from '../lessons/lesson.repository.js';
import type { CourseModuleProjection } from '../modules/module.repository.js';
import { resolveEffectiveContentStatus } from './content-schedule.policy.js';

export function isVisibleLesson(
  lesson: LessonProjection,
  publishedModuleIds: ReadonlySet<string>,
  asOf: Date,
): boolean {
  return (
    resolveEffectiveContentStatus(lesson, asOf) === 'PUBLISHED' &&
    (!lesson.moduleId || publishedModuleIds.has(lesson.moduleId.toString()))
  );
}

export function orderedVisibleCourseLessons(
  modules: readonly CourseModuleProjection[],
  lessons: readonly LessonProjection[],
  asOf: Date,
): LessonProjection[] {
  const publishedModules = modules
    .filter((item) => item.status === 'PUBLISHED')
    .sort(
      (left, right) =>
        left.displayOrder - right.displayOrder ||
        left._id.toString().localeCompare(right._id.toString()),
    );
  const moduleIds = new Set(publishedModules.map((item) => item._id.toString()));
  const visible = lessons.filter((lesson) => isVisibleLesson(lesson, moduleIds, asOf));
  const sortLessons = (left: LessonProjection, right: LessonProjection) =>
    left.displayOrder - right.displayOrder ||
    left._id.toString().localeCompare(right._id.toString());
  const root = visible.filter((lesson) => !lesson.moduleId).sort(sortLessons);
  return [
    ...publishedModules.flatMap((module) =>
      visible.filter((lesson) => lesson.moduleId?.equals(module._id)).sort(sortLessons),
    ),
    ...root,
  ];
}
