import { Types } from 'mongoose';

import type { AssignmentRepository } from '../assignments/assignment.repository.js';
import { CourseModel } from '../courses/course.model.js';
import type { LessonRepository } from '../lessons/lesson.repository.js';
import type { CourseModuleRepository } from '../modules/module.repository.js';
import type { QuizRepository } from '../quizzes/quiz.repository.js';
import { resolveEffectiveContentStatus } from '../learning-content/content-schedule.policy.js';
import {
  LEARNING_ACTIVITY_DESCRIPTOR_VERSION,
  type LearningActivityDescriptor,
  type LearningActivityReader,
} from '../learning-content/learning-activity.reader.js';

function isPublished(
  value: { status: string; scheduledPublishAt: Date | null },
  asOf: Date,
): boolean {
  if (value.status === 'PUBLISHED') return true;
  return (
    value.status === 'SCHEDULED' &&
    Boolean(value.scheduledPublishAt && value.scheduledPublishAt <= asOf)
  );
}

export class MongoLearningActivityReader implements LearningActivityReader {
  readonly descriptorVersion = LEARNING_ACTIVITY_DESCRIPTOR_VERSION;

  constructor(
    private readonly modules: CourseModuleRepository,
    private readonly lessons: LessonRepository,
    private readonly quizzes: QuizRepository,
    private readonly assignments: AssignmentRepository,
  ) {}

  async listByCourseIds(
    courseIds: readonly string[],
    asOf: Date,
  ): Promise<ReadonlyMap<string, readonly LearningActivityDescriptor[]>> {
    const ids = courseIds.filter(Types.ObjectId.isValid).map((id) => new Types.ObjectId(id));
    if (ids.length === 0) return new Map();
    const [courses, modules, lessons, quizzes, assignments] = await Promise.all([
      CourseModel.find({ _id: { $in: ids } })
        .select({ classroomId: 1 })
        .lean<Array<{ _id: Types.ObjectId; classroomId: Types.ObjectId }>>()
        .exec(),
      this.modules.listByCourseIds(ids),
      this.lessons.listByCourseIds(ids),
      this.quizzes.listByCourseIds(ids),
      this.assignments.listByCourseIds(ids),
    ]);
    const classroomByCourse = new Map(
      courses.map((course) => [course._id.toString(), course.classroomId.toString()]),
    );
    const visibleModuleIds = new Set(
      modules
        .filter((module) => module.status === 'PUBLISHED')
        .map((module) => module._id.toString()),
    );
    const parentVisible = (moduleId: Types.ObjectId | null) =>
      moduleId === null || visibleModuleIds.has(moduleId.toString());
    const map = new Map<string, LearningActivityDescriptor[]>();
    const push = (descriptor: LearningActivityDescriptor) => {
      map.set(descriptor.courseId, [...(map.get(descriptor.courseId) ?? []), descriptor]);
    };

    for (const lesson of lessons) {
      if (
        resolveEffectiveContentStatus(lesson, asOf) !== 'PUBLISHED' ||
        !parentVisible(lesson.moduleId) ||
        !lesson.completionDeadline
      )
        continue;
      const courseId = lesson.courseId.toString();
      const classroomId = classroomByCourse.get(courseId);
      if (!classroomId) continue;
      push({
        activityType: 'LESSON',
        activityId: lesson._id.toString(),
        classroomId,
        courseId,
        moduleId: lesson.moduleId?.toString() ?? null,
        title: lesson.title,
        isRequired: lesson.isRequired,
        completionDeadline: lesson.completionDeadline.toISOString(),
        displayOrder: lesson.displayOrder,
        visible: true,
        actionUrl: `/student/lessons/${lesson._id.toString()}`,
      });
    }
    for (const quiz of quizzes) {
      if (!isPublished(quiz, asOf) || !parentVisible(quiz.moduleId)) continue;
      push({
        activityType: 'QUIZ',
        activityId: quiz._id.toString(),
        classroomId: quiz.classroomId.toString(),
        courseId: quiz.courseId.toString(),
        moduleId: quiz.moduleId?.toString() ?? null,
        title: quiz.title,
        isRequired: quiz.isRequired,
        completionDeadline: quiz.dueDate.toISOString(),
        displayOrder: quiz.displayOrder,
        visible: true,
        actionUrl: `/student/quizzes/${quiz._id.toString()}`,
      });
    }
    for (const assignment of assignments) {
      if (!isPublished(assignment, asOf) || !parentVisible(assignment.moduleId)) continue;
      push({
        activityType: 'ASSIGNMENT',
        activityId: assignment._id.toString(),
        classroomId: assignment.classroomId.toString(),
        courseId: assignment.courseId.toString(),
        moduleId: assignment.moduleId?.toString() ?? null,
        title: assignment.title,
        isRequired: assignment.isRequired,
        completionDeadline: assignment.dueDate.toISOString(),
        displayOrder: assignment.displayOrder,
        visible: true,
        actionUrl: `/student/assignments/${assignment._id.toString()}`,
      });
    }
    for (const [courseId, descriptors] of map) {
      map.set(
        courseId,
        descriptors.sort(
          (left, right) =>
            (left.moduleId ?? '').localeCompare(right.moduleId ?? '') ||
            left.displayOrder - right.displayOrder ||
            left.activityType.localeCompare(right.activityType) ||
            left.activityId.localeCompare(right.activityId),
        ),
      );
    }
    return map;
  }
}
