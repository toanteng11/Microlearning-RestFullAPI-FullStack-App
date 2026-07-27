import type { ClientSession, Types } from 'mongoose';

import { GradeModel, type GradeRecord } from './grade.model.js';
import { GradeRevisionModel } from './grade-revision.model.js';
import type { NewGrade, NewGradeRevision } from './grade.types.js';

export class GradeRepository {
  async create(input: NewGrade, session?: ClientSession): Promise<GradeRecord> {
    const grade = await new GradeModel(input).save({ session });
    return grade.toObject();
  }

  findByIdentity(
    studentId: Types.ObjectId,
    activityType: 'QUIZ' | 'ASSIGNMENT',
    activityId: Types.ObjectId,
    session?: ClientSession,
  ) {
    return GradeModel.findOne({ studentId, activityType, activityId })
      .session(session ?? null)
      .lean<GradeRecord>()
      .exec();
  }

  findById(gradeId: Types.ObjectId, session?: ClientSession) {
    return GradeModel.findById(gradeId)
      .session(session ?? null)
      .lean<GradeRecord>()
      .exec();
  }

  updateCas(
    gradeId: Types.ObjectId,
    expectedRevision: number,
    patch: Partial<
      Pick<
        GradeRecord,
        | 'evidenceId'
        | 'evidenceRevision'
        | 'score'
        | 'maxScore'
        | 'feedback'
        | 'status'
        | 'gradedBy'
        | 'gradedAt'
        | 'returnedBy'
        | 'returnedAt'
      >
    >,
    session?: ClientSession,
  ) {
    return GradeModel.findOneAndUpdate(
      { _id: gradeId, revision: expectedRevision },
      { $set: patch, $inc: { revision: 1 } },
      { returnDocument: 'after', runValidators: true, session },
    )
      .lean<GradeRecord>()
      .exec();
  }

  async appendRevision(input: NewGradeRevision, session?: ClientSession) {
    const revision = await new GradeRevisionModel(input).save({ session });
    return revision.toObject();
  }

  async listHistory(gradeId: Types.ObjectId, page: number, limit: number, session?: ClientSession) {
    const filter = { gradeId };
    const [items, totalItems] = await Promise.all([
      GradeRevisionModel.find(filter)
        .sort({ revision: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .session(session ?? null)
        .lean()
        .exec(),
      GradeRevisionModel.countDocuments(filter)
        .session(session ?? null)
        .exec(),
    ]);
    return { items, totalItems, page, limit };
  }

  async listReturnedByStudent(
    studentId: Types.ObjectId,
    options: {
      page: number;
      limit: number;
      classroomId?: Types.ObjectId;
      courseId?: Types.ObjectId;
      activityType?: 'QUIZ' | 'ASSIGNMENT';
    },
    session?: ClientSession,
  ) {
    const filter = {
      studentId,
      status: 'RETURNED' as const,
      ...(options.classroomId ? { classroomId: options.classroomId } : {}),
      ...(options.courseId ? { courseId: options.courseId } : {}),
      ...(options.activityType ? { activityType: options.activityType } : {}),
    };
    const [items, totalItems] = await Promise.all([
      GradeModel.find(filter)
        .sort({ returnedAt: -1, _id: -1 })
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .session(session ?? null)
        .lean<GradeRecord[]>()
        .exec(),
      GradeModel.countDocuments(filter)
        .session(session ?? null)
        .exec(),
    ]);
    return { items, totalItems, page: options.page, limit: options.limit };
  }

  listByCourse(courseId: Types.ObjectId, session?: ClientSession) {
    return GradeModel.find({ courseId })
      .sort({ studentId: 1, activityType: 1, activityId: 1 })
      .session(session ?? null)
      .lean<GradeRecord[]>()
      .exec();
  }

  listByActivity(
    activityType: 'QUIZ' | 'ASSIGNMENT',
    activityId: Types.ObjectId,
    session?: ClientSession,
  ) {
    return GradeModel.find({ activityType, activityId })
      .sort({ studentId: 1, _id: 1 })
      .session(session ?? null)
      .lean<GradeRecord[]>()
      .exec();
  }
}
