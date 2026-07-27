import type { ClientSession, Types } from 'mongoose';

import { SubmissionModel, type SubmissionRecord } from './submission.model.js';
import { SubmissionRevisionModel } from './submission-revision.model.js';
import type {
  NewSubmission,
  NewSubmissionRevision,
  SubmissionContentPatch,
} from './submission.types.js';

export class SubmissionRepository {
  async create(input: NewSubmission, session?: ClientSession): Promise<SubmissionRecord> {
    const submission = await new SubmissionModel(input).save({ session });
    return submission.toObject();
  }

  findByIdentity(assignmentId: Types.ObjectId, studentId: Types.ObjectId, session?: ClientSession) {
    return SubmissionModel.findOne({ assignmentId, studentId })
      .session(session ?? null)
      .lean<SubmissionRecord>()
      .exec();
  }

  findById(submissionId: Types.ObjectId, session?: ClientSession) {
    return SubmissionModel.findById(submissionId)
      .session(session ?? null)
      .lean<SubmissionRecord>()
      .exec();
  }

  listByAssignment(assignmentId: Types.ObjectId, session?: ClientSession) {
    return SubmissionModel.find({ assignmentId })
      .sort({ studentId: 1, _id: 1 })
      .session(session ?? null)
      .lean<SubmissionRecord[]>()
      .exec();
  }

  saveDraftCas(
    submissionId: Types.ObjectId,
    expectedRevision: number,
    patch: SubmissionContentPatch,
    session?: ClientSession,
  ) {
    return SubmissionModel.findOneAndUpdate(
      { _id: submissionId, revision: expectedRevision, status: 'DRAFT' },
      { $set: patch, $inc: { revision: 1 } },
      { returnDocument: 'after', runValidators: true, session },
    )
      .lean<SubmissionRecord>()
      .exec();
  }

  transitionCas(
    submissionId: Types.ObjectId,
    expectedRevision: number,
    allowedStatuses: readonly SubmissionRecord['status'][],
    patch: Partial<
      Pick<
        SubmissionRecord,
        | 'status'
        | 'submittedRevision'
        | 'submittedAt'
        | 'isLate'
        | 'effectiveDeadlineAtSubmit'
        | 'gradedAt'
        | 'returnedAt'
      >
    >,
    session?: ClientSession,
  ) {
    return SubmissionModel.findOneAndUpdate(
      { _id: submissionId, revision: expectedRevision, status: { $in: allowedStatuses } },
      { $set: patch, $inc: { revision: 1 } },
      { returnDocument: 'after', runValidators: true, session },
    )
      .lean<SubmissionRecord>()
      .exec();
  }

  gradeCas(
    submissionId: Types.ObjectId,
    expectedRevision: number,
    allowedStatuses: readonly SubmissionRecord['status'][],
    patch: Pick<SubmissionRecord, 'status' | 'gradedAt' | 'returnedAt'>,
    session?: ClientSession,
  ) {
    return SubmissionModel.findOneAndUpdate(
      { _id: submissionId, revision: expectedRevision, status: { $in: allowedStatuses } },
      { $set: patch },
      { returnDocument: 'after', runValidators: true, session },
    )
      .lean<SubmissionRecord>()
      .exec();
  }

  async appendRevision(input: NewSubmissionRevision, session?: ClientSession) {
    const revision = await new SubmissionRevisionModel(input).save({ session });
    return revision.toObject();
  }

  async listHistory(
    submissionId: Types.ObjectId,
    page: number,
    limit: number,
    session?: ClientSession,
  ) {
    const filter = { submissionId };
    const [items, totalItems] = await Promise.all([
      SubmissionRevisionModel.find(filter)
        .sort({ revision: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .session(session ?? null)
        .lean()
        .exec(),
      SubmissionRevisionModel.countDocuments(filter)
        .session(session ?? null)
        .exec(),
    ]);
    return { items, totalItems, page, limit };
  }
}
