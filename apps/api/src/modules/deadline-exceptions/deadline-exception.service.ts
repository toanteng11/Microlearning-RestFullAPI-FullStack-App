import { Types } from 'mongoose';

import { withMongoTransaction } from '../../shared/database/unit-of-work.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { AssignmentRepository } from '../assignments/assignment.repository.js';
import type { PhaseFiveAuditWriter } from '../audit/phase-five-audit.writer.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { EnrollmentRepository } from '../enrollments/enrollment.repository.js';
import type { AssessmentScopeReader } from '../learning-content/assessment-scope.reader.js';
import type { LearningActivityType } from '../learning-content/learning-activity.reader.js';
import type { LessonRepository } from '../lessons/lesson.repository.js';
import type { QuizRepository } from '../quizzes/quiz.repository.js';
import { UserModel } from '../users/user.model.js';
import { toTeacherDeadlineExceptionDto } from './deadline-exception.dto.js';
import type { DeadlineExceptionRecord } from './deadline-exception.model.js';
import {
  assertDeadlineExceptionRevision,
  assertExtensionAllowed,
  assertRevokeAllowed,
} from './deadline-exception.policy.js';
import type { DeadlineExceptionRepository } from './deadline-exception.repository.js';
import type {
  DeadlineExceptionListQueryInput,
  RevokeDeadlineExceptionInput,
  SetDeadlineExceptionInput,
} from './deadline-exception.schemas.js';

function objectId(value: string, label: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value))
    throw new AppError(404, 'RESOURCE_NOT_FOUND', `${label} was not found`);
  return new Types.ObjectId(value);
}

function assertTeacher(actor: AuthenticatedUser): void {
  if (actor.role !== 'TEACHER') throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
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

function isDuplicateKey(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

export function canonicalActivityType(
  value: 'lessons' | 'quizzes' | 'assignments',
): LearningActivityType {
  return value === 'lessons' ? 'LESSON' : value === 'quizzes' ? 'QUIZ' : 'ASSIGNMENT';
}

interface ActivityDeadlineScope {
  activityType: LearningActivityType;
  activityId: Types.ObjectId;
  classroomId: Types.ObjectId;
  courseId: Types.ObjectId;
  defaultDeadline: Date;
}

export class DeadlineExceptionService {
  constructor(
    private readonly exceptions: DeadlineExceptionRepository,
    private readonly lessons: LessonRepository,
    private readonly quizzes: QuizRepository,
    private readonly assignments: AssignmentRepository,
    private readonly enrollments: EnrollmentRepository,
    private readonly scopes: AssessmentScopeReader,
    private readonly audits: PhaseFiveAuditWriter,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async requireActivity(
    actor: AuthenticatedUser,
    activityType: LearningActivityType,
    activityId: string,
  ): Promise<ActivityDeadlineScope> {
    assertTeacher(actor);
    const id = objectId(activityId, 'Activity');
    if (activityType === 'LESSON') {
      const lesson = await this.lessons.findAuthoringById(id);
      if (!lesson) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Activity was not found');
      if (lesson.status === 'ARCHIVED')
        throw new AppError(409, 'ACTIVITY_ARCHIVED', 'Archived activity cannot be changed');
      if (!lesson.completionDeadline)
        throw new AppError(409, 'INVALID_DEADLINE', 'Lesson has no default deadline');
      const scope = await this.scopes.requireTeacherManage(actor.id, lesson.courseId.toString());
      return {
        activityType,
        activityId: id,
        classroomId: objectId(scope.classroomId, 'Classroom'),
        courseId: lesson.courseId,
        defaultDeadline: lesson.completionDeadline,
      };
    }
    if (activityType === 'QUIZ') {
      const quiz = await this.quizzes.findById(id);
      if (!quiz) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Activity was not found');
      if (quiz.status === 'ARCHIVED')
        throw new AppError(409, 'ACTIVITY_ARCHIVED', 'Archived activity cannot be changed');
      await this.scopes.requireTeacherManage(actor.id, quiz.courseId.toString());
      return {
        activityType,
        activityId: id,
        classroomId: quiz.classroomId,
        courseId: quiz.courseId,
        defaultDeadline: quiz.dueDate,
      };
    }
    const assignment = await this.assignments.findById(id);
    if (!assignment) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Activity was not found');
    if (assignment.status === 'ARCHIVED')
      throw new AppError(409, 'ACTIVITY_ARCHIVED', 'Archived activity cannot be changed');
    await this.scopes.requireTeacherManage(actor.id, assignment.courseId.toString());
    return {
      activityType,
      activityId: id,
      classroomId: assignment.classroomId,
      courseId: assignment.courseId,
      defaultDeadline: assignment.dueDate,
    };
  }

  private async requireActiveStudent(scope: ActivityDeadlineScope, studentId: string) {
    const id = objectId(studentId, 'Student');
    const enrollment = await this.enrollments.findActiveMembership(scope.classroomId, id);
    if (!enrollment)
      throw new AppError(
        409,
        'STUDENT_NOT_ACTIVE_IN_CLASSROOM',
        'Student is not active in this classroom',
      );
    return id;
  }

  async list(
    actor: AuthenticatedUser,
    activityType: LearningActivityType,
    activityId: string,
    query: DeadlineExceptionListQueryInput,
  ) {
    const scope = await this.requireActivity(actor, activityType, activityId);
    const result = await this.exceptions.listByActivity(
      scope.activityType,
      scope.activityId,
      query.page,
      query.limit,
    );
    const students = await UserModel.find({
      _id: { $in: result.items.map((item) => item.studentId) },
    })
      .select({ fullName: 1, email: 1, studentCode: 1 })
      .lean<
        Array<{
          _id: Types.ObjectId;
          fullName: string;
          email: string;
          studentCode?: string | null;
        }>
      >()
      .exec();
    const studentById = new Map(students.map((student) => [student._id.toString(), student]));
    return {
      data: {
        items: result.items.map((item) => ({
          ...toTeacherDeadlineExceptionDto(item, scope.defaultDeadline),
          student: studentById.has(item.studentId.toString())
            ? {
                id: item.studentId.toString(),
                fullName: studentById.get(item.studentId.toString())!.fullName,
                email: studentById.get(item.studentId.toString())!.email,
                studentCode: studentById.get(item.studentId.toString())!.studentCode ?? null,
              }
            : null,
        })),
      },
      meta: paginationMeta(result.page, result.limit, result.totalItems),
    };
  }

  async set(
    actor: AuthenticatedUser,
    activityType: LearningActivityType,
    activityId: string,
    studentId: string,
    input: SetDeadlineExceptionInput,
    requestId: string,
  ) {
    const scope = await this.requireActivity(actor, activityType, activityId);
    const studentObjectId = await this.requireActiveStudent(scope, studentId);
    const current = await this.exceptions.findCurrent(
      studentObjectId,
      scope.activityType,
      scope.activityId,
    );
    assertDeadlineExceptionRevision(current, input.expectedRevision);
    const deadline = new Date(input.deadline);
    const effective = current?.active ? current.deadline : scope.defaultDeadline;
    assertExtensionAllowed(deadline, effective, this.now());
    const changedAt = this.now();

    try {
      return await withMongoTransaction(async (session) => {
        let record: DeadlineExceptionRecord;
        if (!current) {
          record = await this.exceptions.create(
            {
              studentId: studentObjectId,
              classroomId: scope.classroomId,
              courseId: scope.courseId,
              activityType: scope.activityType,
              activityId: scope.activityId,
              deadline,
              reason: input.reason,
              defaultDeadlineSnapshot: scope.defaultDeadline,
              changedBy: objectId(actor.id, 'Teacher'),
              changedAt,
            },
            session,
          );
        } else {
          const updated = await this.exceptions.updateCas(
            current._id,
            input.expectedRevision,
            {
              deadline,
              active: true,
              reason: input.reason,
              changedBy: objectId(actor.id, 'Teacher'),
              changedAt,
            },
            session,
          );
          if (!updated)
            throw new AppError(
              409,
              'CONCURRENT_MODIFICATION',
              'Deadline exception was modified elsewhere',
            );
          record = updated;
        }
        await this.exceptions.appendHistory(
          {
            deadlineExceptionId: record._id,
            studentId: record.studentId,
            activityType: record.activityType,
            activityId: record.activityId,
            fromDeadline: current?.active ? current.deadline : scope.defaultDeadline,
            toDeadline: record.deadline,
            fromRevision: current?.revision ?? 0,
            toRevision: record.revision,
            action: 'SET',
            reason: input.reason,
            actorId: objectId(actor.id, 'Teacher'),
            actorRole: actor.role,
            requestId,
          },
          session,
        );
        const audit = await this.audits.append(
          {
            actorId: objectId(actor.id, 'Teacher'),
            actorRole: actor.role,
            action: 'DEADLINE_EXCEPTION_SET',
            resourceId: record._id.toString(),
            requestId,
            reason: input.reason,
            oldValue: current
              ? {
                  deadline: current.deadline.toISOString(),
                  active: current.active,
                  exceptionRevision: current.revision,
                }
              : null,
            newValue: {
              deadline: record.deadline.toISOString(),
              active: true,
              exceptionRevision: record.revision,
            },
            metadata: {
              classroomId: record.classroomId.toString(),
              courseId: record.courseId.toString(),
              studentId: record.studentId.toString(),
              activityId: record.activityId.toString(),
              activityType: record.activityType,
            },
          },
          session,
        );
        return {
          exception: toTeacherDeadlineExceptionDto(record, scope.defaultDeadline),
          auditId: audit._id.toString(),
        };
      });
    } catch (error) {
      if (isDuplicateKey(error))
        throw new AppError(
          409,
          'CONCURRENT_MODIFICATION',
          'Deadline exception was created concurrently',
        );
      throw error;
    }
  }

  async revoke(
    actor: AuthenticatedUser,
    activityType: LearningActivityType,
    activityId: string,
    studentId: string,
    input: RevokeDeadlineExceptionInput,
    requestId: string,
  ) {
    const scope = await this.requireActivity(actor, activityType, activityId);
    const studentObjectId = await this.requireActiveStudent(scope, studentId);
    const current = await this.exceptions.findCurrent(
      studentObjectId,
      scope.activityType,
      scope.activityId,
    );
    if (!current?.active)
      throw new AppError(409, 'DEADLINE_EXCEPTION_NOT_ALLOWED', 'No active exception to revoke');
    assertDeadlineExceptionRevision(current, input.expectedRevision);
    assertRevokeAllowed(scope.defaultDeadline, this.now());
    const changedAt = this.now();
    return withMongoTransaction(async (session) => {
      const record = await this.exceptions.updateCas(
        current._id,
        input.expectedRevision,
        {
          deadline: current.deadline,
          active: false,
          reason: input.reason,
          changedBy: objectId(actor.id, 'Teacher'),
          changedAt,
        },
        session,
      );
      if (!record)
        throw new AppError(
          409,
          'CONCURRENT_MODIFICATION',
          'Deadline exception was modified elsewhere',
        );
      await this.exceptions.appendHistory(
        {
          deadlineExceptionId: record._id,
          studentId: record.studentId,
          activityType: record.activityType,
          activityId: record.activityId,
          fromDeadline: current.deadline,
          toDeadline: scope.defaultDeadline,
          fromRevision: current.revision,
          toRevision: record.revision,
          action: 'REVOKED',
          reason: input.reason,
          actorId: objectId(actor.id, 'Teacher'),
          actorRole: actor.role,
          requestId,
        },
        session,
      );
      const audit = await this.audits.append(
        {
          actorId: objectId(actor.id, 'Teacher'),
          actorRole: actor.role,
          action: 'DEADLINE_EXCEPTION_REVOKED',
          resourceId: record._id.toString(),
          requestId,
          reason: input.reason,
          oldValue: {
            deadline: current.deadline.toISOString(),
            active: true,
            exceptionRevision: current.revision,
          },
          newValue: {
            deadline: scope.defaultDeadline.toISOString(),
            active: false,
            exceptionRevision: record.revision,
          },
          metadata: {
            classroomId: record.classroomId.toString(),
            courseId: record.courseId.toString(),
            studentId: record.studentId.toString(),
            activityId: record.activityId.toString(),
            activityType: record.activityType,
          },
        },
        session,
      );
      return {
        exception: toTeacherDeadlineExceptionDto(record, scope.defaultDeadline),
        auditId: audit._id.toString(),
      };
    });
  }

  async history(
    actor: AuthenticatedUser,
    activityType: LearningActivityType,
    activityId: string,
    studentId: string,
    query: DeadlineExceptionListQueryInput,
  ) {
    const scope = await this.requireActivity(actor, activityType, activityId);
    const studentObjectId = await this.requireActiveStudent(scope, studentId);
    const result = await this.exceptions.listHistory(
      studentObjectId,
      scope.activityType,
      scope.activityId,
      query.page,
      query.limit,
    );
    return {
      data: {
        items: result.items.map((item) => ({
          id: item._id.toString(),
          revision: item.toRevision,
          action: item.action,
          fromDeadline: item.fromDeadline?.toISOString() ?? null,
          toDeadline: item.toDeadline?.toISOString() ?? null,
          reason: item.reason,
          actorRole: item.actorRole,
          createdAt: item.createdAt.toISOString(),
        })),
      },
      meta: paginationMeta(result.page, result.limit, result.totalItems),
    };
  }
}
