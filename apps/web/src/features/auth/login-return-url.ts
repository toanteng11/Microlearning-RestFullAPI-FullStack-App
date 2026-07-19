import type { UserRole } from '../../app/route-paths';

function safeReturnUrl(value: string | undefined): string | null {
  return value?.startsWith('/') && !value.startsWith('//') ? value : null;
}

export function returnUrlForRole(value: string | undefined, role: UserRole): string | null {
  const returnUrl = safeReturnUrl(value);
  if (!returnUrl) return null;

  const [pathname = ''] = returnUrl.split(/[?#]/, 1);
  if (pathname === '/profile') return returnUrl;
  if (pathname === '/join/invite') return role === 'STUDENT' ? returnUrl : null;
  if (pathname.startsWith('/student/')) return role === 'STUDENT' ? returnUrl : null;
  if (pathname.startsWith('/teacher/')) return role === 'TEACHER' ? returnUrl : null;
  if (pathname.startsWith('/admin/'))
    return role === 'ADMIN' || role === 'SUPER_ADMIN' ? returnUrl : null;

  return null;
}
