import { randomUUID } from 'node:crypto';

import mongoose from 'mongoose';
import type { Connection, Model } from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

interface SmokeRecord {
  marker: string;
  createdAt: Date;
}

const integrationUri = process.env.MONGODB_INTEGRATION_URI;

if (!integrationUri) {
  throw new Error('MONGODB_INTEGRATION_URI is required for MongoDB integration tests');
}

const smokeSchema = new mongoose.Schema<SmokeRecord>(
  {
    marker: { type: String, required: true, unique: true },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);

let connection: Connection;
let smokeModel: Model<SmokeRecord>;

describe('MongoDB replica-set transaction smoke', () => {
  beforeAll(async () => {
    connection = await mongoose
      .createConnection(integrationUri, {
        serverSelectionTimeoutMS: 15_000,
        connectTimeoutMS: 15_000,
      })
      .asPromise();

    const database = connection.db;
    if (!database) throw new Error('Integration connection has no database handle');

    const hello = await database.admin().command({ hello: 1 });
    expect(hello).toMatchObject({ isWritablePrimary: true, setName: 'rs0' });

    smokeModel = connection.model<SmokeRecord>(
      'Phase02TransactionSmoke',
      smokeSchema,
      'p02_transaction_smoke',
    );
    await smokeModel.createCollection();
  });

  beforeEach(async () => {
    await smokeModel.deleteMany({});
  });

  afterAll(async () => {
    if (smokeModel) await smokeModel.deleteMany({});
    if (connection) await connection.close();
  });

  it('commits a write inside a transaction', async () => {
    const marker = `commit-${randomUUID()}`;
    const session = await connection.startSession();

    try {
      await session.withTransaction(async () => {
        await smokeModel.create([{ marker, createdAt: new Date() }], { session });
      });
    } finally {
      await session.endSession();
    }

    await expect(smokeModel.exists({ marker })).resolves.toBeTruthy();
  });

  it('rolls back all writes when a transaction fails', async () => {
    const marker = `rollback-${randomUUID()}`;
    const session = await connection.startSession();

    try {
      await expect(
        session.withTransaction(async () => {
          await smokeModel.create([{ marker, createdAt: new Date() }], { session });
          throw new Error('intentional transaction rollback');
        }),
      ).rejects.toThrow('intentional transaction rollback');
    } finally {
      await session.endSession();
    }

    await expect(smokeModel.exists({ marker })).resolves.toBeNull();
  });
});
