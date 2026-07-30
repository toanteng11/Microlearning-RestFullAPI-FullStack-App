import { Types } from 'mongoose';

import { QuizAttemptModel } from '../../quiz-attempts/quiz-attempt.model.js';
import { SubmissionModel } from '../../submissions/submission.model.js';
import type { UserRepository } from '../../users/user.repository.js';
import type {
  TeacherAssignmentSubmissionState,
  TeacherQuizAttemptState,
  TeacherReportingSource,
} from '../teacher-reporting.source.js';

export class MongoTeacherReportingSource implements TeacherReportingSource {
  constructor(
    private readonly users: UserRepository,
    private readonly maxStudentIds = 500,
  ) {}

  private ids(studentIds: readonly string[]) {
    if (studentIds.length > this.maxStudentIds) {
      throw new Error(`Teacher reporting batch exceeds ${this.maxStudentIds} students`);
    }
    return studentIds.map((id) => new Types.ObjectId(id));
  }

  async listStudentProfiles(studentIds: readonly string[]) {
    const rows = await this.users.listActiveStudentSummaries(this.ids(studentIds));
    return rows.map((row) => ({
      id: row._id.toString(),
      fullName: row.fullName,
      email: row.email,
      studentCode: row.studentCode ?? null,
    }));
  }

  async listAssessmentStates(courseId: string, studentIds: readonly string[]) {
    if (studentIds.length === 0) {
      return { quizAttempts: [], assignmentSubmissions: [] };
    }
    const ids = this.ids(studentIds);
    const courseObjectId = new Types.ObjectId(courseId);
    const [attemptRows, submissionRows] = await Promise.all([
      QuizAttemptModel.find({ courseId: courseObjectId, studentId: { $in: ids } })
        .select({ quizId: 1, studentId: 1, status: 1, submittedAt: 1, attemptNumber: 1 })
        .sort({ quizId: 1, studentId: 1, attemptNumber: -1, _id: -1 })
        .lean()
        .exec(),
      SubmissionModel.find({ courseId: courseObjectId, studentId: { $in: ids } })
        .select({
          assignmentId: 1,
          studentId: 1,
          status: 1,
          submittedAt: 1,
          isLate: 1,
        })
        .sort({ assignmentId: 1, studentId: 1 })
        .lean()
        .exec(),
    ]);
    const latestAttempts = new Map<string, TeacherQuizAttemptState>();
    for (const row of attemptRows) {
      const key = `${row.quizId.toString()}:${row.studentId.toString()}`;
      if (latestAttempts.has(key)) continue;
      latestAttempts.set(key, {
        studentId: row.studentId.toString(),
        activityId: row.quizId.toString(),
        status: row.status,
        submittedAt: row.submittedAt,
      });
    }
    const assignmentSubmissions: TeacherAssignmentSubmissionState[] = submissionRows.map((row) => ({
      studentId: row.studentId.toString(),
      activityId: row.assignmentId.toString(),
      status: row.status,
      submittedAt: row.submittedAt,
      isLate: row.isLate,
    }));
    return {
      quizAttempts: [...latestAttempts.values()],
      assignmentSubmissions,
    };
  }
}
