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

  it('downloads a CSV blob without trying to parse it as JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('"name"\r\n"Student"\r\n', {
        status: 200,
        headers: { 'Content-Type': 'text/csv; charset=utf-8' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const blob = await apiRequest<Blob>('/teacher/courses/one/progress/export', {
      accessToken: 'memory-token',
      responseType: 'blob',
    });
    expect(blob.type).toBe('text/csv;charset=utf-8');
    await expect(blob.text()).resolves.toContain('Student');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ headers: expect.objectContaining({ Accept: 'text/csv' }) }),
    );
  });
});
