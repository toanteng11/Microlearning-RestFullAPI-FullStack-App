import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';

import { createAuthenticateMiddleware, requirePermission } from '../shared/auth/authenticate.js';
import type { AppConfig } from '../shared/config/environment.js';
import { AppError } from '../shared/errors/app-error.js';
import { parseWithSchema } from '../shared/validation/parse.js';
import { AuditLogRepository } from './audit/audit-log.repository.js';
import { PhaseFourAuditWriter } from './audit/phase-four-audit.writer.js';
import { AnnouncementRepository } from './announcements/announcement.repository.js';
import {
  announcementListQuerySchema,
  announcementParamsSchema,
  archiveAnnouncementSchema,
  changeAnnouncementStatusSchema,
  classroomAnnouncementParamsSchema,
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from './announcements/announcement.schemas.js';
import { AnnouncementService } from './announcements/announcement.service.js';
import { AuthLoginStateRepository } from './auth/auth-login-state.repository.js';
import { AuthService } from './auth/auth.service.js';
import { ClassroomRepository } from './classrooms/classroom.repository.js';
import { CourseScopeRepositoryAdapter } from './courses/course-scope.adapter.js';
import {
  adminCourseListQuerySchema,
  adminCourseParamsSchema,
} from './courses/course-governance.schemas.js';
import { CourseGovernanceService } from './courses/course-governance.service.js';
import { CourseRepository } from './courses/course.repository.js';
import { LessonDeadlineRepository } from './deadlines/lesson-deadline.repository.js';
import {
  changeLessonDeadlineSchema,
  deadlineHistoryQuerySchema,
  teacherLessonIdSchema,
} from './deadlines/lesson-deadline.schemas.js';
import { LessonDeadlineService } from './deadlines/lesson-deadline.service.js';
import {
  archiveCourseSchema,
  changeCourseStatusSchema,
  courseIdSchema,
  courseListQuerySchema,
  createCourseSchema,
  updateCourseSchema,
} from './courses/course.schemas.js';
import { CourseService } from './courses/course.service.js';
import { EnrollmentRepository } from './enrollments/enrollment.repository.js';
import {
  archiveFlashcardSchema,
  createFlashcardSchema,
  flashcardIdSchema,
  lessonIdForFlashcardsSchema,
  reorderFlashcardsSchema,
  updateFlashcardSchema,
} from './flashcards/flashcard.schemas.js';
import { FlashcardRepository } from './flashcards/flashcard.repository.js';
import { FlashcardService } from './flashcards/flashcard.service.js';
import {
  archiveLessonSchema,
  changeLessonStatusSchema,
  courseIdForLessonsSchema,
  createLessonSchema,
  lessonIdSchema,
  lessonListQuerySchema,
  reorderLessonsSchema,
  updateLessonSchema,
} from './lessons/lesson.schemas.js';
import { LessonRepository } from './lessons/lesson.repository.js';
import { LessonService } from './lessons/lesson.service.js';
import { LearningProgressRepository } from './learning-progress/learning-progress.repository.js';
import {
  learningLessonParamsSchema,
  ownCourseProgressQuerySchema,
  studentClassworkParamsSchema,
  studentDeadlineQuerySchema,
  studentTodoQuerySchema,
  teacherActivityQuerySchema,
  teacherCourseParamsSchema,
  teacherProgressQuerySchema,
} from './learning-progress/learning-progress.schemas.js';
import { StudentLearningService } from './learning-progress/student-learning.service.js';
import { TeacherCourseDashboardService } from './learning-progress/teacher-course-dashboard.service.js';
import {
  archiveModuleSchema,
  changeModuleStatusSchema,
  courseIdForModulesSchema,
  createModuleSchema,
  moduleIdSchema,
  reorderModulesSchema,
  updateModuleSchema,
} from './modules/module.schemas.js';
import { CourseModuleRepository } from './modules/module.repository.js';
import { CourseModuleService } from './modules/module.service.js';
import { createPhaseFourFoundation } from './phase-four.foundation.js';
import { AuthSessionRepository } from './sessions/auth-session.repository.js';
import { UserRepository } from './users/user.repository.js';

function requestIdFrom(response: {
  getHeader(name: string): number | string | string[] | undefined;
}) {
  return String(response.getHeader('x-request-id') ?? 'unknown');
}

function createContentWriteLimiter(windowSeconds: number, max: number) {
  return rateLimit({
    windowMs: windowSeconds * 1000,
    limit: max,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: (request) =>
      request.method === 'GET' ||
      request.method === 'HEAD' ||
      request.path.endsWith('/start') ||
      request.path.endsWith('/complete'),
    keyGenerator: (request) => request.auth?.id ?? 'unauthenticated',
    handler: (_request, _response, next) =>
      next(new AppError(429, 'RATE_LIMITED', 'Too many content changes. Try again later')),
  });
}

function createLearningActionLimiter(windowSeconds: number, max: number) {
  return rateLimit({
    windowMs: windowSeconds * 1000,
    limit: max,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: (request) => request.auth?.id ?? 'unauthenticated',
    handler: (_request, _response, next) =>
      next(new AppError(429, 'RATE_LIMITED', 'Too many learning actions. Try again later')),
  });
}

export function createPhaseFourRouter(config: AppConfig, classrooms = new ClassroomRepository()) {
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
  const flashcards = new FlashcardRepository();
  const deadlines = new LessonDeadlineRepository();
  const progress = new LearningProgressRepository();
  const announcements = new AnnouncementRepository();
  const foundation = createPhaseFourFoundation(classrooms, enrollments);
  const courseScopes = new CourseScopeRepositoryAdapter(courses, foundation.classroomScopeReader);
  const audits = new PhaseFourAuditWriter(new AuditLogRepository());
  const courseService = new CourseService(
    courses,
    modules,
    lessons,
    foundation.classroomScopeReader,
    courseScopes,
    audits,
    config.contentLimits.coursesPerClassroom,
  );
  const moduleService = new CourseModuleService(
    courses,
    modules,
    lessons,
    courseScopes,
    audits,
    config.contentLimits.modulesPerCourse,
  );
  const lessonService = new LessonService(
    courses,
    modules,
    lessons,
    deadlines,
    courseScopes,
    audits,
    config.contentLimits.lessonsPerCourse,
  );
  const flashcardService = new FlashcardService(
    flashcards,
    lessons,
    modules,
    courseScopes,
    audits,
    config.contentLimits.flashcardsPerLesson,
  );
  const deadlineService = new LessonDeadlineService(lessons, deadlines, courseScopes, audits);
  const studentLearningService = new StudentLearningService(
    classrooms,
    enrollments,
    courses,
    modules,
    lessons,
    flashcards,
    progress,
    foundation.classroomScopeReader,
    courseScopes,
  );
  const teacherDashboardService = new TeacherCourseDashboardService(
    classrooms,
    enrollments,
    users,
    courses,
    modules,
    lessons,
    progress,
    courseScopes,
  );
  const announcementService = new AnnouncementService(
    announcements,
    foundation.classroomScopeReader,
    audits,
  );
  const courseGovernanceService = new CourseGovernanceService(courses);

  const contentWriteLimiter = createContentWriteLimiter(
    config.learningRateLimits.contentWriteWindowSeconds,
    config.learningRateLimits.contentWriteIdentityMax,
  );
  const learningActionLimiter = createLearningActionLimiter(
    config.learningRateLimits.learningActionWindowSeconds,
    config.learningRateLimits.learningActionIdentityMax,
  );
  router.use(
    [
      '/courses',
      '/modules',
      '/lessons',
      '/flashcards',
      '/announcements',
      '/classrooms',
      '/students',
      '/teacher/lessons',
      '/teacher/courses',
      '/admin/courses',
    ],
    authenticate,
    contentWriteLimiter,
  );

  router.get('/courses', async (request, response) => {
    const input = parseWithSchema(courseListQuerySchema, request.query);
    response.setHeader('Cache-Control', 'private, no-store');
    response.json({ success: true, ...(await courseService.list(request.auth!, input)) });
  });

  router.post('/courses', requirePermission('course.create'), async (request, response) => {
    const input = parseWithSchema(createCourseSchema, request.body);
    const result = await courseService.create(request.auth!, input, requestIdFrom(response));
    response.setHeader('Cache-Control', 'private, no-store');
    response.status(201).json({ success: true, data: result });
  });

  router.get('/courses/:courseId', async (request, response) => {
    const { courseId } = parseWithSchema(courseIdSchema, request.params);
    response.setHeader('Cache-Control', 'private, no-store');
    response.json({
      success: true,
      data: { course: await courseService.getDetail(request.auth!, courseId) },
    });
  });

  router.patch(
    '/courses/:courseId',
    requirePermission('course.update_owned'),
    async (request, response) => {
      const { courseId } = parseWithSchema(courseIdSchema, request.params);
      const input = parseWithSchema(updateCourseSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await courseService.update(request.auth!, courseId, input, requestIdFrom(response)),
      });
    },
  );

  router.patch(
    '/courses/:courseId/status',
    requirePermission('course.publish_owned'),
    async (request, response) => {
      const { courseId } = parseWithSchema(courseIdSchema, request.params);
      const input = parseWithSchema(changeCourseStatusSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await courseService.changeStatus(
          request.auth!,
          courseId,
          input,
          requestIdFrom(response),
        ),
      });
    },
  );

  router.delete(
    '/courses/:courseId',
    requirePermission('course.archive_owned'),
    async (request, response) => {
      const { courseId } = parseWithSchema(courseIdSchema, request.params);
      const input = parseWithSchema(archiveCourseSchema, request.body);
      await courseService.archive(request.auth!, courseId, input, requestIdFrom(response));
      response.status(204).end();
    },
  );

  router.get('/courses/:courseId/modules', async (request, response) => {
    const { courseId } = parseWithSchema(courseIdForModulesSchema, request.params);
    response.setHeader('Cache-Control', 'private, no-store');
    response.json({
      success: true,
      data: { items: await moduleService.list(request.auth!, courseId) },
    });
  });

  router.post(
    '/courses/:courseId/modules',
    requirePermission('course.update_owned'),
    async (request, response) => {
      const { courseId } = parseWithSchema(courseIdForModulesSchema, request.params);
      const input = parseWithSchema(createModuleSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.status(201).json({
        success: true,
        data: await moduleService.create(request.auth!, courseId, input, requestIdFrom(response)),
      });
    },
  );

  router.patch(
    '/modules/:moduleId',
    requirePermission('course.update_owned'),
    async (request, response) => {
      const { moduleId } = parseWithSchema(moduleIdSchema, request.params);
      const input = parseWithSchema(updateModuleSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await moduleService.update(request.auth!, moduleId, input, requestIdFrom(response)),
      });
    },
  );

  router.patch(
    '/modules/:moduleId/status',
    requirePermission('course.publish_owned'),
    async (request, response) => {
      const { moduleId } = parseWithSchema(moduleIdSchema, request.params);
      const input = parseWithSchema(changeModuleStatusSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await moduleService.changeStatus(
          request.auth!,
          moduleId,
          input,
          requestIdFrom(response),
        ),
      });
    },
  );

  router.delete(
    '/modules/:moduleId',
    requirePermission('course.archive_owned'),
    async (request, response) => {
      const { moduleId } = parseWithSchema(moduleIdSchema, request.params);
      const input = parseWithSchema(archiveModuleSchema, request.body);
      await moduleService.archive(request.auth!, moduleId, input, requestIdFrom(response));
      response.status(204).end();
    },
  );

  router.patch(
    '/courses/:courseId/modules/reorder',
    requirePermission('content.reorder_owned'),
    async (request, response) => {
      const { courseId } = parseWithSchema(courseIdForModulesSchema, request.params);
      const input = parseWithSchema(reorderModulesSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await moduleService.reorder(request.auth!, courseId, input, requestIdFrom(response)),
      });
    },
  );

  router.get('/courses/:courseId/lessons', async (request, response) => {
    const { courseId } = parseWithSchema(courseIdForLessonsSchema, request.params);
    const query = parseWithSchema(lessonListQuerySchema, request.query);
    response.setHeader('Cache-Control', 'private, no-store');
    response.json({
      success: true,
      data: { items: await lessonService.list(request.auth!, courseId, query) },
    });
  });

  router.post('/lessons', requirePermission('lesson.manage_owned'), async (request, response) => {
    const input = parseWithSchema(createLessonSchema, request.body);
    response.setHeader('Cache-Control', 'private, no-store');
    response.status(201).json({
      success: true,
      data: await lessonService.create(request.auth!, input, requestIdFrom(response)),
    });
  });

  router.get('/lessons/:lessonId', async (request, response) => {
    const { lessonId } = parseWithSchema(lessonIdSchema, request.params);
    response.setHeader('Cache-Control', 'private, no-store');
    response.json({
      success: true,
      data:
        request.auth!.role === 'STUDENT'
          ? await studentLearningService.player(request.auth!, lessonId)
          : { lesson: await lessonService.getDetail(request.auth!, lessonId) },
    });
  });

  router.post(
    '/lessons/:lessonId/start',
    requirePermission('learning.complete_own'),
    learningActionLimiter,
    async (request, response) => {
      const { lessonId } = parseWithSchema(learningLessonParamsSchema, request.params);
      const result = await studentLearningService.start(request.auth!, lessonId);
      response.setHeader('Cache-Control', 'private, no-store');
      response.status(result.newlyStarted ? 201 : 200).json({ success: true, data: result });
    },
  );

  router.post(
    '/lessons/:lessonId/complete',
    requirePermission('learning.complete_own'),
    learningActionLimiter,
    async (request, response) => {
      const { lessonId } = parseWithSchema(learningLessonParamsSchema, request.params);
      const result = await studentLearningService.complete(request.auth!, lessonId);
      response.setHeader('Cache-Control', 'private, no-store');
      response.status(result.newlyCompleted ? 201 : 200).json({ success: true, data: result });
    },
  );

  router.patch(
    '/lessons/:lessonId',
    requirePermission('lesson.manage_owned'),
    async (request, response) => {
      const { lessonId } = parseWithSchema(lessonIdSchema, request.params);
      const input = parseWithSchema(updateLessonSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await lessonService.update(request.auth!, lessonId, input, requestIdFrom(response)),
      });
    },
  );

  router.patch(
    '/lessons/:lessonId/status',
    requirePermission('course.publish_owned'),
    async (request, response) => {
      const { lessonId } = parseWithSchema(lessonIdSchema, request.params);
      const input = parseWithSchema(changeLessonStatusSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await lessonService.changeStatus(
          request.auth!,
          lessonId,
          input,
          requestIdFrom(response),
        ),
      });
    },
  );

  router.delete(
    '/lessons/:lessonId',
    requirePermission('course.archive_owned'),
    async (request, response) => {
      const { lessonId } = parseWithSchema(lessonIdSchema, request.params);
      const input = parseWithSchema(archiveLessonSchema, request.body);
      await lessonService.archive(request.auth!, lessonId, input, requestIdFrom(response));
      response.status(204).end();
    },
  );

  router.post(
    '/lessons/:lessonId/preview',
    requirePermission('lesson.manage_owned'),
    async (request, response) => {
      const { lessonId } = parseWithSchema(lessonIdSchema, request.params);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: { lesson: await lessonService.preview(request.auth!, lessonId) },
      });
    },
  );

  router.patch(
    '/courses/:courseId/lessons/reorder',
    requirePermission('content.reorder_owned'),
    async (request, response) => {
      const { courseId } = parseWithSchema(courseIdForLessonsSchema, request.params);
      const input = parseWithSchema(reorderLessonsSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await lessonService.reorder(request.auth!, courseId, input, requestIdFrom(response)),
      });
    },
  );

  router.get('/lessons/:lessonId/flashcards', async (request, response) => {
    const { lessonId } = parseWithSchema(lessonIdForFlashcardsSchema, request.params);
    response.setHeader('Cache-Control', 'private, no-store');
    response.json({
      success: true,
      data: { items: await flashcardService.list(request.auth!, lessonId) },
    });
  });

  router.post(
    '/lessons/:lessonId/flashcards',
    requirePermission('lesson.manage_owned'),
    async (request, response) => {
      const { lessonId } = parseWithSchema(lessonIdForFlashcardsSchema, request.params);
      const input = parseWithSchema(createFlashcardSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.status(201).json({
        success: true,
        data: await flashcardService.create(
          request.auth!,
          lessonId,
          input,
          requestIdFrom(response),
        ),
      });
    },
  );

  router.patch(
    '/flashcards/:flashcardId',
    requirePermission('lesson.manage_owned'),
    async (request, response) => {
      const { flashcardId } = parseWithSchema(flashcardIdSchema, request.params);
      const input = parseWithSchema(updateFlashcardSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await flashcardService.update(
          request.auth!,
          flashcardId,
          input,
          requestIdFrom(response),
        ),
      });
    },
  );

  router.delete(
    '/flashcards/:flashcardId',
    requirePermission('lesson.manage_owned'),
    async (request, response) => {
      const { flashcardId } = parseWithSchema(flashcardIdSchema, request.params);
      const input = parseWithSchema(archiveFlashcardSchema, request.body);
      await flashcardService.archive(request.auth!, flashcardId, input, requestIdFrom(response));
      response.status(204).end();
    },
  );

  router.patch(
    '/lessons/:lessonId/flashcards/reorder',
    requirePermission('content.reorder_owned'),
    async (request, response) => {
      const { lessonId } = parseWithSchema(lessonIdForFlashcardsSchema, request.params);
      const input = parseWithSchema(reorderFlashcardsSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await flashcardService.reorder(
          request.auth!,
          lessonId,
          input,
          requestIdFrom(response),
        ),
      });
    },
  );

  router.patch(
    '/teacher/lessons/:lessonId/deadline',
    requirePermission('lesson.deadline_manage_owned'),
    async (request, response) => {
      const { lessonId } = parseWithSchema(teacherLessonIdSchema, request.params);
      const input = parseWithSchema(changeLessonDeadlineSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await deadlineService.change(request.auth!, lessonId, input, requestIdFrom(response)),
      });
    },
  );

  router.get(
    '/teacher/lessons/:lessonId/deadline-history',
    requirePermission('lesson.deadline_manage_owned'),
    async (request, response) => {
      const { lessonId } = parseWithSchema(teacherLessonIdSchema, request.params);
      const query = parseWithSchema(deadlineHistoryQuerySchema, request.query);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        ...(await deadlineService.history(request.auth!, lessonId, query)),
      });
    },
  );

  router.get(
    '/classrooms/:classroomId/classwork',
    requirePermission('learning.view_enrolled'),
    async (request, response) => {
      const { classroomId } = parseWithSchema(studentClassworkParamsSchema, request.params);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await studentLearningService.classwork(request.auth!, classroomId),
      });
    },
  );

  router.get(
    '/students/me/todo',
    requirePermission('learning.view_enrolled'),
    async (request, response) => {
      const query = parseWithSchema(studentTodoQuerySchema, request.query);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        ...(await studentLearningService.todo(request.auth!, query)),
      });
    },
  );

  router.get(
    '/students/me/deadlines',
    requirePermission('learning.view_enrolled'),
    async (request, response) => {
      const query = parseWithSchema(studentDeadlineQuerySchema, request.query);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        ...(await studentLearningService.deadlines(request.auth!, query)),
      });
    },
  );

  router.get(
    '/students/me/progress',
    requirePermission('learning.view_enrolled'),
    async (request, response) => {
      const { courseId } = parseWithSchema(ownCourseProgressQuerySchema, request.query);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await studentLearningService.ownProgress(request.auth!, courseId),
      });
    },
  );

  router.get(
    '/teacher/courses/:courseId/dashboard',
    requirePermission('course.progress_view_owned'),
    async (request, response) => {
      const { courseId } = parseWithSchema(teacherCourseParamsSchema, request.params);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await teacherDashboardService.dashboard(request.auth!, courseId),
      });
    },
  );

  router.get(
    '/teacher/courses/:courseId/activities',
    requirePermission('course.progress_view_owned'),
    async (request, response) => {
      const { courseId } = parseWithSchema(teacherCourseParamsSchema, request.params);
      const query = parseWithSchema(teacherActivityQuerySchema, request.query);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        ...(await teacherDashboardService.activities(request.auth!, courseId, query)),
      });
    },
  );

  router.get(
    '/teacher/courses/:courseId/students',
    requirePermission('course.progress_view_owned'),
    async (request, response) => {
      const { courseId } = parseWithSchema(teacherCourseParamsSchema, request.params);
      const query = parseWithSchema(teacherProgressQuerySchema, request.query);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        ...(await teacherDashboardService.students(request.auth!, courseId, query)),
      });
    },
  );

  router.get(
    '/teacher/courses/:courseId/progress',
    requirePermission('course.progress_view_owned'),
    async (request, response) => {
      const { courseId } = parseWithSchema(teacherCourseParamsSchema, request.params);
      const query = parseWithSchema(teacherProgressQuerySchema, request.query);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        ...(await teacherDashboardService.ranking(request.auth!, courseId, query)),
      });
    },
  );

  router.get('/classrooms/:classroomId/announcements', async (request, response) => {
    const { classroomId } = parseWithSchema(classroomAnnouncementParamsSchema, request.params);
    const query = parseWithSchema(announcementListQuerySchema, request.query);
    response.setHeader('Cache-Control', 'private, no-store');
    response.json({
      success: true,
      ...(await announcementService.list(request.auth!, classroomId, query)),
    });
  });

  router.post(
    '/classrooms/:classroomId/announcements',
    requirePermission('announcement.manage_owned'),
    async (request, response) => {
      const { classroomId } = parseWithSchema(classroomAnnouncementParamsSchema, request.params);
      const input = parseWithSchema(createAnnouncementSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.status(201).json({
        success: true,
        data: await announcementService.create(
          request.auth!,
          classroomId,
          input,
          requestIdFrom(response),
        ),
      });
    },
  );

  router.patch(
    '/announcements/:announcementId',
    requirePermission('announcement.manage_owned'),
    async (request, response) => {
      const { announcementId } = parseWithSchema(announcementParamsSchema, request.params);
      const input = parseWithSchema(updateAnnouncementSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await announcementService.update(
          request.auth!,
          announcementId,
          input,
          requestIdFrom(response),
        ),
      });
    },
  );

  router.patch(
    '/announcements/:announcementId/status',
    requirePermission('announcement.manage_owned'),
    async (request, response) => {
      const { announcementId } = parseWithSchema(announcementParamsSchema, request.params);
      const input = parseWithSchema(changeAnnouncementStatusSchema, request.body);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: await announcementService.changeStatus(
          request.auth!,
          announcementId,
          input,
          requestIdFrom(response),
        ),
      });
    },
  );

  router.delete(
    '/announcements/:announcementId',
    requirePermission('announcement.manage_owned'),
    async (request, response) => {
      const { announcementId } = parseWithSchema(announcementParamsSchema, request.params);
      const input = parseWithSchema(archiveAnnouncementSchema, request.body);
      await announcementService.archive(
        request.auth!,
        announcementId,
        input,
        requestIdFrom(response),
      );
      response.status(204).end();
    },
  );

  router.get(
    '/admin/courses',
    requirePermission('content.governance_view'),
    async (request, response) => {
      const query = parseWithSchema(adminCourseListQuerySchema, request.query);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        ...(await courseGovernanceService.list(request.auth!, query)),
      });
    },
  );

  router.get(
    '/admin/courses/:courseId',
    requirePermission('content.governance_view'),
    async (request, response) => {
      const { courseId } = parseWithSchema(adminCourseParamsSchema, request.params);
      response.setHeader('Cache-Control', 'private, no-store');
      response.json({
        success: true,
        data: { course: await courseGovernanceService.detail(request.auth!, courseId) },
      });
    },
  );

  return router;
}
