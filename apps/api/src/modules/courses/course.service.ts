import { Types, type ClientSession } from 'mongoose';

import { withMongoTransaction } from '../../shared/database/unit-of-work.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { PhaseFourAuditWriter } from '../audit/phase-four-audit.writer.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { ClassroomScopeReader } from '../learning-content/classroom-scope.reader.js';
import { assertContentTransition } from '../learning-content/content-lifecycle.policy.js';
import { assertFutureSchedule } from '../learning-content/content-schedule.policy.js';
import type { CourseScopeReader } from '../learning-content/course-scope.reader.js';
import type { LessonRepository } from '../lessons/lesson.repository.js';
import type { CourseModuleRepository } from '../modules/module.repository.js';
import { hasValidCoursePublishCandidate } from './course.domain.js';
import { toCourseAuditValue, toStudentCourseDto, toTeacherCourseDto } from './course.dto.js';
import type { CourseRepository } from './course.repository.js';
import type {
  ArchiveCourseInput,
  ChangeCourseStatusInput,
  CourseListQueryInput,
  CreateCourseInput,
  UpdateCourseInput,
} from './course.schemas.js';

function objectId(value: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Course was not found');
  }
  return new Types.ObjectId(value);
}

function assertTeacher(actor: AuthenticatedUser): void {
  if (actor.role !== 'TEACHER') throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
}

function assertMutableClassroom(status: string): void {
  if (status !== 'ACTIVE') {
    throw new AppError(409, 'CLASSROOM_NOT_ACTIVE', 'Classroom does not allow content mutation');
  }
}

function expectedDate(actual: Date, expected: string): Date {
  const parsed = new Date(expected);
  if (actual.getTime() !== parsed.getTime()) {
    throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Course was modified by another request');
  }
  return parsed;
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

export class CourseService {
  constructor(
    private readonly courses: CourseRepository,
    private readonly modules: CourseModuleRepository,
    private readonly lessons: LessonRepository,
    private readonly classrooms: ClassroomScopeReader,
    private readonly courseScopes: CourseScopeReader,
    private readonly audits: PhaseFourAuditWriter,
    private readonly maxCoursesPerClassroom: number,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async requireTeacherCourse(actor: AuthenticatedUser, courseId: string) {
    assertTeacher(actor);
    const scope = await this.courseScopes.requireTeacherManage(actor.id, courseId);
    const course = await this.courses.findById(objectId(courseId));
    if (!course) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Course was not found');
    return { scope, course };
  }

  private async assertPublishPrerequisite(
    courseId: Types.ObjectId,
    asOf: Date,
    session: ClientSession,
  ) {
    const lessons = await this.lessons.listCoursePublishCandidates(courseId, asOf, session);
    const modules = await this.modules.listByCourse(courseId, session);
    const moduleStatuses = new Map(
      modules.map((module) => [module._id.toString(), module.status] as const),
    );
    if (!hasValidCoursePublishCandidate(lessons, moduleStatuses, asOf)) {
      throw new AppError(
        409,
        'COURSE_PUBLISH_PREREQUISITE_FAILED',
        'Course requires a visible required Lesson with a valid deadline',
      );
    }
  }

  async create(actor: AuthenticatedUser, input: CreateCourseInput, requestId: string) {
    assertTeacher(actor);
    const classroom = await this.classrooms.getTeacherOwnedScope(actor.id, input.classroomId);
    assertMutableClassroom(classroom.status);
    const actorId = objectId(actor.id);
    const classroomId = objectId(input.classroomId);

    return withMongoTransaction(async (session) => {
      const courseCount = await this.courses.countNonArchivedByClassroom(classroomId, session);
      if (courseCount >= this.maxCoursesPerClassroom) {
        throw new AppError(409, 'CONTENT_LIMIT_REACHED', 'Classroom Course limit was reached');
      }
      const displayOrder = await this.courses.nextDisplayOrderByClassroom(classroomId, session);
      const course = await this.courses.create(
        {
          classroomId,
          ownerTeacherId: objectId(classroom.ownerTeacherId),
          title: input.title,
          description: input.description,
          displayOrder,
          createdBy: actorId,
          updatedBy: actorId,
        },
        session,
      );
      const audit = await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'COURSE_CREATED',
          resourceId: course._id.toString(),
          requestId,
          newValue: toCourseAuditValue(course),
          metadata: { classroomId: input.classroomId },
        },
        session,
      );
      return {
        course: toTeacherCourseDto(course, actor, this.now()),
        auditId: audit._id.toString(),
      };
    });
  }

  async list(actor: AuthenticatedUser, input: CourseListQueryInput) {
    const asOf = this.now();
    if (actor.role === 'TEACHER') {
      await this.classrooms.getTeacherOwnedScope(actor.id, input.classroomId);
      const result = await this.courses.listByClassroom(objectId(input.classroomId), {
        page: input.page,
        limit: input.limit,
        search: input.search,
        statuses: input.status ? [input.status] : undefined,
        sortBy: input.sortBy,
        sortOrder: input.sortOrder,
      });
      return {
        data: { items: result.items.map((course) => toTeacherCourseDto(course, actor, asOf)) },
        meta: paginationMeta(result.page, result.limit, result.totalItems),
      };
    }

    if (actor.role === 'STUDENT') {
      const enrollment = await this.classrooms.getStudentEnrollmentScope(
        actor.id,
        input.classroomId,
      );
      if (enrollment.classroomStatus !== 'ACTIVE') {
        throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Classroom was not found');
      }
      const result = await this.courses.listByClassroom(objectId(input.classroomId), {
        page: input.page,
        limit: input.limit,
        search: input.search,
        sortBy: input.sortBy,
        sortOrder: input.sortOrder,
        visibleAt: asOf,
      });
      return {
        data: { items: result.items.map(toStudentCourseDto) },
        meta: paginationMeta(result.page, result.limit, result.totalItems),
      };
    }

    throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
  }

  async getDetail(actor: AuthenticatedUser, courseId: string) {
    const id = objectId(courseId);
    if (actor.role === 'TEACHER') {
      await this.courseScopes.requireTeacherManage(actor.id, courseId);
      const course = await this.courses.findById(id);
      if (!course) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Course was not found');
      return toTeacherCourseDto(course, actor, this.now());
    }
    if (actor.role === 'STUDENT') {
      await this.courseScopes.requireStudentView(actor.id, courseId);
      const course = await this.courses.findById(id);
      if (!course) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Course was not found');
      return toStudentCourseDto(course);
    }
    throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
  }

  async update(
    actor: AuthenticatedUser,
    courseId: string,
    input: UpdateCourseInput,
    requestId: string,
  ) {
    const { scope, course } = await this.requireTeacherCourse(actor, courseId);
    assertMutableClassroom(scope.classroomStatus);
    if (course.status !== 'DRAFT' && course.status !== 'UNPUBLISHED') {
      throw new AppError(409, 'CONTENT_STATE_CONFLICT', 'Course metadata is locked');
    }
    const expectedUpdatedAt = expectedDate(course.updatedAt, input.expectedUpdatedAt);
    const patch = {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    };
    const actorId = objectId(actor.id);

    return withMongoTransaction(async (session) => {
      const updated = await this.courses.updateMetadataCas(
        { courseId: course._id, expectedUpdatedAt, updatedBy: actorId, patch },
        session,
      );
      if (!updated) {
        throw new AppError(
          409,
          'CONCURRENT_MODIFICATION',
          'Course was modified by another request',
        );
      }
      const audit = await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'COURSE_UPDATED',
          resourceId: courseId,
          requestId,
          oldValue: toCourseAuditValue(course),
          newValue: toCourseAuditValue(updated),
          metadata: { classroomId: scope.classroomId },
        },
        session,
      );
      return {
        course: toTeacherCourseDto(updated, actor, this.now()),
        auditId: audit._id.toString(),
      };
    });
  }

  async changeStatus(
    actor: AuthenticatedUser,
    courseId: string,
    input: ChangeCourseStatusInput,
    requestId: string,
  ) {
    const { scope, course } = await this.requireTeacherCourse(actor, courseId);
    assertMutableClassroom(scope.classroomStatus);
    assertContentTransition('COMMON', course.status, input.targetStatus);
    const expectedUpdatedAt = expectedDate(course.updatedAt, input.expectedUpdatedAt);
    const changedAt = this.now();
    const scheduledPublishAt = input.scheduledPublishAt ? new Date(input.scheduledPublishAt) : null;
    if (input.targetStatus === 'SCHEDULED') assertFutureSchedule(scheduledPublishAt, changedAt);
    const actorId = objectId(actor.id);

    return withMongoTransaction(async (session) => {
      if (input.targetStatus === 'SCHEDULED' || input.targetStatus === 'PUBLISHED') {
        await this.assertPublishPrerequisite(course._id, changedAt, session);
      }
      const updated = await this.courses.changeStatusCas(
        {
          courseId: course._id,
          expectedUpdatedAt,
          updatedBy: actorId,
          patch: {
            status: input.targetStatus,
            scheduledPublishAt,
            ...(input.targetStatus === 'PUBLISHED' ? { publishedAt: changedAt } : {}),
            ...(input.targetStatus === 'UNPUBLISHED' ? { unpublishedAt: changedAt } : {}),
          },
        },
        session,
      );
      if (!updated) {
        throw new AppError(
          409,
          'CONCURRENT_MODIFICATION',
          'Course was modified by another request',
        );
      }
      const audit = await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'COURSE_STATUS_CHANGED',
          resourceId: courseId,
          requestId,
          oldValue: toCourseAuditValue(course),
          newValue: toCourseAuditValue(updated),
          metadata: { classroomId: scope.classroomId },
        },
        session,
      );
      return {
        course: toTeacherCourseDto(updated, actor, changedAt),
        auditId: audit._id.toString(),
      };
    });
  }

  async archive(
    actor: AuthenticatedUser,
    courseId: string,
    input: ArchiveCourseInput,
    requestId: string,
  ): Promise<void> {
    const { scope, course } = await this.requireTeacherCourse(actor, courseId);
    assertMutableClassroom(scope.classroomStatus);
    assertContentTransition('COMMON', course.status, 'ARCHIVED');
    const expectedUpdatedAt = expectedDate(course.updatedAt, input.expectedUpdatedAt);
    const actorId = objectId(actor.id);
    const archivedAt = this.now();

    await withMongoTransaction(async (session) => {
      const archived = await this.courses.archiveCas(
        { courseId: course._id, expectedUpdatedAt, actorId, archivedAt },
        session,
      );
      if (!archived) {
        throw new AppError(
          409,
          'CONCURRENT_MODIFICATION',
          'Course was modified by another request',
        );
      }
      await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'COURSE_ARCHIVED',
          resourceId: courseId,
          requestId,
          reason: input.reason,
          oldValue: toCourseAuditValue(course),
          newValue: toCourseAuditValue(archived),
          metadata: { classroomId: scope.classroomId },
        },
        session,
      );
      return true;
    });
  }
}
