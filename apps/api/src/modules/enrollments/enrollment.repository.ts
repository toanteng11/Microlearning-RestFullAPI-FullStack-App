import { type ClientSession, type HydratedDocument, type Types } from 'mongoose';

import {
  createStableSort,
  escapeRegex,
  normalizeSearchKeyword,
  type Page,
} from '../../shared/validation/list-query.js';
import type { StudentClassroomListQuery } from '../classrooms/classroom.types.js';
import {
  EnrollmentModel,
  type EnrollmentJoinMethod,
  type EnrollmentRecord,
  type EnrollmentStatus,
} from './enrollment.model.js';

export interface NewEnrollment {
  classroomId: Types.ObjectId;
  studentId: Types.ObjectId;
  joinedBy: EnrollmentJoinMethod;
  joinedAt: Date;
  sourceCredentialId?: Types.ObjectId | null;
}

export interface EnrollmentListQuery {
  page: number;
  limit: number;
  status?: EnrollmentStatus;
  sortBy: 'joinedAt' | 'status' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

export class EnrollmentRepository {
  async create(
    input: NewEnrollment,
    session: ClientSession,
  ): Promise<HydratedDocument<EnrollmentRecord>> {
    const enrollment = new EnrollmentModel({ ...input, status: 'ACTIVE' });
    return enrollment.save({ session });
  }

  async findMembership(
    classroomId: Types.ObjectId,
    studentId: Types.ObjectId,
    session?: ClientSession,
  ) {
    return EnrollmentModel.findOne({ classroomId, studentId })
      .session(session ?? null)
      .exec();
  }

  async findActiveMembership(
    classroomId: Types.ObjectId,
    studentId: Types.ObjectId,
    session?: ClientSession,
  ) {
    return EnrollmentModel.findOne({ classroomId, studentId, status: 'ACTIVE' })
      .session(session ?? null)
      .exec();
  }

  async listStudentClassrooms(studentId: Types.ObjectId, query: StudentClassroomListQuery) {
    const classroomMatch: Record<string, unknown> = {};
    if (query.status) classroomMatch.status = query.status;
    if (query.keyword) {
      const keyword = escapeRegex(normalizeSearchKeyword(query.keyword));
      classroomMatch.nameNormalized = new RegExp(`^${keyword}`, 'u');
    }
    const sortField =
      query.sortBy === 'name'
        ? 'classroom.nameNormalized'
        : query.sortBy === 'joinedAt'
          ? 'joinedAt'
          : 'classroom.updatedAt';
    const direction = query.sortOrder === 'asc' ? 1 : -1;

    const result = await EnrollmentModel.aggregate<{
      items: Array<{
        enrollment: EnrollmentRecord;
        classroom: Record<string, unknown>;
        owner: { _id: Types.ObjectId; fullName: string };
      }>;
      total: Array<{ count: number }>;
    }>([
      { $match: { studentId, status: 'ACTIVE' } },
      {
        $lookup: {
          from: 'classrooms',
          localField: 'classroomId',
          foreignField: '_id',
          as: 'classroom',
        },
      },
      { $unwind: '$classroom' },
      {
        $match: Object.fromEntries(
          Object.entries(classroomMatch).map(([key, value]) => [`classroom.${key}`, value]),
        ),
      },
      { $sort: { [sortField]: direction, _id: direction } },
      {
        $facet: {
          items: [
            { $skip: (query.page - 1) * query.limit },
            { $limit: query.limit },
            {
              $lookup: {
                from: 'users',
                localField: 'classroom.ownerTeacherId',
                foreignField: '_id',
                pipeline: [{ $project: { _id: 1, fullName: 1 } }],
                as: 'owner',
              },
            },
            { $unwind: '$owner' },
            { $project: { enrollment: '$$ROOT', classroom: 1, owner: 1 } },
          ],
          total: [{ $count: 'count' }],
        },
      },
    ]).exec();

    return {
      items: result[0]?.items ?? [],
      totalItems: result[0]?.total[0]?.count ?? 0,
      page: query.page,
      limit: query.limit,
    };
  }

  async listRoster(
    classroomId: Types.ObjectId,
    query: {
      page: number;
      limit: number;
      keyword?: string;
      enrollmentStatus?: EnrollmentStatus;
      accountStatus?: string;
      sortBy: 'fullName' | 'email' | 'joinedAt' | 'status';
      sortOrder: 'asc' | 'desc';
    },
  ) {
    const enrollmentMatch: Record<string, unknown> = {
      classroomId,
      status: query.enrollmentStatus ?? 'ACTIVE',
    };
    const studentMatch: Record<string, unknown> = {};
    if (query.accountStatus) studentMatch['student.status'] = query.accountStatus;
    if (query.keyword) {
      const prefix = new RegExp(`^${escapeRegex(normalizeSearchKeyword(query.keyword))}`, 'u');
      studentMatch.$or = [
        { 'student.fullNameNormalized': prefix },
        { 'student.email': prefix },
        { 'student.studentCode': prefix },
      ];
    }
    const sortField =
      query.sortBy === 'fullName'
        ? 'student.fullNameNormalized'
        : query.sortBy === 'email'
          ? 'student.email'
          : query.sortBy === 'joinedAt'
            ? 'joinedAt'
            : 'status';
    const direction = query.sortOrder === 'asc' ? 1 : -1;

    const result = await EnrollmentModel.aggregate<{
      items: Array<{
        enrollment: EnrollmentRecord;
        student: {
          _id: Types.ObjectId;
          fullName: string;
          email: string;
          studentCode?: string | null;
          status: string;
        };
      }>;
      total: Array<{ count: number }>;
    }>([
      { $match: enrollmentMatch },
      {
        $lookup: {
          from: 'users',
          localField: 'studentId',
          foreignField: '_id',
          pipeline: [
            {
              $project: {
                _id: 1,
                fullName: 1,
                fullNameNormalized: 1,
                email: 1,
                studentCode: 1,
                status: 1,
              },
            },
          ],
          as: 'student',
        },
      },
      { $unwind: '$student' },
      ...(Object.keys(studentMatch).length > 0 ? [{ $match: studentMatch }] : []),
      { $sort: { [sortField]: direction, _id: direction } },
      {
        $facet: {
          items: [
            { $skip: (query.page - 1) * query.limit },
            { $limit: query.limit },
            { $project: { enrollment: '$$ROOT', student: 1 } },
          ],
          total: [{ $count: 'count' }],
        },
      },
    ]).exec();

    return {
      items: result[0]?.items ?? [],
      totalItems: result[0]?.total[0]?.count ?? 0,
    };
  }

  async listByClassroom(
    classroomId: Types.ObjectId,
    query: EnrollmentListQuery,
  ): Promise<Page<HydratedDocument<EnrollmentRecord>>> {
    const filter = { classroomId, ...(query.status ? { status: query.status } : {}) };
    const [items, totalItems] = await Promise.all([
      EnrollmentModel.find(filter)
        .sort(createStableSort(query.sortBy, query.sortOrder))
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .exec(),
      EnrollmentModel.countDocuments(filter).exec(),
    ]);
    return { items, totalItems, page: query.page, limit: query.limit };
  }

  async listByStudent(
    studentId: Types.ObjectId,
    query: EnrollmentListQuery,
  ): Promise<Page<HydratedDocument<EnrollmentRecord>>> {
    const filter = { studentId, ...(query.status ? { status: query.status } : {}) };
    const [items, totalItems] = await Promise.all([
      EnrollmentModel.find(filter)
        .sort(createStableSort(query.sortBy, query.sortOrder))
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .exec(),
      EnrollmentModel.countDocuments(filter).exec(),
    ]);
    return { items, totalItems, page: query.page, limit: query.limit };
  }

  async removeActiveCas(
    input: {
      classroomId: Types.ObjectId;
      studentId: Types.ObjectId;
      expectedUpdatedAt: Date;
      removedAt: Date;
      removedBy: Types.ObjectId;
      removalReason: string;
    },
    session: ClientSession,
  ) {
    return EnrollmentModel.findOneAndUpdate(
      {
        classroomId: input.classroomId,
        studentId: input.studentId,
        status: 'ACTIVE',
        updatedAt: input.expectedUpdatedAt,
      },
      {
        $set: {
          status: 'REMOVED',
          removedAt: input.removedAt,
          removedBy: input.removedBy,
          removalReason: input.removalReason,
        },
      },
      { returnDocument: 'after', runValidators: true, session },
    ).exec();
  }

  async countActiveByClassroom(classroomId: Types.ObjectId): Promise<number> {
    return EnrollmentModel.countDocuments({ classroomId, status: 'ACTIVE' }).exec();
  }
}
