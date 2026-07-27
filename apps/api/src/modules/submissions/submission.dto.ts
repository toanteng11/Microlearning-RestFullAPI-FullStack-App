import type { SubmissionRecord } from './submission.model.js';

export function toStudentOwnSubmissionDto(submission: SubmissionRecord) {
  return {
    id: submission._id.toString(),
    assignmentId: submission.assignmentId.toString(),
    status: submission.status,
    submissionType: submission.submissionType,
    textAnswer: submission.textAnswer,
    links: [...submission.links],
    markDone: submission.markDone,
    revision: submission.revision,
    submittedRevision: submission.submittedRevision,
    submittedAt: submission.submittedAt?.toISOString() ?? null,
    isLate: submission.isLate,
    effectiveDeadlineAtSubmit: submission.effectiveDeadlineAtSubmit?.toISOString() ?? null,
    gradedAt: submission.gradedAt?.toISOString() ?? null,
    returnedAt: submission.returnedAt?.toISOString() ?? null,
  };
}

export function toTeacherSubmissionDto(submission: SubmissionRecord) {
  return {
    ...toStudentOwnSubmissionDto(submission),
    studentId: submission.studentId.toString(),
    classroomId: submission.classroomId.toString(),
    courseId: submission.courseId.toString(),
  };
}
