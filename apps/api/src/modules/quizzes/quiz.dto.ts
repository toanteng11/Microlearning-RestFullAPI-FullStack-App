import type { AuthenticatedUser } from '../auth/auth.types.js';
import { resolveEffectiveQuizStatus } from './quiz.domain.js';
import type { QuizProjection } from './quiz.repository.js';

function iso(value?: Date | null): string | null {
  return value?.toISOString() ?? null;
}

export function toTeacherQuizDto(quiz: QuizProjection, actor: AuthenticatedUser, asOf: Date) {
  const editable = quiz.status === 'DRAFT' || quiz.status === 'UNPUBLISHED';
  return {
    id: quiz._id.toString(),
    classroomId: quiz.classroomId.toString(),
    courseId: quiz.courseId.toString(),
    moduleId: quiz.moduleId?.toString() ?? null,
    title: quiz.title,
    instruction: quiz.instruction,
    isRequired: quiz.isRequired,
    status: quiz.status,
    effectiveStatus: resolveEffectiveQuizStatus(quiz, asOf),
    availableFrom: iso(quiz.availableFrom),
    dueDate: quiz.dueDate.toISOString(),
    attemptLimit: quiz.attemptLimit,
    timeLimitMinutes: quiz.timeLimitMinutes,
    resultReleasePolicy: quiz.resultReleasePolicy,
    scorePolicy: quiz.scorePolicy,
    displayOrder: quiz.displayOrder,
    contentRevision: quiz.contentRevision,
    questionRevision: quiz.questionRevision,
    publishedRevision: quiz.publishedRevision,
    maxScore: quiz.maxScore,
    scheduledPublishAt: iso(quiz.scheduledPublishAt),
    publishedAt: iso(quiz.publishedAt),
    unpublishedAt: iso(quiz.unpublishedAt),
    archivedAt: iso(quiz.archivedAt),
    createdAt: quiz.createdAt.toISOString(),
    updatedAt: quiz.updatedAt.toISOString(),
    allowedActions:
      actor.role === 'TEACHER'
        ? [
            'VIEW',
            'PREVIEW',
            ...(editable ? ['UPDATE', 'MANAGE_QUESTIONS'] : []),
            ...(quiz.status !== 'ARCHIVED' ? ['CHANGE_STATUS'] : []),
          ]
        : [],
  };
}

export function toTeacherQuizListItem(quiz: QuizProjection, actor: AuthenticatedUser, asOf: Date) {
  const { instruction, allowedActions, ...item } = toTeacherQuizDto(quiz, actor, asOf);
  void instruction;
  return { ...item, allowedActions };
}

export function toQuizAuditValue(quiz: QuizProjection) {
  return {
    moduleId: quiz.moduleId?.toString() ?? null,
    title: quiz.title,
    status: quiz.status,
    isRequired: quiz.isRequired,
    availableFrom: iso(quiz.availableFrom),
    dueDate: quiz.dueDate.toISOString(),
    attemptLimit: quiz.attemptLimit,
    timeLimitMinutes: quiz.timeLimitMinutes,
    resultReleasePolicy: quiz.resultReleasePolicy,
    scorePolicy: quiz.scorePolicy,
    displayOrder: quiz.displayOrder,
    contentRevision: quiz.contentRevision,
    questionRevision: quiz.questionRevision,
    publishedRevision: quiz.publishedRevision,
    maxScore: quiz.maxScore,
    scheduledPublishAt: iso(quiz.scheduledPublishAt),
    archivedAt: iso(quiz.archivedAt),
  };
}
