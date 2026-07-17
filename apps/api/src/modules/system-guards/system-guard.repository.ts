import type { ClientSession } from 'mongoose';

import { isMongoDuplicateKeyError } from '../../shared/database/mongo-errors.js';
import { SystemGuardModel } from './system-guard.model.js';

export class SystemGuardRepository {
  async ensureSuperAdminGovernance(): Promise<void> {
    try {
      await SystemGuardModel.updateOne(
        { _id: 'super-admin-governance' },
        { $setOnInsert: { revision: 0, updatedAt: new Date() } },
        { upsert: true },
      ).exec();
    } catch (error) {
      if (!isMongoDuplicateKeyError(error)) throw error;
    }
  }

  async touchSuperAdminGovernance(session: ClientSession): Promise<void> {
    const guard = await SystemGuardModel.findOneAndUpdate(
      { _id: 'super-admin-governance' },
      { $inc: { revision: 1 }, $set: { updatedAt: new Date() } },
      { returnDocument: 'after', session },
    ).exec();
    if (!guard) throw new Error('Super Admin governance guard is not initialized');
  }
}
