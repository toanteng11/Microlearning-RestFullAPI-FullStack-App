import { describe, expect, it } from 'vitest';

import {
  sanitizeAtlasError,
  validateAtlasStagingUri,
} from '../src/shared/database/atlas-staging-contract.js';

describe('Atlas Staging connection contract', () => {
  const validUri =
    'mongodb+srv://ml-staging-app:synthetic-password@cluster.example.test/microlearning_staging?retryWrites=true&w=majority';

  it('accepts only the bounded TLS/SRV Staging database contract', () => {
    expect(validateAtlasStagingUri(validUri)).toEqual({
      databaseName: 'microlearning_staging',
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 10_000,
      connectTimeoutMS: 10_000,
      socketTimeoutMS: 30_000,
    });
    expect(() => validateAtlasStagingUri(validUri.replace('mongodb+srv://', 'mongodb://'))).toThrow(
      'mongodb+srv://',
    );
    expect(() =>
      validateAtlasStagingUri(validUri.replace('microlearning_staging', 'admin')),
    ).toThrow('microlearning_staging');
    expect(() => validateAtlasStagingUri(`${validUri}&tls=false`)).toThrow('must not disable TLS');
  });

  it('redacts URI userinfo from diagnostics', () => {
    const message = sanitizeAtlasError(new Error(`connect failed for ${validUri}`));
    expect(message).toContain('[REDACTED_MONGODB_URI]');
    expect(message).not.toContain('synthetic-password');
    expect(message).not.toContain('ml-staging-app');
  });

  it('redacts a bare Atlas hostname from diagnostics', () => {
    const message = sanitizeAtlasError(
      new Error('query failed on cluster0.example.mongodb.net after server selection'),
    );
    expect(message).toContain('[REDACTED_ATLAS_HOST]');
    expect(message).not.toContain('cluster0.example.mongodb.net');
  });
});
