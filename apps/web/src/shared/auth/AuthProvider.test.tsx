import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from './AuthProvider';
import { useAuth } from './auth-context';

const user = {
  id: 'user-one',
  fullName: 'Student Example',
  email: 'student@example.com',
  role: 'STUDENT' as const,
  status: 'ACTIVE' as const,
  capabilities: ['profile.view_own'],
};

function Harness() {
  const auth = useAuth();
  const [result, setResult] = useState('no-result');
  return (
    <div>
      <span>{auth.status}</span>
      <span>{auth.user?.email ?? 'no-user'}</span>
      <span>
        {auth.hasPermission('profile.view_own') ? 'can-view-profile' : 'cannot-view-profile'}
      </span>
      <span>{result}</span>
      <button
        type="button"
        onClick={() => void auth.login(user.email, 'StrongPassword123!').catch(() => undefined)}
      >
        Login
      </button>
      <button type="button" onClick={() => void auth.refresh()}>
        Refresh
      </button>
      <button
        type="button"
        onClick={() =>
          void auth
            .request<{ success: true; data: { value: string } }>('/protected')
            .then((response) => setResult(response.data.value))
            .catch(() => setResult('request-error'))
        }
      >
        Request
      </button>
      <button
        type="button"
        onClick={() => auth.updateUser({ ...user, email: 'updated@example.com' })}
      >
        Update user
      </button>
      <button type="button" onClick={() => void auth.logout()}>
        Logout
      </button>
    </div>
  );
}

function renderProvider() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Harness />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('AuthProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('bootstraps an authenticated session without persistent token storage', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            data: { accessToken: 'memory-only-token', expiresInSeconds: 900, user },
          }),
          { status: 200 },
        ),
      ),
    );
    renderProvider();
    expect(await screen.findByText('student@example.com')).toBeInTheDocument();
    expect(screen.getByText('authenticated')).toBeInTheDocument();
    expect(JSON.stringify(localStorage)).not.toContain('memory-only-token');
    expect(JSON.stringify(sessionStorage)).not.toContain('memory-only-token');
  });

  it('becomes anonymous when bootstrap fails and clears state after logout', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: { code: 'AUTHENTICATION_REQUIRED', message: 'Required' } }),
          { status: 401 },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);
    renderProvider();
    expect(await screen.findByText('anonymous')).toBeInTheDocument();

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(screen.getByText('no-user')).toBeInTheDocument();
  });

  it('supports login, explicit refresh, permission checks, and local user updates', async () => {
    const authenticatedPayload = {
      success: true,
      data: { accessToken: 'new-memory-token', expiresInSeconds: 900, user },
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: { code: 'AUTHENTICATION_REQUIRED', message: 'Required' } }),
          { status: 401 },
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify(authenticatedPayload), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(authenticatedPayload), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    renderProvider();
    expect(await screen.findByText('anonymous')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    expect(await screen.findByText('student@example.com')).toBeInTheDocument();
    expect(screen.getByText('can-view-profile')).toBeInTheDocument();
    expect(fetchMock.mock.calls[1]?.[0]).toBe('http://localhost:4000/api/v1/auth/login');

    fireEvent.click(screen.getByRole('button', { name: 'Update user' }));
    expect(screen.getByText('updated@example.com')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(screen.getByText('authenticated')).toBeInTheDocument();
  });

  it('refreshes once after a protected request receives 401 and retries with the new token', async () => {
    const bootstrapPayload = {
      success: true,
      data: { accessToken: 'old-token', expiresInSeconds: 900, user },
    };
    const refreshPayload = {
      success: true,
      data: { accessToken: 'rotated-token', expiresInSeconds: 900, user },
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(bootstrapPayload), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: { code: 'ACCESS_TOKEN_EXPIRED', message: 'Expired' } }),
          { status: 401 },
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify(refreshPayload), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: { value: 'protected-data' } }), {
          status: 200,
        }),
      );
    vi.stubGlobal('fetch', fetchMock);
    renderProvider();
    expect(await screen.findByText('authenticated')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Request' }));
    expect(await screen.findByText('protected-data')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls[3]?.[1]).toEqual(
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer rotated-token' }),
      }),
    );
  });

  it('retries refresh after the server reports a safe rotation race', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: { code: 'REFRESH_RACE_RETRY', message: 'Retry refresh' } }),
          { status: 409 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: { accessToken: 'race-recovered-token', expiresInSeconds: 900, user },
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);
    renderProvider();
    expect(await screen.findByText('student@example.com')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('reports a non-authenticated request failure without attempting refresh', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: { code: 'AUTHENTICATION_REQUIRED', message: 'Required' } }),
          { status: 401 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { code: 'FORBIDDEN', message: 'Forbidden' } }), {
          status: 403,
        }),
      );
    vi.stubGlobal('fetch', fetchMock);
    renderProvider();
    expect(await screen.findByText('anonymous')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Request' }));
    expect(await screen.findByText('request-error')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
