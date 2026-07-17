import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from './auth-context';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'bootstrapping' || status === 'refreshing') {
    return (
      <main className="centered-page" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <p>Đang xác thực phiên làm việc...</p>
      </main>
    );
  }
  if (status !== 'authenticated') {
    const returnUrl = `${location.pathname}${location.search}`;
    return <Navigate to="/login" replace state={{ returnUrl }} />;
  }
  return children;
}
