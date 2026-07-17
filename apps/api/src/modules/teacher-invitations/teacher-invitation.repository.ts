import {
  type ClientSession,
  type HydratedDocument,
  isValidObjectId,
  type SortOrder,
  Types,
} from 'mongoose';

import {
  TeacherInvitationModel,
  type InvitationChannel,
  type InvitationStatus,
  type TeacherInvitationRecord,
} from './teacher-invitation.model.js';

export interface CreateTeacherInvitationInput {
  email: string;
  tokenHash: string;
  invitedBy: Types.ObjectId;
  expiresAt: Date;
}

export interface TeacherInvitationListQuery {
  page: number;
  limit: number;
  email?: string;
  status?: InvitationStatus;
  sortBy: 'createdAt' | 'expiresAt' | 'status';
  sortOrder: 'asc' | 'desc';
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

export class TeacherInvitationRepository {
  async create(
    input: CreateTeacherInvitationInput,
    session: ClientSession,
  ): Promise<HydratedDocument<TeacherInvitationRecord>> {
    const invitation = new TeacherInvitationModel({
      ...input,
      role: 'TEACHER',
      status: 'PENDING',
      deliveryMethod: 'MANUAL_COPY',
    });
    return invitation.save({ session });
  }

  async findById(invitationId: string, session?: ClientSession) {
    if (!isValidObjectId(invitationId)) return null;
    return TeacherInvitationModel.findById(invitationId)
      .session(session ?? null)
      .exec();
  }

  async findByTokenHash(tokenHash: string, session?: ClientSession) {
    return TeacherInvitationModel.findOne({ tokenHash })
      .select('+tokenHash')
      .session(session ?? null)
      .exec();
  }

  async findPendingByEmail(email: string, session?: ClientSession) {
    return TeacherInvitationModel.findOne({ email, status: 'PENDING' })
      .session(session ?? null)
      .exec();
  }

  async expirePendingForEmail(email: string, now: Date, session: ClientSession): Promise<number> {
    const result = await TeacherInvitationModel.updateMany(
      { email, status: 'PENDING', expiresAt: { $lte: now } },
      { $set: { status: 'EXPIRED' } },
      { session },
    ).exec();
    return result.modifiedCount;
  }

  async expirePastDue(now: Date): Promise<number> {
    const result = await TeacherInvitationModel.updateMany(
      { status: 'PENDING', expiresAt: { $lte: now } },
      { $set: { status: 'EXPIRED' } },
    ).exec();
    return result.modifiedCount;
  }

  async expirePastDueById(invitationId: string, now: Date): Promise<void> {
    if (!isValidObjectId(invitationId)) return;
    await TeacherInvitationModel.updateOne(
      { _id: invitationId, status: 'PENDING', expiresAt: { $lte: now } },
      { $set: { status: 'EXPIRED' } },
    ).exec();
  }

  async expirePastDueByTokenHash(tokenHash: string, now: Date): Promise<void> {
    await TeacherInvitationModel.updateOne(
      { tokenHash, status: 'PENDING', expiresAt: { $lte: now } },
      { $set: { status: 'EXPIRED' } },
    ).exec();
  }

  async list(query: TeacherInvitationListQuery): Promise<{
    items: HydratedDocument<TeacherInvitationRecord>[];
    totalItems: number;
  }> {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.email) filter.email = new RegExp(`^${escapeRegex(query.email)}`, 'u');
    const direction: SortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, SortOrder> = { [query.sortBy]: direction, _id: direction };
    const [items, totalItems] = await Promise.all([
      TeacherInvitationModel.find(filter)
        .sort(sort)
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .exec(),
      TeacherInvitationModel.countDocuments(filter).exec(),
    ]);
    return { items, totalItems };
  }

  async recordCopy(
    invitationId: string,
    now: Date,
    channelHint: InvitationChannel | undefined,
    session: ClientSession,
  ) {
    return TeacherInvitationModel.findOneAndUpdate(
      { _id: invitationId, status: 'PENDING', expiresAt: { $gt: now } },
      {
        $inc: { copyCount: 1 },
        $set: { lastCopiedAt: now, ...(channelHint ? { channelHint } : {}) },
      },
      { returnDocument: 'after', session, runValidators: true },
    ).exec();
  }

  async revoke(
    invitationId: string,
    actorId: Types.ObjectId,
    reason: string,
    now: Date,
    session: ClientSession,
  ) {
    return TeacherInvitationModel.findOneAndUpdate(
      { _id: invitationId, status: 'PENDING', expiresAt: { $gt: now } },
      {
        $set: {
          status: 'REVOKED',
          revokedAt: now,
          revokedBy: actorId,
          revokeReason: reason,
        },
      },
      { returnDocument: 'after', session, runValidators: true },
    ).exec();
  }

  async accept(
    invitationId: Types.ObjectId,
    teacherId: Types.ObjectId,
    now: Date,
    session: ClientSession,
  ) {
    return TeacherInvitationModel.findOneAndUpdate(
      { _id: invitationId, status: 'PENDING', expiresAt: { $gt: now } },
      {
        $set: {
          status: 'ACCEPTED',
          acceptedBy: teacherId,
          acceptedAt: now,
        },
      },
      { returnDocument: 'after', session, runValidators: true },
    ).exec();
  }
}
