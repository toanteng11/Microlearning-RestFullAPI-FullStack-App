import type { ClientSession, Types } from 'mongoose';

import { isMongoDuplicateKeyError } from '../../shared/database/mongo-errors.js';
import {
  ENROLLMENT_POLICY_KEY,
  SystemSettingModel,
  type EnrollmentPolicyValue,
} from './system-setting.model.js';

export const DEFAULT_ENROLLMENT_POLICY: Readonly<EnrollmentPolicyValue> = Object.freeze({
  allowClassCodeJoin: true,
  allowInviteLinkJoin: true,
  defaultInviteLinkLifetimeDays: 30,
});

export class EnrollmentPolicyRepository {
  async ensureEnrollmentPolicy(defaultInviteLinkLifetimeDays: number, now = new Date()) {
    const value: EnrollmentPolicyValue = {
      ...DEFAULT_ENROLLMENT_POLICY,
      defaultInviteLinkLifetimeDays,
    };

    try {
      return await SystemSettingModel.findOneAndUpdate(
        { key: ENROLLMENT_POLICY_KEY },
        {
          $setOnInsert: {
            value,
            revision: 1,
            updatedBy: null,
            createdAt: now,
            updatedAt: now,
          },
        },
        {
          upsert: true,
          returnDocument: 'after',
          runValidators: true,
          setDefaultsOnInsert: true,
          timestamps: false,
        },
      ).exec();
    } catch (error) {
      if (!isMongoDuplicateKeyError(error)) throw error;
      return this.findEnrollmentPolicy();
    }
  }

  async findEnrollmentPolicy(session?: ClientSession) {
    return SystemSettingModel.findOne({ key: ENROLLMENT_POLICY_KEY })
      .session(session ?? null)
      .exec();
  }

  async updateEnrollmentPolicyCas(
    input: {
      value: EnrollmentPolicyValue;
      expectedRevision: number;
      updatedBy: Types.ObjectId;
    },
    session: ClientSession,
  ) {
    return SystemSettingModel.findOneAndUpdate(
      { key: ENROLLMENT_POLICY_KEY, revision: input.expectedRevision },
      {
        $set: { value: input.value, updatedBy: input.updatedBy },
        $inc: { revision: 1 },
      },
      { returnDocument: 'after', runValidators: true, session },
    ).exec();
  }
}
