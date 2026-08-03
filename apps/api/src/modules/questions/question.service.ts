import { Types, type ClientSession } from 'mongoose';

import type { AssessmentFeatureFlagConfig } from '../../shared/config/environment.js';
import { withMongoTransaction } from '../../shared/database/unit-of-work.js';
import { AppError } from '../../shared/errors/app-error.js';
import type {
  PhaseFiveAuditAction,
  PhaseFiveAuditWriter,
} from '../audit/phase-five-audit.writer.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { CourseScopeReader } from '../learning-content/course-scope.reader.js';
import type { ReportingInvalidationWriter } from '../learning-content/reporting-invalidation.writer.js';
import { assertQuizMutable } from '../quizzes/quiz.domain.js';
import type { QuizProjection, QuizRepository } from '../quizzes/quiz.repository.js';
import { toQuestionAuditValue, toTeacherQuestionDto } from './question.dto.js';
import {
  buildNewQuestionShape,
  buildQuestionMedia,
  buildQuestionPatch,
  type OptionIdFactory,
} from './question.policy.js';
import type { QuestionProjection, QuestionRepository } from './question.repository.js';
import type {
  ArchiveQuestionInput,
  CreateQuestionInput,
  RemoveQuestionMediaInput,
  ReorderQuestionsInput,
  SetQuestionMediaInput,
  UpdateQuestionInput,
} from './question.schemas.js';

function objectId(value: string, label: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value))
    throw new AppError(404, 'RESOURCE_NOT_FOUND', `${label} was not found`);
  return new Types.ObjectId(value);
}

function assertTeacher(actor: AuthenticatedUser): void {
  if (actor.role !== 'TEACHER') throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
}

export class QuestionService {
  constructor(
    private readonly quizzes: QuizRepository,
    private readonly questions: QuestionRepository,
    private readonly scopes: CourseScopeReader,
    private readonly audits: PhaseFiveAuditWriter,
    private readonly features: AssessmentFeatureFlagConfig,
    private readonly reportingInvalidationWriter: ReportingInvalidationWriter,
    private readonly createOptionId?: OptionIdFactory,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async requireTeacherQuiz(actor: AuthenticatedUser, quizId: string) {
    assertTeacher(actor);
    const quiz = await this.quizzes.findById(objectId(quizId, 'Quiz'));
    if (!quiz) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Quiz was not found');
    const scope = await this.scopes.requireTeacherManage(actor.id, quiz.courseId.toString());
    return { quiz, scope };
  }

  private async requireTeacherQuestion(actor: AuthenticatedUser, questionId: string) {
    assertTeacher(actor);
    const question = await this.questions.findById(objectId(questionId, 'Question'));
    if (!question || question.status !== 'ACTIVE')
      throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Question was not found');
    const { quiz, scope } = await this.requireTeacherQuiz(actor, question.quizId.toString());
    return { question, quiz, scope };
  }

  private assertRevision(quiz: QuizProjection, expected: number): void {
    if (quiz.questionRevision !== expected)
      throw new AppError(
        409,
        'CONCURRENT_MODIFICATION',
        'Quiz Questions were modified by another request',
      );
  }

  private async reviseQuiz(
    quiz: QuizProjection,
    expected: number,
    actorId: Types.ObjectId,
    session: Parameters<QuizRepository['incrementQuestionRevisionCas']>[4],
  ) {
    const aggregate = await this.questions.aggregateActive(quiz._id, session);
    const revised = await this.quizzes.incrementQuestionRevisionCas(
      quiz._id,
      expected,
      aggregate.maxScore,
      actorId,
      session,
    );
    if (!revised)
      throw new AppError(
        409,
        'CONCURRENT_MODIFICATION',
        'Quiz Questions were modified by another request',
      );
    return { revised, aggregate };
  }

  private async auditMutation(input: {
    action: PhaseFiveAuditAction;
    actor: AuthenticatedUser;
    resourceId: string;
    requestId: string;
    quiz: QuizProjection;
    oldValue?: QuestionProjection | null;
    newValue?: QuestionProjection | null;
    reason?: string;
    questionCount: number;
    toQuestionRevision: number;
    session: Parameters<QuizRepository['incrementQuestionRevisionCas']>[4];
  }) {
    return this.audits.append(
      {
        actorId: objectId(input.actor.id, 'User'),
        actorRole: input.actor.role,
        action: input.action,
        resourceId: input.resourceId,
        requestId: input.requestId,
        reason: input.reason,
        oldValue: input.oldValue ? toQuestionAuditValue(input.oldValue) : null,
        newValue: input.newValue ? toQuestionAuditValue(input.newValue) : null,
        metadata: {
          courseId: input.quiz.courseId.toString(),
          quizId: input.quiz._id.toString(),
          questionCount: input.questionCount,
          fromQuestionRevision: input.quiz.questionRevision,
          toQuestionRevision: input.toQuestionRevision,
        },
      },
      input.session,
    );
  }

  private invalidateQuiz(quiz: QuizProjection, sourceChangedAt: Date, session: ClientSession) {
    return this.reportingInvalidationWriter.invalidateCourse(
      {
        classroomId: quiz.classroomId,
        courseId: quiz.courseId,
        reasons: ['ACTIVITY_CHANGED'],
        sourceChangedAt,
      },
      session,
    );
  }

  async list(actor: AuthenticatedUser, quizId: string) {
    const { quiz } = await this.requireTeacherQuiz(actor, quizId);
    const items = await this.questions.listActiveByQuiz(quiz._id);
    return {
      items: items.map(toTeacherQuestionDto),
      questionRevision: quiz.questionRevision,
      maxScore: quiz.maxScore,
    };
  }

  async create(
    actor: AuthenticatedUser,
    quizId: string,
    input: CreateQuestionInput,
    requestId: string,
  ) {
    const { quiz } = await this.requireTeacherQuiz(actor, quizId);
    assertQuizMutable(quiz);
    this.assertRevision(quiz, input.expectedQuestionRevision);
    const shape = buildNewQuestionShape(input, this.createOptionId);
    const actorId = objectId(actor.id, 'User');
    return withMongoTransaction(async (session) => {
      const displayOrder = await this.questions.nextDisplayOrder(quiz._id, session);
      const question = await this.questions.create(
        {
          ...shape,
          quizId: quiz._id,
          courseId: quiz.courseId,
          displayOrder,
          createdBy: actorId,
          updatedBy: actorId,
        },
        session,
      );
      const { revised, aggregate } = await this.reviseQuiz(
        quiz,
        input.expectedQuestionRevision,
        actorId,
        session,
      );
      const audit = await this.auditMutation({
        action: 'QUESTION_CREATED',
        actor,
        resourceId: question._id.toString(),
        requestId,
        quiz,
        newValue: question,
        questionCount: aggregate.activeCount,
        toQuestionRevision: revised.questionRevision,
        session,
      });
      await this.invalidateQuiz(quiz, question.updatedAt, session);
      return {
        question: toTeacherQuestionDto(question),
        questionRevision: revised.questionRevision,
        maxScore: revised.maxScore,
        auditId: audit._id.toString(),
      };
    });
  }

  async update(
    actor: AuthenticatedUser,
    questionId: string,
    input: UpdateQuestionInput,
    requestId: string,
  ) {
    const { question, quiz } = await this.requireTeacherQuestion(actor, questionId);
    assertQuizMutable(quiz);
    this.assertRevision(quiz, input.expectedQuestionRevision);
    const patch = buildQuestionPatch(question, input);
    const actorId = objectId(actor.id, 'User');
    return withMongoTransaction(async (session) => {
      const updated = await this.questions.updateCas(
        { questionId: question._id, expectedVersion: question.version, actorId, patch },
        session,
      );
      if (!updated)
        throw new AppError(
          409,
          'CONCURRENT_MODIFICATION',
          'Question was modified by another request',
        );
      const { revised, aggregate } = await this.reviseQuiz(
        quiz,
        input.expectedQuestionRevision,
        actorId,
        session,
      );
      const audit = await this.auditMutation({
        action: 'QUESTION_UPDATED',
        actor,
        resourceId: questionId,
        requestId,
        quiz,
        oldValue: question,
        newValue: updated,
        questionCount: aggregate.activeCount,
        toQuestionRevision: revised.questionRevision,
        session,
      });
      await this.invalidateQuiz(quiz, updated.updatedAt, session);
      return {
        question: toTeacherQuestionDto(updated),
        questionRevision: revised.questionRevision,
        maxScore: revised.maxScore,
        auditId: audit._id.toString(),
      };
    });
  }

  async archive(
    actor: AuthenticatedUser,
    questionId: string,
    input: ArchiveQuestionInput,
    requestId: string,
  ) {
    const { question, quiz } = await this.requireTeacherQuestion(actor, questionId);
    assertQuizMutable(quiz);
    this.assertRevision(quiz, input.expectedQuestionRevision);
    const actorId = objectId(actor.id, 'User');
    return withMongoTransaction(async (session) => {
      const archived = await this.questions.archiveCas(
        question._id,
        question.version,
        actorId,
        this.now(),
        session,
      );
      if (!archived)
        throw new AppError(
          409,
          'CONCURRENT_MODIFICATION',
          'Question was modified by another request',
        );
      const { revised, aggregate } = await this.reviseQuiz(
        quiz,
        input.expectedQuestionRevision,
        actorId,
        session,
      );
      const audit = await this.auditMutation({
        action: 'QUESTION_ARCHIVED',
        actor,
        resourceId: questionId,
        requestId,
        quiz,
        oldValue: question,
        newValue: archived,
        reason: input.reason,
        questionCount: aggregate.activeCount,
        toQuestionRevision: revised.questionRevision,
        session,
      });
      await this.invalidateQuiz(quiz, archived.updatedAt, session);
      return {
        question: toTeacherQuestionDto(archived),
        questionRevision: revised.questionRevision,
        maxScore: revised.maxScore,
        auditId: audit._id.toString(),
      };
    });
  }

  async reorder(
    actor: AuthenticatedUser,
    quizId: string,
    input: ReorderQuestionsInput,
    requestId: string,
  ) {
    const { quiz } = await this.requireTeacherQuiz(actor, quizId);
    assertQuizMutable(quiz);
    this.assertRevision(quiz, input.expectedQuestionRevision);
    const questions = await this.questions.listActiveByQuiz(quiz._id);
    const activeIds = questions.map((question) => question._id.toString());
    if (
      activeIds.length !== input.orderedQuestionIds.length ||
      activeIds.some((id) => !input.orderedQuestionIds.includes(id))
    )
      throw new AppError(
        422,
        'ORDER_SET_MISMATCH',
        'Question order must contain the exact active Question set',
      );
    const actorId = objectId(actor.id, 'User');
    return withMongoTransaction(async (session) => {
      await this.questions.reorder(
        quiz._id,
        input.orderedQuestionIds.map((id, displayOrder) => ({
          questionId: objectId(id, 'Question'),
          displayOrder,
        })),
        actorId,
        session,
      );
      const { revised, aggregate } = await this.reviseQuiz(
        quiz,
        input.expectedQuestionRevision,
        actorId,
        session,
      );
      const reordered = await this.questions.listActiveByQuiz(quiz._id, session);
      const audit = await this.auditMutation({
        action: 'QUESTIONS_REORDERED',
        actor,
        resourceId: quizId,
        requestId,
        quiz,
        questionCount: aggregate.activeCount,
        toQuestionRevision: revised.questionRevision,
        session,
      });
      await this.invalidateQuiz(quiz, revised.updatedAt, session);
      return {
        items: reordered.map(toTeacherQuestionDto),
        questionRevision: revised.questionRevision,
        maxScore: revised.maxScore,
        auditId: audit._id.toString(),
      };
    });
  }

  private async mutateMedia(
    actor: AuthenticatedUser,
    questionId: string,
    expectedQuestionRevision: number,
    media: ReturnType<typeof buildQuestionMedia> | null,
    requestId: string,
  ) {
    const { question, quiz } = await this.requireTeacherQuestion(actor, questionId);
    assertQuizMutable(quiz);
    this.assertRevision(quiz, expectedQuestionRevision);
    const actorId = objectId(actor.id, 'User');
    return withMongoTransaction(async (session) => {
      const updated = await this.questions.setMediaCas(
        question._id,
        question.version,
        actorId,
        media,
        session,
      );
      if (!updated)
        throw new AppError(
          409,
          'CONCURRENT_MODIFICATION',
          'Question was modified by another request',
        );
      const { revised, aggregate } = await this.reviseQuiz(
        quiz,
        expectedQuestionRevision,
        actorId,
        session,
      );
      const audit = await this.auditMutation({
        action: 'QUESTION_MEDIA_CHANGED',
        actor,
        resourceId: questionId,
        requestId,
        quiz,
        oldValue: question,
        newValue: updated,
        questionCount: aggregate.activeCount,
        toQuestionRevision: revised.questionRevision,
        session,
      });
      await this.invalidateQuiz(quiz, updated.updatedAt, session);
      return {
        question: toTeacherQuestionDto(updated),
        questionRevision: revised.questionRevision,
        maxScore: revised.maxScore,
        auditId: audit._id.toString(),
      };
    });
  }

  setMedia(
    actor: AuthenticatedUser,
    questionId: string,
    input: SetQuestionMediaInput,
    requestId: string,
  ) {
    return this.mutateMedia(
      actor,
      questionId,
      input.expectedQuestionRevision,
      buildQuestionMedia(input, this.features),
      requestId,
    );
  }

  removeMedia(
    actor: AuthenticatedUser,
    questionId: string,
    input: RemoveQuestionMediaInput,
    requestId: string,
  ) {
    return this.mutateMedia(actor, questionId, input.expectedQuestionRevision, null, requestId);
  }
}
