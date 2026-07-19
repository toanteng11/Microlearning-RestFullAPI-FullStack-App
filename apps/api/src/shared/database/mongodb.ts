import mongoose from 'mongoose';
import type { Logger } from 'pino';

export type DatabaseStatus = 'UP' | 'DOWN' | 'CONNECTING';

interface MongoHelloResponse {
  isWritablePrimary?: boolean;
  setName?: string;
}

async function readReplicaSetHello(): Promise<MongoHelloResponse> {
  const database = mongoose.connection.db;

  if (!database) {
    throw new Error('MongoDB connection does not expose a database handle');
  }

  return (await database.admin().command({ hello: 1 })) as MongoHelloResponse;
}

export async function assertMongoDBPrimary(): Promise<void> {
  const hello = await readReplicaSetHello();

  if (!hello.isWritablePrimary || !hello.setName) {
    throw new Error('MongoDB is not a writable replica-set primary');
  }
}

export async function getDatabaseStatus(): Promise<DatabaseStatus> {
  switch (mongoose.connection.readyState) {
    case 1:
      try {
        await assertMongoDBPrimary();
        return 'UP';
      } catch {
        return 'DOWN';
      }
    case 2:
      return 'CONNECTING';
    default:
      return 'DOWN';
  }
}

export async function connectToMongoDB(
  uri: string,
  logger: Logger,
  options: { autoIndex?: boolean } = {},
): Promise<void> {
  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    autoIndex: options.autoIndex ?? true,
    serverSelectionTimeoutMS: 10_000,
    connectTimeoutMS: 10_000,
  });

  try {
    await assertMongoDBPrimary();
  } catch (error) {
    await mongoose.disconnect();
    throw error;
  }

  logger.info(
    { event: 'mongodb.connected', topology: 'replica-set-primary' },
    'MongoDB connection established',
  );
}

export async function disconnectFromMongoDB(logger: Logger): Promise<void> {
  if (mongoose.connection.readyState === 0) return;

  await mongoose.disconnect();
  logger.info({ event: 'mongodb.disconnected' }, 'MongoDB connection closed');
}
