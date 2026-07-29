import { AssignmentModel } from '../../assignments/assignment.model.js';
import { ClassroomModel } from '../../classrooms/classroom.model.js';
import { CourseModel } from '../../courses/course.model.js';
import { EnrollmentModel } from '../../enrollments/enrollment.model.js';
import { QuizModel } from '../../quizzes/quiz.model.js';
import { TeacherInvitationModel } from '../../teacher-invitations/teacher-invitation.model.js';
import { UserModel } from '../../users/user.model.js';
import type { ReportingGovernanceReader } from '../reporting-governance.reader.js';

async function groupedCounts(
  model: { aggregate<T>(pipeline: object[]): { exec(): Promise<T[]> } },
  field: string,
): Promise<Record<string, number>> {
  const rows = await model
    .aggregate<{ _id: string; count: number }>([
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ])
    .exec();
  return Object.fromEntries(rows.map((row) => [row._id, row.count]));
}

export class MongoReportingGovernanceReader implements ReportingGovernanceReader {
  async readCounts() {
    const [userCounts, classroomCounts, courseCounts, invitationCounts, activeEnrollmentCount] =
      await Promise.all([
        groupedCounts(UserModel, 'status'),
        groupedCounts(ClassroomModel, 'status'),
        groupedCounts(CourseModel, 'status'),
        groupedCounts(TeacherInvitationModel, 'status'),
        EnrollmentModel.countDocuments({ status: 'ACTIVE' }).exec(),
      ]);
    return {
      activeEnrollmentCount,
      userCounts,
      classroomCounts,
      courseCounts,
      invitationCounts,
    };
  }

  async getSourceWatermark() {
    const rows = await Promise.all([
      UserModel.findOne({}).select({ updatedAt: 1 }).sort({ updatedAt: -1, _id: -1 }).lean().exec(),
      ClassroomModel.findOne({})
        .select({ updatedAt: 1 })
        .sort({ updatedAt: -1, _id: -1 })
        .lean()
        .exec(),
      CourseModel.findOne({})
        .select({ updatedAt: 1 })
        .sort({ updatedAt: -1, _id: -1 })
        .lean()
        .exec(),
      EnrollmentModel.findOne({})
        .select({ updatedAt: 1 })
        .sort({ updatedAt: -1, _id: -1 })
        .lean()
        .exec(),
      QuizModel.findOne({}).select({ updatedAt: 1 }).sort({ updatedAt: -1, _id: -1 }).lean().exec(),
      AssignmentModel.findOne({})
        .select({ updatedAt: 1 })
        .sort({ updatedAt: -1, _id: -1 })
        .lean()
        .exec(),
    ]);
    const timestamps: Date[] = rows
      .map((row): Date | null => row?.updatedAt ?? null)
      .filter((value): value is Date => value instanceof Date)
      .sort((left, right) => right.getTime() - left.getTime());
    return timestamps[0] ?? null;
  }
}
