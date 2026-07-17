import type { Permission } from '../../shared/auth/permissions.js';
import type { UserRole, UserStatus, UserSummary } from '../users/user.types.js';

export interface UserContext extends UserSummary {
  capabilities: Permission[];
}

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  status: UserStatus;
  familyId: string;
  capabilities: Permission[];
}

export interface AuthTokenResult {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  user: UserContext;
}
