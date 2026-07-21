import { Types } from 'mongoose';

import { AppError } from '../../shared/errors/app-error.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { ClassroomRepository } from '../classrooms/classroom.repository.js';
import type { CourseScopeReader } from '../learning-content/course-scope.reader.js';
import type { ClassroomScopeReader } from '../learning-content/classroom-scope.reader.js';
import { resolveEffectiveContentStatus } from '../learning-content/content-schedule.policy.js';
import {
  isVisibleLesson,
  orderedVisibleCourseLessons,
} from '../learning-content/visible-content.policy.js';
import type { CourseProjection, CourseRepository } from '../courses/course.repository.js';
import type { EnrollmentRepository } from '../enrollments/enrollment.repository.js';
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

export const STUDENT_TODO_SCOPE_VERSION = 'P04_LESSON_TODO_V1' as const;
export const LEARNING_PROGRESS_METRIC_VERSION = 'P04_LESSON_COMPLETION_V1' as const;

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

interface VisibleLessonContext {
  classroomId: string;
  classroomTitle: string;
  course: CourseProjection;
  module: CourseModuleProjection | null;
  lesson: LessonProjection;
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
  ): Promise<VisibleLessonContext[]> {
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
    const [modules, lessons] = await Promise.all([
      this.modules.listByCourseIds(courseIds),
      this.lessons.listByCourseIds(courseIds),
    ]);
    const publishedModuleIds = new Set(
      modules.filter((item) => item.status === 'PUBLISHED').map((item) => item._id.toString()),
    );
    const visibleLessons = lessons.filter((lesson) =>
      isVisibleLesson(lesson, publishedModuleIds, asOf),
    );
    const progress = await this.progress.listByStudentAndActivityIds(
      studentId,
      visibleLessons.map((item) => item._id),
    );
    const courseMap = new Map(visibleCourses.map((item) => [item._id.toString(), item]));
    const moduleMap = new Map(modules.map((item) => [item._id.toString(), item]));
    const progressMap = new Map(progress.map((item) => [item.activityId.toString(), item]));

    return visibleLessons.flatMap((lesson) => {
      const course = courseMap.get(lesson.courseId.toString());
      const classroom = course ? classroomMap.get(course.classroomId.toString()) : undefined;
      if (!course || !classroom) return [];
      return [
        {
          classroomId: classroom._id.toString(),
          classroomTitle: classroom.name,
          course,
          module: lesson.moduleId ? (moduleMap.get(lesson.moduleId.toString()) ?? null) : null,
          lesson,
          progress: progressMap.get(lesson._id.toString()),
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
    const courseIds = courses.map((item) => item._id);
    const [modules, lessons] = await Promise.all([
      this.modules.listByCourseIds(courseIds),
      this.lessons.listByCourseIds(courseIds),
    ]);
    const allVisible = courses.flatMap((course) =>
      orderedVisibleCourseLessons(
        modules.filter((item) => item.courseId.equals(course._id)),
        lessons.filter((item) => item.courseId.equals(course._id)),
        asOf,
      ),
    );
    const progress = await this.progress.listByStudentAndActivityIds(
      objectId(actor.id, 'Student'),
      allVisible.map((item) => item._id),
    );
    const progressMap = new Map(progress.map((item) => [item.activityId.toString(), item]));

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
        const courseLessons = orderedVisibleCourseLessons(
          courseModules,
          lessons.filter((item) => item.courseId.equals(course._id)),
          asOf,
        );
        const lessonItem = (lesson: LessonProjection) => ({
          ...toStudentLessonDto(lesson),
          progress: progressDto(
            progressMap.get(lesson._id.toString()),
            lesson.completionDeadline,
            asOf,
          ),
        });
        return {
          id: course._id.toString(),
          title: course.title,
          description: course.description,
          displayOrder: course.displayOrder,
          lessons: courseLessons.filter((item) => !item.moduleId).map(lessonItem),
          modules: courseModules.map((module) => ({
            id: module._id.toString(),
            title: module.title,
            description: module.description,
            displayOrder: module.displayOrder,
            lessons: courseLessons
              .filter((item) => item.moduleId?.equals(module._id))
              .map(lessonItem),
          })),
        };
      }),
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
      .filter((item) => item.lesson.isRequired && item.lesson.completionDeadline)
      .filter(
        (item) =>
          !isCompletedDerived(
            deriveLearningStatus(item.progress, item.lesson.completionDeadline, asOf),
          ),
      )
      .filter((item) => !query.classroomId || item.classroomId === query.classroomId)
      .filter((item) => {
        const status = deriveLearningStatus(item.progress, item.lesson.completionDeadline, asOf);
        if (query.scope === 'OVERDUE') return status === 'MISSING';
        if (query.scope === 'UPCOMING') return status !== 'MISSING';
        return true;
      })
      .sort((left, right) => {
        const leftMissing =
          deriveLearningStatus(left.progress, left.lesson.completionDeadline, asOf) === 'MISSING'
            ? 0
            : 1;
        const rightMissing =
          deriveLearningStatus(right.progress, right.lesson.completionDeadline, asOf) === 'MISSING'
            ? 0
            : 1;
        return (
          leftMissing - rightMissing ||
          left.lesson.completionDeadline!.getTime() - right.lesson.completionDeadline!.getTime() ||
          left.classroomTitle.localeCompare(right.classroomTitle) ||
          left.course.displayOrder - right.course.displayOrder ||
          left.lesson.displayOrder - right.lesson.displayOrder ||
          left.lesson._id.toString().localeCompare(right.lesson._id.toString())
        );
      });
    const start = (query.page - 1) * query.limit;
    return {
      data: {
        items: contexts.slice(start, start + query.limit).map((item) => ({
          id: item.lesson._id.toString(),
          title: item.lesson.title,
          classroom: { id: item.classroomId, name: item.classroomTitle },
          course: { id: item.course._id.toString(), title: item.course.title },
          module: item.module ? { id: item.module._id.toString(), title: item.module.title } : null,
          completionDeadline: item.lesson.completionDeadline!.toISOString(),
          progress: progressDto(item.progress, item.lesson.completionDeadline, asOf),
          actionUrl: `/student/lessons/${item.lesson._id.toString()}`,
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
      .filter((item) => item.lesson.completionDeadline)
      .filter((item) => !query.classroomId || item.classroomId === query.classroomId)
      .filter((item) => !from || item.lesson.completionDeadline! >= from)
      .filter((item) => !to || item.lesson.completionDeadline! <= to)
      .sort(
        (left, right) =>
          left.lesson.completionDeadline!.getTime() - right.lesson.completionDeadline!.getTime() ||
          left.lesson._id.toString().localeCompare(right.lesson._id.toString()),
      );
    const start = (query.page - 1) * query.limit;
    return {
      data: {
        items: contexts.slice(start, start + query.limit).map((item) => ({
          id: item.lesson._id.toString(),
          title: item.lesson.title,
          classroom: { id: item.classroomId, name: item.classroomTitle },
          course: { id: item.course._id.toString(), title: item.course.title },
          completionDeadline: item.lesson.completionDeadline!.toISOString(),
          progress: progressDto(item.progress, item.lesson.completionDeadline, asOf),
          actionUrl: `/student/lessons/${item.lesson._id.toString()}`,
        })),
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
    const [course, modules, lessons, progress] = await Promise.all([
      this.courses.findById(id),
      this.modules.listByCourse(id),
      this.lessons.listByCourse(id),
      this.progress.listByStudentAndCourse(objectId(actor.id, 'Student'), id),
    ]);
    if (!course) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Course was not found');
    const required = orderedVisibleCourseLessons(modules, lessons, asOf).filter(
      (item) => item.isRequired,
    );
    const progressMap = new Map(progress.map((item) => [item.activityId.toString(), item]));
    const items = required.map((lesson) => {
      const current = progressMap.get(lesson._id.toString());
      return {
        lessonId: lesson._id.toString(),
        title: lesson.title,
        completionDeadline: lesson.completionDeadline?.toISOString() ?? null,
        ...progressDto(current, lesson.completionDeadline, asOf),
      };
    });
    const completedLessons = items.filter((item) => isCompletedDerived(item.derivedStatus)).length;
    return {
      metricVersion: LEARNING_PROGRESS_METRIC_VERSION,
      asOf: asOf.toISOString(),
      course: { id: course._id.toString(), title: course.title },
      summary: {
        requiredLessons: required.length,
        completedLessons,
        progressPercentage: progressPercentage(completedLessons, required.length),
      },
      items,
    };
  }
}
