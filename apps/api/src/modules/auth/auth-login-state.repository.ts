import { AuthLoginStateModel } from './auth-login-state.model.js';

interface LoginPolicy {
  windowSeconds: number;
  maxAttempts: number;
  cooldownSeconds: number;
}

export class AuthLoginStateRepository {
  async getLockedUntil(identityKey: string, now: Date): Promise<Date | null> {
    const state = await AuthLoginStateModel.findOne({ identityKey }).lean().exec();
    return state?.lockedUntil && state.lockedUntil > now ? state.lockedUntil : null;
  }

  async recordFailure(identityKey: string, now: Date, policy: LoginPolicy): Promise<Date | null> {
    const current = await AuthLoginStateModel.findOne({ identityKey }).exec();
    const windowMilliseconds = policy.windowSeconds * 1000;
    const cooldownMilliseconds = policy.cooldownSeconds * 1000;

    if (!current || now.getTime() - current.windowStartedAt.getTime() >= windowMilliseconds) {
      await AuthLoginStateModel.findOneAndUpdate(
        { identityKey },
        {
          $set: {
            failureCount: 1,
            windowStartedAt: now,
            lockedUntil: null,
            expiresAt: new Date(now.getTime() + windowMilliseconds + cooldownMilliseconds),
          },
        },
        { upsert: true, runValidators: true },
      ).exec();
      return null;
    }

    current.failureCount += 1;
    if (current.failureCount >= policy.maxAttempts) {
      current.lockedUntil = new Date(now.getTime() + cooldownMilliseconds);
    }
    current.expiresAt = new Date(now.getTime() + windowMilliseconds + cooldownMilliseconds);
    await current.save();
    return current.lockedUntil ?? null;
  }

  async reset(identityKey: string): Promise<void> {
    await AuthLoginStateModel.deleteOne({ identityKey }).exec();
  }
}
