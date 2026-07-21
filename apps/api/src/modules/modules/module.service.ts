import { Types } from 'mongoose';

import { withMongoTransaction } from '../../shared/database/unit-of-work.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { PhaseFourAuditWriter } from '../audit/phase-four-audit.writer.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { CourseRepository } from '../courses/course.repository.js';
import type { CourseScopeReader } from '../learning-content/course-scope.reader.js';
import { assertContentTransition } from '../learning-content/content-lifecycle.policy.js';
import { assignExactOrder } from '../learning-content/content-ordering.policy.js';
import type { LessonRepository } from '../lessons/lesson.repository.js';
import { toModuleAuditValue, toStudentModuleDto, toTeacherModuleDto } from './module.dto.js';
import type { CourseModuleProjection, CourseModuleRepository } from './module.repository.js';
import type {
  ArchiveModuleInput,
  ChangeModuleStatusInput,
  CreateModuleInput,
  ReorderModulesInput,
  UpdateModuleInput,
} from './module.schemas.js';

function objectId(value: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Module was not found');
  }
  return new Types.ObjectId(value);
}

function assertTeacher(actor: AuthenticatedUser): void {
  if (actor.role !== 'TEACHER') throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
}

function assertMutableCourseScope(
  scope: Awaited<ReturnType<CourseScopeReader['requireTeacherManage']>>,
) {
  if (scope.classroomStatus !== 'ACTIVE') {
    throw new AppError(409, 'CLASSROOM_NOT_ACTIVE', 'Classroom does not allow content mutation');
  }
  if (scope.status === 'ARCHIVED') {
    throw new AppError(409, 'CONTENT_STATE_CONFLICT', 'Archived Course is read-only');
  }
}

function expectedDate(actual: Date, expected: string): Date {
  const parsed = new Date(expected);
  if (actual.getTime() !== parsed.getTime()) {
    throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Module was modified by another request');
  }
  return parsed;
}

export class CourseModuleService {
  constructor(
    private readonly courses: CourseRepository,
    private readonly modules: CourseModuleRepository,
    private readonly lessons: LessonRepository,
    private readonly courseScopes: CourseScopeReader,
    private readonly audits: PhaseFourAuditWriter,
    private readonly maxModulesPerCourse: number,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async requireTeacherModule(actor: AuthenticatedUser, moduleId: string) {
    assertTeacher(actor);
    const module = await this.modules.findById(objectId(moduleId));
    if (!module) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Module was not found');
    const scope = await this.courseScopes.requireTeacherManage(
      actor.id,
      module.courseId.toString(),
    );
    return { module, scope };
  }

  async list(actor: AuthenticatedUser, courseId: string) {
    if (actor.role === 'TEACHER') {
      await this.courseScopes.requireTeacherManage(actor.id, courseId);
      const modules = await this.modules.listByCourse(objectId(courseId), undefined, {
        includeArchived: true,
      });
      return modules.map((module) => toTeacherModuleDto(module, actor));
    }
    if (actor.role === 'STUDENT') {
      await this.courseScopes.requireStudentView(actor.id, courseId);
      const modules = await this.modules.listByCourse(objectId(courseId));
      return modules.filter((module) => module.status === 'PUBLISHED').map(toStudentModuleDto);
    }
    throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
  }

  async create(
    actor: AuthenticatedUser,
    courseId: string,
    input: CreateModuleInput,
    requestId: string,
  ) {
    assertTeacher(actor);
    const scope = await this.courseScopes.requireTeacherManage(actor.id, courseId);
    assertMutableCourseScope(scope);
    const courseObjectId = objectId(courseId);
    const actorId = objectId(actor.id);

    return withMongoTransaction(async (session) => {
      const course = await this.courses.findById(courseObjectId, session);
      if (!course || course.status === 'ARCHIVED') {
        throw new AppError(409, 'CONTENT_STATE_CONFLICT', 'Course cannot accept a Module');
      }
      const moduleCount = await this.modules.countNonArchivedByCourse(courseObjectId, session);
      if (moduleCount >= this.maxModulesPerCourse) {
        throw new AppError(409, 'CONTENT_LIMIT_REACHED', 'Course Module limit was reached');
      }
      const displayOrder = await this.modules.nextDisplayOrderByCourse(courseObjectId, session);
      const module = await this.modules.create(
        {
          courseId: courseObjectId,
          title: input.title,
          description: input.description,
          displayOrder,
          createdBy: actorId,
          updatedBy: actorId,
        },
        session,
      );
      const revisedCourse = await this.courses.incrementStructureRevisionCas(
        courseObjectId,
        course.structureRevision,
        actorId,
        session,
      );
      if (!revisedCourse) {
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Course structure changed');
      }
      const audit = await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'MODULE_CREATED',
          resourceId: module._id.toString(),
          requestId,
          newValue: toModuleAuditValue(module),
          metadata: { courseId },
        },
        session,
      );
      return {
        module: toTeacherModuleDto(module, actor),
        structureRevision: revisedCourse.structureRevision,
        auditId: audit._id.toString(),
      };
    });
  }

  async update(
    actor: AuthenticatedUser,
    moduleId: string,
    input: UpdateModuleInput,
    requestId: string,
  ) {
    const { module, scope } = await this.requireTeacherModule(actor, moduleId);
    assertMutableCourseScope(scope);
    if (module.status === 'ARCHIVED') {
      throw new AppError(409, 'CONTENT_STATE_CONFLICT', 'Archived Module is read-only');
    }
    const expectedUpdatedAt = expectedDate(module.updatedAt, input.expectedUpdatedAt);
    const patch = {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    };
    const actorId = objectId(actor.id);

    return withMongoTransaction(async (session) => {
      const updated = await this.modules.updateMetadataCas(
        { moduleId: module._id, expectedUpdatedAt, updatedBy: actorId, patch },
        session,
      );
      if (!updated) {
        throw new AppError(
          409,
          'CONCURRENT_MODIFICATION',
          'Module was modified by another request',
        );
      }
      const audit = await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'MODULE_UPDATED',
          resourceId: moduleId,
          requestId,
          oldValue: toModuleAuditValue(module),
          newValue: toModuleAuditValue(updated),
          metadata: { courseId: scope.courseId },
        },
        session,
      );
      return { module: toTeacherModuleDto(updated, actor), auditId: audit._id.toString() };
    });
  }

  async changeStatus(
    actor: AuthenticatedUser,
    moduleId: string,
    input: ChangeModuleStatusInput,
    requestId: string,
  ) {
    const { module, scope } = await this.requireTeacherModule(actor, moduleId);
    assertMutableCourseScope(scope);
    assertContentTransition('MODULE', module.status, input.targetStatus);
    const expectedUpdatedAt = expectedDate(module.updatedAt, input.expectedUpdatedAt);
    const actorId = objectId(actor.id);

    return withMongoTransaction(async (session) => {
      const updated = await this.modules.changeStatusCas(
        {
          moduleId: module._id,
          expectedUpdatedAt,
          updatedBy: actorId,
          patch: { status: input.targetStatus },
        },
        session,
      );
      if (!updated) {
        throw new AppError(
          409,
          'CONCURRENT_MODIFICATION',
          'Module was modified by another request',
        );
      }
      const audit = await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'MODULE_STATUS_CHANGED',
          resourceId: moduleId,
          requestId,
          oldValue: toModuleAuditValue(module),
          newValue: toModuleAuditValue(updated),
          metadata: { courseId: scope.courseId },
        },
        session,
      );
      return { module: toTeacherModuleDto(updated, actor), auditId: audit._id.toString() };
    });
  }

  async archive(
    actor: AuthenticatedUser,
    moduleId: string,
    input: ArchiveModuleInput,
    requestId: string,
  ): Promise<void> {
    const { module, scope } = await this.requireTeacherModule(actor, moduleId);
    assertMutableCourseScope(scope);
    assertContentTransition('MODULE', module.status, 'ARCHIVED');
    const expectedUpdatedAt = expectedDate(module.updatedAt, input.expectedUpdatedAt);
    const actorId = objectId(actor.id);
    const archivedAt = this.now();

    await withMongoTransaction(async (session) => {
      const course = await this.courses.findById(module.courseId, session);
      if (!course || course.status === 'ARCHIVED') {
        throw new AppError(409, 'CONTENT_STATE_CONFLICT', 'Course cannot be changed');
      }
      const childCount = await this.lessons.countNonArchivedByModule(module._id, session);
      if ((module.status === 'PUBLISHED' || childCount > 0) && !input.reason) {
        throw new AppError(422, 'VALIDATION_ERROR', 'Archive reason is required for this Module', [
          {
            field: 'reason',
            code: 'REQUIRED',
            message: 'Reason is required for a published or non-empty Module',
          },
        ]);
      }
      const archived = await this.modules.archiveCas(
        { moduleId: module._id, expectedUpdatedAt, actorId, archivedAt },
        session,
      );
      if (!archived) {
        throw new AppError(
          409,
          'CONCURRENT_MODIFICATION',
          'Module was modified by another request',
        );
      }
      const revisedCourse = await this.courses.incrementStructureRevisionCas(
        module.courseId,
        course.structureRevision,
        actorId,
        session,
      );
      if (!revisedCourse) {
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Course structure changed');
      }
      await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'MODULE_ARCHIVED',
          resourceId: moduleId,
          requestId,
          reason: input.reason,
          oldValue: toModuleAuditValue(module),
          newValue: toModuleAuditValue(archived),
          metadata: {
            courseId: scope.courseId,
            fromStructureRevision: course.structureRevision,
            toStructureRevision: revisedCourse.structureRevision,
          },
        },
        session,
      );
      return true;
    });
  }

  async reorder(
    actor: AuthenticatedUser,
    courseId: string,
    input: ReorderModulesInput,
    requestId: string,
  ) {
    assertTeacher(actor);
    const scope = await this.courseScopes.requireTeacherManage(actor.id, courseId);
    assertMutableCourseScope(scope);
    const courseObjectId = objectId(courseId);
    const actorId = objectId(actor.id);

    return withMongoTransaction(async (session) => {
      const course = await this.courses.findById(courseObjectId, session);
      if (!course || course.structureRevision !== input.expectedStructureRevision) {
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Course structure changed');
      }
      const activeModules = await this.modules.listByCourse(courseObjectId, session);
      const assignments = assignExactOrder(
        activeModules.map((module) => module._id.toString()),
        input.orderedModuleIds,
      );
      await this.modules.reorder(
        courseObjectId,
        assignments.map((assignment) => ({
          moduleId: objectId(assignment.id),
          displayOrder: assignment.displayOrder,
        })),
        actorId,
        session,
      );
      const revisedCourse = await this.courses.incrementStructureRevisionCas(
        courseObjectId,
        input.expectedStructureRevision,
        actorId,
        session,
      );
      if (!revisedCourse) {
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Course structure changed');
      }
      const reordered = await this.modules.listByCourse(courseObjectId, session);
      const audit = await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'MODULES_REORDERED',
          resourceId: courseId,
          requestId,
          oldValue: { structureRevision: input.expectedStructureRevision },
          newValue: { structureRevision: revisedCourse.structureRevision },
          metadata: {
            courseId,
            moduleCount: reordered.length,
            fromStructureRevision: input.expectedStructureRevision,
            toStructureRevision: revisedCourse.structureRevision,
          },
        },
        session,
      );
      return {
        items: reordered.map((module: CourseModuleProjection) => toTeacherModuleDto(module, actor)),
        structureRevision: revisedCourse.structureRevision,
        auditId: audit._id.toString(),
      };
    });
  }
}
