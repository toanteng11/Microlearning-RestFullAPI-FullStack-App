import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';

import { AuthProvider } from '../shared/auth/AuthProvider';
import { InviteJoinProvider } from '../features/classrooms/InviteJoinContext';

export function ApplicationProviders() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false },
          mutations: { retry: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <InviteJoinProvider>
          <Suspense
            fallback={
              <main className="centered-page" aria-live="polite">
                <div className="spinner" aria-hidden="true" />
                <p>Đang tải màn hình...</p>
              </main>
            }
          >
            <Outlet />
          </Suspense>
        </InviteJoinProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
