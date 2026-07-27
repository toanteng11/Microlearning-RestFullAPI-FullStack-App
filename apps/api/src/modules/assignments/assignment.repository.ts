import type { ClientSession, Types } from 'mongoose';

import { AssignmentModel, type AssignmentRecord } from './assignment.model.js';
import type {
  AssignmentLifecyclePatch,
  AssignmentPatch,
  AssignmentListOptions,
  NewAssignment,
} from './assignment.types.js';

export class AssignmentRepository {
  async create(input: NewAssignment, session?: ClientSession): Promise<AssignmentRecord> {
    const assignment = await new AssignmentModel(input).save({ session });
    return assignment.toObject();
  }

  findById(assignmentId: Types.ObjectId, session?: ClientSession) {
    return AssignmentModel.findById(assignmentId)
      .session(session ?? null)
      .lean<AssignmentRecord>()
      .exec();
  }

  async listByCourse(
    courseId: Types.ObjectId,
    options: AssignmentListOptions,
    session?: ClientSession,
  ) {
    const filter = {
      courseId,
      status: options.status ?? ({ $ne: 'ARCHIVED' } as const),
      ...(options.search
        ? {
            title: {
              $regex: options.search.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'),
              $options: 'i',
            },
          }
        : {}),
    };
    const [items, totalItems] = await Promise.all([
      AssignmentModel.find(filter)
        .sort({ moduleId: 1, displayOrder: 1, _id: 1 })
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .session(session ?? null)
        .lean<AssignmentRecord[]>()
        .exec(),
      AssignmentModel.countDocuments(filter)
        .session(session ?? null)
        .exec(),
    ]);
    return { items, totalItems, page: options.page, limit: options.limit };
  }

  listByCourseIds(courseIds: readonly Types.ObjectId[], session?: ClientSession) {
    if (courseIds.length === 0) return Promise.resolve([] as AssignmentRecord[]);
    return AssignmentModel.find({
      courseId: { $in: courseIds },
      status: { $ne: 'ARCHIVED' },
    })
      .sort({ courseId: 1, moduleId: 1, displayOrder: 1, _id: 1 })
      .session(session ?? null)
      .lean<AssignmentRecord[]>()
      .exec();
  }

  async nextDisplayOrder(
    courseId: Types.ObjectId,
    moduleId: Types.ObjectId | null,
    session?: ClientSession,
  ) {
    const latest = await AssignmentModel.findOne({
      courseId,
      moduleId,
      status: { $ne: 'ARCHIVED' },
    })
      .select({ displayOrder: 1 })
      .sort({ displayOrder: -1, _id: -1 })
      .session(session ?? null)
      .lean<Pick<AssignmentRecord, 'displayOrder'>>()
      .exec();
    return (latest?.displayOrder ?? -1) + 1;
  }

  updateCas(
    assignmentId: Types.ObjectId,
    expectedRevision: number,
    actorId: Types.ObjectId,
    patch: AssignmentPatch,
    session?: ClientSession,
  ) {
    return AssignmentModel.findOneAndUpdate(
      {
        _id: assignmentId,
        contentRevision: expectedRevision,
        status: { $in: ['DRAFT', 'UNPUBLISHED'] },
      },
      { $set: { ...patch, updatedBy: actorId }, $inc: { contentRevision: 1 } },
      { returnDocument: 'after', runValidators: true, session },
    )
      .lean<AssignmentRecord>()
      .exec();
  }

  changeStatusCas(
    assignmentId: Types.ObjectId,
    expectedRevision: number,
    actorId: Types.ObjectId,
    patch: AssignmentLifecyclePatch,
    session?: ClientSession,
  ) {
    return AssignmentModel.findOneAndUpdate(
      { _id: assignmentId, contentRevision: expectedRevision, status: { $ne: 'ARCHIVED' } },
      { $set: { ...patch, updatedBy: actorId }, $inc: { contentRevision: 1 } },
      { returnDocument: 'after', runValidators: true, session },
    )
      .lean<AssignmentRecord>()
      .exec();
  }
}
