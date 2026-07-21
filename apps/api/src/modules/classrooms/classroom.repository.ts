import { type ClientSession, type HydratedDocument, type Types } from 'mongoose';

import {
  createStableSort,
  escapeRegex,
  normalizeSearchKeyword,
  type Page,
} from '../../shared/validation/list-query.js';
import { ClassroomModel, type ClassroomRecord } from './classroom.model.js';
import {
  type AdminClassroomListQuery,
  type ClassroomListQuery,
  type ClassroomUpdateCommand,
  type NewClassroom,
  normalizeClassroomDisplayName,
} from './classroom.types.js';

function normalizeOptionalText(value: string | null | undefined): string | null | undefined {
  if (typeof value !== 'string') return value;
  const normalized = value.normalize('NFKC').trim().replace(/\s+/gu, ' ');
  return normalized.length > 0 ? normalized : null;
}

export class ClassroomRepository {
  async create(
    input: NewClassroom,
    session: ClientSession,
  ): Promise<HydratedDocument<ClassroomRecord>> {
    const classroom = new ClassroomModel(input);
    return classroom.save({ session });
  }

  async findById(classroomId: Types.ObjectId, session?: ClientSession) {
    return ClassroomModel.findById(classroomId)
      .session(session ?? null)
      .exec();
  }

  async findOwnedById(
    classroomId: Types.ObjectId,
    ownerTeacherId: Types.ObjectId,
    session?: ClientSession,
  ) {
    return ClassroomModel.findOne({ _id: classroomId, ownerTeacherId })
      .session(session ?? null)
      .exec();
  }

  listActiveByIds(classroomIds: readonly Types.ObjectId[], session?: ClientSession) {
    if (classroomIds.length === 0) return Promise.resolve([] as ClassroomRecord[]);
    return ClassroomModel.find({ _id: { $in: classroomIds }, status: 'ACTIVE' })
      .select({ name: 1, ownerTeacherId: 1, status: 1 })
      .sort({ _id: 1 })
      .session(session ?? null)
      .lean<ClassroomRecord[]>()
      .exec();
  }

  async listOwned(
    ownerTeacherId: Types.ObjectId,
    query: ClassroomListQuery,
  ): Promise<Page<HydratedDocument<ClassroomRecord>>> {
    const filter: Record<string, unknown> = { ownerTeacherId };
    if (query.status) filter.status = query.status;
    if (query.enrollmentStatus) filter.enrollmentStatus = query.enrollmentStatus;
    if (query.keyword) {
      const keyword = escapeRegex(normalizeSearchKeyword(query.keyword));
      filter.nameNormalized = new RegExp(`^${keyword}`, 'u');
    }

    const sortField = query.sortBy === 'name' ? 'nameNormalized' : query.sortBy;
    const [items, totalItems] = await Promise.all([
      ClassroomModel.find(filter)
        .sort(createStableSort(sortField, query.sortOrder))
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .exec(),
      ClassroomModel.countDocuments(filter).exec(),
    ]);

    return { items, totalItems, page: query.page, limit: query.limit };
  }

  async updateOwnedCas(input: ClassroomUpdateCommand, session?: ClientSession) {
    const patch: Record<string, unknown> = { ...input.patch };
    if (typeof input.patch.name === 'string') {
      const name = normalizeClassroomDisplayName(input.patch.name);
      patch.name = name;
      patch.nameNormalized = normalizeSearchKeyword(name);
    }
    for (const field of ['description', 'subject', 'section'] as const) {
      if (field in input.patch) patch[field] = normalizeOptionalText(input.patch[field]);
    }

    return ClassroomModel.findOneAndUpdate(
      {
        _id: input.classroomId,
        ownerTeacherId: input.ownerTeacherId,
        status: { $ne: 'ARCHIVED' },
        updatedAt: input.expectedUpdatedAt,
      },
      { $set: patch },
      { returnDocument: 'after', runValidators: true, session },
    ).exec();
  }

  async archiveOwnedCas(
    input: {
      classroomId: Types.ObjectId;
      ownerTeacherId: Types.ObjectId;
      expectedUpdatedAt: Date;
      archivedAt: Date;
      archivedBy: Types.ObjectId;
    },
    session: ClientSession,
  ) {
    return ClassroomModel.findOneAndUpdate(
      {
        _id: input.classroomId,
        ownerTeacherId: input.ownerTeacherId,
        status: 'ACTIVE',
        updatedAt: input.expectedUpdatedAt,
      },
      {
        $set: {
          status: 'ARCHIVED',
          archivedAt: input.archivedAt,
          archivedBy: input.archivedBy,
        },
      },
      { returnDocument: 'after', runValidators: true, session },
    ).exec();
  }

  async listGovernance(query: AdminClassroomListQuery): Promise<{
    items: Array<{
      classroom: ClassroomRecord;
      owner: { _id: Types.ObjectId; fullName: string };
      memberCount: number;
    }>;
    totalItems: number;
  }> {
    const match: Record<string, unknown> = {};
    if (query.status) match.status = query.status;
    if (query.enrollmentStatus) match.enrollmentStatus = query.enrollmentStatus;
    if (query.ownerTeacherId) match.ownerTeacherId = query.ownerTeacherId;
    if (query.keyword) {
      const keyword = escapeRegex(normalizeSearchKeyword(query.keyword));
      match.nameNormalized = new RegExp(`^${keyword}`, 'u');
    }

    const sortField = query.sortBy === 'name' ? 'nameNormalized' : query.sortBy;
    const direction = query.sortOrder === 'asc' ? 1 : -1;
    const result = await ClassroomModel.aggregate<{
      items: Array<{
        classroom: ClassroomRecord;
        owner: { _id: Types.ObjectId; fullName: string };
        memberCount: number;
      }>;
      total: Array<{ count: number }>;
    }>([
      { $match: match },
      { $sort: { [sortField]: direction, _id: direction } },
      {
        $facet: {
          items: [
            { $skip: (query.page - 1) * query.limit },
            { $limit: query.limit },
            {
              $lookup: {
                from: 'users',
                localField: 'ownerTeacherId',
                foreignField: '_id',
                pipeline: [{ $project: { _id: 1, fullName: 1 } }],
                as: 'owner',
              },
            },
            { $unwind: '$owner' },
            {
              $lookup: {
                from: 'enrollments',
                let: { classroomId: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ['$classroomId', '$$classroomId'] },
                      status: 'ACTIVE',
                    },
                  },
                  { $count: 'count' },
                ],
                as: 'activeMembers',
              },
            },
            {
              $project: {
                classroom: '$$ROOT',
                owner: 1,
                memberCount: { $ifNull: [{ $first: '$activeMembers.count' }, 0] },
              },
            },
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

  async findGovernanceById(classroomId: Types.ObjectId) {
    const result = await ClassroomModel.aggregate<{
      classroom: ClassroomRecord;
      owner: { _id: Types.ObjectId; fullName: string };
      memberCount: number;
    }>([
      { $match: { _id: classroomId } },
      {
        $lookup: {
          from: 'users',
          localField: 'ownerTeacherId',
          foreignField: '_id',
          pipeline: [{ $project: { _id: 1, fullName: 1 } }],
          as: 'owner',
        },
      },
      { $unwind: '$owner' },
      {
        $lookup: {
          from: 'enrollments',
          let: { classroomId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$classroomId', '$$classroomId'] },
                status: 'ACTIVE',
              },
            },
            { $count: 'count' },
          ],
          as: 'activeMembers',
        },
      },
      {
        $project: {
          classroom: '$$ROOT',
          owner: 1,
          memberCount: { $ifNull: [{ $first: '$activeMembers.count' }, 0] },
        },
      },
    ]).exec();
    return result[0] ?? null;
  }

  async countActiveOwnedByTeacher(teacherId: Types.ObjectId): Promise<number> {
    return ClassroomModel.countDocuments({ ownerTeacherId: teacherId, status: 'ACTIVE' }).exec();
  }
}
