import type { ClientSession, Types } from 'mongoose';

import { CourseModuleModel, type CourseModuleRecord } from './module.model.js';
import type {
  CourseModuleLifecyclePatch,
  CourseModuleMetadataPatch,
  CourseModuleOrderAssignment,
  NewCourseModule,
} from './module.types.js';

const MODULE_AUTHORING_PROJECTION = {
  courseId: 1,
  title: 1,
  description: 1,
  status: 1,
  displayOrder: 1,
  archivedAt: 1,
  schemaVersion: 1,
  createdBy: 1,
  updatedBy: 1,
  createdAt: 1,
  updatedAt: 1,
} as const;

export type CourseModuleProjection = CourseModuleRecord;

export class CourseModuleRepository {
  async create(input: NewCourseModule, session?: ClientSession): Promise<CourseModuleProjection> {
    const courseModule = await new CourseModuleModel(input).save({ session });
    return courseModule.toObject();
  }

  findById(moduleId: Types.ObjectId, session?: ClientSession) {
    return CourseModuleModel.findById(moduleId)
      .select(MODULE_AUTHORING_PROJECTION)
      .session(session ?? null)
      .lean<CourseModuleProjection>()
      .exec();
  }

  listByCourse(
    courseId: Types.ObjectId,
    session?: ClientSession,
    options: { includeArchived?: boolean } = {},
  ) {
    return CourseModuleModel.find({
      courseId,
      ...(options.includeArchived ? {} : { status: { $ne: 'ARCHIVED' } }),
    })
      .select(MODULE_AUTHORING_PROJECTION)
      .sort({ displayOrder: 1, _id: 1 })
      .session(session ?? null)
      .lean<CourseModuleProjection[]>()
      .exec();
  }

  listByCourseIds(courseIds: readonly Types.ObjectId[], session?: ClientSession) {
    if (courseIds.length === 0) return Promise.resolve([] as CourseModuleProjection[]);
    return CourseModuleModel.find({ courseId: { $in: courseIds }, status: { $ne: 'ARCHIVED' } })
      .select(MODULE_AUTHORING_PROJECTION)
      .sort({ courseId: 1, displayOrder: 1, _id: 1 })
      .session(session ?? null)
      .lean<CourseModuleProjection[]>()
      .exec();
  }

  async nextDisplayOrderByCourse(
    courseId: Types.ObjectId,
    session?: ClientSession,
  ): Promise<number> {
    const [last] = await CourseModuleModel.find({ courseId, status: { $ne: 'ARCHIVED' } })
      .select({ displayOrder: 1 })
      .sort({ displayOrder: -1, _id: -1 })
      .limit(1)
      .session(session ?? null)
      .lean<Array<Pick<CourseModuleRecord, 'displayOrder'>>>()
      .exec();
    return (last?.displayOrder ?? -1) + 1;
  }

  updateMetadataCas(
    input: {
      moduleId: Types.ObjectId;
      expectedUpdatedAt: Date;
      updatedBy: Types.ObjectId;
      patch: CourseModuleMetadataPatch;
    },
    session?: ClientSession,
  ) {
    return CourseModuleModel.findOneAndUpdate(
      { _id: input.moduleId, status: { $ne: 'ARCHIVED' }, updatedAt: input.expectedUpdatedAt },
      { $set: { ...input.patch, updatedBy: input.updatedBy } },
      { returnDocument: 'after', runValidators: true, session },
    )
      .select(MODULE_AUTHORING_PROJECTION)
      .lean<CourseModuleProjection>()
      .exec();
  }

  changeStatusCas(
    input: {
      moduleId: Types.ObjectId;
      expectedUpdatedAt: Date;
      updatedBy: Types.ObjectId;
      patch: CourseModuleLifecyclePatch;
    },
    session: ClientSession,
  ) {
    return CourseModuleModel.findOneAndUpdate(
      { _id: input.moduleId, status: { $ne: 'ARCHIVED' }, updatedAt: input.expectedUpdatedAt },
      { $set: { ...input.patch, updatedBy: input.updatedBy } },
      { returnDocument: 'after', runValidators: true, session },
    )
      .select(MODULE_AUTHORING_PROJECTION)
      .lean<CourseModuleProjection>()
      .exec();
  }

  archiveCas(
    input: {
      moduleId: Types.ObjectId;
      expectedUpdatedAt: Date;
      actorId: Types.ObjectId;
      archivedAt: Date;
    },
    session: ClientSession,
  ) {
    return CourseModuleModel.findOneAndUpdate(
      { _id: input.moduleId, status: { $ne: 'ARCHIVED' }, updatedAt: input.expectedUpdatedAt },
      {
        $set: {
          status: 'ARCHIVED',
          archivedAt: input.archivedAt,
          updatedBy: input.actorId,
        },
      },
      { returnDocument: 'after', runValidators: true, session },
    )
      .select(MODULE_AUTHORING_PROJECTION)
      .lean<CourseModuleProjection>()
      .exec();
  }

  async reorder(
    courseId: Types.ObjectId,
    assignments: readonly CourseModuleOrderAssignment[],
    actorId: Types.ObjectId,
    session: ClientSession,
  ): Promise<void> {
    if (assignments.length === 0) return;
    const result = await CourseModuleModel.bulkWrite(
      assignments.map((assignment) => ({
        updateOne: {
          filter: {
            _id: assignment.moduleId,
            courseId,
            status: { $ne: 'ARCHIVED' },
          },
          update: {
            $set: { displayOrder: assignment.displayOrder, updatedBy: actorId },
          },
        },
      })),
      { session, ordered: true },
    );
    if (result.matchedCount !== assignments.length) {
      throw new Error('Module reorder set changed during transaction');
    }
  }

  countNonArchivedByCourse(courseId: Types.ObjectId, session?: ClientSession): Promise<number> {
    return CourseModuleModel.countDocuments({ courseId, status: { $ne: 'ARCHIVED' } })
      .session(session ?? null)
      .exec();
  }
}
