import { Types } from 'mongoose';

import { withMongoTransaction } from '../../shared/database/unit-of-work.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { PhaseFourAuditWriter } from '../audit/phase-four-audit.writer.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { CourseScopeReader } from '../learning-content/course-scope.reader.js';
import { toLessonAuditValue } from '../lessons/lesson.dto.js';
import type { LessonRepository } from '../lessons/lesson.repository.js';
import { assertDeadlineChangeAllowed } from './lesson-deadline.policy.js';
import type { LessonDeadlineRepository } from './lesson-deadline.repository.js';
import type {
  ChangeLessonDeadlineInput,
  DeadlineHistoryQueryInput,
} from './lesson-deadline.schemas.js';

function objectId(value: string, resource = 'Lesson'): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(404, 'RESOURCE_NOT_FOUND', `${resource} was not found`);
  }
  return new Types.ObjectId(value);
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

export class LessonDeadlineService {
  constructor(
    private readonly lessons: LessonRepository,
    private readonly deadlines: LessonDeadlineRepository,
    private readonly courseScopes: CourseScopeReader,
    private readonly audits: PhaseFourAuditWriter,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async requireTeacherLesson(actor: AuthenticatedUser, lessonId: string) {
    if (actor.role !== 'TEACHER') throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
    const lesson = await this.lessons.findAuthoringById(objectId(lessonId));
    if (!lesson) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Lesson was not found');
    const scope = await this.courseScopes.requireTeacherManage(
      actor.id,
      lesson.courseId.toString(),
    );
    if (scope.classroomStatus !== 'ACTIVE' || scope.status === 'ARCHIVED') {
      throw new AppError(409, 'CONTENT_STATE_CONFLICT', 'Lesson deadline is read-only');
    }
    return { lesson, scope };
  }

  async change(
    actor: AuthenticatedUser,
    lessonId: string,
    input: ChangeLessonDeadlineInput,
    requestId: string,
  ) {
    const { lesson, scope } = await this.requireTeacherLesson(actor, lessonId);
    const changedAt = this.now();
    const nextDeadline = input.completionDeadline ? new Date(input.completionDeadline) : null;
    assertDeadlineChangeAllowed({
      status: lesson.status,
      currentDeadline: lesson.completionDeadline,
      nextDeadline,
      reason: input.reason,
      now: changedAt,
    });
    const actorId = objectId(actor.id, 'User');

    return withMongoTransaction(async (session) => {
      const current = await this.lessons.findAuthoringById(lesson._id, session);
      if (!current || current.deadlineRevision !== input.expectedDeadlineRevision) {
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Lesson deadline changed');
      }
      assertDeadlineChangeAllowed({
        status: current.status,
        currentDeadline: current.completionDeadline,
        nextDeadline,
        reason: input.reason,
        now: changedAt,
      });
      const updated = await this.lessons.changeDeadlineCas(
        {
          lessonId: current._id,
          expectedDeadlineRevision: input.expectedDeadlineRevision,
          completionDeadline: nextDeadline,
          actorId,
          changedAt,
        },
        session,
      );
      if (!updated) throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Lesson deadline changed');
      const history = await this.deadlines.append(
        {
          lessonId: current._id,
          courseId: current.courseId,
          classroomId: objectId(scope.classroomId, 'Classroom'),
          fromDeadline: current.completionDeadline,
          toDeadline: nextDeadline,
          fromRevision: current.deadlineRevision,
          toRevision: updated.deadlineRevision,
          reason: input.reason,
          actorId,
          requestId,
          changedAt,
        },
        session,
      );
      const audit = await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'LESSON_DEADLINE_CHANGED',
          resourceId: lessonId,
          requestId,
          reason: input.reason,
          oldValue: toLessonAuditValue(current),
          newValue: toLessonAuditValue(updated),
          metadata: {
            courseId: current.courseId.toString(),
            lessonId,
            fromDeadlineRevision: current.deadlineRevision,
            toDeadlineRevision: updated.deadlineRevision,
          },
        },
        session,
      );
      return {
        lessonId,
        completionDeadline: updated.completionDeadline?.toISOString() ?? null,
        deadlineRevision: updated.deadlineRevision,
        deadlineLastUpdatedAt: updated.deadlineLastUpdatedAt?.toISOString() ?? null,
        historyId: history._id.toString(),
        auditId: audit._id.toString(),
      };
    });
  }

  async history(actor: AuthenticatedUser, lessonId: string, query: DeadlineHistoryQueryInput) {
    await this.requireTeacherLesson(actor, lessonId);
    const id = objectId(lessonId);
    const [items, totalItems] = await Promise.all([
      this.deadlines.listByLesson(id, query),
      this.deadlines.countByLesson(id),
    ]);
    return {
      data: {
        items: items.map((item) => ({
          id: item._id.toString(),
          lessonId: item.lessonId.toString(),
          fromDeadline: item.fromDeadline?.toISOString() ?? null,
          toDeadline: item.toDeadline?.toISOString() ?? null,
          fromRevision: item.fromRevision,
          toRevision: item.toRevision,
          reason: item.reason,
          actorId: item.actorId.toString(),
          changedAt: item.changedAt.toISOString(),
        })),
      },
      meta: paginationMeta(query.page, query.limit, totalItems),
    };
  }
}
