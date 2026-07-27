import { Types } from 'mongoose';

import { AppError } from '../../shared/errors/app-error.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { ClassroomRepository } from '../classrooms/classroom.repository.js';
import type { CourseScopeReader } from '../learning-content/course-scope.reader.js';
import type { ClassroomScopeReader } from '../learning-content/classroom-scope.reader.js';
import { resolveEffectiveContentStatus } from '../learning-content/content-schedule.policy.js';
import { orderedVisibleCourseLessons } from '../learning-content/visible-content.policy.js';
import type { CourseProjection, CourseRepository } from '../courses/course.repository.js';
import type { EnrollmentRepository } from '../enrollments/enrollment.repository.js';
import type { DeadlineExceptionRepository } from '../deadline-exceptions/deadline-exception.repository.js';
import { resolveEffectiveDeadline } from '../deadline-exceptions/effective-deadline.resolver.js';
import { toStudentFlashcardDto } from '../flashcards/flashcard.dto.js';
import type { FlashcardRepository } from '../flashcards/flashcard.repository.js';
import { toStudentLessonDto } from '../lessons/lesson.dto.js';
import type { LessonProjection, LessonRepository } from '../lessons/lesson.repository.js';
import type { StudentDeadlineQuery, StudentTodoQuery } from './learning-progress.schemas.js';
import type {
  CourseModuleProjection,
  CourseModuleRepository,
} from '../modules/module.repository.js';
import {
  deriveLearningStatus,
  isCompletedDerived,
  progressPercentage,
} from './derived-progress.policy.js';
import type {
  LearningProgressProjection,
  LearningProgressRepository,
} from './learning-progress.repository.js';
import {
  LEARNING_ACTIVITY_DESCRIPTOR_VERSION,
  type LearningActivityDescriptor,
  type LearningActivityReader,
} from '../learning-content/learning-activity.reader.js';
import { STUDENT_TODO_SCOPE_VERSION as P05_STUDENT_TODO_SCOPE_VERSION } from '../learning-content/assessment.types.js';
import { LEARNING_PROGRESS_METRIC_VERSION as P05_PROGRESS_METRIC_VERSION } from '../learning-content/learning-progress.reader.js';

export const STUDENT_TODO_SCOPE_VERSION = P05_STUDENT_TODO_SCOPE_VERSION;
export const LEARNING_PROGRESS_METRIC_VERSION = P05_PROGRESS_METRIC_VERSION;

function objectId(value: string, label = 'Resource'): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(404, 'RESOURCE_NOT_FOUND', `${label} was not found`);
  }
  return new Types.ObjectId(value);
}

function assertStudent(actor: AuthenticatedUser): void {
  if (actor.role !== 'STUDENT') throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
}

function paginationMeta(page: number, limit: number, totalItems: number) {
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && totalPages > 0,
  };
}

function progressDto(
  progress: LearningProgressProjection | undefined,
  deadline: Date | null,
  asOf: Date,
) {
  return {
    status: progress?.status ?? null,
    startedAt: progress?.startedAt.toISOString() ?? null,
    completedAt: progress?.completedAt?.toISOString() ?? null,
    lastActiveAt: progress?.lastActiveAt.toISOString() ?? null,
    derivedStatus: deriveLearningStatus(progress, deadline, asOf),
  };
}

interface VisibleActivityContext {
  classroomId: string;
  classroomTitle: string;
  course: CourseProjection;
  module: CourseModuleProjection | null;
  activity: LearningActivityDescriptor;
  defaultDeadline: Date;
  effectiveDeadline: Date;
  hasDeadlineException: boolean;
  progress?: LearningProgressProjection;
}

export class StudentLearningService {
  constructor(
    private readonly classrooms: ClassroomRepository,
    private readonly enrollments: EnrollmentRepository,
    private readonly courses: CourseRepository,
    private readonly modules: CourseModuleRepository,
    private readonly lessons: LessonRepository,
    private readonly flashcards: FlashcardRepository,
    private readonly progress: LearningProgressRepository,
    private readonly classroomScopes: ClassroomScopeReader,
    private readonly courseScopes: CourseScopeReader,
    private readonly activityReader: LearningActivityReader,
    private readonly deadlineExceptions: DeadlineExceptionRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async requireVisibleLesson(actor: AuthenticatedUser, lessonId: string, asOf: Date) {
    assertStudent(actor);
    const lesson = await this.lessons.findAuthoringById(objectId(lessonId, 'Lesson'));
    if (!lesson) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Lesson was not found');
    const scope = await this.courseScopes.requireStudentView(actor.id, lesson.courseId.toString());
    if (resolveEffectiveContentStatus(lesson, asOf) !== 'PUBLISHED') {
      throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Lesson was not found');
    }
    if (lesson.moduleId) {
      const parent = await this.modules.findById(lesson.moduleId);
      if (!parent || parent.status !== 'PUBLISHED') {
        throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Lesson was not found');
      }
    }
    return { lesson, scope };
  }

  private async loadAllVisible(
    actor: AuthenticatedUser,
    asOf: Date,
  ): Promise<VisibleActivityContext[]> {
    assertStudent(actor);
    const studentId = objectId(actor.id, 'Student');
    const activeEnrollments = await this.enrollments.listActiveByStudent(studentId);
    const classroomIds = activeEnrollments.map((item) => item.classroomId);
    const classrooms = await this.classrooms.listActiveByIds(classroomIds);
    const classroomMap = new Map(classrooms.map((item) => [item._id.toString(), item]));
    const visibleCourses = await this.courses.listVisibleByClassroomIds(
      classrooms.map((item) => item._id),
      asOf,
    );
    const courseIds = visibleCourses.map((item) => item._id);
    const modules = await this.modules.listByCourseIds(courseIds);
    const activitiesByCourse = await this.activityReader.listByCourseIds(
      courseIds.map((item) => item.toString()),
      asOf,
    );
    const activities = visibleCourses.flatMap(
      (course) => activitiesByCourse.get(course._id.toString()) ?? [],
    );
    const progress = await this.progress.listByStudentAndActivities(
      studentId,
      activities.map((activity) => ({
        activityType: activity.activityType,
        activityId: activity.activityId,
      })),
    );
    const exceptions = await this.deadlineExceptions.listActiveByStudentAndActivities(
      studentId,
      activities.map((activity) => ({
        activityType: activity.activityType,
        activityId: activity.activityId,
      })),
    );
    const courseMap = new Map(visibleCourses.map((item) => [item._id.toString(), item]));
    const moduleMap = new Map(modules.map((item) => [item._id.toString(), item]));
    const progressMap = new Map(
      progress.map((item) => [`${item.activityType}:${item.activityId.toString()}`, item]),
    );
    const exceptionMap = new Map(
      exceptions.map((item) => [`${item.activityType}:${item.activityId.toString()}`, item]),
    );

    return activities.flatMap((activity) => {
      const course = courseMap.get(activity.courseId);
      const classroom = course ? classroomMap.get(course.classroomId.toString()) : undefined;
      if (!course || !classroom) return [];
      const key = `${activity.activityType}:${activity.activityId}`;
      const deadline = resolveEffectiveDeadline(
        new Date(activity.completionDeadline),
        exceptionMap.get(key),
      );
      return [
        {
          classroomId: classroom._id.toString(),
          classroomTitle: classroom.name,
          course,
          module: activity.moduleId ? (moduleMap.get(activity.moduleId) ?? null) : null,
          activity,
          defaultDeadline: deadline.defaultDeadline,
          effectiveDeadline: deadline.effectiveDeadline,
          hasDeadlineException: deadline.source === 'STUDENT_EXCEPTION',
          progress: progressMap.get(key),
        },
      ];
    });
  }

  async classwork(actor: AuthenticatedUser, classroomId: string) {
    assertStudent(actor);
    const asOf = this.now();
    const scope = await this.classroomScopes.getStudentEnrollmentScope(actor.id, classroomId);
    if (scope.classroomStatus !== 'ACTIVE') {
      throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Classroom was not found');
    }
    const classroom = await this.classrooms.findById(objectId(classroomId, 'Classroom'));
    if (!classroom) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Classroom was not found');
    const courses = await this.courses.listVisibleByClassroomIds([classroom._id], asOf);
    const modules = await this.modules.listByCourseIds(courses.map((item) => item._id));
    const contexts = (await this.loadAllVisible(actor, asOf)).filter(
      (item) => item.classroomId === classroomId,
    );
    const toItem = (item: VisibleActivityContext) => ({
      id: item.activity.activityId,
      activityId: item.activity.activityId,
      activityType: item.activity.activityType,
      courseId: item.activity.courseId,
      moduleId: item.activity.moduleId,
      title: item.activity.title,
      isRequired: item.activity.isRequired,
      completionDeadline: item.effectiveDeadline.toISOString(),
      defaultDeadline: item.defaultDeadline.toISOString(),
      effectiveDeadline: item.effectiveDeadline.toISOString(),
      hasDeadlineException: item.hasDeadlineException,
      displayOrder: item.activity.displayOrder,
      actionUrl: item.activity.actionUrl,
      progress: progressDto(item.progress, item.effectiveDeadline, asOf),
    });

    return {
      classroom: { id: classroom._id.toString(), name: classroom.name },
      courses: courses.map((course) => {
        const courseModules = modules
          .filter((item) => item.courseId.equals(course._id) && item.status === 'PUBLISHED')
          .sort(
            (left, right) =>
              left.displayOrder - right.displayOrder ||
              left._id.toString().localeCompare(right._id.toString()),
          );
        const courseActivities = contexts.filter(
          (item) => item.activity.courseId === course._id.toString(),
        );
        return {
          id: course._id.toString(),
          title: course.title,
          description: course.description,
          displayOrder: course.displayOrder,
          descriptorVersion: LEARNING_ACTIVITY_DESCRIPTOR_VERSION,
          activities: courseActivities.filter((item) => !item.activity.moduleId).map(toItem),
          lessons: courseActivities
            .filter((item) => item.activity.activityType === 'LESSON' && !item.activity.moduleId)
            .map(toItem),
          modules: courseModules.map((module) => ({
            id: module._id.toString(),
            title: module.title,
            description: module.description,
            displayOrder: module.displayOrder,
            activities: courseActivities
              .filter((item) => item.activity.moduleId === module._id.toString())
              .map(toItem),
            lessons: courseActivities
              .filter(
                (item) =>
                  item.activity.activityType === 'LESSON' &&
                  item.activity.moduleId === module._id.toString(),
              )
              .map(toItem),
          })),
        };
      }),
      descriptorVersion: LEARNING_ACTIVITY_DESCRIPTOR_VERSION,
      asOf: asOf.toISOString(),
    };
  }

  async player(actor: AuthenticatedUser, lessonId: string) {
    const asOf = this.now();
    const { lesson, scope } = await this.requireVisibleLesson(actor, lessonId, asOf);
    const [course, classroom, modules, lessons, flashcards, progress] = await Promise.all([
      this.courses.findById(lesson.courseId),
      this.classrooms.findById(objectId(scope.classroomId, 'Classroom')),
      this.modules.listByCourse(lesson.courseId),
      this.lessons.listByCourse(lesson.courseId),
      this.flashcards.listActiveByLesson(lesson._id),
      this.progress.findByNaturalKey(objectId(actor.id, 'Student'), 'LESSON', lesson._id),
    ]);
    if (!course || !classroom) {
      throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Course was not found');
    }
    const ordered = orderedVisibleCourseLessons(modules, lessons, asOf);
    const index = ordered.findIndex((item) => item._id.equals(lesson._id));
    if (index < 0) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Lesson was not found');
    const link = (item: LessonProjection | undefined) =>
      item
        ? {
            id: item._id.toString(),
            title: item.title,
            url: `/student/lessons/${item._id.toString()}`,
          }
        : null;
    const parentModule = lesson.moduleId
      ? (modules.find((item) => item._id.equals(lesson.moduleId)) ?? null)
      : null;
    return {
      lesson: {
        ...toStudentLessonDto(lesson),
        progress: progressDto(progress ?? undefined, lesson.completionDeadline, asOf),
        flashcards: flashcards.map(toStudentFlashcardDto),
      },
      navigation: {
        back: { label: course.title, url: `/student/courses/${course._id.toString()}` },
        previous: link(ordered[index - 1]),
        next: link(ordered[index + 1]),
        breadcrumb: [
          {
            label: classroom.name,
            url: `/student/classrooms/${classroom._id.toString()}?tab=classwork`,
          },
          { label: course.title, url: `/student/courses/${course._id.toString()}` },
          ...(parentModule
            ? [
                {
                  label: parentModule.title,
                  url: `/student/courses/${course._id.toString()}#module-${parentModule._id.toString()}`,
                },
              ]
            : []),
          { label: lesson.title, url: `/student/lessons/${lesson._id.toString()}` },
        ],
      },
      asOf: asOf.toISOString(),
    };
  }

  async start(actor: AuthenticatedUser, lessonId: string) {
    const asOf = this.now();
    const { lesson, scope } = await this.requireVisibleLesson(actor, lessonId, asOf);
    const result = await this.progress.startLesson({
      studentId: objectId(actor.id, 'Student'),
      classroomId: objectId(scope.classroomId, 'Classroom'),
      courseId: lesson.courseId,
      activityType: 'LESSON',
      activityId: lesson._id,
      startedAt: asOf,
      lastActiveAt: asOf,
    });
    return {
      progress: progressDto(result.progress, lesson.completionDeadline, asOf),
      newlyStarted: result.newlyStarted,
    };
  }

  async complete(actor: AuthenticatedUser, lessonId: string) {
    const asOf = this.now();
    const { lesson, scope } = await this.requireVisibleLesson(actor, lessonId, asOf);
    const result = await this.progress.completeLesson({
      studentId: objectId(actor.id, 'Student'),
      classroomId: objectId(scope.classroomId, 'Classroom'),
      courseId: lesson.courseId,
      activityType: 'LESSON',
      activityId: lesson._id,
      startedAt: asOf,
      lastActiveAt: asOf,
      completedAt: asOf,
    });
    return {
      progress: progressDto(result.progress, lesson.completionDeadline, asOf),
      newlyCompleted: result.newlyCompleted,
    };
  }

  async todo(actor: AuthenticatedUser, query: StudentTodoQuery) {
    const asOf = this.now();
    const contexts = (await this.loadAllVisible(actor, asOf))
      .filter((item) => item.activity.isRequired)
      .filter(
        (item) =>
          !isCompletedDerived(deriveLearningStatus(item.progress, item.effectiveDeadline, asOf)),
      )
      .filter((item) => !query.classroomId || item.classroomId === query.classroomId)
      .filter((item) => {
        const status = deriveLearningStatus(item.progress, item.effectiveDeadline, asOf);
        if (query.scope === 'OVERDUE') return status === 'MISSING';
        if (query.scope === 'UPCOMING') return status !== 'MISSING';
        return true;
      })
      .sort((left, right) => {
        const leftMissing =
          deriveLearningStatus(left.progress, left.effectiveDeadline, asOf) === 'MISSING' ? 0 : 1;
        const rightMissing =
          deriveLearningStatus(right.progress, right.effectiveDeadline, asOf) === 'MISSING' ? 0 : 1;
        return (
          leftMissing - rightMissing ||
          left.effectiveDeadline.getTime() - right.effectiveDeadline.getTime() ||
          left.classroomTitle.localeCompare(right.classroomTitle) ||
          left.course.displayOrder - right.course.displayOrder ||
          left.activity.displayOrder - right.activity.displayOrder ||
          left.activity.activityId.localeCompare(right.activity.activityId)
        );
      });
    const start = (query.page - 1) * query.limit;
    return {
      data: {
        items: contexts.slice(start, start + query.limit).map((item) => ({
          id: item.activity.activityId,
          activityId: item.activity.activityId,
          activityType: item.activity.activityType,
          title: item.activity.title,
          classroom: { id: item.classroomId, name: item.classroomTitle },
          course: { id: item.course._id.toString(), title: item.course.title },
          module: item.module ? { id: item.module._id.toString(), title: item.module.title } : null,
          completionDeadline: item.effectiveDeadline.toISOString(),
          defaultDeadline: item.defaultDeadline.toISOString(),
          effectiveDeadline: item.effectiveDeadline.toISOString(),
          hasDeadlineException: item.hasDeadlineException,
          progress: progressDto(item.progress, item.effectiveDeadline, asOf),
          actionUrl: item.activity.actionUrl,
        })),
        scopeVersion: STUDENT_TODO_SCOPE_VERSION,
        asOf: asOf.toISOString(),
      },
      meta: paginationMeta(query.page, query.limit, contexts.length),
    };
  }

  async deadlines(actor: AuthenticatedUser, query: StudentDeadlineQuery) {
    const asOf = this.now();
    const from = query.from ? new Date(query.from) : null;
    const to = query.to ? new Date(query.to) : null;
    const contexts = (await this.loadAllVisible(actor, asOf))
      .filter((item) => !query.classroomId || item.classroomId === query.classroomId)
      .filter((item) => !from || item.effectiveDeadline >= from)
      .filter((item) => !to || item.effectiveDeadline <= to)
      .sort(
        (left, right) =>
          left.effectiveDeadline.getTime() - right.effectiveDeadline.getTime() ||
          left.activity.activityId.localeCompare(right.activity.activityId),
      );
    const start = (query.page - 1) * query.limit;
    return {
      data: {
        items: contexts.slice(start, start + query.limit).map((item) => ({
          id: item.activity.activityId,
          activityId: item.activity.activityId,
          activityType: item.activity.activityType,
          title: item.activity.title,
          classroom: { id: item.classroomId, name: item.classroomTitle },
          course: { id: item.course._id.toString(), title: item.course.title },
          completionDeadline: item.effectiveDeadline.toISOString(),
          defaultDeadline: item.defaultDeadline.toISOString(),
          effectiveDeadline: item.effectiveDeadline.toISOString(),
          hasDeadlineException: item.hasDeadlineException,
          progress: progressDto(item.progress, item.effectiveDeadline, asOf),
          actionUrl: item.activity.actionUrl,
        })),
        descriptorVersion: LEARNING_ACTIVITY_DESCRIPTOR_VERSION,
        asOf: asOf.toISOString(),
      },
      meta: paginationMeta(query.page, query.limit, contexts.length),
    };
  }

  async ownProgress(actor: AuthenticatedUser, courseId: string) {
    assertStudent(actor);
    const asOf = this.now();
    await this.courseScopes.requireStudentView(actor.id, courseId);
    const id = objectId(courseId, 'Course');
    const [course, progress] = await Promise.all([
      this.courses.findById(id),
      this.progress.listByStudentAndCourse(objectId(actor.id, 'Student'), id),
    ]);
    if (!course) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Course was not found');
    const activityMap = await this.activityReader.listByCourseIds([courseId], asOf);
    const required = (activityMap.get(courseId) ?? []).filter(
      (item) => item.isRequired && item.visible,
    );
    const exceptions = await this.deadlineExceptions.listActiveByStudentAndActivities(
      objectId(actor.id, 'Student'),
      required.map((activity) => ({
        activityType: activity.activityType,
        activityId: activity.activityId,
      })),
    );
    const progressMap = new Map(
      progress.map((item) => [`${item.activityType}:${item.activityId.toString()}`, item]),
    );
    const exceptionMap = new Map(
      exceptions.map((item) => [`${item.activityType}:${item.activityId.toString()}`, item]),
    );
    const items = required.map((activity) => {
      const key = `${activity.activityType}:${activity.activityId}`;
      const current = progressMap.get(key);
      const deadline = resolveEffectiveDeadline(
        new Date(activity.completionDeadline),
        exceptionMap.get(key),
      );
      return {
        activityId: activity.activityId,
        activityType: activity.activityType,
        lessonId: activity.activityType === 'LESSON' ? activity.activityId : null,
        title: activity.title,
        completionDeadline: deadline.effectiveDeadline.toISOString(),
        defaultDeadline: deadline.defaultDeadline.toISOString(),
        effectiveDeadline: deadline.effectiveDeadline.toISOString(),
        hasDeadlineException: deadline.source === 'STUDENT_EXCEPTION',
        actionUrl: activity.actionUrl,
        ...progressDto(current, deadline.effectiveDeadline, asOf),
      };
    });
    const completedActivities = items.filter((item) =>
      isCompletedDerived(item.derivedStatus),
    ).length;
    return {
      metricVersion: LEARNING_PROGRESS_METRIC_VERSION,
      descriptorVersion: LEARNING_ACTIVITY_DESCRIPTOR_VERSION,
      asOf: asOf.toISOString(),
      course: { id: course._id.toString(), title: course.title },
      summary: {
        requiredActivities: required.length,
        completedActivities,
        requiredLessons: required.filter((item) => item.activityType === 'LESSON').length,
        completedLessons: items.filter(
          (item) => item.activityType === 'LESSON' && isCompletedDerived(item.derivedStatus),
        ).length,
        progressPercentage:
          required.length === 0 ? null : progressPercentage(completedActivities, required.length),
      },
      items,
    };
  }
}
