import { beforeEach, describe, expect, it, vi } from 'vitest';

const mongoMocks = vi.hoisted(() => ({
  startSession: vi.fn(),
}));

vi.mock('mongoose', () => ({
  default: { startSession: mongoMocks.startSession },
}));

import { withMongoTransaction } from '../src/shared/database/unit-of-work.js';

describe('Mongo unit of work', () => {
  const endSession = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mongoMocks.startSession.mockResolvedValue({
      withTransaction: async (operation: () => Promise<void>) => operation(),
      endSession,
    });
  });

  it('returns the operation result and always closes its session', async () => {
    await expect(withMongoTransaction(async () => 'committed')).resolves.toBe('committed');
    expect(endSession).toHaveBeenCalledOnce();
  });

  it('does not retry non-transient failures', async () => {
    await expect(
      withMongoTransaction(async () => {
        throw new Error('business failure');
      }),
    ).rejects.toThrow('business failure');
    expect(mongoMocks.startSession).toHaveBeenCalledOnce();
  });

  it('retries a bounded transient transaction failure', async () => {
    const transient = Object.assign(new Error('transient'), {
      hasErrorLabel: (label: string) => label === 'TransientTransactionError',
    });
    let attempt = 0;
    const result = await withMongoTransaction(async () => {
      attempt += 1;
      if (attempt === 1) throw transient;
      return 'retried';
    });
    expect(result).toBe('retried');
    expect(mongoMocks.startSession).toHaveBeenCalledTimes(2);
  });
});
