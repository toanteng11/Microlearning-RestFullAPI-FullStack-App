import type { Logger } from 'pino';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mongoMocks = vi.hoisted(() => ({
  readyState: 0,
  databaseAvailable: true,
  command: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  set: vi.fn(),
}));

vi.mock('mongoose', () => ({
  default: {
    connection: {
      get readyState() {
        return mongoMocks.readyState;
      },
      get db() {
        if (!mongoMocks.databaseAvailable) return undefined;
        return {
          admin: () => ({ command: mongoMocks.command }),
        };
      },
    },
    connect: mongoMocks.connect,
    disconnect: mongoMocks.disconnect,
    set: mongoMocks.set,
  },
}));

import {
  assertMongoDBPrimary,
  connectToMongoDB,
  disconnectFromMongoDB,
  getDatabaseStatus,
} from '../src/shared/database/mongodb.js';

const logger = {
  info: vi.fn(),
} as unknown as Logger;

describe('MongoDB runtime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mongoMocks.readyState = 0;
    mongoMocks.databaseAvailable = true;
    mongoMocks.command.mockResolvedValue({ isWritablePrimary: true, setName: 'rs0' });
  });

  it('reports DOWN, CONNECTING and replica-set-primary UP accurately', async () => {
    await expect(getDatabaseStatus()).resolves.toBe('DOWN');

    mongoMocks.readyState = 2;
    await expect(getDatabaseStatus()).resolves.toBe('CONNECTING');

    mongoMocks.readyState = 1;
    await expect(getDatabaseStatus()).resolves.toBe('UP');
    expect(mongoMocks.command).toHaveBeenCalledWith({ hello: 1 });
  });

  it('reports DOWN when the connected node is not writable primary', async () => {
    mongoMocks.readyState = 1;
    mongoMocks.command.mockResolvedValue({ isWritablePrimary: false, setName: 'rs0' });

    await expect(getDatabaseStatus()).resolves.toBe('DOWN');
  });

  it('requires a database handle and a named writable replica set', async () => {
    mongoMocks.databaseAvailable = false;
    await expect(assertMongoDBPrimary()).rejects.toThrow('does not expose a database handle');

    mongoMocks.databaseAvailable = true;
    mongoMocks.command.mockResolvedValue({ isWritablePrimary: true });
    await expect(assertMongoDBPrimary()).rejects.toThrow('not a writable replica-set primary');
  });

  it('connects only after the server is confirmed as replica-set primary', async () => {
    await connectToMongoDB('mongodb://mongodb:27017/app?replicaSet=rs0', logger);

    expect(mongoMocks.set).toHaveBeenCalledWith('strictQuery', true);
    expect(mongoMocks.connect).toHaveBeenCalledWith(
      'mongodb://mongodb:27017/app?replicaSet=rs0',
      expect.objectContaining({ serverSelectionTimeoutMS: 10_000 }),
    );
    expect(logger.info).toHaveBeenCalledWith(
      { event: 'mongodb.connected', topology: 'replica-set-primary' },
      'MongoDB connection established',
    );
  });

  it('disconnects and rejects startup when primary verification fails', async () => {
    mongoMocks.command.mockResolvedValue({ isWritablePrimary: false, setName: 'rs0' });

    await expect(
      connectToMongoDB('mongodb://mongodb:27017/app?replicaSet=rs0', logger),
    ).rejects.toThrow('not a writable replica-set primary');
    expect(mongoMocks.disconnect).toHaveBeenCalledOnce();
  });

  it('disconnects only when a connection is active', async () => {
    await disconnectFromMongoDB(logger);
    expect(mongoMocks.disconnect).not.toHaveBeenCalled();

    mongoMocks.readyState = 1;
    await disconnectFromMongoDB(logger);
    expect(mongoMocks.disconnect).toHaveBeenCalledOnce();
    expect(logger.info).toHaveBeenCalledWith(
      { event: 'mongodb.disconnected' },
      'MongoDB connection closed',
    );
  });
});
