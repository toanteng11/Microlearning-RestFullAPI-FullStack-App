import mongoose, { type ClientSession } from 'mongoose';

const MAX_TRANSACTION_ATTEMPTS = 3;

function isTransientTransactionError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('hasErrorLabel' in error)) return false;
  const hasErrorLabel = (error as { hasErrorLabel?: (label: string) => boolean }).hasErrorLabel;
  return (
    typeof hasErrorLabel === 'function' &&
    (hasErrorLabel.call(error, 'TransientTransactionError') ||
      hasErrorLabel.call(error, 'UnknownTransactionCommitResult'))
  );
}

export async function withMongoTransaction<T>(
  operation: (session: ClientSession) => Promise<T>,
): Promise<T> {
  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    const session = await mongoose.startSession();

    try {
      let result: T | undefined;
      await session.withTransaction(async () => {
        result = await operation(session);
      });

      if (result === undefined) throw new Error('MongoDB transaction did not return a result');
      return result;
    } catch (error) {
      if (attempt === MAX_TRANSACTION_ATTEMPTS || !isTransientTransactionError(error)) throw error;
    } finally {
      await session.endSession();
    }
  }

  throw new Error('MongoDB transaction retry limit exceeded');
}
