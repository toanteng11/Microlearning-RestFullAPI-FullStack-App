import { Types } from 'mongoose';

import { withMongoTransaction } from '../../shared/database/unit-of-work.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { PhaseFiveAuditWriter } from '../audit/phase-five-audit.writer.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { CourseRepository } from '../courses/course.repository.js';
import type { CourseScopeReader } from '../learning-content/course-scope.reader.js';
import { assertFutureSchedule } from '../learning-content/content-schedule.policy.js';
import type { CourseModuleRepository } from '../modules/module.repository.js';
import { toStudentQuestionDto } from '../questions/question.dto.js';
import type { QuestionRepository } from '../questions/question.repository.js';
import {
  assertQuizMutable,
  assertQuizPublishPrerequisites,
  assertQuizTransition,
} from './quiz.domain.js';
import { toQuizAuditValue, toTeacherQuizDto, toTeacherQuizListItem } from './quiz.dto.js';
import type { QuizRepository } from './quiz.repository.js';
import type {
  ChangeQuizStatusInput,
  CreateQuizInput,
  QuizListQueryInput,
  UpdateQuizInput,
} from './quiz.schemas.js';

function objectId(value: string, label: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value))
    throw new AppError(404, 'RESOURCE_NOT_FOUND', `${label} was not found`);
  return new Types.ObjectId(value);
}

function assertTeacher(actor: AuthenticatedUser): void {
  if (actor.role !== 'TEACHER') throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
}

function assertMutableScope(
  scope: Awaited<ReturnType<CourseScopeReader['requireTeacherManage']>>,
): void {
  if (scope.classroomStatus !== 'ACTIVE')
    throw new AppError(409, 'CLASSROOM_NOT_ACTIVE', 'Classroom does not allow assessment mutation');
  if (scope.status === 'ARCHIVED')
    throw new AppError(409, 'CONTENT_STATE_CONFLICT', 'Archived Course is read-only');
}

function assertQuizWindow(availableFrom: Date | null, dueDate: Date, now: Date): void {
  if (dueDate <= now)
    throw new AppError(422, 'VALIDATION_ERROR', 'Quiz due date must be in the future', [
      {
        field: 'dueDate',
        code: 'FUTURE_DATE_REQUIRED',
        message: 'Quiz due date must be in the future',
      },
    ]);
  if (availableFrom && availableFrom >= dueDate)
    throw new AppError(422, 'VALIDATION_ERROR', 'Quiz availability window is invalid', [
      {
        field: 'availableFrom',
        code: 'INVALID_TIME_WINDOW',
        message: 'availableFrom must be before dueDate',
      },
    ]);
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

export class QuizService {
  constructor(
    private readonly courses: CourseRepository,
    private readonly modules: CourseModuleRepository,
    private readonly quizzes: QuizRepository,
    private readonly questions: QuestionRepository,
    private readonly scopes: CourseScopeReader,
    private readonly audits: PhaseFiveAuditWriter,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async requireTeacherQuiz(actor: AuthenticatedUser, quizId: string) {
    assertTeacher(actor);
    const quiz = await this.quizzes.findById(objectId(quizId, 'Quiz'));
    if (!quiz) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Quiz was not found');
    const scope = await this.scopes.requireTeacherManage(actor.id, quiz.courseId.toString());
    return { quiz, scope };
  }

  async create(
    actor: AuthenticatedUser,
    courseId: string,
    input: CreateQuizInput,
    requestId: string,
  ) {
    assertTeacher(actor);
    const scope = await this.scopes.requireTeacherManage(actor.id, courseId);
    assertMutableScope(scope);
    const courseObjectId = objectId(courseId, 'Course');
    const actorId = objectId(actor.id, 'User');
    const moduleId = input.moduleId ? objectId(input.moduleId, 'Module') : null;
    const availableFrom = input.availableFrom ? new Date(input.availableFrom) : null;
    const dueDate = new Date(input.dueDate);
    assertQuizWindow(availableFrom, dueDate, this.now());

    return withMongoTransaction(async (session) => {
      const course = await this.courses.findById(courseObjectId, session);
      if (!course || course.status === 'ARCHIVED')
        throw new AppError(409, 'CONTENT_STATE_CONFLICT', 'Course cannot accept a Quiz');
      if (moduleId) {
        const module = await this.modules.findById(moduleId, session);
        if (!module || !module.courseId.equals(courseObjectId) || module.status === 'ARCHIVED')
          throw new AppError(422, 'INVALID_PARENT_REFERENCE', 'Module does not belong to Course');
      }
      const quiz = await this.quizzes.create(
        {
          classroomId: objectId(scope.classroomId, 'Classroom'),
          courseId: courseObjectId,
          moduleId,
          title: input.title,
          instruction: input.instruction,
          isRequired: input.isRequired,
          availableFrom,
          dueDate,
          attemptLimit: input.attemptLimit,
          timeLimitMinutes: input.timeLimitMinutes,
          resultReleasePolicy: input.resultReleasePolicy,
          scorePolicy: input.scorePolicy,
          displayOrder: await this.quizzes.nextDisplayOrder(courseObjectId, moduleId, session),
          createdBy: actorId,
          updatedBy: actorId,
        },
        session,
      );
      const audit = await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'QUIZ_CREATED',
          resourceId: quiz._id.toString(),
          requestId,
          newValue: toQuizAuditValue(quiz),
          metadata: { classroomId: scope.classroomId, courseId },
        },
        session,
      );
      return { quiz: toTeacherQuizDto(quiz, actor, this.now()), auditId: audit._id.toString() };
    });
  }

  async list(actor: AuthenticatedUser, courseId: string, query: QuizListQueryInput) {
    assertTeacher(actor);
    await this.scopes.requireTeacherManage(actor.id, courseId);
    const result = await this.quizzes.listByCourse(objectId(courseId, 'Course'), query);
    return {
      data: { items: result.items.map((quiz) => toTeacherQuizListItem(quiz, actor, this.now())) },
      meta: paginationMeta(result.page, result.limit, result.totalItems),
    };
  }

  async getTeacherDetail(actor: AuthenticatedUser, quizId: string) {
    const { quiz } = await this.requireTeacherQuiz(actor, quizId);
    return toTeacherQuizDto(quiz, actor, this.now());
  }

  async update(
    actor: AuthenticatedUser,
    quizId: string,
    input: UpdateQuizInput,
    requestId: string,
  ) {
    const { quiz, scope } = await this.requireTeacherQuiz(actor, quizId);
    assertMutableScope(scope);
    assertQuizMutable(quiz);
    const availableFrom =
      input.availableFrom === undefined
        ? quiz.availableFrom
        : input.availableFrom
          ? new Date(input.availableFrom)
          : null;
    const dueDate = input.dueDate ? new Date(input.dueDate) : quiz.dueDate;
    assertQuizWindow(availableFrom, dueDate, this.now());
    const actorId = objectId(actor.id, 'User');
    const moduleId =
      input.moduleId === undefined
        ? undefined
        : input.moduleId
          ? objectId(input.moduleId, 'Module')
          : null;

    return withMongoTransaction(async (session) => {
      if (moduleId) {
        const module = await this.modules.findById(moduleId, session);
        if (!module || !module.courseId.equals(quiz.courseId) || module.status === 'ARCHIVED')
          throw new AppError(422, 'INVALID_PARENT_REFERENCE', 'Module does not belong to Course');
      }
      const updated = await this.quizzes.updateMetadataCas(
        {
          quizId: quiz._id,
          expectedContentRevision: input.expectedContentRevision,
          actorId,
          patch: {
            ...(moduleId !== undefined ? { moduleId } : {}),
            ...(input.title !== undefined ? { title: input.title } : {}),
            ...(input.instruction !== undefined ? { instruction: input.instruction } : {}),
            ...(input.isRequired !== undefined ? { isRequired: input.isRequired } : {}),
            ...(input.availableFrom !== undefined ? { availableFrom } : {}),
            ...(input.dueDate !== undefined ? { dueDate } : {}),
            ...(input.attemptLimit !== undefined ? { attemptLimit: input.attemptLimit } : {}),
            ...(input.timeLimitMinutes !== undefined
              ? { timeLimitMinutes: input.timeLimitMinutes }
              : {}),
            ...(input.resultReleasePolicy !== undefined
              ? { resultReleasePolicy: input.resultReleasePolicy }
              : {}),
            ...(input.scorePolicy !== undefined ? { scorePolicy: input.scorePolicy } : {}),
          },
        },
        session,
      );
      if (!updated)
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Quiz was modified by another request');
      const audit = await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'QUIZ_UPDATED',
          resourceId: quizId,
          requestId,
          oldValue: toQuizAuditValue(quiz),
          newValue: toQuizAuditValue(updated),
          metadata: {
            classroomId: scope.classroomId,
            courseId: scope.courseId,
            fromContentRevision: quiz.contentRevision,
            toContentRevision: updated.contentRevision,
          },
        },
        session,
      );
      return { quiz: toTeacherQuizDto(updated, actor, this.now()), auditId: audit._id.toString() };
    });
  }

  async changeStatus(
    actor: AuthenticatedUser,
    quizId: string,
    input: ChangeQuizStatusInput,
    requestId: string,
  ) {
    const { quiz, scope } = await this.requireTeacherQuiz(actor, quizId);
    assertMutableScope(scope);
    assertQuizTransition(quiz.status, input.status);
    const changedAt = this.now();
    const scheduledPublishAt = input.scheduledPublishAt ? new Date(input.scheduledPublishAt) : null;
    if (input.status === 'SCHEDULED') assertFutureSchedule(scheduledPublishAt, changedAt);
    const actorId = objectId(actor.id, 'User');

    return withMongoTransaction(async (session) => {
      if (input.status === 'PUBLISHED' || input.status === 'SCHEDULED') {
        const aggregate = await this.questions.aggregateActive(quiz._id, session);
        assertQuizPublishPrerequisites(quiz, aggregate, changedAt);
      }
      const updated = await this.quizzes.changeStatusCas(
        {
          quizId: quiz._id,
          expectedContentRevision: input.expectedContentRevision,
          expectedQuestionRevision: input.expectedQuestionRevision,
          actorId,
          patch: {
            status: input.status,
            scheduledPublishAt,
            ...(input.status === 'PUBLISHED'
              ? { publishedAt: changedAt, publishedRevision: quiz.contentRevision }
              : {}),
            ...(input.status === 'SCHEDULED' ? { publishedRevision: quiz.contentRevision } : {}),
            ...(input.status === 'UNPUBLISHED' ? { unpublishedAt: changedAt } : {}),
            ...(input.status === 'ARCHIVED' ? { archivedAt: changedAt } : {}),
          },
        },
        session,
      );
      if (!updated)
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Quiz was modified by another request');
      const audit = await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'QUIZ_STATUS_CHANGED',
          resourceId: quizId,
          requestId,
          reason: input.reason,
          oldValue: toQuizAuditValue(quiz),
          newValue: toQuizAuditValue(updated),
          metadata: { classroomId: scope.classroomId, courseId: scope.courseId },
        },
        session,
      );
      return { quiz: toTeacherQuizDto(updated, actor, changedAt), auditId: audit._id.toString() };
    });
  }

  async preview(actor: AuthenticatedUser, quizId: string) {
    const { quiz } = await this.requireTeacherQuiz(actor, quizId);
    const questions = await this.questions.listActiveByQuiz(quiz._id);
    return {
      quiz: toTeacherQuizDto(quiz, actor, this.now()),
      questions: questions.map(toStudentQuestionDto),
    };
  }
}
