import type { ClientSession, Types } from 'mongoose';

import { AnnouncementModel, type AnnouncementRecord } from './announcement.model.js';
import type {
  AnnouncementLifecyclePatch,
  AnnouncementListQuery,
  AnnouncementMetadataPatch,
  NewAnnouncement,
} from './announcement.types.js';

const ANNOUNCEMENT_AUTHORING_PROJECTION = {
  classroomId: 1,
  teacherId: 1,
  content: 1,
  status: 1,
  scheduledPublishAt: 1,
  publishedAt: 1,
  unpublishedAt: 1,
  archivedAt: 1,
  schemaVersion: 1,
  createdBy: 1,
  updatedBy: 1,
  createdAt: 1,
  updatedAt: 1,
} as const;

const ANNOUNCEMENT_STUDENT_PROJECTION = {
  classroomId: 1,
  teacherId: 1,
  content: 1,
  status: 1,
  scheduledPublishAt: 1,
  publishedAt: 1,
} as const;

export type AnnouncementProjection = AnnouncementRecord;

export class AnnouncementRepository {
  async create(input: NewAnnouncement, session?: ClientSession): Promise<AnnouncementProjection> {
    const announcement = await new AnnouncementModel(input).save({ session });
    return announcement.toObject();
  }

  findAuthoringById(announcementId: Types.ObjectId, session?: ClientSession) {
    return AnnouncementModel.findById(announcementId)
      .select(ANNOUNCEMENT_AUTHORING_PROJECTION)
      .session(session ?? null)
      .lean<AnnouncementProjection>()
      .exec();
  }

  async listByClassroom(
    classroomId: Types.ObjectId,
    query: AnnouncementListQuery,
    session?: ClientSession,
  ) {
    const filter = { classroomId, ...(query.status ? { status: query.status } : {}) };
    const [items, totalItems] = await Promise.all([
      AnnouncementModel.find(filter)
        .select(ANNOUNCEMENT_AUTHORING_PROJECTION)
        .sort({ createdAt: -1, _id: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .session(session ?? null)
        .lean<AnnouncementProjection[]>()
        .exec(),
      AnnouncementModel.countDocuments(filter)
        .session(session ?? null)
        .exec(),
    ]);
    return { items, totalItems, page: query.page, limit: query.limit };
  }

  async listStudentVisibilityCandidates(
    classroomId: Types.ObjectId,
    query: { page: number; limit: number; asOf: Date },
    session?: ClientSession,
  ) {
    const match = {
      classroomId,
      $or: [
        { status: 'PUBLISHED' },
        { status: 'SCHEDULED', scheduledPublishAt: { $lte: query.asOf } },
      ],
    };
    const [result] = await AnnouncementModel.aggregate<{
      items: Array<
        Pick<
          AnnouncementRecord,
          | '_id'
          | 'classroomId'
          | 'teacherId'
          | 'content'
          | 'status'
          | 'scheduledPublishAt'
          | 'publishedAt'
        >
      >;
      total: Array<{ count: number }>;
    }>([
      { $match: match },
      {
        $addFields: { effectivePublishedAt: { $ifNull: ['$publishedAt', '$scheduledPublishAt'] } },
      },
      { $sort: { effectivePublishedAt: -1, _id: -1 } },
      {
        $facet: {
          items: [
            { $skip: (query.page - 1) * query.limit },
            { $limit: query.limit },
            { $project: ANNOUNCEMENT_STUDENT_PROJECTION },
          ],
          total: [{ $count: 'count' }],
        },
      },
    ])
      .session(session ?? null)
      .exec();
    return {
      items: result?.items ?? [],
      totalItems: result?.total[0]?.count ?? 0,
      page: query.page,
      limit: query.limit,
    };
  }

  updateMetadataCas(
    input: {
      announcementId: Types.ObjectId;
      expectedUpdatedAt: Date;
      updatedBy: Types.ObjectId;
      patch: AnnouncementMetadataPatch;
    },
    session: ClientSession,
  ) {
    return AnnouncementModel.findOneAndUpdate(
      {
        _id: input.announcementId,
        status: { $in: ['DRAFT', 'UNPUBLISHED'] },
        updatedAt: input.expectedUpdatedAt,
      },
      { $set: { ...input.patch, updatedBy: input.updatedBy } },
      { returnDocument: 'after', runValidators: true, session },
    )
      .select(ANNOUNCEMENT_AUTHORING_PROJECTION)
      .lean<AnnouncementProjection>()
      .exec();
  }

  changeStatusCas(
    input: {
      announcementId: Types.ObjectId;
      expectedUpdatedAt: Date;
      updatedBy: Types.ObjectId;
      patch: AnnouncementLifecyclePatch;
    },
    session: ClientSession,
  ) {
    return AnnouncementModel.findOneAndUpdate(
      {
        _id: input.announcementId,
        status: { $ne: 'ARCHIVED' },
        updatedAt: input.expectedUpdatedAt,
      },
      { $set: { ...input.patch, updatedBy: input.updatedBy } },
      { returnDocument: 'after', runValidators: true, session },
    )
      .select(ANNOUNCEMENT_AUTHORING_PROJECTION)
      .lean<AnnouncementProjection>()
      .exec();
  }

  archiveCas(
    input: {
      announcementId: Types.ObjectId;
      expectedUpdatedAt: Date;
      actorId: Types.ObjectId;
      archivedAt: Date;
    },
    session: ClientSession,
  ) {
    return AnnouncementModel.findOneAndUpdate(
      {
        _id: input.announcementId,
        status: { $ne: 'ARCHIVED' },
        updatedAt: input.expectedUpdatedAt,
      },
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
      .select(ANNOUNCEMENT_AUTHORING_PROJECTION)
      .lean<AnnouncementProjection>()
      .exec();
  }
}
