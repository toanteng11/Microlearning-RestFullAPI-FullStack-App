export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN';

export function dashboardForRole(role: UserRole): string {
  switch (role) {
    case 'STUDENT':
      return '/student/dashboard';
    case 'TEACHER':
      return '/teacher/dashboard';
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return '/admin/dashboard';
  }
}
