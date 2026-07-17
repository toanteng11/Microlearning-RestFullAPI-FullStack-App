import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';

import { apiRequest, type ApiRequestOptions } from '../api/api-client';
import { ApiError } from '../api/api-error';
import { AuthContext, type AuthContextValue, type CurrentUser } from './auth-context';

interface AuthPayload {
  success: true;
  data: {
    accessToken: string;
    expiresInSeconds: number;
    user: CurrentUser;
  };
}

let sameTabRefresh: Promise<AuthPayload> | null = null;

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function executeRefresh(): Promise<AuthPayload> {
  try {
    return await apiRequest<AuthPayload>('/auth/refresh-token', { method: 'POST' });
  } catch (error) {
    if (error instanceof ApiError && error.code === 'REFRESH_RACE_RETRY') {
      await delay(180);
      return apiRequest<AuthPayload>('/auth/refresh-token', { method: 'POST' });
    }
    throw error;
  }
}

async function coordinatedRefresh(): Promise<AuthPayload> {
  if (sameTabRefresh) return sameTabRefresh;
  sameTabRefresh = (async () => {
    if (navigator.locks) {
      return navigator.locks.request('microlearning-refresh', executeRefresh);
    }
    return executeRefresh();
  })();
  try {
    return await sameTabRefresh;
  } finally {
    sameTabRefresh = null;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthContextValue['status']>('bootstrapping');
  const [user, setUser] = useState<CurrentUser | null>(null);
  const accessToken = useRef<string | null>(null);

  const clearPrivateState = useCallback(() => {
    accessToken.current = null;
    setUser(null);
    setStatus('anonymous');
    queryClient.clear();
  }, [queryClient]);

  const refresh = useCallback(async () => {
    setStatus((current) => (current === 'bootstrapping' ? current : 'refreshing'));
    try {
      const payload = await coordinatedRefresh();
      accessToken.current = payload.data.accessToken;
      setUser(payload.data.user);
      setStatus('authenticated');
      return true;
    } catch {
      clearPrivateState();
      return false;
    }
  }, [clearPrivateState]);

  useEffect(() => {
    let active = true;
    void coordinatedRefresh()
      .then((payload) => {
        if (!active) return;
        accessToken.current = payload.data.accessToken;
        setUser(payload.data.user);
        setStatus('authenticated');
      })
      .catch(() => {
        if (active) clearPrivateState();
      });
    return () => {
      active = false;
    };
  }, [clearPrivateState]);

  useEffect(() => {
    if (!('BroadcastChannel' in window)) return undefined;
    const channel = new BroadcastChannel('microlearning-auth');
    channel.onmessage = (event: MessageEvent<{ type?: string }>) => {
      if (event.data.type === 'LOGOUT') clearPrivateState();
    };
    return () => channel.close();
  }, [clearPrivateState]);

  const login = useCallback(async (email: string, password: string) => {
    const payload = await apiRequest<AuthPayload>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    accessToken.current = payload.data.accessToken;
    setUser(payload.data.user);
    setStatus('authenticated');
    return payload.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest<void>('/auth/logout', { method: 'POST' });
    } finally {
      clearPrivateState();
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('microlearning-auth');
        channel.postMessage({ type: 'LOGOUT' });
        channel.close();
      }
    }
  }, [clearPrivateState]);

  const authenticatedRequest = useCallback(
    async <T,>(path: string, options: ApiRequestOptions = {}): Promise<T> => {
      try {
        return await apiRequest<T>(path, { ...options, accessToken: accessToken.current });
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) throw error;
        const restored = await refresh();
        if (!restored) throw error;
        return apiRequest<T>(path, { ...options, accessToken: accessToken.current });
      }
    },
    [refresh],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      login,
      logout,
      refresh,
      request: authenticatedRequest,
      updateUser: setUser,
      hasPermission: (permission) => user?.capabilities.includes(permission) ?? false,
    }),
    [authenticatedRequest, login, logout, refresh, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
