import { randomUUID } from 'node:crypto';

import mongoose from 'mongoose';

import {
  sanitizeAtlasError,
  validateAtlasStagingUri,
} from '../shared/database/atlas-staging-contract.js';
import {
  createApplicationIndexes,
  verifyApplicationIndexes,
} from '../shared/database/application-indexes.js';
import { connectToMongoDB, disconnectFromMongoDB } from '../shared/database/mongodb.js';
import { createLogger } from '../shared/logging/logger.js';

interface Arguments {
  prepareIndexes: boolean;
  transaction: boolean;
}

function parseArguments(values: string[]): Arguments {
  const allowed = new Set(['--prepare-indexes', '--transaction']);
  const unknown = values.filter((value) => !allowed.has(value));
  if (unknown.length > 0) throw new Error(`Unknown argument: ${unknown.join(', ')}`);
  return {
    prepareIndexes: values.includes('--prepare-indexes'),
    transaction: values.includes('--transaction'),
  };
}

async function verifyTransaction(): Promise<void> {
  const database = mongoose.connection.db;
  if (!database) throw new Error('Atlas connection does not expose a database handle');

  const collection = database.collection('phase_07_transaction_verification');
  const verificationId = randomUUID();
  const session = await mongoose.connection.getClient().startSession();
  try {
    await session.withTransaction(async () => {
      await collection.insertOne(
        { verificationId, synthetic: true, createdAt: new Date() },
        { session },
      );
    });
    const committed = await collection.countDocuments({ verificationId, synthetic: true });
    if (committed !== 1) throw new Error('Atlas transaction commit verification failed');
  } finally {
    await collection.deleteMany({ verificationId });
    await session.endSession();
  }
}

async function main(): Promise<void> {
  if (process.env.APP_ENV !== 'staging') {
    throw new Error('Atlas verification requires APP_ENV=staging');
  }
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) throw new Error('MONGODB_URI must be supplied through a protected environment');

  const arguments_ = parseArguments(process.argv.slice(2));
  const contract = validateAtlasStagingUri(uri);
  const logger = createLogger('silent');

  await connectToMongoDB(uri, logger, {
    autoIndex: false,
    maxPoolSize: contract.maxPoolSize,
    minPoolSize: contract.minPoolSize,
    serverSelectionTimeoutMS: contract.serverSelectionTimeoutMS,
    connectTimeoutMS: contract.connectTimeoutMS,
    socketTimeoutMS: contract.socketTimeoutMS,
  });

  try {
    if (arguments_.prepareIndexes) await createApplicationIndexes();
    await verifyApplicationIndexes('staging');
    if (arguments_.transaction) await verifyTransaction();

    const collections = await mongoose.connection.db?.listCollections().toArray();
    process.stdout.write(
      `${JSON.stringify({
        event: 'atlas.staging.verified',
        database: contract.databaseName,
        tls: true,
        pool: { max: contract.maxPoolSize, min: contract.minPoolSize },
        indexes: 'verified',
        transaction: arguments_.transaction ? 'verified-and-cleaned' : 'not-requested',
        collectionCount: collections?.length ?? 0,
      })}\n`,
    );
  } finally {
    await disconnectFromMongoDB(logger);
  }
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${JSON.stringify({ event: 'atlas.staging.verification_failed', message: sanitizeAtlasError(error) })}\n`,
  );
  process.exitCode = 1;
});
