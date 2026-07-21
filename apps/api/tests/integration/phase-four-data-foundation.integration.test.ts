import mongoose, { type Model, Types } from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AnnouncementModel } from '../../src/modules/announcements/announcement.model.js';
import { AnnouncementRepository } from '../../src/modules/announcements/announcement.repository.js';
import { CourseModel } from '../../src/modules/courses/course.model.js';
import { CourseRepository } from '../../src/modules/courses/course.repository.js';
import { LessonDeadlineChangeModel } from '../../src/modules/deadlines/lesson-deadline-change.model.js';
import { LessonDeadlineRepository } from '../../src/modules/deadlines/lesson-deadline.repository.js';
import { FlashcardModel } from '../../src/modules/flashcards/flashcard.model.js';
import { FlashcardRepository } from '../../src/modules/flashcards/flashcard.repository.js';
import { LearningProgressModel } from '../../src/modules/learning-progress/learning-progress.model.js';
import { LearningProgressRepository } from '../../src/modules/learning-progress/learning-progress.repository.js';
import { LessonModel } from '../../src/modules/lessons/lesson.model.js';
import { LessonRepository } from '../../src/modules/lessons/lesson.repository.js';
import { CourseModuleModel } from '../../src/modules/modules/module.model.js';
import { CourseModuleRepository } from '../../src/modules/modules/module.repository.js';
import {
  initializePhaseFourIndexes,
  PHASE_FOUR_MODELS,
} from '../../src/shared/database/phase-four-indexes.js';

const integrationUri = process.env.MONGODB_INTEGRATION_URI;
if (!integrationUri) {
  throw new Error('MONGODB_INTEGRATION_URI is required for Phase 04 integration');
}

const models = PHASE_FOUR_MODELS as readonly Model<never>[];

async function indexByName(model: Model<never>, name: string) {
  const indexes = await model.collection.indexes();
  const index = indexes.find((candidate) => candidate.name === name);
  expect(index, `${model.collection.collectionName}.${name}`).toBeDefined();
  return index!;
}

describe('Phase 04 data foundation on MongoDB replica set', () => {
  beforeAll(async () => {
    await mongoose.connect(integrationUri, { serverSelectionTimeoutMS: 15_000 });
    await initializePhaseFourIndexes('test');
  });

  beforeEach(async () => {
    await Promise.all(models.map((model) => model.deleteMany({})));
  });

  afterAll(async () => mongoose.disconnect());

  it('creates the exact named indexes and unique natural keys', async () => {
    const expectedNames = new Map<Model<never>, string[]>([
      [
        CourseModel as unknown as Model<never>,
        ['course_classroom_status_order', 'course_owner_status_updated'],
      ],
      [CourseModuleModel as unknown as Model<never>, ['module_course_status_order']],
      [
        LessonModel as unknown as Model<never>,
        ['lesson_course_status_order', 'lesson_module_status_order', 'lesson_due_visibility'],
      ],
      [FlashcardModel as unknown as Model<never>, ['flashcard_lesson_status_order']],
      [
        LessonDeadlineChangeModel as unknown as Model<never>,
        ['deadline_history_revision_unique', 'deadline_history_recent'],
      ],
      [AnnouncementModel as unknown as Model<never>, ['announcement_stream']],
      [
        LearningProgressModel as unknown as Model<never>,
        ['progress_activity_unique', 'progress_student_course', 'progress_course_students'],
      ],
    ]);

    for (const [model, names] of expectedNames) {
      const actualNames = (await model.collection.indexes()).map((index) => index.name);
      expect(actualNames).toEqual(expect.arrayContaining(names));
    }

    expect(
      await indexByName(
        LessonDeadlineChangeModel as unknown as Model<never>,
        'deadline_history_revision_unique',
      ),
    ).toMatchObject({ unique: true, key: { lessonId: 1, toRevision: 1 } });
    expect(
      await indexByName(
        LearningProgressModel as unknown as Model<never>,
        'progress_activity_unique',
      ),
    ).toMatchObject({
      unique: true,
      key: { studentId: 1, activityType: 1, activityId: 1 },
    });
  });

  it('persists one complete content graph through lean repository projections', async () => {
    const classroomId = new Types.ObjectId();
    const teacherId = new Types.ObjectId();
    const studentId = new Types.ObjectId();
    const courses = new CourseRepository();
    const modules = new CourseModuleRepository();
    const lessons = new LessonRepository();
    const flashcards = new FlashcardRepository();
    const announcements = new AnnouncementRepository();
    const progress = new LearningProgressRepository();
    const deadlines = new LessonDeadlineRepository();

    const course = await courses.create({
      classroomId,
      ownerTeacherId: teacherId,
      title: '  Backend   Fundamentals ',
      description: '  REST API course ',
      displayOrder: 0,
      createdBy: teacherId,
      updatedBy: teacherId,
    });
    const courseModule = await modules.create({
      courseId: course._id,
      title: 'Module 1',
      displayOrder: 0,
      createdBy: teacherId,
      updatedBy: teacherId,
    });
    const lesson = await lessons.create({
      courseId: course._id,
      moduleId: courseModule._id,
      title: 'Resource naming',
      content: '## Goal\r\n\r\nUse nouns.',
      estimatedMinutes: 8,
      completionDeadline: new Date('2026-08-01T00:00:00.000Z'),
      displayOrder: 0,
      createdBy: teacherId,
      updatedBy: teacherId,
    });
    await flashcards.create({
      lessonId: lesson._id,
      frontText: 'Resource?',
      backText: 'A domain noun.',
      displayOrder: 0,
      createdBy: teacherId,
      updatedBy: teacherId,
    });
    await announcements.create({
      classroomId,
      teacherId,
      content: 'Welcome to the course.',
      createdBy: teacherId,
      updatedBy: teacherId,
    });
    await progress.create({
      studentId,
      classroomId,
      courseId: course._id,
      activityType: 'LESSON',
      activityId: lesson._id,
      status: 'IN_PROGRESS',
      startedAt: new Date('2026-07-20T08:00:00.000Z'),
      lastActiveAt: new Date('2026-07-20T08:00:00.000Z'),
    });
    await deadlines.append({
      lessonId: lesson._id,
      courseId: course._id,
      classroomId,
      fromDeadline: null,
      toDeadline: new Date('2026-08-01T00:00:00.000Z'),
      fromRevision: 0,
      toRevision: 1,
      actorId: teacherId,
      requestId: 'phase-four-integration-request',
      changedAt: new Date('2026-07-20T08:00:00.000Z'),
    });

    const coursePage = await courses.listByClassroom(classroomId, { page: 1, limit: 20 });
    expect(coursePage.items[0]).toMatchObject({
      title: 'Backend Fundamentals',
      description: 'REST API course',
      status: 'DRAFT',
    });
    expect(coursePage.items[0]?.constructor).toBe(Object);
    expect((await modules.listByCourse(course._id))[0]?.constructor).toBe(Object);
    expect((await lessons.listByCourse(course._id))[0]).toMatchObject({
      content: '## Goal\n\nUse nouns.',
      contentRevision: 1,
      deadlineRevision: 0,
    });
    expect(await flashcards.countActiveByLesson(lesson._id)).toBe(1);
    expect(await deadlines.countByLesson(lesson._id)).toBe(1);
    expect(await progress.findByNaturalKey(studentId, 'LESSON', lesson._id)).toMatchObject({
      status: 'IN_PROGRESS',
      completedAt: null,
    });
  });

  it('enforces unique deadline revisions and progress natural keys', async () => {
    const commonId = new Types.ObjectId();
    const teacherId = new Types.ObjectId();
    const deadline = {
      lessonId: commonId,
      courseId: new Types.ObjectId(),
      classroomId: new Types.ObjectId(),
      fromDeadline: null,
      toDeadline: new Date('2026-08-01T00:00:00.000Z'),
      fromRevision: 0,
      toRevision: 1,
      actorId: teacherId,
      requestId: 'request-one',
      changedAt: new Date(),
    };
    await LessonDeadlineChangeModel.create(deadline);
    await expect(
      LessonDeadlineChangeModel.create({ ...deadline, requestId: 'request-two' }),
    ).rejects.toMatchObject({ code: 11000 });

    const progress = {
      studentId: new Types.ObjectId(),
      classroomId: deadline.classroomId,
      courseId: deadline.courseId,
      activityType: 'LESSON' as const,
      activityId: commonId,
      status: 'IN_PROGRESS' as const,
      startedAt: new Date(),
      lastActiveAt: new Date(),
    };
    await LearningProgressModel.create(progress);
    await expect(LearningProgressModel.create(progress)).rejects.toMatchObject({ code: 11000 });
  });

  it('uses declared query indexes and detects a missing Production index', async () => {
    const classroomId = new Types.ObjectId();
    const courseExplain = await CourseModel.find({ classroomId, status: 'DRAFT' })
      .sort({ displayOrder: 1, _id: 1 })
      .hint('course_classroom_status_order')
      .explain('queryPlanner');
    expect(JSON.stringify(courseExplain)).toContain('course_classroom_status_order');

    await LearningProgressModel.collection.dropIndex('progress_course_students');
    await expect(initializePhaseFourIndexes('production')).rejects.toThrow(
      'Phase 04 index compatibility check failed',
    );
    await LearningProgressModel.createIndexes();
    await expect(initializePhaseFourIndexes('production')).resolves.toBeUndefined();
  });
});
