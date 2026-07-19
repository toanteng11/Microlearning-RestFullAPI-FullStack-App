import { Writable } from 'node:stream';

import { describe, expect, it } from 'vitest';

import { createLogger, sanitizeRequestUrl } from '../src/shared/logging/logger.js';

describe('structured log redaction', () => {
  it('keeps operational URL context while redacting sensitive query values', () => {
    expect(
      sanitizeRequestUrl(
        '/api/v1/teacher/invitations/preview?token=raw-invitation-value&channel=ZALO',
      ),
    ).toBe('/api/v1/teacher/invitations/preview?token=%5BREDACTED%5D&channel=ZALO');
    expect(sanitizeRequestUrl('/health')).toBe('/health');
    expect(sanitizeRequestUrl('/join/invite#token=raw-fragment-token')).toBe(
      '/join/invite#[REDACTED]',
    );
  });

  it('redacts credentials, cookies, token fields, and request URL values', () => {
    let output = '';
    const destination = new Writable({
      write(chunk, _encoding, callback) {
        output += chunk.toString();
        callback();
      },
    });
    const logger = createLogger('info', destination);

    logger.info({
      req: {
        method: 'POST',
        url: '/teacher/invite?token=raw-query-token',
        headers: {
          authorization: 'Bearer raw-access-token',
          cookie: 'ml_refresh=raw-refresh-cookie',
        },
      },
      body: {
        password: 'raw-password',
        confirmPassword: 'raw-confirm-password',
        token: 'raw-body-token',
        code: 'ABCD-EFGH',
        codeDigest: 'raw-code-digest',
        inviteToken: 'raw-invite-token',
        tokenHash: 'raw-token-hash',
      },
      accessToken: 'raw-top-level-access-token',
    });

    expect(output).toContain('[REDACTED]');
    expect(output).toContain('/teacher/invite');
    for (const secret of [
      'raw-query-token',
      'raw-access-token',
      'raw-refresh-cookie',
      'raw-password',
      'raw-confirm-password',
      'raw-body-token',
      'raw-top-level-access-token',
      'ABCD-EFGH',
      'raw-code-digest',
      'raw-invite-token',
      'raw-token-hash',
    ]) {
      expect(output).not.toContain(secret);
    }
  });
});
