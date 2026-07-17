import { render, screen } from '@testing-library/react';
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApplicationProviders } from '../../app/providers';
import { AdminHomePage, TeacherHomePage } from '../../features/role-home/RoleHomePage';
import { AuthContext, type AuthContextValue, type CurrentUser } from './auth-context';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

const teacher: CurrentUser = {
  id: 'teacher-one',
  fullName: 'Teacher Example',
  email: 'teacher@example.com',
  role: 'TEACHER',
  status: 'ACTIVE',
  capabilities: ['profile.view_own', 'classroom.create'],
};

function authValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    status: 'authenticated',
    user: teacher,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    request: vi.fn(),
    updateUser: vi.fn(),
    hasPermission: (permission) => teacher.capabilities.includes(permission),
    ...overrides,
  };
}

function withAuth(element: React.ReactNode, value: AuthContextValue) {
  return <AuthContext.Provider value={value}>{element}</AuthContext.Provider>;
}

describe('route access control', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('renders bootstrap state and then permits authenticated content', () => {
    const first = render(
      <MemoryRouter>
        {withAuth(
          <ProtectedRoute>
            <span>Private content</span>
          </ProtectedRoute>,
          authValue({ status: 'bootstrapping' }),
        )}
      </MemoryRouter>,
    );
    expect(screen.getByText('Đang xác thực phiên làm việc...')).toBeInTheDocument();
    first.unmount();

    render(
      <MemoryRouter>
        {withAuth(
          <ProtectedRoute>
            <span>Private content</span>
          </ProtectedRoute>,
          authValue(),
        )}
      </MemoryRouter>,
    );
    expect(screen.getByText('Private content')).toBeInTheDocument();
  });

  it('handles missing users, role access, and permission access', async () => {
    const router = createMemoryRouter(
      [
        {
          path: '/missing',
          element: withAuth(
            <RoleRoute roles={['TEACHER']}>
              <span>Missing user content</span>
            </RoleRoute>,
            authValue({ user: null }),
          ),
        },
        {
          path: '/allowed',
          element: withAuth(
            <RoleRoute roles={['TEACHER']} permission="classroom.create">
              <span>Allowed content</span>
            </RoleRoute>,
            authValue(),
          ),
        },
        {
          path: '/denied',
          element: withAuth(
            <RoleRoute permission="admin.users.read">
              <span>Denied content</span>
            </RoleRoute>,
            authValue(),
          ),
        },
        { path: '/login', element: <span>Login destination</span> },
        { path: '/forbidden', element: <span>Forbidden destination</span> },
      ],
      { initialEntries: ['/missing'] },
    );
    render(<RouterProvider router={router} />);
    expect(await screen.findByText('Login destination')).toBeInTheDocument();

    await router.navigate('/allowed');
    expect(await screen.findByText('Allowed content')).toBeInTheDocument();

    await router.navigate('/denied');
    expect(await screen.findByText('Forbidden destination')).toBeInTheDocument();
  });

  it('renders Teacher and Admin role workspaces', () => {
    const first = render(<MemoryRouter>{withAuth(<TeacherHomePage />, authValue())}</MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Khóa học của tôi' })).toBeInTheDocument();
    first.unmount();

    const admin = { ...teacher, role: 'ADMIN' as const, email: 'admin@example.com' };
    render(<MemoryRouter>{withAuth(<AdminHomePage />, authValue({ user: admin }))}</MemoryRouter>);
    expect(screen.getByRole('link', { name: /Quản lý người dùng/ })).toHaveAttribute(
      'href',
      '/admin/users',
    );
    expect(screen.getByRole('link', { name: /Lời mời Teacher/ })).toHaveAttribute(
      'href',
      '/admin/teacher-invitations',
    );
  });

  it('composes query and authentication providers around route outlets', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ error: { code: 'AUTHENTICATION_REQUIRED', message: 'Required' } }),
            { status: 401 },
          ),
        ),
    );
    const router = createMemoryRouter(
      [
        {
          element: <ApplicationProviders />,
          children: [{ path: '/', element: <span>Provider child</span> }],
        },
      ],
      { initialEntries: ['/'] },
    );
    render(<RouterProvider router={router} />);
    expect(screen.getByText('Provider child')).toBeInTheDocument();
  });
});
