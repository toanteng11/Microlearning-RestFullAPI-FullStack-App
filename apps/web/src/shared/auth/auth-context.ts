import { createContext, useContext } from 'react';

import type { UserRole } from '../../app/route-paths';
import type { ApiRequestOptions } from '../api/api-client';

export interface CurrentUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE' | 'BLOCKED' | 'DELETED';
  capabilities: string[];
  avatarUrl?: string | null;
  studentCode?: string | null;
  department?: string | null;
  registrationSource?: string;
  activatedAt?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type AuthStatus = 'bootstrapping' | 'authenticated' | 'anonymous' | 'refreshing';

export interface AuthContextValue {
  status: AuthStatus;
  user: CurrentUser | null;
  login: (email: string, password: string) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  request: <T>(path: string, options?: ApiRequestOptions) => Promise<T>;
  updateUser: (user: CurrentUser) => void;
  hasPermission: (permission: string) => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
