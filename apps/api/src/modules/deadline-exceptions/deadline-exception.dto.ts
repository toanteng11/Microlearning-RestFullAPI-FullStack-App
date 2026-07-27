import type { DeadlineExceptionRecord } from './deadline-exception.model.js';

export function toTeacherDeadlineExceptionDto(
  record: DeadlineExceptionRecord,
  defaultDeadline: Date,
) {
  return {
    id: record._id.toString(),
    studentId: record.studentId.toString(),
    classroomId: record.classroomId.toString(),
    courseId: record.courseId.toString(),
    activityType: record.activityType,
    activityId: record.activityId.toString(),
    defaultDeadline: defaultDeadline.toISOString(),
    effectiveDeadline: (record.active ? record.deadline : defaultDeadline).toISOString(),
    active: record.active,
    reason: record.reason,
    revision: record.revision,
    changedAt: record.changedAt.toISOString(),
  };
}
