import { type ClientSession, type HydratedDocument, Types } from 'mongoose';

import {
  AuthSessionModel,
  type AuthSessionRecord,
  type SessionRevokeReason,
} from './auth-session.model.js';

export interface CreateAuthSessionInput {
  userId: Types.ObjectId;
  familyId: string;
  tokenHash: string;
  expiresAt: Date;
  userAgentHash?: string | null;
  ipPrefixHash?: string | null;
}

export class AuthSessionRepository {
  async create(
    input: CreateAuthSessionInput,
    session?: ClientSession,
  ): Promise<HydratedDocument<AuthSessionRecord>> {
    const record = new AuthSessionModel({ ...input, status: 'ACTIVE' });
    return record.save({ session });
  }

  async findByTokenHash(
    tokenHash: string,
    session?: ClientSession,
  ): Promise<HydratedDocument<AuthSessionRecord> | null> {
    return AuthSessionModel.findOne({ tokenHash })
      .select('+tokenHash')
      .session(session ?? null)
      .exec();
  }

  async hasActiveFamily(userId: string, familyId: string, now: Date): Promise<boolean> {
    const session = await AuthSessionModel.exists({
      userId,
      familyId,
      status: 'ACTIVE',
      expiresAt: { $gt: now },
    });
    return session !== null;
  }

  async rotate(
    oldSessionId: Types.ObjectId,
    replacementSessionId: Types.ObjectId,
    now: Date,
    session: ClientSession,
  ): Promise<boolean> {
    const result = await AuthSessionModel.updateOne(
      { _id: oldSessionId, status: 'ACTIVE', expiresAt: { $gt: now } },
      {
        $set: {
          status: 'ROTATED',
          rotatedAt: now,
          lastUsedAt: now,
          replacedBySessionId: replacementSessionId,
        },
      },
      { session },
    ).exec();
    return result.modifiedCount === 1;
  }

  async revokeFamily(
    familyId: string,
    reason: SessionRevokeReason,
    now: Date,
    session?: ClientSession,
  ): Promise<number> {
    const result = await AuthSessionModel.updateMany(
      { familyId, status: { $ne: 'REVOKED' } },
      { $set: { status: 'REVOKED', revokedAt: now, revokeReason: reason } },
      { session },
    ).exec();
    return result.modifiedCount;
  }

  async revokeAllForUser(
    userId: string,
    reason: SessionRevokeReason,
    now: Date,
    session: ClientSession,
  ): Promise<number> {
    const result = await AuthSessionModel.updateMany(
      { userId, status: { $ne: 'REVOKED' } },
      { $set: { status: 'REVOKED', revokedAt: now, revokeReason: reason } },
      { session },
    ).exec();
    return result.modifiedCount;
  }
}
