import type { LessonRecord } from '../lessons/lesson.model.js';
import type { ModuleContentStatus } from '../learning-content/content.types.js';

export type CoursePublishCandidate = Pick<
  LessonRecord,
  '_id' | 'moduleId' | 'status' | 'scheduledPublishAt' | 'completionDeadline'
>;

export function hasValidCoursePublishCandidate(
  lessons: readonly CoursePublishCandidate[],
  moduleStatuses: ReadonlyMap<string, ModuleContentStatus>,
  asOf: Date,
): boolean {
  return lessons.some((lesson) => {
    if (!lesson.completionDeadline || lesson.completionDeadline <= asOf) return false;
    if (lesson.status === 'SCHEDULED' && !lesson.scheduledPublishAt) return false;
    if (lesson.status !== 'PUBLISHED' && lesson.status !== 'SCHEDULED') return false;
    if (!lesson.moduleId) return true;
    return moduleStatuses.get(lesson.moduleId.toString()) === 'PUBLISHED';
  });
}
