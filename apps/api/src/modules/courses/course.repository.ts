import type { ClientSession, Types } from 'mongoose';

import { createStableSort, escapeRegex, type Page } from '../../shared/validation/list-query.js';
import { CourseModel, type CourseRecord } from './course.model.js';
import type {
  CourseLifecyclePatch,
  CourseGovernanceListQuery,
  CourseListQuery,
  CourseMetadataPatch,
  NewCourse,
} from './course.types.js';

const COURSE_AUTHORING_PROJECTION = {
  classroomId: 1,
  ownerTeacherId: 1,
  title: 1,
  description: 1,
  status: 1,
  scheduledPublishAt: 1,
  publishedAt: 1,
  unpublishedAt: 1,
  archivedAt: 1,
  displayOrder: 1,
  structureRevision: 1,
  schemaVersion: 1,
  createdBy: 1,
  updatedBy: 1,
  createdAt: 1,
  updatedAt: 1,
} as const;

export type CourseProjection = CourseRecord;

export interface CourseGovernanceRow {
  course: CourseRecord;
  classroom: { _id: Types.ObjectId; name: string; status: string };
  owner: { _id: Types.ObjectId; fullName: string };
  moduleCount: number;
  lessonCount: number;
}

export class CourseRepository {
  async create(input: NewCourse, session?: ClientSession): Promise<CourseProjection> {
    const course = await new CourseModel(input).save({ session });
    return course.toObject();
  }

  findById(courseId: Types.ObjectId, session?: ClientSession) {
    return CourseModel.findById(courseId)
      .select(COURSE_AUTHORING_PROJECTION)
      .session(session ?? null)
      .lean<CourseProjection>()
      .exec();
  }

  async listByClassroom(
    classroomId: Types.ObjectId,
    query: CourseListQuery,
    session?: ClientSession,
  ): Promise<Page<CourseProjection>> {
    const filter: Record<string, unknown> = { classroomId };
    if (query.statuses && query.statuses.length > 0) filter.status = { $in: query.statuses };
    if (query.visibleAt) {
      filter.$or = [
        { status: 'PUBLISHED' },
        { status: 'SCHEDULED', scheduledPublishAt: { $lte: query.visibleAt } },
      ];
    }
    if (query.search) {
      filter.title = new RegExp(escapeRegex(query.search.normalize('NFKC').trim()), 'iu');
    }

    const sortField = query.sortBy === 'title' ? 'title' : (query.sortBy ?? 'displayOrder');
    const sort = createStableSort(sortField, query.sortOrder ?? 'asc');
    const [items, totalItems] = await Promise.all([
      CourseModel.find(filter)
        .select(COURSE_AUTHORING_PROJECTION)
        .sort(sort)
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .session(session ?? null)
        .lean<CourseProjection[]>()
        .exec(),
      CourseModel.countDocuments(filter)
        .session(session ?? null)
        .exec(),
    ]);
    return { items, totalItems, page: query.page, limit: query.limit };
  }

  listVisibleByClassroomIds(
    classroomIds: readonly Types.ObjectId[],
    visibleAt: Date,
    session?: ClientSession,
  ) {
    if (classroomIds.length === 0) return Promise.resolve([] as CourseProjection[]);
    return CourseModel.find({
      classroomId: { $in: classroomIds },
      $or: [
        { status: 'PUBLISHED' },
        { status: 'SCHEDULED', scheduledPublishAt: { $lte: visibleAt } },
      ],
    })
      .select(COURSE_AUTHORING_PROJECTION)
      .sort({ classroomId: 1, displayOrder: 1, _id: 1 })
      .session(session ?? null)
      .lean<CourseProjection[]>()
      .exec();
  }

  async nextDisplayOrderByClassroom(
    classroomId: Types.ObjectId,
    session?: ClientSession,
  ): Promise<number> {
    const [last] = await CourseModel.find({ classroomId, status: { $ne: 'ARCHIVED' } })
      .select({ displayOrder: 1 })
      .sort({ displayOrder: -1, _id: -1 })
      .limit(1)
      .session(session ?? null)
      .lean<Array<Pick<CourseRecord, 'displayOrder'>>>()
      .exec();
    return (last?.displayOrder ?? -1) + 1;
  }

  async listGovernance(query: CourseGovernanceListQuery): Promise<{
    items: CourseGovernanceRow[];
    totalItems: number;
  }> {
    const match: Record<string, unknown> = {};
    if (query.status) match.status = query.status;
    if (query.classroomId) match.classroomId = query.classroomId;
    if (query.ownerTeacherId) match.ownerTeacherId = query.ownerTeacherId;
    if (query.search) {
      match.title = new RegExp(escapeRegex(query.search.normalize('NFKC').trim()), 'iu');
    }
    const direction = query.sortOrder === 'asc' ? 1 : -1;
    const [result] = await CourseModel.aggregate<{
      items: CourseGovernanceRow[];
      total: Array<{ count: number }>;
    }>([
      { $match: match },
      { $sort: { [query.sortBy]: direction, _id: direction } },
      {
        $facet: {
          items: [
            { $skip: (query.page - 1) * query.limit },
            { $limit: query.limit },
            {
              $lookup: {
                from: 'classrooms',
                localField: 'classroomId',
                foreignField: '_id',
                pipeline: [{ $project: { _id: 1, name: 1, status: 1 } }],
                as: 'classroom',
              },
            },
            { $unwind: '$classroom' },
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
                from: 'course_modules',
                let: { courseId: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ['$courseId', '$$courseId'] },
                      status: { $ne: 'ARCHIVED' },
                    },
                  },
                  { $count: 'count' },
                ],
                as: 'modules',
              },
            },
            {
              $lookup: {
                from: 'lessons',
                let: { courseId: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ['$courseId', '$$courseId'] },
                      status: { $ne: 'ARCHIVED' },
                    },
                  },
                  { $count: 'count' },
                ],
                as: 'lessons',
              },
            },
            {
              $project: {
                course: {
                  _id: '$_id',
                  classroomId: '$classroomId',
                  ownerTeacherId: '$ownerTeacherId',
                  title: '$title',
                  description: '$description',
                  status: '$status',
                  scheduledPublishAt: '$scheduledPublishAt',
                  publishedAt: '$publishedAt',
                  unpublishedAt: '$unpublishedAt',
                  archivedAt: '$archivedAt',
                  displayOrder: '$displayOrder',
                  structureRevision: '$structureRevision',
                  schemaVersion: '$schemaVersion',
                  createdBy: '$createdBy',
                  updatedBy: '$updatedBy',
                  createdAt: '$createdAt',
                  updatedAt: '$updatedAt',
                },
                classroom: 1,
                owner: 1,
                moduleCount: { $ifNull: [{ $first: '$modules.count' }, 0] },
                lessonCount: { $ifNull: [{ $first: '$lessons.count' }, 0] },
              },
            },
          ],
          total: [{ $count: 'count' }],
        },
      },
    ]).exec();
    return { items: result?.items ?? [], totalItems: result?.total[0]?.count ?? 0 };
  }

  async findGovernanceById(courseId: Types.ObjectId): Promise<CourseGovernanceRow | null> {
    const rows = await CourseModel.aggregate<CourseGovernanceRow>([
      { $match: { _id: courseId } },
      {
        $lookup: {
          from: 'classrooms',
          localField: 'classroomId',
          foreignField: '_id',
          pipeline: [{ $project: { _id: 1, name: 1, status: 1 } }],
          as: 'classroom',
        },
      },
      { $unwind: '$classroom' },
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
          from: 'course_modules',
          let: { courseId: '$_id' },
          pipeline: [
            {
              $match: { $expr: { $eq: ['$courseId', '$$courseId'] }, status: { $ne: 'ARCHIVED' } },
            },
            { $count: 'count' },
          ],
          as: 'modules',
        },
      },
      {
        $lookup: {
          from: 'lessons',
          let: { courseId: '$_id' },
          pipeline: [
            {
              $match: { $expr: { $eq: ['$courseId', '$$courseId'] }, status: { $ne: 'ARCHIVED' } },
            },
            { $count: 'count' },
          ],
          as: 'lessons',
        },
      },
      {
        $project: {
          course: {
            _id: '$_id',
            classroomId: '$classroomId',
            ownerTeacherId: '$ownerTeacherId',
            title: '$title',
            status: '$status',
            scheduledPublishAt: '$scheduledPublishAt',
            publishedAt: '$publishedAt',
            unpublishedAt: '$unpublishedAt',
            archivedAt: '$archivedAt',
            createdAt: '$createdAt',
            updatedAt: '$updatedAt',
          },
          classroom: 1,
          owner: 1,
          moduleCount: { $ifNull: [{ $first: '$modules.count' }, 0] },
          lessonCount: { $ifNull: [{ $first: '$lessons.count' }, 0] },
        },
      },
    ]).exec();
    return rows[0] ?? null;
  }

  updateMetadataCas(
    input: {
      courseId: Types.ObjectId;
      expectedUpdatedAt: Date;
      updatedBy: Types.ObjectId;
      patch: CourseMetadataPatch;
    },
    session?: ClientSession,
  ) {
    return CourseModel.findOneAndUpdate(
      {
        _id: input.courseId,
        status: { $in: ['DRAFT', 'UNPUBLISHED'] },
        updatedAt: input.expectedUpdatedAt,
      },
      { $set: { ...input.patch, updatedBy: input.updatedBy } },
      { returnDocument: 'after', runValidators: true, session },
    )
      .select(COURSE_AUTHORING_PROJECTION)
      .lean<CourseProjection>()
      .exec();
  }

  changeStatusCas(
    input: {
      courseId: Types.ObjectId;
      expectedUpdatedAt: Date;
      updatedBy: Types.ObjectId;
      patch: CourseLifecyclePatch;
    },
    session: ClientSession,
  ) {
    return CourseModel.findOneAndUpdate(
      { _id: input.courseId, status: { $ne: 'ARCHIVED' }, updatedAt: input.expectedUpdatedAt },
      { $set: { ...input.patch, updatedBy: input.updatedBy } },
      { returnDocument: 'after', runValidators: true, session },
    )
      .select(COURSE_AUTHORING_PROJECTION)
      .lean<CourseProjection>()
      .exec();
  }

  archiveCas(
    input: {
      courseId: Types.ObjectId;
      expectedUpdatedAt: Date;
      actorId: Types.ObjectId;
      archivedAt: Date;
    },
    session: ClientSession,
  ) {
    return CourseModel.findOneAndUpdate(
      { _id: input.courseId, status: { $ne: 'ARCHIVED' }, updatedAt: input.expectedUpdatedAt },
      {
        $set: {
          status: 'ARCHIVED',
          archivedAt: input.archivedAt,
          scheduledPublishAt: null,
          updatedBy: input.actorId,
        },
      },
      { returnDocument: 'after', runValidators: true, session },
    )
      .select(COURSE_AUTHORING_PROJECTION)
      .lean<CourseProjection>()
      .exec();
  }

  incrementStructureRevisionCas(
    courseId: Types.ObjectId,
    expectedRevision: number,
    actorId: Types.ObjectId,
    session: ClientSession,
  ) {
    return CourseModel.findOneAndUpdate(
      { _id: courseId, status: { $ne: 'ARCHIVED' }, structureRevision: expectedRevision },
      { $inc: { structureRevision: 1 }, $set: { updatedBy: actorId } },
      { returnDocument: 'after', runValidators: true, session },
    )
      .select(COURSE_AUTHORING_PROJECTION)
      .lean<CourseProjection>()
      .exec();
  }

  countNonArchivedByClassroom(
    classroomId: Types.ObjectId,
    session?: ClientSession,
  ): Promise<number> {
    return CourseModel.countDocuments({ classroomId, status: { $ne: 'ARCHIVED' } })
      .session(session ?? null)
      .exec();
  }
}
