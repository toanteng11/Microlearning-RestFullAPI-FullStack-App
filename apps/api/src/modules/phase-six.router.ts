import { Router } from 'express';

import { createAuthenticateMiddleware, requirePermission } from '../shared/auth/authenticate.js';
import type { AppConfig } from '../shared/config/environment.js';
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
import { createReportingQuerySchemas } from './reporting/reporting.schemas.js';
import { StudentReportingService } from './reporting/student-reporting.service.js';
import { AuthSessionRepository } from './sessions/auth-session.repository.js';
import { UserRepository } from './users/user.repository.js';

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
  const schemas = createReportingQuerySchemas({
    pageMax: config.reporting.pageMax,
    maxDateRangeDays: config.reporting.maxDateRangeDays,
    defaultTimezone: config.reporting.timezone,
  });

  router.use('/students', authenticate);

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

  return router;
}
