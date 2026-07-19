import { type ClientSession, type HydratedDocument, type Types } from 'mongoose';

import { ClassCodeModel, type ClassCodeRecord } from './class-code.model.js';
import {
  ClassroomInviteLinkModel,
  type ClassroomInviteLinkRecord,
} from './classroom-invite-link.model.js';

export interface NewClassCode {
  _id?: Types.ObjectId;
  classroomId: Types.ObjectId;
  codeDigest: string;
  maskedCode: string;
  generatedBy: Types.ObjectId;
  generatedAt: Date;
  expiresAt?: Date | null;
}

export interface NewClassroomInviteLink {
  _id?: Types.ObjectId;
  classroomId: Types.ObjectId;
  tokenHash: string;
  createdBy: Types.ObjectId;
  expiresAt: Date;
}

export class ClassroomCredentialRepository {
  async createClassCode(
    input: NewClassCode,
    session: ClientSession,
  ): Promise<HydratedDocument<ClassCodeRecord>> {
    const code = new ClassCodeModel({ ...input, status: 'ACTIVE' });
    return code.save({ session });
  }

  async findActiveClassCode(classroomId: Types.ObjectId, session?: ClientSession) {
    return ClassCodeModel.findOne({ classroomId, status: 'ACTIVE' })
      .session(session ?? null)
      .exec();
  }

  async findActiveClassCodeByDigest(codeDigest: string, session?: ClientSession) {
    return ClassCodeModel.findOne({ codeDigest, status: 'ACTIVE' })
      .select('+codeDigest')
      .session(session ?? null)
      .exec();
  }

  async findLatestClassCode(classroomId: Types.ObjectId, session?: ClientSession) {
    return ClassCodeModel.findOne({ classroomId })
      .sort({ createdAt: -1, _id: -1 })
      .session(session ?? null)
      .exec();
  }

  async replaceActiveClassCode(
    input: {
      credentialId: Types.ObjectId;
      classroomId: Types.ObjectId;
      expectedUpdatedAt: Date;
      replacementCredentialId: Types.ObjectId;
      changedAt: Date;
      changedBy: Types.ObjectId;
    },
    session: ClientSession,
  ) {
    return ClassCodeModel.findOneAndUpdate(
      {
        _id: input.credentialId,
        classroomId: input.classroomId,
        status: 'ACTIVE',
        updatedAt: input.expectedUpdatedAt,
      },
      {
        $set: {
          status: 'REGENERATED',
          disabledAt: input.changedAt,
          disabledBy: input.changedBy,
          replacedById: input.replacementCredentialId,
        },
      },
      { returnDocument: 'after', runValidators: true, session },
    ).exec();
  }

  async disableActiveClassCode(
    input: {
      credentialId: Types.ObjectId;
      classroomId: Types.ObjectId;
      expectedUpdatedAt: Date;
      changedAt: Date;
      changedBy: Types.ObjectId;
    },
    session: ClientSession,
  ) {
    return ClassCodeModel.findOneAndUpdate(
      {
        _id: input.credentialId,
        classroomId: input.classroomId,
        status: 'ACTIVE',
        updatedAt: input.expectedUpdatedAt,
      },
      {
        $set: {
          status: 'DISABLED',
          disabledAt: input.changedAt,
          disabledBy: input.changedBy,
        },
      },
      { returnDocument: 'after', runValidators: true, session },
    ).exec();
  }

  async createInviteLink(
    input: NewClassroomInviteLink,
    session: ClientSession,
  ): Promise<HydratedDocument<ClassroomInviteLinkRecord>> {
    const link = new ClassroomInviteLinkModel({ ...input, status: 'ACTIVE' });
    return link.save({ session });
  }

  async findActiveInviteLink(classroomId: Types.ObjectId, session?: ClientSession) {
    return ClassroomInviteLinkModel.findOne({ classroomId, status: 'ACTIVE' })
      .session(session ?? null)
      .exec();
  }

  async findActiveInviteLinkByHash(tokenHash: string, session?: ClientSession) {
    return ClassroomInviteLinkModel.findOne({ tokenHash, status: 'ACTIVE' })
      .select('+tokenHash')
      .session(session ?? null)
      .exec();
  }

  async findInviteLinkById(
    classroomId: Types.ObjectId,
    linkId: Types.ObjectId,
    session?: ClientSession,
  ) {
    return ClassroomInviteLinkModel.findOne({ _id: linkId, classroomId })
      .session(session ?? null)
      .exec();
  }

  async listInviteLinks(classroomId: Types.ObjectId) {
    return ClassroomInviteLinkModel.find({ classroomId }).sort({ createdAt: -1, _id: -1 }).exec();
  }

  async replaceActiveInviteLink(
    input: {
      credentialId: Types.ObjectId;
      classroomId: Types.ObjectId;
      expectedUpdatedAt: Date;
      replacementCredentialId: Types.ObjectId;
      changedAt: Date;
      changedBy: Types.ObjectId;
    },
    session: ClientSession,
  ) {
    return ClassroomInviteLinkModel.findOneAndUpdate(
      {
        _id: input.credentialId,
        classroomId: input.classroomId,
        status: 'ACTIVE',
        updatedAt: input.expectedUpdatedAt,
      },
      {
        $set: {
          status: 'REGENERATED',
          disabledAt: input.changedAt,
          disabledBy: input.changedBy,
          replacedById: input.replacementCredentialId,
        },
      },
      { returnDocument: 'after', runValidators: true, session },
    ).exec();
  }

  async disableActiveInviteLink(
    input: {
      credentialId: Types.ObjectId;
      classroomId: Types.ObjectId;
      expectedUpdatedAt: Date;
      changedAt: Date;
      changedBy: Types.ObjectId;
    },
    session: ClientSession,
  ) {
    return ClassroomInviteLinkModel.findOneAndUpdate(
      {
        _id: input.credentialId,
        classroomId: input.classroomId,
        status: 'ACTIVE',
        updatedAt: input.expectedUpdatedAt,
      },
      {
        $set: {
          status: 'DISABLED',
          disabledAt: input.changedAt,
          disabledBy: input.changedBy,
        },
      },
      { returnDocument: 'after', runValidators: true, session },
    ).exec();
  }

  async expireInviteLink(
    credentialId: Types.ObjectId,
    expectedUpdatedAt: Date,
    now: Date,
    session?: ClientSession,
  ) {
    return ClassroomInviteLinkModel.findOneAndUpdate(
      {
        _id: credentialId,
        status: 'ACTIVE',
        updatedAt: expectedUpdatedAt,
        expiresAt: { $lte: now },
      },
      { $set: { status: 'EXPIRED', disabledAt: now } },
      { returnDocument: 'after', runValidators: true, session },
    ).exec();
  }
}
