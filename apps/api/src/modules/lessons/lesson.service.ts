import { Types } from 'mongoose';

import { withMongoTransaction } from '../../shared/database/unit-of-work.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { PhaseFourAuditWriter } from '../audit/phase-four-audit.writer.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { CourseRepository } from '../courses/course.repository.js';
import type { LessonDeadlineRepository } from '../deadlines/lesson-deadline.repository.js';
import type { CourseScopeReader } from '../learning-content/course-scope.reader.js';
import { assertContentTransition } from '../learning-content/content-lifecycle.policy.js';
import { assignExactOrder } from '../learning-content/content-ordering.policy.js';
import {
  assertFutureSchedule,
  resolveEffectiveContentStatus,
} from '../learning-content/content-schedule.policy.js';
import type { CourseModuleRepository } from '../modules/module.repository.js';
import { assertLessonPublishPrerequisites } from './lesson.domain.js';
import { toLessonAuditValue, toStudentLessonDto, toTeacherLessonDto } from './lesson.dto.js';
import type { LessonRepository } from './lesson.repository.js';
import type {
  ArchiveLessonInput,
  ChangeLessonStatusInput,
  CreateLessonInput,
  LessonListQueryInput,
  ReorderLessonsInput,
  UpdateLessonInput,
} from './lesson.schemas.js';

function objectId(value: string, resource = 'Lesson'): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(404, 'RESOURCE_NOT_FOUND', `${resource} was not found`);
  }
  return new Types.ObjectId(value);
}

function assertTeacher(actor: AuthenticatedUser): void {
  if (actor.role !== 'TEACHER') throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
}

function expectedDate(actual: Date, expected: string): Date {
  const parsed = new Date(expected);
  if (actual.getTime() !== parsed.getTime()) {
    throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Lesson was modified by another request');
  }
  return parsed;
}

function assertMutableScope(scope: Awaited<ReturnType<CourseScopeReader['requireTeacherManage']>>) {
  if (scope.classroomStatus !== 'ACTIVE') {
    throw new AppError(409, 'CLASSROOM_NOT_ACTIVE', 'Classroom does not allow content mutation');
  }
  if (scope.status === 'ARCHIVED') {
    throw new AppError(409, 'CONTENT_STATE_CONFLICT', 'Archived Course is read-only');
  }
}

export class LessonService {
  constructor(
    private readonly courses: CourseRepository,
    private readonly modules: CourseModuleRepository,
    private readonly lessons: LessonRepository,
    private readonly deadlines: LessonDeadlineRepository,
    private readonly courseScopes: CourseScopeReader,
    private readonly audits: PhaseFourAuditWriter,
    private readonly maxLessonsPerCourse: number,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async requireTeacherLesson(actor: AuthenticatedUser, lessonId: string) {
    assertTeacher(actor);
    const lesson = await this.lessons.findAuthoringById(objectId(lessonId));
    if (!lesson) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Lesson was not found');
    const scope = await this.courseScopes.requireTeacherManage(
      actor.id,
      lesson.courseId.toString(),
    );
    return { lesson, scope };
  }

  private async requireStudentLesson(actor: AuthenticatedUser, lessonId: string) {
    if (actor.role !== 'STUDENT') throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
    const lesson = await this.lessons.findAuthoringById(objectId(lessonId));
    if (!lesson) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Lesson was not found');
    await this.courseScopes.requireStudentView(actor.id, lesson.courseId.toString());
    if (resolveEffectiveContentStatus(lesson, this.now()) !== 'PUBLISHED') {
      throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Lesson was not found');
    }
    if (lesson.moduleId) {
      const parent = await this.modules.findById(lesson.moduleId);
      if (!parent || parent.status !== 'PUBLISHED') {
        throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Lesson was not found');
      }
    }
    return lesson;
  }

  async create(actor: AuthenticatedUser, input: CreateLessonInput, requestId: string) {
    assertTeacher(actor);
    const scope = await this.courseScopes.requireTeacherManage(actor.id, input.courseId);
    assertMutableScope(scope);
    const actorId = objectId(actor.id, 'User');
    const courseId = objectId(input.courseId, 'Course');
    const moduleId = input.moduleId ? objectId(input.moduleId, 'Module') : null;
    const changedAt = this.now();
    const deadline = input.completionDeadline ? new Date(input.completionDeadline) : null;
    if (deadline && deadline.getTime() <= changedAt.getTime()) {
      throw new AppError(422, 'VALIDATION_ERROR', 'Completion deadline must be in the future');
    }

    return withMongoTransaction(async (session) => {
      const course = await this.courses.findById(courseId, session);
      if (!course || course.status === 'ARCHIVED') {
        throw new AppError(409, 'CONTENT_STATE_CONFLICT', 'Course cannot accept a Lesson');
      }
      if (moduleId) {
        const parent = await this.modules.findById(moduleId, session);
        if (!parent || !parent.courseId.equals(courseId) || parent.status === 'ARCHIVED') {
          throw new AppError(422, 'INVALID_PARENT_REFERENCE', 'Module does not belong to Course');
        }
      }
      const count = await this.lessons.countNonArchivedByCourse(courseId, session);
      if (count >= this.maxLessonsPerCourse) {
        throw new AppError(409, 'CONTENT_LIMIT_REACHED', 'Course Lesson limit was reached');
      }
      const displayOrder = await this.lessons.nextDisplayOrder(courseId, moduleId, session);
      const lesson = await this.lessons.create(
        {
          courseId,
          moduleId,
          title: input.title,
          content: input.content,
          estimatedMinutes: input.estimatedMinutes,
          isRequired: input.isRequired,
          completionDeadline: deadline,
          deadlineRevision: deadline ? 1 : 0,
          deadlineLastUpdatedAt: deadline ? changedAt : null,
          deadlineLastUpdatedBy: deadline ? actorId : null,
          displayOrder,
          createdBy: actorId,
          updatedBy: actorId,
        },
        session,
      );
      if (deadline) {
        await this.deadlines.append(
          {
            lessonId: lesson._id,
            courseId,
            classroomId: objectId(scope.classroomId, 'Classroom'),
            fromDeadline: null,
            toDeadline: deadline,
            fromRevision: 0,
            toRevision: 1,
            actorId,
            requestId,
            changedAt,
          },
          session,
        );
      }
      const revisedCourse = await this.courses.incrementStructureRevisionCas(
        courseId,
        course.structureRevision,
        actorId,
        session,
      );
      if (!revisedCourse)
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Course structure changed');
      const audit = await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'LESSON_CREATED',
          resourceId: lesson._id.toString(),
          requestId,
          newValue: toLessonAuditValue(lesson),
          metadata: { courseId: input.courseId, moduleId: input.moduleId ?? null },
        },
        session,
      );
      return {
        lesson: toTeacherLessonDto(lesson, actor, changedAt),
        structureRevision: revisedCourse.structureRevision,
        auditId: audit._id.toString(),
      };
    });
  }

  async list(actor: AuthenticatedUser, courseId: string, query: LessonListQueryInput) {
    const id = objectId(courseId, 'Course');
    const asOf = this.now();
    if (actor.role === 'TEACHER') {
      await this.courseScopes.requireTeacherManage(actor.id, courseId);
      const lessons = await this.lessons.listByCourse(id, undefined, { includeArchived: true });
      return lessons
        .filter((lesson) => query.status === undefined || lesson.status === query.status)
        .filter(
          (lesson) =>
            query.moduleId === undefined ||
            (query.moduleId === null
              ? lesson.moduleId === null
              : lesson.moduleId?.toString() === query.moduleId),
        )
        .map((lesson) => toTeacherLessonDto(lesson, actor, asOf));
    }
    if (actor.role === 'STUDENT') {
      await this.courseScopes.requireStudentView(actor.id, courseId);
      const [lessons, modules] = await Promise.all([
        this.lessons.listByCourse(id),
        this.modules.listByCourse(id),
      ]);
      const publishedModules = new Set(
        modules
          .filter((module) => module.status === 'PUBLISHED')
          .map((module) => module._id.toString()),
      );
      return lessons
        .filter((lesson) => resolveEffectiveContentStatus(lesson, asOf) === 'PUBLISHED')
        .filter((lesson) => !lesson.moduleId || publishedModules.has(lesson.moduleId.toString()))
        .filter(
          (lesson) =>
            query.moduleId === undefined ||
            (query.moduleId === null
              ? lesson.moduleId === null
              : lesson.moduleId?.toString() === query.moduleId),
        )
        .map(toStudentLessonDto);
    }
    throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
  }

  async getDetail(actor: AuthenticatedUser, lessonId: string) {
    if (actor.role === 'TEACHER') {
      const { lesson } = await this.requireTeacherLesson(actor, lessonId);
      return toTeacherLessonDto(lesson, actor, this.now());
    }
    return toStudentLessonDto(await this.requireStudentLesson(actor, lessonId));
  }

  async preview(actor: AuthenticatedUser, lessonId: string) {
    const { lesson } = await this.requireTeacherLesson(actor, lessonId);
    return toStudentLessonDto(lesson);
  }

  async update(
    actor: AuthenticatedUser,
    lessonId: string,
    input: UpdateLessonInput,
    requestId: string,
  ) {
    const { lesson, scope } = await this.requireTeacherLesson(actor, lessonId);
    assertMutableScope(scope);
    if (lesson.status !== 'DRAFT' && lesson.status !== 'UNPUBLISHED') {
      throw new AppError(409, 'CONTENT_STATE_CONFLICT', 'Published Lesson content is locked');
    }
    const expectedUpdatedAt = expectedDate(lesson.updatedAt, input.expectedUpdatedAt);
    const actorId = objectId(actor.id, 'User');
    const patch = {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.estimatedMinutes !== undefined ? { estimatedMinutes: input.estimatedMinutes } : {}),
      ...(input.isRequired !== undefined ? { isRequired: input.isRequired } : {}),
    };
    return withMongoTransaction(async (session) => {
      const updated = await this.lessons.updateMetadataCas(
        { lessonId: lesson._id, expectedUpdatedAt, updatedBy: actorId, patch },
        session,
      );
      if (!updated) throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Lesson was modified');
      const audit = await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'LESSON_UPDATED',
          resourceId: lessonId,
          requestId,
          oldValue: toLessonAuditValue(lesson),
          newValue: toLessonAuditValue(updated),
          metadata: { courseId: scope.courseId, moduleId: updated.moduleId?.toString() ?? null },
        },
        session,
      );
      return {
        lesson: toTeacherLessonDto(updated, actor, this.now()),
        auditId: audit._id.toString(),
      };
    });
  }

  async changeStatus(
    actor: AuthenticatedUser,
    lessonId: string,
    input: ChangeLessonStatusInput,
    requestId: string,
  ) {
    const { lesson, scope } = await this.requireTeacherLesson(actor, lessonId);
    assertMutableScope(scope);
    assertContentTransition('COMMON', lesson.status, input.targetStatus);
    const expectedUpdatedAt = expectedDate(lesson.updatedAt, input.expectedUpdatedAt);
    const changedAt = this.now();
    const scheduledPublishAt = input.scheduledPublishAt ? new Date(input.scheduledPublishAt) : null;
    if (input.targetStatus === 'SCHEDULED') assertFutureSchedule(scheduledPublishAt, changedAt);
    const actorId = objectId(actor.id, 'User');

    return withMongoTransaction(async (session) => {
      if (input.targetStatus === 'SCHEDULED' || input.targetStatus === 'PUBLISHED') {
        const parent = lesson.moduleId
          ? await this.modules.findById(lesson.moduleId, session)
          : null;
        assertLessonPublishPrerequisites(lesson, parent, changedAt);
      }
      const updated = await this.lessons.changeStatusCas(
        {
          lessonId: lesson._id,
          expectedUpdatedAt,
          updatedBy: actorId,
          patch: {
            status: input.targetStatus,
            scheduledPublishAt,
            ...(input.targetStatus === 'PUBLISHED'
              ? { publishedAt: changedAt, publishedRevision: lesson.contentRevision }
              : {}),
            ...(input.targetStatus === 'SCHEDULED'
              ? { publishedRevision: lesson.contentRevision }
              : {}),
            ...(input.targetStatus === 'UNPUBLISHED' ? { unpublishedAt: changedAt } : {}),
          },
        },
        session,
      );
      if (!updated) throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Lesson was modified');
      const audit = await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'LESSON_STATUS_CHANGED',
          resourceId: lessonId,
          requestId,
          oldValue: toLessonAuditValue(lesson),
          newValue: toLessonAuditValue(updated),
          metadata: { courseId: scope.courseId, moduleId: updated.moduleId?.toString() ?? null },
        },
        session,
      );
      return {
        lesson: toTeacherLessonDto(updated, actor, changedAt),
        auditId: audit._id.toString(),
      };
    });
  }

  async archive(
    actor: AuthenticatedUser,
    lessonId: string,
    input: ArchiveLessonInput,
    requestId: string,
  ) {
    const { lesson, scope } = await this.requireTeacherLesson(actor, lessonId);
    assertMutableScope(scope);
    assertContentTransition('COMMON', lesson.status, 'ARCHIVED');
    const expectedUpdatedAt = expectedDate(lesson.updatedAt, input.expectedUpdatedAt);
    const actorId = objectId(actor.id, 'User');
    const archivedAt = this.now();
    await withMongoTransaction(async (session) => {
      const course = await this.courses.findById(lesson.courseId, session);
      if (!course) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Course was not found');
      const archived = await this.lessons.archiveCas(
        { lessonId: lesson._id, expectedUpdatedAt, actorId, archivedAt },
        session,
      );
      if (!archived) throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Lesson was modified');
      const revisedCourse = await this.courses.incrementStructureRevisionCas(
        lesson.courseId,
        course.structureRevision,
        actorId,
        session,
      );
      if (!revisedCourse)
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Course structure changed');
      await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'LESSON_ARCHIVED',
          resourceId: lessonId,
          requestId,
          reason: input.reason,
          oldValue: toLessonAuditValue(lesson),
          newValue: toLessonAuditValue(archived),
          metadata: { courseId: scope.courseId, moduleId: lesson.moduleId?.toString() ?? null },
        },
        session,
      );
      return true;
    });
  }

  async reorder(
    actor: AuthenticatedUser,
    courseId: string,
    input: ReorderLessonsInput,
    requestId: string,
  ) {
    assertTeacher(actor);
    const scope = await this.courseScopes.requireTeacherManage(actor.id, courseId);
    assertMutableScope(scope);
    const courseObjectId = objectId(courseId, 'Course');
    const actorId = objectId(actor.id, 'User');

    return withMongoTransaction(async (session) => {
      const course = await this.courses.findById(courseObjectId, session);
      if (!course || course.structureRevision !== input.expectedStructureRevision) {
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Course structure changed');
      }
      const activeLessons = await this.lessons.listByCourse(courseObjectId, session);
      const activeModules = await this.modules.listByCourse(courseObjectId, session);
      const validModuleIds = new Set(activeModules.map((module) => module._id.toString()));
      for (const container of input.containers) {
        if (container.moduleId && !validModuleIds.has(container.moduleId)) {
          throw new AppError(422, 'ORDER_SET_MISMATCH', 'Lesson container is foreign or archived');
        }
      }
      const requestedIds = input.containers.flatMap((container) => container.orderedLessonIds);
      assignExactOrder(
        activeLessons.map((lesson) => lesson._id.toString()),
        requestedIds,
      );
      const assignments = input.containers.flatMap((container) =>
        container.orderedLessonIds.map((id, displayOrder) => ({
          lessonId: objectId(id),
          moduleId: container.moduleId ? objectId(container.moduleId, 'Module') : null,
          displayOrder,
        })),
      );
      await this.lessons.reorder(courseObjectId, assignments, actorId, session);
      const revisedCourse = await this.courses.incrementStructureRevisionCas(
        courseObjectId,
        input.expectedStructureRevision,
        actorId,
        session,
      );
      if (!revisedCourse)
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Course structure changed');
      const reordered = await this.lessons.listByCourse(courseObjectId, session);
      const audit = await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'LESSONS_REORDERED',
          resourceId: courseId,
          requestId,
          oldValue: { structureRevision: input.expectedStructureRevision },
          newValue: { structureRevision: revisedCourse.structureRevision },
          metadata: {
            courseId,
            lessonCount: reordered.length,
            fromStructureRevision: input.expectedStructureRevision,
            toStructureRevision: revisedCourse.structureRevision,
          },
        },
        session,
      );
      return {
        items: reordered.map((lesson) => toTeacherLessonDto(lesson, actor, this.now())),
        structureRevision: revisedCourse.structureRevision,
        auditId: audit._id.toString(),
      };
    });
  }
}
