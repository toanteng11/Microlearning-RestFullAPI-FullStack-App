import { ClassroomModel } from '../../classrooms/classroom.model.js';
import { CLASSROOM_STATUSES } from '../../classrooms/classroom.types.js';
import { CourseModel } from '../../courses/course.model.js';
import { EnrollmentModel, ENROLLMENT_STATUSES } from '../../enrollments/enrollment.model.js';
import { COMMON_CONTENT_STATUSES } from '../../learning-content/content.types.js';
import { AssignmentModel } from '../../assignments/assignment.model.js';
import { QuizModel } from '../../quizzes/quiz.model.js';
import {
  INVITATION_STATUSES,
  TeacherInvitationModel,
} from '../../teacher-invitations/teacher-invitation.model.js';
import { REGISTRATION_SOURCES, USER_ROLES, USER_STATUSES } from '../../users/user.types.js';
import { UserModel } from '../../users/user.model.js';
import type {
  ReportingGovernanceQuery,
  ReportingGovernanceReader,
} from '../reporting-governance.reader.js';

interface AggregateModel {
  aggregate<T>(pipeline: object[]): { exec(): Promise<T[]> };
}

interface GroupedCount {
  _id: string;
  count: number;
}

function emptyCounts<const T extends readonly string[]>(values: T): Record<T[number], number> {
  return Object.fromEntries(values.map((value) => [value, 0])) as Record<T[number], number>;
}

function withDateRange(
  filter: Record<string, unknown>,
  query: Pick<ReportingGovernanceQuery, 'from' | 'to'>,
) {
  if (query.from || query.to) {
    filter.createdAt = {
      ...(query.from ? { $gte: query.from } : {}),
      ...(query.to ? { $lt: query.to } : {}),
    };
  }
  return filter;
}

async function groupedCounts(
  model: AggregateModel,
  field: string,
  filter: Record<string, unknown>,
): Promise<readonly GroupedCount[]> {
  return model
    .aggregate<GroupedCount>([
      { $match: filter },
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ])
    .exec();
}

function fillCounts<const T extends readonly string[]>(
  values: T,
  rows: readonly GroupedCount[],
): Record<T[number], number> {
  const result = emptyCounts(values);
  for (const row of rows) {
    if (Object.hasOwn(result, row._id)) result[row._id as T[number]] = row.count;
  }
  return result;
}

export class MongoReportingGovernanceReader implements ReportingGovernanceReader {
  async readCounts(query: ReportingGovernanceQuery) {
    const userFilter = withDateRange(
      {
        ...(query.role ? { role: query.role } : {}),
        ...(query.userStatus ? { status: query.userStatus } : {}),
      },
      query,
    );
    const classroomFilter = withDateRange(
      query.classroomStatus ? { status: query.classroomStatus } : {},
      query,
    );
    const courseFilter = withDateRange(
      query.courseStatus ? { status: query.courseStatus } : {},
      query,
    );
    const enrollmentFilter = withDateRange({}, query);
    const invitationDateFilter = withDateRange({}, query);

    const [userRows, sourceRows, classroomRows, courseRows, invitationRows, enrollmentRows] =
      await Promise.all([
        UserModel.aggregate<{ _id: { role: string; status: string }; count: number }>([
          { $match: userFilter },
          { $group: { _id: { role: '$role', status: '$status' }, count: { $sum: 1 } } },
          { $sort: { '_id.role': 1, '_id.status': 1 } },
        ]).exec(),
        groupedCounts(UserModel, 'registrationSource', userFilter),
        groupedCounts(ClassroomModel, 'status', classroomFilter),
        groupedCounts(CourseModel, 'status', courseFilter),
        TeacherInvitationModel.aggregate<GroupedCount>([
          { $match: invitationDateFilter },
          {
            $set: {
              effectiveStatus: {
                $cond: [
                  { $and: [{ $eq: ['$status', 'PENDING'] }, { $lte: ['$expiresAt', query.asOf] }] },
                  'EXPIRED',
                  '$status',
                ],
              },
            },
          },
          ...(query.invitationStatus
            ? [{ $match: { effectiveStatus: query.invitationStatus } }]
            : []),
          { $group: { _id: '$effectiveStatus', count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]).exec(),
        groupedCounts(EnrollmentModel, 'status', enrollmentFilter),
      ]);

    const userCounts = Object.fromEntries(
      USER_ROLES.map((role) => [role, emptyCounts(USER_STATUSES)]),
    ) as Record<(typeof USER_ROLES)[number], Record<(typeof USER_STATUSES)[number], number>>;
    for (const row of userRows) {
      if (
        Object.hasOwn(userCounts, row._id.role) &&
        Object.hasOwn(userCounts[row._id.role as (typeof USER_ROLES)[number]], row._id.status)
      ) {
        userCounts[row._id.role as (typeof USER_ROLES)[number]][
          row._id.status as (typeof USER_STATUSES)[number]
        ] = row.count;
      }
    }

    return {
      userCounts,
      registrationSourceCounts: fillCounts(REGISTRATION_SOURCES, sourceRows),
      classroomCounts: fillCounts(CLASSROOM_STATUSES, classroomRows),
      courseCounts: fillCounts(COMMON_CONTENT_STATUSES, courseRows),
      invitationCounts: fillCounts(INVITATION_STATUSES, invitationRows),
      enrollmentCounts: fillCounts(ENROLLMENT_STATUSES, enrollmentRows),
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
      TeacherInvitationModel.findOne({})
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
    const timestamps = rows
      .map((row): Date | null => row?.updatedAt ?? null)
      .filter((value): value is Date => value instanceof Date)
      .sort((left, right) => right.getTime() - left.getTime());
    return timestamps[0] ?? null;
  }
}
