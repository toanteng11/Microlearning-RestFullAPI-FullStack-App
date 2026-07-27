import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { AssignmentRecord } from './assignment.model.js';
import { resolveEffectiveAssignmentStatus } from './assignment.domain.js';

const iso = (value: Date | null) => value?.toISOString() ?? null;

export function toTeacherAssignmentDto(
  assignment: AssignmentRecord,
  actor: AuthenticatedUser,
  asOf: Date,
) {
  const editable = ['DRAFT', 'UNPUBLISHED'].includes(assignment.status);
  return {
    id: assignment._id.toString(),
    classroomId: assignment.classroomId.toString(),
    courseId: assignment.courseId.toString(),
    moduleId: assignment.moduleId?.toString() ?? null,
    title: assignment.title,
    instruction: assignment.instruction,
    maxScore: assignment.maxScore,
    isRequired: assignment.isRequired,
    allowedSubmissionTypes: [...assignment.allowedSubmissionTypes],
    allowLateSubmission: assignment.allowLateSubmission,
    allowUnsubmit: assignment.allowUnsubmit,
    allowResubmit: assignment.allowResubmit,
    availableFrom: iso(assignment.availableFrom),
    dueDate: assignment.dueDate.toISOString(),
    status: assignment.status,
    effectiveStatus: resolveEffectiveAssignmentStatus(assignment, asOf),
    displayOrder: assignment.displayOrder,
    contentRevision: assignment.contentRevision,
    publishedRevision: assignment.publishedRevision,
    scheduledPublishAt: iso(assignment.scheduledPublishAt),
    publishedAt: iso(assignment.publishedAt),
    unpublishedAt: iso(assignment.unpublishedAt),
    closedAt: iso(assignment.closedAt),
    archivedAt: iso(assignment.archivedAt),
    createdAt: assignment.createdAt.toISOString(),
    updatedAt: assignment.updatedAt.toISOString(),
    allowedActions:
      actor.role === 'TEACHER'
        ? [
            'VIEW',
            'PREVIEW',
            ...(editable ? ['UPDATE'] : []),
            ...(assignment.status !== 'ARCHIVED' ? ['CHANGE_STATUS'] : []),
          ]
        : [],
  };
}

export function toTeacherAssignmentListItem(
  assignment: AssignmentRecord,
  actor: AuthenticatedUser,
  asOf: Date,
) {
  const { instruction, ...item } = toTeacherAssignmentDto(assignment, actor, asOf);
  void instruction;
  return item;
}

export function toStudentAssignmentDto(
  assignment: AssignmentRecord,
  asOf: Date,
  deadline: {
    effectiveDeadline: Date;
    hasDeadlineException: boolean;
  } = { effectiveDeadline: assignment.dueDate, hasDeadlineException: false },
) {
  return {
    id: assignment._id.toString(),
    classroomId: assignment.classroomId.toString(),
    courseId: assignment.courseId.toString(),
    moduleId: assignment.moduleId?.toString() ?? null,
    title: assignment.title,
    instruction: assignment.instruction,
    maxScore: assignment.maxScore,
    isRequired: assignment.isRequired,
    allowedSubmissionTypes: [...assignment.allowedSubmissionTypes],
    allowLateSubmission: assignment.allowLateSubmission,
    allowUnsubmit: assignment.allowUnsubmit,
    allowResubmit: assignment.allowResubmit,
    availableFrom: iso(assignment.availableFrom),
    defaultDeadline: assignment.dueDate.toISOString(),
    effectiveDeadline: deadline.effectiveDeadline.toISOString(),
    hasDeadlineException: deadline.hasDeadlineException,
    status: resolveEffectiveAssignmentStatus(assignment, asOf),
  };
}

export function toAssignmentAuditValue(assignment: AssignmentRecord) {
  return {
    moduleId: assignment.moduleId?.toString() ?? null,
    title: assignment.title,
    status: assignment.status,
    isRequired: assignment.isRequired,
    dueDate: assignment.dueDate.toISOString(),
    availableFrom: iso(assignment.availableFrom),
    maxScore: assignment.maxScore,
    contentRevision: assignment.contentRevision,
    publishedRevision: assignment.publishedRevision,
    scheduledPublishAt: iso(assignment.scheduledPublishAt),
    archivedAt: iso(assignment.archivedAt),
  };
}
