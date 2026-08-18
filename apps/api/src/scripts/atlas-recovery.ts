import { createHash } from 'node:crypto';
import {
  createReadStream,
  createWriteStream,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { once } from 'node:events';
import { MongoClient, type Document, type IndexDescription } from 'mongodb';
import { EJSON } from 'bson';

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/u;
const RESTORE_DATABASE_PREFIX = 'microlearning_restore_';
const DEFAULT_RETENTION_DAYS = 14;
const DEFAULT_BATCH_SIZE = 100;

export interface RecoveryEnvironment {
  appEnv: 'staging';
  dataScope: 'synthetic';
  uri: string;
  database: string;
  outputDirectory?: string;
  manifestPath?: string;
  backupId?: string;
  restoreDatabase?: string;
  reportPath?: string;
  retentionDays: number;
  batchSize: number;
}

export interface BackupCollectionManifest {
  name: string;
  file: string;
  count: number;
  bytes: number;
  sha256: string;
  indexes: IndexDescription[];
}

export interface BackupManifest {
  schemaVersion: 1;
  kind: 'ATLAS_SYNTHETIC_LOGICAL_BACKUP';
  backupId: string;
  environment: 'staging';
  dataScope: 'synthetic';
  sourceDatabase: string;
  createdAt: string;
  tool: 'atlas-recovery/1';
  retentionDays: number;
  totalDocuments: number;
  collections: BackupCollectionManifest[];
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function positiveInteger(name: string, fallback: number): number {
  const value = process.env[name]?.trim();
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1)
    throw new Error(`${name} must be a positive integer.`);
  return parsed;
}

function databaseFromUri(uri: string): string {
  const database = uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?/#]+)(?:[?#]|$)/u)?.[1];
  if (!database) throw new Error('MONGODB_URI must contain an explicit database name.');
  return decodeURIComponent(database);
}

function safeFileName(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function redactError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/mongodb(?:\+srv)?:\/\/[^\s"']+/giu, 'mongodb://[REDACTED]')
    .replace(/(?:password|passwd|pwd)=([^&\s]+)/giu, '$1=[REDACTED]');
}

export function validateRecoveryEnvironment(mode: 'backup' | 'restore'): RecoveryEnvironment {
  if (process.env.APP_ENV !== 'staging') {
    throw new Error('Atlas recovery tooling is restricted to APP_ENV=staging.');
  }
  if (process.env.RECOVERY_DATA_SCOPE !== 'synthetic') {
    throw new Error('RECOVERY_DATA_SCOPE=synthetic is required; real data is forbidden.');
  }

  const uri = required(mode === 'backup' ? 'MONGODB_URI' : 'RESTORE_MONGODB_URI');
  if (!uri.startsWith('mongodb+srv://')) {
    throw new Error('Atlas recovery requires an SRV connection string.');
  }

  const database = mode === 'backup' ? databaseFromUri(uri) : required('SOURCE_DATABASE');
  if (!SAFE_ID.test(database)) throw new Error('Database name contains unsupported characters.');

  const common = {
    appEnv: 'staging' as const,
    dataScope: 'synthetic' as const,
    uri,
    database,
    retentionDays: positiveInteger('BACKUP_RETENTION_DAYS', DEFAULT_RETENTION_DAYS),
    batchSize: positiveInteger('RECOVERY_BATCH_SIZE', DEFAULT_BATCH_SIZE),
  };

  if (mode === 'backup') {
    const outputDirectory = resolve(required('BACKUP_OUTPUT_DIR'));
    const backupId = required('BACKUP_ID');
    if (!SAFE_ID.test(backupId)) throw new Error('BACKUP_ID contains unsupported characters.');
    return { ...common, outputDirectory, backupId };
  }

  const restoreDatabase = required('RESTORE_DATABASE');
  if (!restoreDatabase.startsWith(RESTORE_DATABASE_PREFIX) || !SAFE_ID.test(restoreDatabase)) {
    throw new Error(
      `RESTORE_DATABASE must use the isolated ${RESTORE_DATABASE_PREFIX}<id> prefix.`,
    );
  }
  if (restoreDatabase === database)
    throw new Error('RESTORE_DATABASE must differ from SOURCE_DATABASE.');

  const manifestPath = resolve(required('BACKUP_MANIFEST'));
  const reportPath = resolve(
    process.env.RESTORE_REPORT_PATH?.trim() || join(dirname(manifestPath), 'restore-report.json'),
  );
  return { ...common, manifestPath, restoreDatabase, reportPath };
}

async function writeLine(
  stream: ReturnType<typeof createWriteStream>,
  line: string,
): Promise<void> {
  if (stream.write(`${line}\n`)) return;
  await once(stream, 'drain');
}

async function closeStream(stream: ReturnType<typeof createWriteStream>): Promise<void> {
  stream.end();
  await once(stream, 'close');
}

async function backupCollection(
  database: ReturnType<MongoClient['db']>,
  outputDirectory: string,
  collectionName: string,
): Promise<BackupCollectionManifest> {
  const relativeFile = join('collections', `${safeFileName(collectionName)}.jsonl`);
  const filePath = join(outputDirectory, relativeFile);
  mkdirSync(dirname(filePath), { recursive: true });

  const stream = createWriteStream(filePath, { encoding: 'utf8' });
  const hash = createHash('sha256');
  let count = 0;
  try {
    const cursor = database.collection(collectionName).find({}).sort({ _id: 1 });
    for await (const document of cursor) {
      const line = EJSON.stringify(document, { relaxed: false });
      hash.update(`${line}\n`, 'utf8');
      await writeLine(stream, line);
      count += 1;
    }
  } finally {
    await closeStream(stream);
  }

  const indexes = (await database.collection(collectionName).listIndexes().toArray()).filter(
    (index) => index.name !== '_id_',
  );
  const bytes = Buffer.byteLength(readFileSync(filePath));
  return {
    name: collectionName,
    file: relativeFile,
    count,
    bytes,
    sha256: hash.digest('hex'),
    indexes,
  };
}

export function buildManifest(
  environment: RecoveryEnvironment,
  collections: BackupCollectionManifest[],
  createdAt = new Date().toISOString(),
): BackupManifest {
  return {
    schemaVersion: 1,
    kind: 'ATLAS_SYNTHETIC_LOGICAL_BACKUP',
    backupId: environment.backupId ?? 'unknown',
    environment: 'staging',
    dataScope: 'synthetic',
    sourceDatabase: environment.database,
    createdAt,
    tool: 'atlas-recovery/1',
    retentionDays: environment.retentionDays,
    totalDocuments: collections.reduce((total, collection) => total + collection.count, 0),
    collections,
  };
}

async function runBackup(): Promise<void> {
  const environment = validateRecoveryEnvironment('backup');
  const outputDirectory = environment.outputDirectory!;
  mkdirSync(outputDirectory, { recursive: true });
  const client = new MongoClient(environment.uri, {
    serverSelectionTimeoutMS: 15_000,
    connectTimeoutMS: 15_000,
    socketTimeoutMS: 60_000,
  });

  try {
    await client.connect();
    const database = client.db(environment.database);
    const collections = (await database.listCollections().toArray())
      .filter(
        (collection) => collection.type === 'collection' && !collection.name.startsWith('system.'),
      )
      .map((collection) => collection.name)
      .sort();
    const collectionManifests = [];
    for (const collectionName of collections) {
      collectionManifests.push(await backupCollection(database, outputDirectory, collectionName));
    }

    const manifest = buildManifest(environment, collectionManifests);
    writeFileSync(
      join(outputDirectory, 'manifest.json'),
      `${JSON.stringify(manifest, null, 2)}\n`,
      'utf8',
    );
    process.stdout.write(
      `${JSON.stringify({ event: 'atlas.backup.completed', backupId: manifest.backupId, collectionCount: collections.length, totalDocuments: manifest.totalDocuments })}\n`,
    );
  } finally {
    await client.close();
  }
}

function readManifest(path: string): BackupManifest {
  const manifest = JSON.parse(readFileSync(path, 'utf8')) as BackupManifest;
  if (
    manifest.schemaVersion !== 1 ||
    manifest.kind !== 'ATLAS_SYNTHETIC_LOGICAL_BACKUP' ||
    manifest.environment !== 'staging' ||
    manifest.dataScope !== 'synthetic' ||
    !Array.isArray(manifest.collections)
  ) {
    throw new Error('Backup manifest is invalid or not a synthetic Staging backup.');
  }
  return manifest;
}

async function verifyFile(path: string, expectedSha256: string): Promise<void> {
  const hash = createHash('sha256');
  const stream = createReadStream(path);
  for await (const chunk of stream) hash.update(chunk);
  if (hash.digest('hex') !== expectedSha256) throw new Error(`Checksum mismatch for ${path}.`);
}

async function restoreCollection(
  database: ReturnType<MongoClient['db']>,
  sourceDirectory: string,
  collectionManifest: BackupCollectionManifest,
  batchSize: number,
): Promise<number> {
  const filePath = join(sourceDirectory, collectionManifest.file);
  await verifyFile(filePath, collectionManifest.sha256);
  const collection = database.collection(collectionManifest.name);
  const input = createReadStream(filePath, { encoding: 'utf8' });
  const lines = createInterface({ input, crlfDelay: Infinity });
  let batch: Document[] = [];
  let count = 0;
  for await (const line of lines) {
    if (!line.trim()) continue;
    batch.push(EJSON.parse(line, { relaxed: false }) as Document);
    if (batch.length >= batchSize) {
      await collection.insertMany(batch, { ordered: true });
      count += batch.length;
      batch = [];
    }
  }
  if (batch.length) {
    await collection.insertMany(batch, { ordered: true });
    count += batch.length;
  }

  if (count !== collectionManifest.count) {
    throw new Error(`Document count mismatch for ${collectionManifest.name}.`);
  }
  if (count === 0) {
    await database.createCollection(collectionManifest.name).catch((error: unknown) => {
      if (!(error instanceof Error) || !error.message.includes('already exists')) throw error;
    });
  }
  if (collectionManifest.indexes.length) {
    await collection.createIndexes(
      collectionManifest.indexes.filter((index) => index.name !== '_id_'),
    );
  }
  const restoredIndexNames = new Set(
    (await collection.listIndexes().toArray()).map((index) => index.name),
  );
  for (const index of collectionManifest.indexes) {
    if (!restoredIndexNames.has(index.name)) {
      throw new Error(`Index ${index.name} was not restored for ${collectionManifest.name}.`);
    }
  }
  return count;
}

async function runRestore(): Promise<void> {
  const environment = validateRecoveryEnvironment('restore');
  const manifest = readManifest(environment.manifestPath!);
  if (manifest.sourceDatabase !== environment.database) {
    throw new Error('SOURCE_DATABASE does not match the backup manifest.');
  }

  const client = new MongoClient(environment.uri, {
    serverSelectionTimeoutMS: 15_000,
    connectTimeoutMS: 15_000,
    socketTimeoutMS: 60_000,
  });
  const startedAt = Date.now();
  try {
    await client.connect();
    const database = client.db(environment.restoreDatabase);
    for (const collectionManifest of manifest.collections) {
      await verifyFile(
        join(dirname(environment.manifestPath!), collectionManifest.file),
        collectionManifest.sha256,
      );
    }
    await database.dropDatabase();
    const restoredCollections: Record<string, number> = {};
    for (const collectionManifest of manifest.collections) {
      restoredCollections[collectionManifest.name] = await restoreCollection(
        database,
        dirname(environment.manifestPath!),
        collectionManifest,
        environment.batchSize,
      );
    }
    const report = {
      schemaVersion: 1,
      kind: 'ATLAS_SYNTHETIC_ISOLATED_RESTORE',
      environment: 'staging',
      dataScope: 'synthetic',
      sourceDatabase: manifest.sourceDatabase,
      restoreDatabase: environment.restoreDatabase,
      backupId: manifest.backupId,
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date().toISOString(),
      durationSeconds: Number(((Date.now() - startedAt) / 1000).toFixed(3)),
      expectedDocuments: manifest.totalDocuments,
      restoredDocuments: Object.values(restoredCollections).reduce((sum, value) => sum + value, 0),
      restoredCollections,
      checksumVerified: true,
      activeStagingUntouched: true,
      cleanupRequired: true,
    };
    mkdirSync(dirname(environment.reportPath!), { recursive: true });
    writeFileSync(environment.reportPath!, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    process.stdout.write(
      `${JSON.stringify({ event: 'atlas.restore.completed', backupId: manifest.backupId, restoreDatabase: environment.restoreDatabase, reportPath: environment.reportPath })}\n`,
    );
  } finally {
    await client.close();
  }
}

const mode = process.argv[2];
if (mode !== 'backup' && mode !== 'restore') {
  throw new Error('Usage: atlas-recovery.ts <backup|restore>.');
}

(mode === 'backup' ? runBackup() : runRestore()).catch((error) => {
  process.stderr.write(
    `${JSON.stringify({ event: 'atlas.recovery.failed', message: redactError(error) })}\n`,
  );
  process.exitCode = 1;
});
