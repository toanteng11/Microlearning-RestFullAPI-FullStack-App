const EXPECTED_DATABASE = 'microlearning_staging';

export interface AtlasStagingContract {
  databaseName: typeof EXPECTED_DATABASE;
  maxPoolSize: 10;
  minPoolSize: 0;
  serverSelectionTimeoutMS: 10_000;
  connectTimeoutMS: 10_000;
  socketTimeoutMS: 30_000;
}

export function validateAtlasStagingUri(uri: string): AtlasStagingContract {
  if (!uri.startsWith('mongodb+srv://')) {
    throw new Error('Atlas Staging URI must use mongodb+srv://');
  }

  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    throw new Error('Atlas Staging URI is invalid');
  }

  if (!parsed.username || !parsed.password) {
    throw new Error('Atlas Staging URI must include a dedicated application credential');
  }
  if (decodeURIComponent(parsed.pathname.replace(/^\//u, '')) !== EXPECTED_DATABASE) {
    throw new Error(`Atlas Staging URI must select ${EXPECTED_DATABASE}`);
  }
  if (
    ['false', '0'].includes(parsed.searchParams.get('tls')?.toLowerCase() ?? '') ||
    ['false', '0'].includes(parsed.searchParams.get('ssl')?.toLowerCase() ?? '')
  ) {
    throw new Error('Atlas Staging URI must not disable TLS');
  }

  return Object.freeze({
    databaseName: EXPECTED_DATABASE,
    maxPoolSize: 10,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 10_000,
    connectTimeoutMS: 10_000,
    socketTimeoutMS: 30_000,
  });
}

export function sanitizeAtlasError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Unknown Atlas verification error';
  return message
    .replace(/mongodb(?:\+srv)?:\/\/[^\s"']+/giu, '[REDACTED_MONGODB_URI]')
    .replace(/([a-z0-9._%+-]+):([^@\s]+)@/giu, '[REDACTED_CREDENTIAL]@')
    .replace(/[a-z0-9.-]+\.mongodb\.net/giu, '[REDACTED_ATLAS_HOST]')
    .slice(0, 500);
}
