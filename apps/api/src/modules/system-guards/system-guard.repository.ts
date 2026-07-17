import type { ClientSession } from 'mongoose';

import { SystemGuardModel } from './system-guard.model.js';

export class SystemGuardRepository {
  async touchSuperAdminGovernance(session: ClientSession): Promise<void> {
    await SystemGuardModel.findOneAndUpdate(
      { _id: 'super-admin-governance' },
      { $inc: { revision: 1 }, $set: { updatedAt: new Date() } },
      { upsert: true, session, setDefaultsOnInsert: true },
    ).exec();
  }
}
