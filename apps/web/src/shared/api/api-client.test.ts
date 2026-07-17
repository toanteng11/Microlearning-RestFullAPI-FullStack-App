import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiRequest } from './api-client';

describe('apiRequest', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('adds ephemeral bearer auth and parses a success envelope', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ success: true, data: { id: 'one' } }), { status: 200 }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest('/users/me', { accessToken: 'memory-token' })).resolves.toMatchObject({
      success: true,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/api/v1/users/me',
      expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({ Authorization: 'Bearer memory-token' }),
      }),
    );
  });

  it('serializes JSON mutations and maps API errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid',
              details: [{ field: 'email', code: 'INVALID_EMAIL', message: 'Invalid email' }],
            },
          }),
          { status: 422 },
        ),
      ),
    );

    await expect(
      apiRequest('/auth/register', { method: 'POST', body: { email: 'invalid' } }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' });
  });

  it('supports empty 204 responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await expect(apiRequest('/auth/logout', { method: 'POST' })).resolves.toBeUndefined();
  });
});
