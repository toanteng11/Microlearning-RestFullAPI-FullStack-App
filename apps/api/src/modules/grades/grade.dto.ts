import type { GradeRecord } from './grade.model.js';

export function toTeacherGradeDto(grade: GradeRecord) {
  return {
    id: grade._id.toString(),
    studentId: grade.studentId.toString(),
    classroomId: grade.classroomId.toString(),
    courseId: grade.courseId.toString(),
    activityType: grade.activityType,
    activityId: grade.activityId.toString(),
    evidenceType: grade.evidenceType,
    evidenceId: grade.evidenceId.toString(),
    evidenceRevision: grade.evidenceRevision,
    score: grade.score,
    maxScore: grade.maxScore,
    feedback: grade.feedback,
    status: grade.status,
    revision: grade.revision,
    gradedAt: grade.gradedAt.toISOString(),
    returnedAt: grade.returnedAt?.toISOString() ?? null,
  };
}

export function toStudentReturnedGradeDto(grade: GradeRecord) {
  if (grade.status !== 'RETURNED') return null;
  return {
    id: grade._id.toString(),
    activityType: grade.activityType,
    activityId: grade.activityId.toString(),
    score: grade.score,
    maxScore: grade.maxScore,
    feedback: grade.feedback,
    revision: grade.revision,
    gradedAt: grade.gradedAt.toISOString(),
    returnedAt: grade.returnedAt?.toISOString() ?? null,
  };
}
