import { Types } from 'mongoose';

import { withMongoTransaction } from '../../shared/database/unit-of-work.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { PhaseFourAuditWriter } from '../audit/phase-four-audit.writer.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { CourseScopeReader } from '../learning-content/course-scope.reader.js';
import { assignExactOrder } from '../learning-content/content-ordering.policy.js';
import { resolveEffectiveContentStatus } from '../learning-content/content-schedule.policy.js';
import type { LessonRepository } from '../lessons/lesson.repository.js';
import type { CourseModuleRepository } from '../modules/module.repository.js';
import {
  toFlashcardAuditValue,
  toStudentFlashcardDto,
  toTeacherFlashcardDto,
} from './flashcard.dto.js';
import type { FlashcardRepository } from './flashcard.repository.js';
import type {
  ArchiveFlashcardInput,
  CreateFlashcardInput,
  ReorderFlashcardsInput,
  UpdateFlashcardInput,
} from './flashcard.schemas.js';

function objectId(value: string, resource = 'Flashcard'): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(404, 'RESOURCE_NOT_FOUND', `${resource} was not found`);
  }
  return new Types.ObjectId(value);
}

function assertTeacher(actor: AuthenticatedUser): void {
  if (actor.role !== 'TEACHER') throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
}

function expectedDate(actual: Date, expected: string): Date {
  const parsed = new Date(expected);
  if (actual.getTime() !== parsed.getTime()) {
    throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Flashcard was modified by another request');
  }
  return parsed;
}

export class FlashcardService {
  constructor(
    private readonly flashcards: FlashcardRepository,
    private readonly lessons: LessonRepository,
    private readonly modules: CourseModuleRepository,
    private readonly courseScopes: CourseScopeReader,
    private readonly audits: PhaseFourAuditWriter,
    private readonly maxFlashcardsPerLesson: number,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async requireLesson(actor: AuthenticatedUser, lessonId: string, mutation = false) {
    const lesson = await this.lessons.findAuthoringById(objectId(lessonId, 'Lesson'));
    if (!lesson) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Lesson was not found');
    if (actor.role === 'TEACHER') {
      const scope = await this.courseScopes.requireTeacherManage(
        actor.id,
        lesson.courseId.toString(),
      );
      if (mutation) {
        if (scope.classroomStatus !== 'ACTIVE' || scope.status === 'ARCHIVED') {
          throw new AppError(409, 'CONTENT_STATE_CONFLICT', 'Lesson content is read-only');
        }
        if (lesson.status !== 'DRAFT' && lesson.status !== 'UNPUBLISHED') {
          throw new AppError(
            409,
            'CONTENT_STATE_CONFLICT',
            'Published Lesson Flashcards are locked',
          );
        }
      }
      return lesson;
    }
    if (actor.role === 'STUDENT' && !mutation) {
      await this.courseScopes.requireStudentView(actor.id, lesson.courseId.toString());
      if (resolveEffectiveContentStatus(lesson, this.now()) !== 'PUBLISHED') {
        throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Lesson was not found');
      }
      if (lesson.moduleId) {
        const parent = await this.modules.findById(lesson.moduleId);
        if (!parent || parent.status !== 'PUBLISHED') {
          throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Lesson was not found');
        }
      }
      return lesson;
    }
    throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
  }

  private async requireTeacherFlashcard(actor: AuthenticatedUser, flashcardId: string) {
    assertTeacher(actor);
    const flashcard = await this.flashcards.findById(objectId(flashcardId));
    if (!flashcard || flashcard.status === 'ARCHIVED') {
      throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Flashcard was not found');
    }
    const lesson = await this.requireLesson(actor, flashcard.lessonId.toString(), true);
    return { flashcard, lesson };
  }

  async list(actor: AuthenticatedUser, lessonId: string) {
    await this.requireLesson(actor, lessonId);
    const items = await this.flashcards.listActiveByLesson(objectId(lessonId, 'Lesson'));
    return actor.role === 'TEACHER'
      ? items.map(toTeacherFlashcardDto)
      : items.map(toStudentFlashcardDto);
  }

  async create(
    actor: AuthenticatedUser,
    lessonId: string,
    input: CreateFlashcardInput,
    requestId: string,
  ) {
    const lesson = await this.requireLesson(actor, lessonId, true);
    assertTeacher(actor);
    const actorId = objectId(actor.id, 'User');
    const lessonObjectId = objectId(lessonId, 'Lesson');

    return withMongoTransaction(async (session) => {
      const currentLesson = await this.lessons.findAuthoringById(lessonObjectId, session);
      if (!currentLesson || currentLesson.flashcardRevision !== lesson.flashcardRevision) {
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Lesson Flashcards changed');
      }
      const count = await this.flashcards.countActiveByLesson(lessonObjectId, session);
      if (count >= this.maxFlashcardsPerLesson) {
        throw new AppError(409, 'CONTENT_LIMIT_REACHED', 'Lesson Flashcard limit was reached');
      }
      const displayOrder = await this.flashcards.nextDisplayOrder(lessonObjectId, session);
      const flashcard = await this.flashcards.create(
        {
          lessonId: lessonObjectId,
          frontText: input.frontText,
          backText: input.backText,
          displayOrder,
          createdBy: actorId,
          updatedBy: actorId,
        },
        session,
      );
      const revisedLesson = await this.lessons.incrementFlashcardRevisionCas(
        lessonObjectId,
        currentLesson.flashcardRevision,
        actorId,
        session,
      );
      if (!revisedLesson)
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Lesson Flashcards changed');
      const audit = await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'FLASHCARD_CREATED',
          resourceId: flashcard._id.toString(),
          requestId,
          newValue: toFlashcardAuditValue(flashcard),
          metadata: { courseId: lesson.courseId.toString(), lessonId },
        },
        session,
      );
      return {
        flashcard: toTeacherFlashcardDto(flashcard),
        flashcardRevision: revisedLesson.flashcardRevision,
        auditId: audit._id.toString(),
      };
    });
  }

  async update(
    actor: AuthenticatedUser,
    flashcardId: string,
    input: UpdateFlashcardInput,
    requestId: string,
  ) {
    const { flashcard, lesson } = await this.requireTeacherFlashcard(actor, flashcardId);
    const actorId = objectId(actor.id, 'User');
    const expectedUpdatedAt = expectedDate(flashcard.updatedAt, input.expectedUpdatedAt);
    const patch = {
      ...(input.frontText !== undefined ? { frontText: input.frontText } : {}),
      ...(input.backText !== undefined ? { backText: input.backText } : {}),
    };
    return withMongoTransaction(async (session) => {
      const updated = await this.flashcards.updateMetadataCas(
        { flashcardId: flashcard._id, expectedUpdatedAt, updatedBy: actorId, patch },
        session,
      );
      if (!updated) throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Flashcard was modified');
      const revisedLesson = await this.lessons.incrementFlashcardRevisionCas(
        lesson._id,
        lesson.flashcardRevision,
        actorId,
        session,
      );
      if (!revisedLesson)
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Lesson Flashcards changed');
      const audit = await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'FLASHCARD_UPDATED',
          resourceId: flashcardId,
          requestId,
          oldValue: toFlashcardAuditValue(flashcard),
          newValue: toFlashcardAuditValue(updated),
          metadata: { courseId: lesson.courseId.toString(), lessonId: lesson._id.toString() },
        },
        session,
      );
      return {
        flashcard: toTeacherFlashcardDto(updated),
        flashcardRevision: revisedLesson.flashcardRevision,
        auditId: audit._id.toString(),
      };
    });
  }

  async archive(
    actor: AuthenticatedUser,
    flashcardId: string,
    input: ArchiveFlashcardInput,
    requestId: string,
  ) {
    const { flashcard, lesson } = await this.requireTeacherFlashcard(actor, flashcardId);
    const actorId = objectId(actor.id, 'User');
    const expectedUpdatedAt = expectedDate(flashcard.updatedAt, input.expectedUpdatedAt);
    await withMongoTransaction(async (session) => {
      const archived = await this.flashcards.archiveCas(
        { flashcardId: flashcard._id, expectedUpdatedAt, actorId, archivedAt: this.now() },
        session,
      );
      if (!archived) throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Flashcard was modified');
      const revisedLesson = await this.lessons.incrementFlashcardRevisionCas(
        lesson._id,
        lesson.flashcardRevision,
        actorId,
        session,
      );
      if (!revisedLesson)
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Lesson Flashcards changed');
      await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'FLASHCARD_ARCHIVED',
          resourceId: flashcardId,
          requestId,
          reason: input.reason,
          oldValue: toFlashcardAuditValue(flashcard),
          newValue: toFlashcardAuditValue(archived),
          metadata: { courseId: lesson.courseId.toString(), lessonId: lesson._id.toString() },
        },
        session,
      );
      return true;
    });
  }

  async reorder(
    actor: AuthenticatedUser,
    lessonId: string,
    input: ReorderFlashcardsInput,
    requestId: string,
  ) {
    const lesson = await this.requireLesson(actor, lessonId, true);
    assertTeacher(actor);
    const actorId = objectId(actor.id, 'User');
    const lessonObjectId = objectId(lessonId, 'Lesson');
    return withMongoTransaction(async (session) => {
      const currentLesson = await this.lessons.findAuthoringById(lessonObjectId, session);
      if (!currentLesson || currentLesson.flashcardRevision !== input.expectedFlashcardRevision) {
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Lesson Flashcards changed');
      }
      const active = await this.flashcards.listActiveByLesson(lessonObjectId, session);
      const assignments = assignExactOrder(
        active.map((item) => item._id.toString()),
        input.orderedFlashcardIds,
      );
      await this.flashcards.reorder(
        lessonObjectId,
        assignments.map((assignment) => ({
          flashcardId: objectId(assignment.id),
          displayOrder: assignment.displayOrder,
        })),
        actorId,
        session,
      );
      const revisedLesson = await this.lessons.incrementFlashcardRevisionCas(
        lessonObjectId,
        input.expectedFlashcardRevision,
        actorId,
        session,
      );
      if (!revisedLesson)
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Lesson Flashcards changed');
      const reordered = await this.flashcards.listActiveByLesson(lessonObjectId, session);
      const audit = await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'FLASHCARDS_REORDERED',
          resourceId: lessonId,
          requestId,
          oldValue: { flashcardRevision: input.expectedFlashcardRevision },
          newValue: { flashcardRevision: revisedLesson.flashcardRevision },
          metadata: {
            courseId: lesson.courseId.toString(),
            lessonId,
            flashcardCount: reordered.length,
            fromFlashcardRevision: input.expectedFlashcardRevision,
            toFlashcardRevision: revisedLesson.flashcardRevision,
          },
        },
        session,
      );
      return {
        items: reordered.map(toTeacherFlashcardDto),
        flashcardRevision: revisedLesson.flashcardRevision,
        auditId: audit._id.toString(),
      };
    });
  }
}
