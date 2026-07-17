export type AdminUserScope = 'students' | 'teachers' | 'admins';
export type AccountStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'DELETED';
export type AccountRole = 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN';

export interface AdminUserListItem {
  id: string;
  fullName: string;
  email: string;
  status: AccountStatus;
  role?: AccountRole;
  studentCode?: string | null;
  department?: string | null;
  registrationSource?: string;
  activatedAt?: string | null;
  lastActiveAt: string | null;
  createdAt: string;
}

export interface AdminUserDetail extends AdminUserListItem {
  role: AccountRole;
  avatarUrl: string | null;
  registrationSource: string;
  activatedAt: string | null;
  lastLoginAt: string | null;
  updatedAt: string;
  allowedActions: string[];
}

export interface Pagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AdminUserListEnvelope {
  success: true;
  data: AdminUserListItem[];
  pagination: Pagination;
  filters: { keyword: string | null; status: AccountStatus | null };
}

export interface AdminUserDetailEnvelope {
  success: true;
  data: { user: AdminUserDetail };
}

export interface AdminUserMutationEnvelope {
  success: true;
  data: { user: AdminUserDetail; auditId: string };
}
