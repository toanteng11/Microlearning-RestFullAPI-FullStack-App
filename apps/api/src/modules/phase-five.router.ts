import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';

import { createAuthenticateMiddleware, requirePermission } from '../shared/auth/authenticate.js';
import type { AppConfig } from '../shared/config/environment.js';
import { AppError } from '../shared/errors/app-error.js';
import { parseWithSchema } from '../shared/validation/parse.js';
import { AuditLogRepository } from './audit/audit-log.repository.js';
import { AssignmentRepository } from './assignments/assignment.repository.js';
import { AssignmentService } from './assignments/assignment.service.js';
import {
  assignmentListQuerySchema,
  assignmentParamsSchema,
  changeAssignmentStatusSchema,
  createAssignmentSchema,
  previewAssignmentSchema,
  teacherCourseAssignmentParamsSchema,
  updateAssignmentSchema,
} from './assignments/assignment.schemas.js';
import { PhaseFiveAuditWriter } from './audit/phase-five-audit.writer.js';
import { AuthLoginStateRepository } from './auth/auth-login-state.repository.js';
import { AuthService } from './auth/auth.service.js';
import { ClassroomRepository } from './classrooms/classroom.repository.js';
import { CourseRepository } from './courses/course.repository.js';
import { EnrollmentRepository } from './enrollments/enrollment.repository.js';
import { GradeRepository } from './grades/grade.repository.js';
import { GradeService } from './grades/grade.service.js';
import {
  gradeCourseParamsSchema,
  gradeHistoryQuerySchema,
  gradeParamsSchema,
  ownGradeListQuerySchema,
  regradeSchema,
  returnSubmissionSchema,
  saveSubmissionGradeSchema,
} from './grades/grade.schemas.js';
import { LearningProgressRepository } from './learning-progress/learning-progress.repository.js';
import type { ReportingInvalidationWriter } from './learning-content/reporting-invalidation.writer.js';
import { LessonRepository } from './lessons/lesson.repository.js';
import { CourseModuleRepository } from './modules/module.repository.js';
import { createPhaseFiveFoundation } from './phase-five.foundation.js';
import {
  archiveQuestionSchema,
  createQuestionSchema,
  questionParamsSchema,
  quizQuestionParamsSchema,
  removeQuestionMediaSchema,
  reorderQuestionsSchema,
  setQuestionMediaSchema,
  updateQuestionSchema,
} from './questions/question.schemas.js';
import { QuestionRepository } from './questions/question.repository.js';
import { QuestionService } from './questions/question.service.js';
import { QuizRepository } from './quizzes/quiz.repository.js';
import { QuizAttemptRepository } from './quiz-attempts/quiz-attempt.repository.js';
import { QuizAttemptService } from './quiz-attempts/quiz-attempt.service.js';
import { QuizReviewService } from './quiz-attempts/quiz-review.service.js';
import {
  finalizeQuizReviewSchema,
  quizResultListQuerySchema,
  regradeQuizAttemptSchema,
  releaseQuizResultSchema,
  saveQuizReviewSchema,
  teacherAttemptParamsSchema,
} from './quiz-attempts/quiz-review.schemas.js';
import {
  attemptListQuerySchema,
  saveQuizAnswersSchema,
  startQuizAttemptSchema,
  studentAttemptParamsSchema,
  studentQuizParamsSchema,
  submitQuizAttemptSchema,
} from './quiz-attempts/quiz-attempt.schemas.js';
import {
  changeQuizStatusSchema,
  createQuizSchema,
  previewQuizBodySchema,
  quizListQuerySchema,
  teacherCourseQuizParamsSchema,
  teacherQuizParamsSchema,
  updateQuizSchema,
} from './quizzes/quiz.schemas.js';
import { QuizService } from './quizzes/quiz.service.js';
import { AuthSessionRepository } from './sessions/auth-session.repository.js';
import { SubmissionRepository } from './submissions/submission.repository.js';
import { SubmissionService } from './submissions/submission.service.js';
import {
  assignmentRosterQuerySchema,
  resubmitSubmissionSchema,
  saveSubmissionDraftSchema,
  studentAssignmentParamsSchema,
  studentSubmissionParamsSchema,
  submissionHistoryQuerySchema,
  submissionTransitionSchema,
} from './submissions/submission.schemas.js';
import { UserRepository } from './users/user.repository.js';
import { DeadlineExceptionRepository } from './deadline-exceptions/deadline-exception.repository.js';
import {
  DeadlineExceptionService,
  canonicalActivityType,
} from './deadline-exceptions/deadline-exception.service.js';
import {
  activityDeadlineParamsSchema,
  deadlineExceptionListQuerySchema,
  revokeDeadlineExceptionSchema,
  setDeadlineExceptionSchema,
  studentActivityDeadlineParamsSchema,
} from './deadline-exceptions/deadline-exception.schemas.js';

function requestIdFrom(response: {
  getHeader(name: string): number | string | string[] | undefined;
}) {
  return String(response.getHeader('x-request-id') ?? 'unknown');
}

function createAssessmentMutationLimiter(config: AppConfig) {
  return rateLimit({
    windowMs: config.assessmentRateLimits.mutationWindowSeconds * 1_000,
    limit: config.assessmentRateLimits.mutationIdentityMax,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: (request) => request.method === 'GET' || request.method === 'HEAD',
    keyGenerator: (request) => request.auth?.id ?? 'unauthenticated',
    handler: (_request, _response, next) =>
      next(new AppError(429, 'RATE_LIMITED', 'Too many assessment changes. Try again later')),
  });
}

function createStudentAssessmentLimiter(config: AppConfig, limit: number, key: 'identity' | 'ip') {
  return rateLimit({
    windowMs: config.assessmentRateLimits.mutationWindowSeconds * 1_000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator:
      key === 'identity' ? (request) => request.auth?.id ?? 'unauthenticated' : undefined,
    handler: (_request, _response, next) =>
      next(new AppError(429, 'RATE_LIMITED', 'Too many assessment requests. Try again later')),
  });
}

export function createPhaseFiveRouter(
  config: AppConfig,
  classrooms: ClassroomRepository,
  reportingInvalidationWriter: ReportingInvalidationWriter,
) {
  const router = Router();
  const users = new UserRepository();
  const sessions = new AuthSessionRepository();
  const auth = new AuthService(config, users, sessions, new AuthLoginStateRepository());
  const authenticate = createAuthenticateMiddleware(auth.accessTokenService, users, sessions);
  const courses = new CourseRepository();
  const modules = new CourseModuleRepository();
  const quizzes = new QuizRepository();
  const questions = new QuestionRepository();
  const attempts = new QuizAttemptRepository();
  const assignments = new AssignmentRepository();
  const submissions = new SubmissionRepository();
  const grades = new GradeRepository();
  const deadlineExceptions = new DeadlineExceptionRepository();
  const foundation = createPhaseFiveFoundation(classrooms, new EnrollmentRepository(), courses);
  const audits = new PhaseFiveAuditWriter(new AuditLogRepository());
  const quizService = new QuizService(
    courses,
    modules,
    quizzes,
    questions,
    foundation.assessmentScopeReader,
    audits,
    reportingInvalidationWriter,
  );
  const questionService = new QuestionService(
    quizzes,
    questions,
    foundation.assessmentScopeReader,
    audits,
    config.assessmentFeatures,
    reportingInvalidationWriter,
  );
  const attemptService = new QuizAttemptService(
    quizzes,
    questions,
    attempts,
    new LearningProgressRepository(),
    deadlineExceptions,
    foundation.assessmentScopeReader,
    audits,
    reportingInvalidationWriter,
  );
  const assignmentService = new AssignmentService(
    courses,
    modules,
    assignments,
    foundation.assessmentScopeReader,
    audits,
    config.assessmentFeatures,
    deadlineExceptions,
    reportingInvalidationWriter,
  );
  const submissionService = new SubmissionService(
    assignments,
    submissions,
    new EnrollmentRepository(),
    new LearningProgressRepository(),
    grades,
    deadlineExceptions,
    foundation.assessmentScopeReader,
    audits,
    config.assessmentFeatures,
    reportingInvalidationWriter,
  );
  const quizReviewService = new QuizReviewService(
    quizzes,
    attempts,
    grades,
    foundation.assessmentScopeReader,
    audits,
    reportingInvalidationWriter,
  );
  const gradeService = new GradeService(
    grades,
    submissions,
    assignments,
    new EnrollmentRepository(),
    foundation.assessmentScopeReader,
    audits,
    config.assessmentFeatures,
    reportingInvalidationWriter,
  );
  const deadlineExceptionService = new DeadlineExceptionService(
    deadlineExceptions,
    new LessonRepository(),
    quizzes,
    assignments,
    new EnrollmentRepository(),
    foundation.assessmentScopeReader,
    audits,
    reportingInvalidationWriter,
  );
  const attemptStartIpLimiter = createStudentAssessmentLimiter(
    config,
    config.assessmentRateLimits.attemptStartIpMax,
    'ip',
  );
  const attemptStartIdentityLimiter = createStudentAssessmentLimiter(
    config,
    config.assessmentRateLimits.attemptStartIdentityMax,
    'identity',
  );
  const answerSaveLimiter = createStudentAssessmentLimiter(
    config,
    config.assessmentRateLimits.answerSaveIdentityMax,
    'identity',
  );

  router.use('/teacher', authenticate, createAssessmentMutationLimiter(config));
  router.use('/students', authenticate);

  router.get(
    '/students/quizzes/:quizId',
    requirePermission('quiz.view_assigned'),
    async (request, response) => {
      const { quizId } = parseWithSchema(studentQuizParamsSchema, request.params);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await attemptService.intro(request.auth!, quizId, requestIdFrom(response)),
      });
    },
  );

  router.get(
    '/students/assignments/:assignmentId',
    requirePermission('assignment.view_assigned'),
    async (request, response) => {
      const { assignmentId } = parseWithSchema(studentAssignmentParamsSchema, request.params);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await assignmentService.getStudent(request.auth!, assignmentId),
      });
    },
  );

  router.get(
    '/students/assignments/:assignmentId/submission',
    requirePermission('submission.view_own'),
    async (request, response) => {
      const { assignmentId } = parseWithSchema(studentAssignmentParamsSchema, request.params);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await submissionService.getOwnByAssignment(request.auth!, assignmentId),
      });
    },
  );

  router.put(
    '/students/assignments/:assignmentId/submission',
    requirePermission('submission.manage_own'),
    answerSaveLimiter,
    async (request, response) => {
      const { assignmentId } = parseWithSchema(studentAssignmentParamsSchema, request.params);
      const input = parseWithSchema(saveSubmissionDraftSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await submissionService.saveDraft(
          request.auth!,
          assignmentId,
          input,
          requestIdFrom(response),
        ),
      });
    },
  );

  router.post(
    '/students/submissions/:submissionId/turn-in',
    requirePermission('submission.manage_own'),
    async (request, response) => {
      const { submissionId } = parseWithSchema(studentSubmissionParamsSchema, request.params);
      const input = parseWithSchema(submissionTransitionSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await submissionService.turnIn(
          request.auth!,
          submissionId,
          input,
          requestIdFrom(response),
        ),
      });
    },
  );

  router.post(
    '/students/submissions/:submissionId/unsubmit',
    requirePermission('submission.manage_own'),
    async (request, response) => {
      const { submissionId } = parseWithSchema(studentSubmissionParamsSchema, request.params);
      const input = parseWithSchema(submissionTransitionSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await submissionService.unsubmit(
          request.auth!,
          submissionId,
          input,
          requestIdFrom(response),
        ),
      });
    },
  );

  router.post(
    '/students/submissions/:submissionId/resubmit',
    requirePermission('submission.manage_own'),
    async (request, response) => {
      const { submissionId } = parseWithSchema(studentSubmissionParamsSchema, request.params);
      const input = parseWithSchema(resubmitSubmissionSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await submissionService.resubmit(
          request.auth!,
          submissionId,
          input,
          requestIdFrom(response),
        ),
      });
    },
  );

  router.get(
    '/students/submissions/:submissionId/history',
    requirePermission('submission.view_own'),
    async (request, response) => {
      const { submissionId } = parseWithSchema(studentSubmissionParamsSchema, request.params);
      const query = parseWithSchema(submissionHistoryQuerySchema, request.query);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        ...(await submissionService.history(request.auth!, submissionId, query)),
      });
    },
  );

  router.post(
    '/students/quizzes/:quizId/attempts',
    requirePermission('quiz.attempt'),
    attemptStartIpLimiter,
    attemptStartIdentityLimiter,
    async (request, response) => {
      const { quizId } = parseWithSchema(studentQuizParamsSchema, request.params);
      parseWithSchema(startQuizAttemptSchema, request.body ?? {});
      const result = await attemptService.start(request.auth!, quizId, requestIdFrom(response));
      response.setHeader('Cache-Control', 'private, no-store');
      response.status(result.resumed ? 200 : 201).json({ success: true, data: result });
    },
  );

  router.get(
    '/students/quiz-attempts/:attemptId',
    requirePermission('quiz.attempt'),
    async (request, response) => {
      const { attemptId } = parseWithSchema(studentAttemptParamsSchema, request.params);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await attemptService.getOwn(request.auth!, attemptId, requestIdFrom(response)),
      });
    },
  );

  router.patch(
    '/students/quiz-attempts/:attemptId/answers',
    requirePermission('quiz.attempt'),
    answerSaveLimiter,
    async (request, response) => {
      const { attemptId } = parseWithSchema(studentAttemptParamsSchema, request.params);
      const input = parseWithSchema(saveQuizAnswersSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await attemptService.saveAnswers(
          request.auth!,
          attemptId,
          input,
          requestIdFrom(response),
        ),
      });
    },
  );

  router.post(
    '/students/quiz-attempts/:attemptId/submit',
    requirePermission('quiz.attempt'),
    async (request, response) => {
      const { attemptId } = parseWithSchema(studentAttemptParamsSchema, request.params);
      const input = parseWithSchema(submitQuizAttemptSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await attemptService.submit(request.auth!, attemptId, input, requestIdFrom(response)),
      });
    },
  );

  router.get(
    '/students/quizzes/:quizId/attempts',
    requirePermission('quiz.result_view_own'),
    async (request, response) => {
      const { quizId } = parseWithSchema(studentQuizParamsSchema, request.params);
      const query = parseWithSchema(attemptListQuerySchema, request.query);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        ...(await attemptService.listOwn(request.auth!, quizId, query, requestIdFrom(response))),
      });
    },
  );

  router.get(
    '/students/quiz-attempts/:attemptId/result',
    requirePermission('quiz.result_view_own'),
    async (request, response) => {
      const { attemptId } = parseWithSchema(studentAttemptParamsSchema, request.params);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await attemptService.result(request.auth!, attemptId, requestIdFrom(response)),
      });
    },
  );

  router.get(
    '/students/me/grades',
    requirePermission('grade.view_own'),
    async (request, response) => {
      const query = parseWithSchema(ownGradeListQuerySchema, request.query);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        ...(await gradeService.listOwn(request.auth!, query)),
      });
    },
  );

  router.get(
    '/students/me/grades/:gradeId',
    requirePermission('grade.view_own'),
    async (request, response) => {
      const { gradeId } = parseWithSchema(gradeParamsSchema, request.params);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await gradeService.getOwn(request.auth!, gradeId),
      });
    },
  );

  router.get(
    '/teacher/courses/:courseId/quizzes',
    requirePermission('quiz.manage_owned'),
    async (request, response) => {
      const { courseId } = parseWithSchema(teacherCourseQuizParamsSchema, request.params);
      const query = parseWithSchema(quizListQuerySchema, request.query);
      const result = await quizService.list(request.auth!, courseId, query);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({ success: true, ...result });
    },
  );

  router.get(
    '/teacher/courses/:courseId/assignments',
    requirePermission('assignment.manage_owned'),
    async (request, response) => {
      const { courseId } = parseWithSchema(teacherCourseAssignmentParamsSchema, request.params);
      const query = parseWithSchema(assignmentListQuerySchema, request.query);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        ...(await assignmentService.list(request.auth!, courseId, query)),
      });
    },
  );

  router.post(
    '/teacher/courses/:courseId/assignments',
    requirePermission('assignment.manage_owned'),
    async (request, response) => {
      const { courseId } = parseWithSchema(teacherCourseAssignmentParamsSchema, request.params);
      const input = parseWithSchema(createAssignmentSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.status(201).json({
        success: true,
        data: await assignmentService.create(
          request.auth!,
          courseId,
          input,
          requestIdFrom(response),
        ),
      });
    },
  );

  router.get(
    '/teacher/assignments/:assignmentId',
    requirePermission('assignment.manage_owned'),
    async (request, response) => {
      const { assignmentId } = parseWithSchema(assignmentParamsSchema, request.params);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await assignmentService.getTeacher(request.auth!, assignmentId),
      });
    },
  );

  router.patch(
    '/teacher/assignments/:assignmentId',
    requirePermission('assignment.manage_owned'),
    async (request, response) => {
      const { assignmentId } = parseWithSchema(assignmentParamsSchema, request.params);
      const input = parseWithSchema(updateAssignmentSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await assignmentService.update(
          request.auth!,
          assignmentId,
          input,
          requestIdFrom(response),
        ),
      });
    },
  );

  router.patch(
    '/teacher/assignments/:assignmentId/status',
    requirePermission('assignment.publish_owned'),
    async (request, response) => {
      const { assignmentId } = parseWithSchema(assignmentParamsSchema, request.params);
      const input = parseWithSchema(changeAssignmentStatusSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await assignmentService.changeStatus(
          request.auth!,
          assignmentId,
          input,
          requestIdFrom(response),
        ),
      });
    },
  );

  router.post(
    '/teacher/assignments/:assignmentId/preview',
    requirePermission('assignment.manage_owned'),
    async (request, response) => {
      const { assignmentId } = parseWithSchema(assignmentParamsSchema, request.params);
      parseWithSchema(previewAssignmentSchema, request.body ?? {});
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await assignmentService.preview(request.auth!, assignmentId),
      });
    },
  );

  router.get(
    '/teacher/assignments/:assignmentId/submissions',
    requirePermission('submission.view_owned'),
    async (request, response) => {
      const { assignmentId } = parseWithSchema(assignmentParamsSchema, request.params);
      const query = parseWithSchema(assignmentRosterQuerySchema, request.query);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        ...(await submissionService.listTeacherRoster(request.auth!, assignmentId, query)),
      });
    },
  );

  router.put(
    '/teacher/submissions/:submissionId/grade',
    requirePermission('grade.manage_owned'),
    async (request, response) => {
      const { submissionId } = parseWithSchema(studentSubmissionParamsSchema, request.params);
      const input = parseWithSchema(saveSubmissionGradeSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await gradeService.save(request.auth!, submissionId, input, requestIdFrom(response)),
      });
    },
  );

  router.post(
    '/teacher/submissions/:submissionId/return',
    requirePermission('grade.manage_owned'),
    async (request, response) => {
      const { submissionId } = parseWithSchema(studentSubmissionParamsSchema, request.params);
      const input = parseWithSchema(returnSubmissionSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await gradeService.returnWork(
          request.auth!,
          submissionId,
          input,
          requestIdFrom(response),
        ),
      });
    },
  );

  router.post(
    '/teacher/grades/:gradeId/regrade',
    requirePermission('grade.manage_owned'),
    async (request, response) => {
      const { gradeId } = parseWithSchema(gradeParamsSchema, request.params);
      const input = parseWithSchema(regradeSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await gradeService.regrade(request.auth!, gradeId, input, requestIdFrom(response)),
      });
    },
  );

  router.get(
    '/teacher/grades/:gradeId/history',
    requirePermission('grade.manage_owned'),
    async (request, response) => {
      const { gradeId } = parseWithSchema(gradeParamsSchema, request.params);
      const query = parseWithSchema(gradeHistoryQuerySchema, request.query);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        ...(await gradeService.history(request.auth!, gradeId, query)),
      });
    },
  );

  router.get(
    '/teacher/courses/:courseId/gradebook',
    requirePermission('grade.manage_owned'),
    async (request, response) => {
      const { courseId } = parseWithSchema(gradeCourseParamsSchema, request.params);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await gradeService.gradebook(request.auth!, courseId),
      });
    },
  );

  router.get(
    '/teacher/submissions/:submissionId',
    requirePermission('submission.view_owned'),
    async (request, response) => {
      const { submissionId } = parseWithSchema(studentSubmissionParamsSchema, request.params);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await submissionService.getTeacherSubmission(request.auth!, submissionId),
      });
    },
  );

  router.post(
    '/teacher/courses/:courseId/quizzes',
    requirePermission('quiz.manage_owned'),
    async (request, response) => {
      const { courseId } = parseWithSchema(teacherCourseQuizParamsSchema, request.params);
      const input = parseWithSchema(createQuizSchema, request.body);
      const result = await quizService.create(
        request.auth!,
        courseId,
        input,
        requestIdFrom(response),
      );
      response.setHeader('Cache-Control', 'private, no-store');
      response.status(201).json({ success: true, data: result });
    },
  );

  router.get(
    '/teacher/quizzes/:quizId',
    requirePermission('quiz.manage_owned'),
    async (request, response) => {
      const { quizId } = parseWithSchema(teacherQuizParamsSchema, request.params);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await quizService.getTeacherDetail(request.auth!, quizId),
      });
    },
  );

  router.patch(
    '/teacher/quizzes/:quizId',
    requirePermission('quiz.manage_owned'),
    async (request, response) => {
      const { quizId } = parseWithSchema(teacherQuizParamsSchema, request.params);
      const input = parseWithSchema(updateQuizSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await quizService.update(request.auth!, quizId, input, requestIdFrom(response)),
      });
    },
  );

  router.patch(
    '/teacher/quizzes/:quizId/status',
    requirePermission('quiz.publish_owned'),
    async (request, response) => {
      const { quizId } = parseWithSchema(teacherQuizParamsSchema, request.params);
      const input = parseWithSchema(changeQuizStatusSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await quizService.changeStatus(request.auth!, quizId, input, requestIdFrom(response)),
      });
    },
  );

  router.post(
    '/teacher/quizzes/:quizId/preview',
    requirePermission('quiz.manage_owned'),
    async (request, response) => {
      const { quizId } = parseWithSchema(teacherQuizParamsSchema, request.params);
      parseWithSchema(previewQuizBodySchema, request.body ?? {});
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({ success: true, data: await quizService.preview(request.auth!, quizId) });
    },
  );

  router.get(
    '/teacher/quizzes/:quizId/questions',
    requirePermission('quiz.manage_owned'),
    async (request, response) => {
      const { quizId } = parseWithSchema(quizQuestionParamsSchema, request.params);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({ success: true, data: await questionService.list(request.auth!, quizId) });
    },
  );

  router.get(
    '/teacher/quizzes/:quizId/results',
    requirePermission('quiz.results_view_owned'),
    async (request, response) => {
      const { quizId } = parseWithSchema(teacherQuizParamsSchema, request.params);
      const query = parseWithSchema(quizResultListQuerySchema, request.query);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        ...(await quizReviewService.listResults(request.auth!, quizId, query)),
      });
    },
  );

  router.get(
    '/teacher/quiz-attempts/:attemptId',
    requirePermission('quiz.results_view_owned'),
    async (request, response) => {
      const { attemptId } = parseWithSchema(teacherAttemptParamsSchema, request.params);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await quizReviewService.getAttempt(request.auth!, attemptId),
      });
    },
  );

  router.put(
    '/teacher/quiz-attempts/:attemptId/review',
    requirePermission('quiz.review_owned'),
    async (request, response) => {
      const { attemptId } = parseWithSchema(teacherAttemptParamsSchema, request.params);
      const input = parseWithSchema(saveQuizReviewSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await quizReviewService.saveReview(
          request.auth!,
          attemptId,
          input,
          requestIdFrom(response),
        ),
      });
    },
  );

  router.post(
    '/teacher/quiz-attempts/:attemptId/review/finalize',
    requirePermission('quiz.review_owned'),
    async (request, response) => {
      const { attemptId } = parseWithSchema(teacherAttemptParamsSchema, request.params);
      const input = parseWithSchema(finalizeQuizReviewSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await quizReviewService.finalizeReview(
          request.auth!,
          attemptId,
          input,
          requestIdFrom(response),
        ),
      });
    },
  );

  router.post(
    '/teacher/quiz-attempts/:attemptId/release',
    requirePermission('quiz.review_owned'),
    async (request, response) => {
      const { attemptId } = parseWithSchema(teacherAttemptParamsSchema, request.params);
      const input = parseWithSchema(releaseQuizResultSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await quizReviewService.release(
          request.auth!,
          attemptId,
          input,
          requestIdFrom(response),
        ),
      });
    },
  );

  router.post(
    '/teacher/quiz-attempts/:attemptId/regrade',
    requirePermission('quiz.review_owned'),
    async (request, response) => {
      const { attemptId } = parseWithSchema(teacherAttemptParamsSchema, request.params);
      const input = parseWithSchema(regradeQuizAttemptSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await quizReviewService.regrade(
          request.auth!,
          attemptId,
          input,
          requestIdFrom(response),
        ),
      });
    },
  );

  router.get(
    '/teacher/activities/:activityType/:activityId/deadline-exceptions',
    requirePermission('deadline_exception.manage_owned'),
    async (request, response) => {
      const params = parseWithSchema(activityDeadlineParamsSchema, request.params);
      const query = parseWithSchema(deadlineExceptionListQuerySchema, request.query);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        ...(await deadlineExceptionService.list(
          request.auth!,
          canonicalActivityType(params.activityType),
          params.activityId,
          query,
        )),
      });
    },
  );

  router.put(
    '/teacher/activities/:activityType/:activityId/deadline-exceptions/:studentId',
    requirePermission('deadline_exception.manage_owned'),
    async (request, response) => {
      const params = parseWithSchema(studentActivityDeadlineParamsSchema, request.params);
      const input = parseWithSchema(setDeadlineExceptionSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await deadlineExceptionService.set(
          request.auth!,
          canonicalActivityType(params.activityType),
          params.activityId,
          params.studentId,
          input,
          requestIdFrom(response),
        ),
      });
    },
  );

  router.post(
    '/teacher/activities/:activityType/:activityId/deadline-exceptions/:studentId/revoke',
    requirePermission('deadline_exception.manage_owned'),
    async (request, response) => {
      const params = parseWithSchema(studentActivityDeadlineParamsSchema, request.params);
      const input = parseWithSchema(revokeDeadlineExceptionSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await deadlineExceptionService.revoke(
          request.auth!,
          canonicalActivityType(params.activityType),
          params.activityId,
          params.studentId,
          input,
          requestIdFrom(response),
        ),
      });
    },
  );

  router.get(
    '/teacher/activities/:activityType/:activityId/deadline-exceptions/:studentId/history',
    requirePermission('deadline_exception.manage_owned'),
    async (request, response) => {
      const params = parseWithSchema(studentActivityDeadlineParamsSchema, request.params);
      const query = parseWithSchema(deadlineExceptionListQuerySchema, request.query);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        ...(await deadlineExceptionService.history(
          request.auth!,
          canonicalActivityType(params.activityType),
          params.activityId,
          params.studentId,
          query,
        )),
      });
    },
  );

  router.post(
    '/teacher/quizzes/:quizId/questions',
    requirePermission('quiz.manage_owned'),
    async (request, response) => {
      const { quizId } = parseWithSchema(quizQuestionParamsSchema, request.params);
      const input = parseWithSchema(createQuestionSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.status(201).json({
        success: true,
        data: await questionService.create(request.auth!, quizId, input, requestIdFrom(response)),
      });
    },
  );

  router.patch(
    '/teacher/questions/:questionId',
    requirePermission('quiz.manage_owned'),
    async (request, response) => {
      const { questionId } = parseWithSchema(questionParamsSchema, request.params);
      const input = parseWithSchema(updateQuestionSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await questionService.update(
          request.auth!,
          questionId,
          input,
          requestIdFrom(response),
        ),
      });
    },
  );

  router.delete(
    '/teacher/questions/:questionId',
    requirePermission('quiz.manage_owned'),
    async (request, response) => {
      const { questionId } = parseWithSchema(questionParamsSchema, request.params);
      const input = parseWithSchema(archiveQuestionSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await questionService.archive(
          request.auth!,
          questionId,
          input,
          requestIdFrom(response),
        ),
      });
    },
  );

  router.patch(
    '/teacher/quizzes/:quizId/questions/reorder',
    requirePermission('quiz.manage_owned'),
    async (request, response) => {
      const { quizId } = parseWithSchema(quizQuestionParamsSchema, request.params);
      const input = parseWithSchema(reorderQuestionsSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await questionService.reorder(request.auth!, quizId, input, requestIdFrom(response)),
      });
    },
  );

  router.put(
    '/teacher/questions/:questionId/media',
    requirePermission('quiz.manage_owned'),
    async (request, response) => {
      const { questionId } = parseWithSchema(questionParamsSchema, request.params);
      const input = parseWithSchema(setQuestionMediaSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await questionService.setMedia(
          request.auth!,
          questionId,
          input,
          requestIdFrom(response),
        ),
      });
    },
  );

  router.delete(
    '/teacher/questions/:questionId/media',
    requirePermission('quiz.manage_owned'),
    async (request, response) => {
      const { questionId } = parseWithSchema(questionParamsSchema, request.params);
      const input = parseWithSchema(removeQuestionMediaSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await questionService.removeMedia(
          request.auth!,
          questionId,
          input,
          requestIdFrom(response),
        ),
      });
    },
  );

  return router;
}
