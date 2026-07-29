import { Types } from 'mongoose';

import type { AssessmentFeatureFlagConfig } from '../../shared/config/environment.js';
import { withMongoTransaction } from '../../shared/database/unit-of-work.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { PhaseFiveAuditWriter } from '../audit/phase-five-audit.writer.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { CourseRepository } from '../courses/course.repository.js';
import type { CourseScopeReader } from '../learning-content/course-scope.reader.js';
import type { ReportingInvalidationWriter } from '../learning-content/reporting-invalidation.writer.js';
import type { DeadlineExceptionRepository } from '../deadline-exceptions/deadline-exception.repository.js';
import { resolveEffectiveDeadline } from '../deadline-exceptions/effective-deadline.resolver.js';
import type { CourseModuleRepository } from '../modules/module.repository.js';
import {
  assertAssignmentMutable,
  assertAssignmentPublishPrerequisites,
  assertAssignmentTransition,
  assertAssignmentWindow,
  assertSubmissionMethods,
} from './assignment.domain.js';
import {
  toAssignmentAuditValue,
  toStudentAssignmentDto,
  toTeacherAssignmentDto,
  toTeacherAssignmentListItem,
} from './assignment.dto.js';
import type { AssignmentRepository } from './assignment.repository.js';
import type {
  AssignmentListQueryInput,
  ChangeAssignmentStatusInput,
  CreateAssignmentInput,
  UpdateAssignmentInput,
} from './assignment.schemas.js';

function objectId(value: string, label: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value))
    throw new AppError(404, 'RESOURCE_NOT_FOUND', `${label} was not found`);
  return new Types.ObjectId(value);
}

function assertTeacher(actor: AuthenticatedUser): void {
  if (actor.role !== 'TEACHER') throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
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

export class AssignmentService {
  constructor(
    private readonly courses: CourseRepository,
    private readonly modules: CourseModuleRepository,
    private readonly assignments: AssignmentRepository,
    private readonly scopes: CourseScopeReader,
    private readonly audits: PhaseFiveAuditWriter,
    private readonly features: AssessmentFeatureFlagConfig,
    private readonly deadlineExceptions: DeadlineExceptionRepository,
    private readonly reportingInvalidationWriter: ReportingInvalidationWriter,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async requireTeacherAssignment(actor: AuthenticatedUser, assignmentId: string) {
    assertTeacher(actor);
    const assignment = await this.assignments.findById(objectId(assignmentId, 'Assignment'));
    if (!assignment) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Assignment was not found');
    const scope = await this.scopes.requireTeacherManage(actor.id, assignment.courseId.toString());
    return { assignment, scope };
  }

  async create(
    actor: AuthenticatedUser,
    courseId: string,
    input: CreateAssignmentInput,
    requestId: string,
  ) {
    assertTeacher(actor);
    const scope = await this.scopes.requireTeacherManage(actor.id, courseId);
    if (scope.classroomStatus !== 'ACTIVE' || scope.status === 'ARCHIVED')
      throw new AppError(409, 'CONTENT_STATE_CONFLICT', 'Course cannot accept an Assignment');
    assertSubmissionMethods(input.allowedSubmissionTypes, this.features);
    const availableFrom = input.availableFrom ? new Date(input.availableFrom) : null;
    const dueDate = new Date(input.dueDate);
    assertAssignmentWindow(availableFrom, dueDate, this.now());
    const courseObjectId = objectId(courseId, 'Course');
    const moduleId = input.moduleId ? objectId(input.moduleId, 'Module') : null;
    const actorId = objectId(actor.id, 'User');

    return withMongoTransaction(async (session) => {
      const course = await this.courses.findById(courseObjectId, session);
      if (!course || course.status === 'ARCHIVED')
        throw new AppError(409, 'CONTENT_STATE_CONFLICT', 'Course cannot accept an Assignment');
      if (moduleId) {
        const module = await this.modules.findById(moduleId, session);
        if (!module || !module.courseId.equals(courseObjectId) || module.status === 'ARCHIVED')
          throw new AppError(422, 'INVALID_PARENT_REFERENCE', 'Module does not belong to Course');
      }
      const assignment = await this.assignments.create(
        {
          classroomId: objectId(scope.classroomId, 'Classroom'),
          courseId: courseObjectId,
          moduleId,
          title: input.title,
          instruction: input.instruction,
          maxScore: input.maxScore,
          isRequired: input.isRequired,
          allowedSubmissionTypes: input.allowedSubmissionTypes,
          allowLateSubmission: input.allowLateSubmission,
          allowUnsubmit: input.allowUnsubmit,
          allowResubmit: input.allowResubmit,
          availableFrom,
          dueDate,
          displayOrder: await this.assignments.nextDisplayOrder(courseObjectId, moduleId, session),
          createdBy: actorId,
          updatedBy: actorId,
        },
        session,
      );
      const audit = await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'ASSIGNMENT_CREATED',
          resourceId: assignment._id.toString(),
          requestId,
          newValue: toAssignmentAuditValue(assignment),
          metadata: { classroomId: scope.classroomId, courseId },
        },
        session,
      );
      await this.reportingInvalidationWriter.invalidateCourse(
        {
          classroomId: objectId(scope.classroomId, 'Classroom'),
          courseId: courseObjectId,
          reasons: ['ACTIVITY_CHANGED'],
          sourceChangedAt: assignment.updatedAt,
        },
        session,
      );
      return {
        assignment: toTeacherAssignmentDto(assignment, actor, this.now()),
        auditId: audit._id.toString(),
      };
    });
  }

  async list(actor: AuthenticatedUser, courseId: string, query: AssignmentListQueryInput) {
    assertTeacher(actor);
    await this.scopes.requireTeacherManage(actor.id, courseId);
    const result = await this.assignments.listByCourse(objectId(courseId, 'Course'), query);
    return {
      data: {
        items: result.items.map((assignment) =>
          toTeacherAssignmentListItem(assignment, actor, this.now()),
        ),
      },
      meta: paginationMeta(result.page, result.limit, result.totalItems),
    };
  }

  async getTeacher(actor: AuthenticatedUser, assignmentId: string) {
    const { assignment } = await this.requireTeacherAssignment(actor, assignmentId);
    return toTeacherAssignmentDto(assignment, actor, this.now());
  }

  async update(
    actor: AuthenticatedUser,
    assignmentId: string,
    input: UpdateAssignmentInput,
    requestId: string,
  ) {
    const { assignment, scope } = await this.requireTeacherAssignment(actor, assignmentId);
    assertAssignmentMutable(assignment.status);
    const methods = input.allowedSubmissionTypes ?? assignment.allowedSubmissionTypes;
    assertSubmissionMethods(methods, this.features);
    const availableFrom =
      input.availableFrom === undefined
        ? assignment.availableFrom
        : input.availableFrom
          ? new Date(input.availableFrom)
          : null;
    const dueDate = input.dueDate ? new Date(input.dueDate) : assignment.dueDate;
    assertAssignmentWindow(availableFrom, dueDate, this.now());
    const moduleId =
      input.moduleId === undefined
        ? undefined
        : input.moduleId
          ? objectId(input.moduleId, 'Module')
          : null;
    const actorId = objectId(actor.id, 'User');
    return withMongoTransaction(async (session) => {
      if (moduleId) {
        const module = await this.modules.findById(moduleId, session);
        if (!module || !module.courseId.equals(assignment.courseId) || module.status === 'ARCHIVED')
          throw new AppError(422, 'INVALID_PARENT_REFERENCE', 'Module does not belong to Course');
      }
      const updated = await this.assignments.updateCas(
        assignment._id,
        input.expectedContentRevision,
        actorId,
        {
          ...(moduleId !== undefined ? { moduleId } : {}),
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.instruction !== undefined ? { instruction: input.instruction } : {}),
          ...(input.maxScore !== undefined ? { maxScore: input.maxScore } : {}),
          ...(input.isRequired !== undefined ? { isRequired: input.isRequired } : {}),
          ...(input.allowedSubmissionTypes !== undefined
            ? { allowedSubmissionTypes: methods }
            : {}),
          ...(input.allowLateSubmission !== undefined
            ? { allowLateSubmission: input.allowLateSubmission }
            : {}),
          ...(input.allowUnsubmit !== undefined ? { allowUnsubmit: input.allowUnsubmit } : {}),
          ...(input.allowResubmit !== undefined ? { allowResubmit: input.allowResubmit } : {}),
          ...(input.availableFrom !== undefined ? { availableFrom } : {}),
          ...(input.dueDate !== undefined ? { dueDate } : {}),
        },
        session,
      );
      if (!updated)
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Assignment was modified elsewhere');
      const audit = await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'ASSIGNMENT_UPDATED',
          resourceId: assignmentId,
          requestId,
          oldValue: toAssignmentAuditValue(assignment),
          newValue: toAssignmentAuditValue(updated),
          metadata: {
            classroomId: scope.classroomId,
            courseId: scope.courseId,
            fromContentRevision: assignment.contentRevision,
            toContentRevision: updated.contentRevision,
          },
        },
        session,
      );
      await this.reportingInvalidationWriter.invalidateCourse(
        {
          classroomId: objectId(scope.classroomId, 'Classroom'),
          courseId: assignment.courseId,
          reasons: ['ACTIVITY_CHANGED'],
          sourceChangedAt: updated.updatedAt,
        },
        session,
      );
      return {
        assignment: toTeacherAssignmentDto(updated, actor, this.now()),
        auditId: audit._id.toString(),
      };
    });
  }

  async changeStatus(
    actor: AuthenticatedUser,
    assignmentId: string,
    input: ChangeAssignmentStatusInput,
    requestId: string,
  ) {
    const { assignment, scope } = await this.requireTeacherAssignment(actor, assignmentId);
    assertAssignmentTransition(assignment.status, input.status);
    const changedAt = this.now();
    if (input.status === 'PUBLISHED' || input.status === 'SCHEDULED')
      assertAssignmentPublishPrerequisites(assignment, this.features, changedAt);
    const scheduledPublishAt = input.scheduledPublishAt ? new Date(input.scheduledPublishAt) : null;
    if (scheduledPublishAt && scheduledPublishAt <= changedAt)
      throw new AppError(422, 'VALIDATION_ERROR', 'Schedule time must be in the future');
    const actorId = objectId(actor.id, 'User');
    const updated = await withMongoTransaction(async (session) => {
      const result = await this.assignments.changeStatusCas(
        assignment._id,
        input.expectedContentRevision,
        actorId,
        {
          status: input.status,
          scheduledPublishAt,
          ...(input.status === 'PUBLISHED'
            ? { publishedAt: changedAt, publishedRevision: assignment.contentRevision + 1 }
            : {}),
          ...(input.status === 'UNPUBLISHED' ? { unpublishedAt: changedAt } : {}),
          ...(input.status === 'CLOSED' ? { closedAt: changedAt } : {}),
          ...(input.status === 'ARCHIVED' ? { archivedAt: changedAt } : {}),
        },
        session,
      );
      if (!result)
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Assignment was modified elsewhere');
      await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'ASSIGNMENT_STATUS_CHANGED',
          resourceId: assignmentId,
          requestId,
          reason: input.reason,
          oldValue: toAssignmentAuditValue(assignment),
          newValue: toAssignmentAuditValue(result),
          metadata: {
            classroomId: scope.classroomId,
            courseId: scope.courseId,
            fromContentRevision: assignment.contentRevision,
            toContentRevision: result.contentRevision,
          },
        },
        session,
      );
      await this.reportingInvalidationWriter.invalidateCourse(
        {
          classroomId: objectId(scope.classroomId, 'Classroom'),
          courseId: assignment.courseId,
          reasons: ['ACTIVITY_CHANGED'],
          sourceChangedAt: result.updatedAt,
        },
        session,
      );
      return result;
    });
    return { assignment: toTeacherAssignmentDto(updated, actor, this.now()) };
  }

  async preview(actor: AuthenticatedUser, assignmentId: string) {
    const { assignment } = await this.requireTeacherAssignment(actor, assignmentId);
    return toStudentAssignmentDto(assignment, this.now());
  }

  async getStudent(actor: AuthenticatedUser, assignmentId: string) {
    assertStudent(actor);
    const assignment = await this.assignments.findById(objectId(assignmentId, 'Assignment'));
    if (!assignment) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Assignment was not found');
    await this.scopes.requireStudentView(actor.id, assignment.courseId.toString());
    const status =
      assignment.status === 'SCHEDULED' &&
      assignment.scheduledPublishAt &&
      assignment.scheduledPublishAt <= this.now()
        ? 'PUBLISHED'
        : assignment.status;
    if (
      status !== 'PUBLISHED' ||
      (assignment.availableFrom && this.now() < assignment.availableFrom)
    )
      throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Assignment was not found');
    const deadline = resolveEffectiveDeadline(
      assignment.dueDate,
      await this.deadlineExceptions.findCurrent(
        objectId(actor.id, 'Student'),
        'ASSIGNMENT',
        assignment._id,
      ),
    );
    return toStudentAssignmentDto(assignment, this.now(), {
      effectiveDeadline: deadline.effectiveDeadline,
      hasDeadlineException: deadline.source === 'STUDENT_EXCEPTION',
    });
  }
}
