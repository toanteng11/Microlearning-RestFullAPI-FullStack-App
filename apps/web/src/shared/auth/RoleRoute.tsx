import { Navigate } from 'react-router-dom';

import type { UserRole } from '../../app/route-paths';
import { useAuth } from './auth-context';

interface RoleRouteProps {
  roles?: UserRole[];
  permission?: string;
  children: React.ReactNode;
}

export function RoleRoute({ roles, permission, children }: RoleRouteProps) {
  const { user, hasPermission } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/forbidden" replace />;
  if (permission && !hasPermission(permission)) return <Navigate to="/forbidden" replace />;
  return children;
}
