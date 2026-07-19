import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { returnUrlForRole } from './login-return-url';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from '../profile/ProfilePage';
import { StudentHomePage } from '../role-home/RoleHomePage';
import { ProtectedRoute } from '../../shared/auth/ProtectedRoute';
import { RoleRoute } from '../../shared/auth/RoleRoute';
import type { UserRole } from '../../app/route-paths';
import {
  AuthContext,
  type AuthContextValue,
  type CurrentUser,
} from '../../shared/auth/auth-context';

const student: CurrentUser = {
  id: 'student-one',
  fullName: 'Student Example',
  email: 'student@example.com',
  role: 'STUDENT',
  status: 'ACTIVE',
  capabilities: ['profile.update_own', 'profile.view_own'],
};

const teacher: CurrentUser = {
  ...student,
  id: 'teacher-one',
  email: 'teacher@example.com',
  role: 'TEACHER',
  capabilities: [],
};

function authValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    status: 'authenticated',
    user: student,
    login: vi.fn().mockResolvedValue(student),
    logout: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn().mockResolvedValue(true),
    request: vi.fn(),
    updateUser: vi.fn(),
    hasPermission: (permission) => student.capabilities.includes(permission),
    ...overrides,
  };
}

function withAuth(element: React.ReactNode, value: AuthContextValue) {
  return <AuthContext.Provider value={value}>{element}</AuthContext.Provider>;
}

describe('authentication UI', () => {
  afterEach(() => vi.unstubAllGlobals());

  const returnUrlCases: Array<[string | undefined, UserRole, string | null]> = [
    [undefined, 'STUDENT', null],
    ['//external.example', 'STUDENT', null],
    ['/profile?tab=account', 'TEACHER', '/profile?tab=account'],
    ['/join/invite', 'STUDENT', '/join/invite'],
    ['/join/invite', 'TEACHER', null],
    ['/student/classrooms/one', 'STUDENT', '/student/classrooms/one'],
    ['/student/dashboard', 'TEACHER', null],
    ['/teacher/dashboard', 'TEACHER', '/teacher/dashboard'],
    ['/teacher/dashboard', 'STUDENT', null],
    ['/admin/classrooms', 'ADMIN', '/admin/classrooms'],
    ['/admin/classrooms', 'SUPER_ADMIN', '/admin/classrooms'],
    ['/admin/classrooms', 'STUDENT', null],
    ['/unsupported', 'ADMIN', null],
  ];

  it.each(returnUrlCases)('scopes return URL %s to role %s', (returnUrl, role, expected) => {
    expect(returnUrlForRole(returnUrl, role)).toBe(expected);
  });

  it('logs in and redirects from server role context', async () => {
    const context = authValue({ status: 'anonymous', user: null });
    const router = createMemoryRouter(
      [
        { path: '/login', element: withAuth(<LoginPage />, context) },
        { path: '/student/dashboard', element: <h1>Student destination</h1> },
      ],
      { initialEntries: ['/login'] },
    );
    render(<RouterProvider router={router} />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: student.email } });
    fireEvent.change(screen.getByLabelText('Mật khẩu'), {
      target: { value: 'StrongPassword123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    expect(await screen.findByRole('heading', { name: 'Student destination' })).toBeInTheDocument();
    expect(context.login).toHaveBeenCalledWith(student.email, 'StrongPassword123!');
  });

  it('ignores a stale return URL that belongs to another role', async () => {
    const context = authValue({
      status: 'anonymous',
      user: null,
      login: vi.fn().mockResolvedValue(teacher),
    });
    const router = createMemoryRouter(
      [
        { path: '/login', element: withAuth(<LoginPage />, context) },
        { path: '/teacher/dashboard', element: <h1>Teacher destination</h1> },
        { path: '/admin/settings/enrollment-policy', element: <h1>Admin destination</h1> },
      ],
      {
        initialEntries: [
          { pathname: '/login', state: { returnUrl: '/admin/settings/enrollment-policy' } },
        ],
      },
    );
    render(<RouterProvider router={router} />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: teacher.email } });
    fireEvent.change(screen.getByLabelText('Mật khẩu'), {
      target: { value: 'StrongPassword123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByRole('heading', { name: 'Teacher destination' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Admin destination' })).not.toBeInTheDocument();
  });

  it('registers a Student without any role control and redirects to login', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true, data: { nextAction: 'LOGIN' } }), {
          status: 201,
        }),
      ),
    );
    const router = createMemoryRouter(
      [
        { path: '/register', element: <RegisterPage /> },
        { path: '/login', element: <h1>Login destination</h1> },
      ],
      { initialEntries: ['/register'] },
    );
    render(<RouterProvider router={router} />);

    fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: student.fullName } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: student.email } });
    fireEvent.change(screen.getByLabelText('Mật khẩu'), {
      target: { value: 'StrongPassword123!' },
    });
    fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu'), {
      target: { value: 'StrongPassword123!' },
    });
    expect(screen.queryByLabelText(/vai trò/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));
    expect(await screen.findByRole('heading', { name: 'Login destination' })).toBeInTheDocument();
  });

  it('loads and updates only the own profile allowlist', async () => {
    const updated = { ...student, fullName: 'Updated Student' };
    const requestMock = vi
      .fn()
      .mockResolvedValueOnce({ success: true, data: { user: student } })
      .mockResolvedValueOnce({ success: true, data: { user: updated } });
    const context = authValue({ request: requestMock });
    const router = createMemoryRouter(
      [{ path: '/profile', element: withAuth(<ProfilePage />, context) }],
      { initialEntries: ['/profile'] },
    );
    render(<RouterProvider router={router} />);
    const input = await screen.findByLabelText('Họ và tên');
    fireEvent.change(input, { target: { value: 'Updated Student' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
    await waitFor(() =>
      expect(requestMock).toHaveBeenLastCalledWith('/users/me', {
        method: 'PATCH',
        body: { fullName: 'Updated Student' },
      }),
    );
  });

  it('protects anonymous routes and denies a wrong role', async () => {
    const anonymous = authValue({ status: 'anonymous', user: null });
    const anonymousRouter = createMemoryRouter(
      [
        {
          path: '/private',
          element: withAuth(
            <ProtectedRoute>
              <span>Private</span>
            </ProtectedRoute>,
            anonymous,
          ),
        },
        { path: '/login', element: <span>Login required</span> },
      ],
      { initialEntries: ['/private'] },
    );
    const first = render(<RouterProvider router={anonymousRouter} />);
    expect(await screen.findByText('Login required')).toBeInTheDocument();
    first.unmount();

    const context = authValue();
    const roleRouter = createMemoryRouter(
      [
        {
          path: '/admin',
          element: withAuth(
            <RoleRoute roles={['ADMIN']}>
              <span>Admin</span>
            </RoleRoute>,
            context,
          ),
        },
        { path: '/forbidden', element: <span>Forbidden destination</span> },
      ],
      { initialEntries: ['/admin'] },
    );
    render(<RouterProvider router={roleRouter} />);
    expect(await screen.findByText('Forbidden destination')).toBeInTheDocument();
  });

  it('renders the Student to-do dashboard without fabricated work', () => {
    const router = createMemoryRouter(
      [{ path: '/', element: withAuth(<StudentHomePage />, authValue()) }],
      { initialEntries: ['/'] },
    );
    render(<RouterProvider router={router} />);
    expect(screen.getByRole('heading', { name: 'Việc cần làm' })).toBeInTheDocument();
    expect(screen.getByText('Chưa có công việc cần hoàn thành')).toBeInTheDocument();
  });
});
