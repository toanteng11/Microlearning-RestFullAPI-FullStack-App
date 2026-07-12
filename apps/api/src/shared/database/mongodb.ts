import mongoose from 'mongoose';
import type { Logger } from 'pino';

export type DatabaseStatus = 'UP' | 'DOWN' | 'CONNECTING';

export function getDatabaseStatus(): DatabaseStatus {
  switch (mongoose.connection.readyState) {
    case 1:
      return 'UP';
    case 2:
      return 'CONNECTING';
    default:
      return 'DOWN';
  }
}

export async function connectToMongoDB(uri: string, logger: Logger): Promise<void> {
  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
    connectTimeoutMS: 10_000,
  });

  logger.info({ event: 'mongodb.connected' }, 'MongoDB connection established');
}

export async function disconnectFromMongoDB(logger: Logger): Promise<void> {
  if (mongoose.connection.readyState === 0) return;

  await mongoose.disconnect();
  logger.info({ event: 'mongodb.disconnected' }, 'MongoDB connection closed');
}
