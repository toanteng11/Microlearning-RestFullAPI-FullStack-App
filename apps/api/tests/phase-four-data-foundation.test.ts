import { type IndexDefinition, type IndexOptions, Types } from 'mongoose';
import { describe, expect, it } from 'vitest';

import { AnnouncementModel } from '../src/modules/announcements/announcement.model.js';
import { CourseModel } from '../src/modules/courses/course.model.js';
import { LessonDeadlineChangeModel } from '../src/modules/deadlines/lesson-deadline-change.model.js';
import { LessonDeadlineRepository } from '../src/modules/deadlines/lesson-deadline.repository.js';
import { FlashcardModel } from '../src/modules/flashcards/flashcard.model.js';
import { LearningProgressModel } from '../src/modules/learning-progress/learning-progress.model.js';
import { LessonModel } from '../src/modules/lessons/lesson.model.js';
import { CourseModuleModel } from '../src/modules/modules/module.model.js';
import { PHASE_FOUR_MODELS } from '../src/shared/database/phase-four-indexes.js';

const actorId = new Types.ObjectId();
const classroomId = new Types.ObjectId();
const courseId = new Types.ObjectId();
const lessonId = new Types.ObjectId();

describe('Phase 04 model foundation', () => {
  it('registers exactly the seven Must collections and their named index manifest', () => {
    expect(PHASE_FOUR_MODELS.map((model) => model.collection.collectionName)).toEqual([
      'courses',
      'course_modules',
      'lessons',
      'flashcards',
      'lesson_deadline_changes',
      'announcements',
      'learning_progress',
    ]);

    const indexNames = PHASE_FOUR_MODELS.flatMap((model) =>
      (model.schema.indexes() as Array<[IndexDefinition, IndexOptions]>).map(
        ([, options]) => options.name,
      ),
    );
    expect(indexNames).toEqual(
      expect.arrayContaining([
        'course_classroom_status_order',
        'course_owner_status_updated',
        'module_course_status_order',
        'lesson_course_status_order',
        'lesson_module_status_order',
        'lesson_due_visibility',
        'flashcard_lesson_status_order',
        'deadline_history_revision_unique',
        'deadline_history_recent',
        'announcement_stream',
        'progress_activity_unique',
        'progress_student_course',
        'progress_course_students',
      ]),
    );
  });

  it('normalizes Course text and applies safe draft/revision defaults', async () => {
    const course = new CourseModel({
      classroomId,
      ownerTeacherId: actorId,
      title: '  REST   API Fundamentals  ',
      description: '  Nội dung khóa học  ',
      displayOrder: 0,
      createdBy: actorId,
      updatedBy: actorId,
    });
    await expect(course.validate()).resolves.toBeUndefined();
    expect(course.toObject()).toMatchObject({
      title: 'REST API Fundamentals',
      description: 'Nội dung khóa học',
      status: 'DRAFT',
      structureRevision: 0,
      schemaVersion: 1,
    });
  });

  it('enforces lifecycle-dependent persisted fields', async () => {
    const scheduledCourse = new CourseModel({
      classroomId,
      ownerTeacherId: actorId,
      title: 'Scheduled Course',
      status: 'SCHEDULED',
      displayOrder: 0,
      createdBy: actorId,
      updatedBy: actorId,
    });
    await expect(scheduledCourse.validate()).rejects.toThrow('scheduledPublishAt');

    const publishedLesson = new LessonModel({
      courseId,
      title: 'Published Lesson',
      content: 'Lesson body',
      estimatedMinutes: 8,
      status: 'PUBLISHED',
      displayOrder: 0,
      createdBy: actorId,
      updatedBy: actorId,
    });
    await expect(publishedLesson.validate()).rejects.toThrow('completionDeadline');

    const archivedFlashcard = new FlashcardModel({
      lessonId,
      frontText: 'Front',
      backText: 'Back',
      displayOrder: 0,
      status: 'ARCHIVED',
      createdBy: actorId,
      updatedBy: actorId,
    });
    await expect(archivedFlashcard.validate()).rejects.toThrow('archivedAt');
  });

  it('validates Module, Announcement and ObjectId reference boundaries', async () => {
    expect(CourseModel.schema.path('classroomId').options.ref).toBe('Classroom');
    expect(CourseModuleModel.schema.path('courseId').options.ref).toBe('Course');
    expect(LessonModel.schema.path('courseId').options.ref).toBe('Course');
    expect(LessonModel.schema.path('moduleId').options.ref).toBe('CourseModule');
    expect(FlashcardModel.schema.path('lessonId').options.ref).toBe('Lesson');
    expect(AnnouncementModel.schema.path('classroomId').options.ref).toBe('Classroom');

    const courseModule = new CourseModuleModel({
      courseId,
      title: 'Module 1',
      displayOrder: 0,
      createdBy: actorId,
      updatedBy: actorId,
    });
    await expect(courseModule.validate()).resolves.toBeUndefined();

    const announcement = new AnnouncementModel({
      classroomId,
      teacherId: actorId,
      content: '  Announcement body  ',
      createdBy: actorId,
      updatedBy: actorId,
    });
    await expect(announcement.validate()).resolves.toBeUndefined();
    expect(announcement.content).toBe('Announcement body');

    const invalidReference = new LessonModel({
      courseId: 'not-an-object-id',
      title: 'Invalid reference',
      content: 'Body',
      estimatedMinutes: 5,
      displayOrder: 0,
      createdBy: actorId,
      updatedBy: actorId,
    });
    await expect(invalidReference.validate()).rejects.toThrow('courseId');
  });

  it('keeps deadline history append-only and validates exact revision increments', async () => {
    const repository = new LessonDeadlineRepository();
    expect(repository).not.toHaveProperty('update');
    expect(repository).not.toHaveProperty('delete');

    const invalidChange = new LessonDeadlineChangeModel({
      lessonId,
      courseId,
      classroomId,
      fromDeadline: null,
      toDeadline: new Date('2026-08-01T00:00:00.000Z'),
      fromRevision: 1,
      toRevision: 3,
      actorId,
      requestId: 'request-id',
      changedAt: new Date('2026-07-20T00:00:00.000Z'),
    });
    await expect(invalidChange.validate()).rejects.toThrow('increase by exactly one');
  });

  it('rejects inconsistent LearningProgress completion timestamps', async () => {
    const invalidProgress = new LearningProgressModel({
      studentId: new Types.ObjectId(),
      classroomId,
      courseId,
      activityType: 'LESSON',
      activityId: lessonId,
      status: 'COMPLETED',
      startedAt: new Date('2026-07-20T00:00:00.000Z'),
      completedAt: null,
      lastActiveAt: new Date('2026-07-20T00:00:00.000Z'),
    });
    await expect(invalidProgress.validate()).rejects.toThrow('completedAt');

    invalidProgress.completedAt = new Date('2026-07-19T23:59:59.000Z');
    await expect(invalidProgress.validate()).rejects.toThrow('cannot be before startedAt');
  });
});
