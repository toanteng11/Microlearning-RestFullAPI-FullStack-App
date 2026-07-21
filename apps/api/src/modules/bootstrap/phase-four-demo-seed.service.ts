import { Types } from 'mongoose';

import type { AppConfig } from '../../shared/config/environment.js';
import { AppError } from '../../shared/errors/app-error.js';
import { AnnouncementModel } from '../announcements/announcement.model.js';
import { CourseModel } from '../courses/course.model.js';
import { LessonDeadlineChangeModel } from '../deadlines/lesson-deadline-change.model.js';
import { FlashcardModel } from '../flashcards/flashcard.model.js';
import { LearningProgressModel } from '../learning-progress/learning-progress.model.js';
import { LessonModel } from '../lessons/lesson.model.js';
import { CourseModuleModel } from '../modules/module.model.js';

interface SeedUserReference {
  id: string;
  email: string;
}

const IDS = {
  classroom: new Types.ObjectId('640000000000000000000001'),
  course: new Types.ObjectId('650000000000000000000001'),
  moduleFoundations: new Types.ObjectId('650000000000000000000011'),
  moduleDelivery: new Types.ObjectId('650000000000000000000012'),
  lessonRest: new Types.ObjectId('650000000000000000000021'),
  lessonSecurity: new Types.ObjectId('650000000000000000000022'),
  lessonDelivery: new Types.ObjectId('650000000000000000000023'),
  flashcardRest: new Types.ObjectId('650000000000000000000031'),
  flashcardStatus: new Types.ObjectId('650000000000000000000032'),
  flashcardJwt: new Types.ObjectId('650000000000000000000033'),
  deadlineRest: new Types.ObjectId('650000000000000000000041'),
  deadlineSecurity: new Types.ObjectId('650000000000000000000042'),
  deadlineDelivery: new Types.ObjectId('650000000000000000000043'),
  announcement: new Types.ObjectId('650000000000000000000051'),
  progressRest: new Types.ObjectId('650000000000000000000061'),
  progressSecurity: new Types.ObjectId('650000000000000000000062'),
} as const;

function requireUser(users: readonly SeedUserReference[], email: string): Types.ObjectId {
  const user = users.find((item) => item.email === email);
  if (!user || !Types.ObjectId.isValid(user.id)) {
    throw new AppError(409, 'DEMO_SEED_USER_MISSING', `Required demo identity ${email} is missing`);
  }
  return new Types.ObjectId(user.id);
}

export class PhaseFourDemoSeedService {
  constructor(private readonly environment: AppConfig['appEnvironment']) {}

  async execute(users: readonly SeedUserReference[], now = new Date()) {
    if (this.environment === 'production') {
      throw new AppError(403, 'DEMO_SEED_DISABLED', 'Demo seed is disabled in production');
    }

    const teacher = requireUser(users, 'teacher.active@example.test');
    const student = requireUser(users, 'student.active@example.test');
    const publishedAt = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1_000);
    const completedAt = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1_000);
    const overdueDeadline = new Date(now.getTime() - 24 * 60 * 60 * 1_000);
    const upcomingDeadline = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1_000);
    const laterDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1_000);

    const courseResult = await CourseModel.bulkWrite([
      {
        updateOne: {
          filter: { _id: IDS.course },
          update: {
            $setOnInsert: {
              classroomId: IDS.classroom,
              ownerTeacherId: teacher,
              title: 'RESTful API Microlearning',
              description: 'Khóa học mẫu Phase 04 về thiết kế, bảo mật và triển khai RESTful API.',
              status: 'PUBLISHED',
              scheduledPublishAt: null,
              publishedAt,
              unpublishedAt: null,
              archivedAt: null,
              displayOrder: 0,
              structureRevision: 1,
              schemaVersion: 1,
              createdBy: teacher,
              updatedBy: teacher,
              createdAt: publishedAt,
              updatedAt: publishedAt,
            },
          },
          upsert: true,
          timestamps: false,
        },
      },
    ]);

    const moduleResult = await CourseModuleModel.bulkWrite(
      [
        {
          updateOne: {
            filter: { _id: IDS.moduleFoundations },
            update: {
              $setOnInsert: {
                courseId: IDS.course,
                title: 'Nền tảng RESTful API',
                description: 'Tài nguyên, HTTP method và mã trạng thái.',
                status: 'PUBLISHED',
                displayOrder: 0,
                archivedAt: null,
                schemaVersion: 1,
                createdBy: teacher,
                updatedBy: teacher,
                createdAt: publishedAt,
                updatedAt: publishedAt,
              },
            },
            upsert: true,
            timestamps: false,
          },
        },
        {
          updateOne: {
            filter: { _id: IDS.moduleDelivery },
            update: {
              $setOnInsert: {
                courseId: IDS.course,
                title: 'Bảo mật và triển khai',
                description: 'JWT, Docker, CI/CD và Cloud Run.',
                status: 'PUBLISHED',
                displayOrder: 1,
                archivedAt: null,
                schemaVersion: 1,
                createdBy: teacher,
                updatedBy: teacher,
                createdAt: publishedAt,
                updatedAt: publishedAt,
              },
            },
            upsert: true,
            timestamps: false,
          },
        },
      ],
      { ordered: true },
    );

    const lessonDefinitions = [
      {
        id: IDS.lessonRest,
        moduleId: IDS.moduleFoundations,
        title: 'Thiết kế tài nguyên REST',
        content: '# Thiết kế tài nguyên\n\nSử dụng danh từ và biểu diễn quan hệ bằng URL rõ ràng.',
        estimatedMinutes: 8,
        deadline: overdueDeadline,
        displayOrder: 0,
      },
      {
        id: IDS.lessonSecurity,
        moduleId: IDS.moduleFoundations,
        title: 'Bảo vệ API với JWT và RBAC',
        content: '# JWT và RBAC\n\nXác thực danh tính trước khi kiểm tra quyền trên tài nguyên.',
        estimatedMinutes: 10,
        deadline: upcomingDeadline,
        displayOrder: 1,
      },
      {
        id: IDS.lessonDelivery,
        moduleId: IDS.moduleDelivery,
        title: 'Đóng gói và triển khai Cloud Run',
        content:
          '# Triển khai\n\nBuild Docker image, chạy quality gates và phát hành lên Cloud Run.',
        estimatedMinutes: 12,
        deadline: laterDeadline,
        displayOrder: 0,
      },
    ] as const;

    const lessonResult = await LessonModel.bulkWrite(
      lessonDefinitions.map((lesson) => ({
        updateOne: {
          filter: { _id: lesson.id },
          update: {
            $setOnInsert: {
              courseId: IDS.course,
              moduleId: lesson.moduleId,
              title: lesson.title,
              content: lesson.content,
              contentFormat: 'MARKDOWN',
              estimatedMinutes: lesson.estimatedMinutes,
              isRequired: true,
              status: 'PUBLISHED',
              scheduledPublishAt: null,
              publishedAt,
              unpublishedAt: null,
              archivedAt: null,
              publishedRevision: 1,
              contentRevision: 1,
              completionDeadline: lesson.deadline,
              deadlineRevision: 1,
              deadlineLastUpdatedAt: publishedAt,
              deadlineLastUpdatedBy: teacher,
              displayOrder: lesson.displayOrder,
              flashcardRevision: 1,
              schemaVersion: 1,
              createdBy: teacher,
              updatedBy: teacher,
              createdAt: publishedAt,
              updatedAt: publishedAt,
            },
          },
          upsert: true,
          timestamps: false,
        },
      })),
      { ordered: true },
    );

    const flashcardResult = await FlashcardModel.bulkWrite(
      [
        {
          id: IDS.flashcardRest,
          lessonId: IDS.lessonRest,
          frontText: 'REST là viết tắt của gì?',
          backText: 'Representational State Transfer',
          displayOrder: 0,
        },
        {
          id: IDS.flashcardStatus,
          lessonId: IDS.lessonRest,
          frontText: 'HTTP 201 biểu thị điều gì?',
          backText: 'Tài nguyên đã được tạo thành công.',
          displayOrder: 1,
        },
        {
          id: IDS.flashcardJwt,
          lessonId: IDS.lessonSecurity,
          frontText: 'RBAC dùng để làm gì?',
          backText: 'Phân quyền theo vai trò của người dùng.',
          displayOrder: 0,
        },
      ].map((flashcard) => ({
        updateOne: {
          filter: { _id: flashcard.id },
          update: {
            $setOnInsert: {
              lessonId: flashcard.lessonId,
              frontText: flashcard.frontText,
              backText: flashcard.backText,
              displayOrder: flashcard.displayOrder,
              status: 'ACTIVE',
              archivedAt: null,
              schemaVersion: 1,
              createdBy: teacher,
              updatedBy: teacher,
              createdAt: publishedAt,
              updatedAt: publishedAt,
            },
          },
          upsert: true,
          timestamps: false,
        },
      })),
      { ordered: true },
    );

    const deadlineResult = await LessonDeadlineChangeModel.bulkWrite(
      lessonDefinitions.map((lesson, index) => ({
        updateOne: {
          filter: { _id: [IDS.deadlineRest, IDS.deadlineSecurity, IDS.deadlineDelivery][index] },
          update: {
            $setOnInsert: {
              lessonId: lesson.id,
              courseId: IDS.course,
              classroomId: IDS.classroom,
              fromDeadline: null,
              toDeadline: lesson.deadline,
              fromRevision: 0,
              toRevision: 1,
              reason: 'Deadline khởi tạo bởi Phase 04 demo seed.',
              actorId: teacher,
              requestId: `phase-04-demo-seed-${index + 1}`,
              changedAt: publishedAt,
              schemaVersion: 1,
            },
          },
          upsert: true,
        },
      })),
      { ordered: true },
    );

    const announcementResult = await AnnouncementModel.bulkWrite([
      {
        updateOne: {
          filter: { _id: IDS.announcement },
          update: {
            $setOnInsert: {
              classroomId: IDS.classroom,
              teacherId: teacher,
              content: 'Chào mừng lớp học đến với khóa RESTful API Microlearning.',
              status: 'PUBLISHED',
              scheduledPublishAt: null,
              publishedAt,
              unpublishedAt: null,
              archivedAt: null,
              schemaVersion: 1,
              createdBy: teacher,
              updatedBy: teacher,
              createdAt: publishedAt,
              updatedAt: publishedAt,
            },
          },
          upsert: true,
          timestamps: false,
        },
      },
    ]);

    const progressResult = await LearningProgressModel.bulkWrite(
      [
        {
          id: IDS.progressRest,
          lessonId: IDS.lessonRest,
          status: 'COMPLETED' as const,
          startedAt: new Date(completedAt.getTime() - 15 * 60 * 1_000),
          completedAt,
        },
        {
          id: IDS.progressSecurity,
          lessonId: IDS.lessonSecurity,
          status: 'IN_PROGRESS' as const,
          startedAt: completedAt,
          completedAt: null,
        },
      ].map((progress) => ({
        updateOne: {
          filter: { _id: progress.id },
          update: {
            $setOnInsert: {
              studentId: student,
              classroomId: IDS.classroom,
              courseId: IDS.course,
              activityType: 'LESSON',
              activityId: progress.lessonId,
              status: progress.status,
              startedAt: progress.startedAt,
              completedAt: progress.completedAt,
              lastActiveAt: progress.completedAt ?? progress.startedAt,
              schemaVersion: 1,
              createdAt: progress.startedAt,
              updatedAt: progress.completedAt ?? progress.startedAt,
            },
          },
          upsert: true,
          timestamps: false,
        },
      })),
      { ordered: true },
    );

    const attempted = 15;
    const createdCount =
      courseResult.upsertedCount +
      moduleResult.upsertedCount +
      lessonResult.upsertedCount +
      flashcardResult.upsertedCount +
      deadlineResult.upsertedCount +
      announcementResult.upsertedCount +
      progressResult.upsertedCount;

    return {
      createdCount,
      reusedCount: attempted - createdCount,
      resources: {
        courseId: IDS.course.toString(),
        moduleIds: [IDS.moduleFoundations, IDS.moduleDelivery].map((id) => id.toString()),
        lessonIds: [IDS.lessonRest, IDS.lessonSecurity, IDS.lessonDelivery].map((id) =>
          id.toString(),
        ),
        flashcardCount: 3,
        announcementId: IDS.announcement.toString(),
        progressCount: 2,
      },
    };
  }
}
