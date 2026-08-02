import { Router, type Request, type Response } from 'express';
import type { ZodType } from 'zod';

import { createAuthenticateMiddleware, requirePermission } from '../shared/auth/authenticate.js';
import type { AppConfig } from '../shared/config/environment.js';
import { AppError } from '../shared/errors/app-error.js';
import { parseWithSchema } from '../shared/validation/parse.js';
import { AssignmentRepository } from './assignments/assignment.repository.js';
import { AuthLoginStateRepository } from './auth/auth-login-state.repository.js';
import { AuthService } from './auth/auth.service.js';
import type { ClassroomRepository } from './classrooms/classroom.repository.js';
import { CourseScopeRepositoryAdapter } from './courses/course-scope.adapter.js';
import { CourseRepository } from './courses/course.repository.js';
import { DeadlineExceptionRepository } from './deadline-exceptions/deadline-exception.repository.js';
import { EnrollmentRepository } from './enrollments/enrollment.repository.js';
import { FlashcardRepository } from './flashcards/flashcard.repository.js';
import { LessonRepository } from './lessons/lesson.repository.js';
import { LearningProgressRepository } from './learning-progress/learning-progress.repository.js';
import { MongoLearningActivityReader } from './learning-progress/mongo-learning-activity.reader.js';
import { StudentLearningService } from './learning-progress/student-learning.service.js';
import { CourseModuleRepository } from './modules/module.repository.js';
import { createPhaseFourFoundation } from './phase-four.foundation.js';
import type { PhaseSixFoundation } from './phase-six.foundation.js';
import { QuizRepository } from './quizzes/quiz.repository.js';
import { MongoStudentReportingSource } from './reporting/adapters/mongo-student-reporting.source.js';
import { MongoTeacherReportingSource } from './reporting/adapters/mongo-teacher-reporting.source.js';
import { AdminReportingService } from './reporting/admin-reporting.service.js';
import { GradebookReportingService } from './reporting/gradebook-reporting.service.js';
import { ReportingAuditWriter } from './reporting/reporting-audit.writer.js';
import { createReportingQuerySchemas } from './reporting/reporting.schemas.js';
import { StudentReportingService } from './reporting/student-reporting.service.js';
import { TeacherReportingService } from './reporting/teacher-reporting.service.js';
import { AuthSessionRepository } from './sessions/auth-session.repository.js';
import { UserRepository } from './users/user.repository.js';

function parseTeacherReportingQuery<T>(schema: ZodType<T>, input: unknown): T {
  try {
    return parseWithSchema(schema, input);
  } catch (error) {
    if (error instanceof AppError && error.code === 'VALIDATION_ERROR') {
      throw new AppError(400, error.code, error.message, error.details);
    }
    throw error;
  }
}

function requestIdFrom(response: Response) {
  return String(response.getHeader('x-request-id') ?? 'unknown');
}

export function createPhaseSixRouter(
  config: AppConfig,
  classrooms: ClassroomRepository,
  foundation: PhaseSixFoundation,
) {
  const router = Router();
  const users = new UserRepository();
  const sessions = new AuthSessionRepository();
  const authService = new AuthService(config, users, sessions, new AuthLoginStateRepository());
  const authenticate = createAuthenticateMiddleware(
    authService.accessTokenService,
    users,
    sessions,
  );
  const enrollments = new EnrollmentRepository();
  const courses = new CourseRepository();
  const modules = new CourseModuleRepository();
  const lessons = new LessonRepository();
  const quizzes = new QuizRepository();
  const assignments = new AssignmentRepository();
  const phaseFourFoundation = createPhaseFourFoundation(classrooms, enrollments);
  const courseScopes = new CourseScopeRepositoryAdapter(
    courses,
    phaseFourFoundation.classroomScopeReader,
  );
  const learning = new StudentLearningService(
    classrooms,
    enrollments,
    courses,
    modules,
    lessons,
    new FlashcardRepository(),
    new LearningProgressRepository(),
    phaseFourFoundation.classroomScopeReader,
    courseScopes,
    new MongoLearningActivityReader(modules, lessons, quizzes, assignments),
    new DeadlineExceptionRepository(),
    foundation.reportingInvalidationWriter,
  );
  const reporting = new StudentReportingService(
    new MongoStudentReportingSource(enrollments, classrooms, courses),
    foundation.scopeReader,
    foundation.summaries,
    foundation.refreshService,
    learning,
    {
      enabled: config.reporting.enabled,
      timezone: config.reporting.timezone,
      staleAfterSeconds: config.reporting.staleAfterSeconds,
      inlineRefreshMaxStudents: config.reporting.inlineRefreshMaxStudents,
      refreshRequestBudgetMs: config.reporting.refreshRequestBudgetMs,
      dueSoonWindowHours: config.reporting.dueSoonWindowHours,
    },
  );
  const teacherSource = new MongoTeacherReportingSource(
    users,
    config.reporting.onDemandCourseRefreshMaxStudents,
  );
  const teacherReporting = new TeacherReportingService(
    foundation.scopeReader,
    foundation.rosterReader,
    foundation.activityReader,
    foundation.progressReader,
    foundation.gradeReader,
    teacherSource,
    foundation.calculator,
    {
      enabled: config.reporting.enabled,
      timezone: config.reporting.timezone,
      staleAfterSeconds: config.reporting.staleAfterSeconds,
      dueSoonWindowHours: config.reporting.dueSoonWindowHours,
    },
  );
  const gradebookReporting = new GradebookReportingService(
    foundation.scopeReader,
    foundation.rosterReader,
    foundation.activityReader,
    foundation.progressReader,
    foundation.gradeReader,
    teacherSource,
    modules,
    foundation.calculator,
    {
      enabled: config.reporting.enabled,
      timezone: config.reporting.timezone,
      staleAfterSeconds: config.reporting.staleAfterSeconds,
    },
  );
  const adminReporting = new AdminReportingService(
    foundation.governanceReader,
    foundation.auditReader,
    new ReportingAuditWriter(),
    {
      enabled: config.reporting.enabled,
      timezone: config.reporting.timezone,
      staleAfterSeconds: config.reporting.staleAfterSeconds,
      maxDateRangeDays: config.reporting.maxDateRangeDays,
    },
  );
  const schemas = createReportingQuerySchemas({
    pageMax: config.reporting.pageMax,
    gradebookActivityMax: config.reporting.gradebookActivityMax,
    maxDateRangeDays: config.reporting.maxDateRangeDays,
    defaultTimezone: config.reporting.timezone,
  });

  router.use('/students', authenticate);
  router.use('/teacher', authenticate);
  router.use('/admin', authenticate);

  router.get(
    '/students/me/dashboard',
    requirePermission('learning.view_enrolled'),
    async (request, response) => {
      const query = parseWithSchema(schemas.studentDashboard, request.query);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({ success: true, data: await reporting.dashboard(request.auth!, query) });
    },
  );

  router.get(
    '/admin/dashboard',
    requirePermission('report.view_governance'),
    async (request, response) => {
      const query = parseTeacherReportingQuery(schemas.adminDashboard, request.query);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await adminReporting.dashboard(request.auth!, query),
      });
    },
  );

  router.get(
    '/admin/reports/governance',
    requirePermission('report.view_governance'),
    async (request, response) => {
      const query = parseTeacherReportingQuery(schemas.adminGovernance, request.query);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await adminReporting.governanceReport(request.auth!, query, requestIdFrom(response)),
      });
    },
  );

  router.get(
    '/admin/audit-logs',
    requirePermission('report.audit_view'),
    async (request, response) => {
      const query = parseTeacherReportingQuery(schemas.adminAudit, request.query);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        ...(await adminReporting.auditLogs(request.auth!, query, requestIdFrom(response))),
      });
    },
  );

  router.get(
    '/students/me/progress',
    requirePermission('learning.view_enrolled'),
    async (request, response) => {
      const query = parseWithSchema(schemas.studentCourseDetail, request.query);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({ success: true, data: await reporting.course(request.auth!, query) });
    },
  );

  router.get(
    '/students/me/progress/courses',
    requirePermission('learning.view_enrolled'),
    async (request, response) => {
      const query = parseWithSchema(schemas.studentCourseList, request.query);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({ success: true, ...(await reporting.courses(request.auth!, query)) });
    },
  );

  router.get(
    '/teacher/courses/:courseId/dashboard',
    requirePermission('course.progress_view_owned'),
    async (request, response) => {
      const { courseId } = parseWithSchema(schemas.courseParams, request.params);
      const query = parseTeacherReportingQuery(schemas.teacherDashboard, request.query);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await teacherReporting.dashboard(request.auth!, courseId, query),
      });
    },
  );

  const listTeacherProgress = async (request: Request, response: Response) => {
    const { courseId } = parseWithSchema(schemas.courseParams, request.params);
    const query = parseTeacherReportingQuery(schemas.teacherProgress, request.query);
    response.setHeader('Cache-Control', 'private, no-store');
    response.json({
      success: true,
      ...(await teacherReporting.ranking(request.auth!, courseId, query)),
    });
  };

  router.get(
    '/teacher/courses/:courseId/progress',
    requirePermission('course.progress_view_owned'),
    listTeacherProgress,
  );

  router.get(
    '/teacher/courses/:courseId/students',
    requirePermission('course.progress_view_owned'),
    listTeacherProgress,
  );

  router.get(
    '/teacher/courses/:courseId/activities',
    requirePermission('course.progress_view_owned'),
    async (request, response) => {
      const { courseId } = parseWithSchema(schemas.courseParams, request.params);
      const query = parseTeacherReportingQuery(schemas.teacherActivities, request.query);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        ...(await teacherReporting.activityAnalytics(request.auth!, courseId, query)),
      });
    },
  );

  router.get(
    '/teacher/courses/:courseId/assessments',
    requirePermission('course.progress_view_owned'),
    async (request, response) => {
      const { courseId } = parseWithSchema(schemas.courseParams, request.params);
      const query = parseTeacherReportingQuery(schemas.teacherAssessments, request.query);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        ...(await teacherReporting.assessmentAnalytics(request.auth!, courseId, query)),
      });
    },
  );

  router.get(
    '/teacher/courses/:courseId/gradebook',
    requirePermission('grade.manage_owned'),
    async (request, response) => {
      const { courseId } = parseWithSchema(schemas.courseParams, request.params);
      const query = parseTeacherReportingQuery(schemas.gradebook, request.query);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        ...(await gradebookReporting.gradebook(request.auth!, courseId, query)),
      });
    },
  );

  router.get(
    '/teacher/courses/:courseId/students/:studentId/progress',
    requirePermission('course.progress_view_owned'),
    async (request, response) => {
      const { courseId, studentId } = parseWithSchema(schemas.teacherStudentParams, request.params);
      const query = parseTeacherReportingQuery(schemas.teacherStudentDetail, request.query);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await teacherReporting.studentDetail(request.auth!, courseId, studentId, query),
      });
    },
  );

  return router;
}
