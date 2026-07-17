import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { AuthContext, type AuthContextValue, type CurrentUser } from '../auth/auth-context';
import { AppShell } from './AppShell';
import { ForbiddenPage } from './ForbiddenPage';
import { PasswordField } from './PasswordField';

const student: CurrentUser = {
  id: 'student-one',
  fullName: 'Student Example',
  email: 'student@example.com',
  role: 'STUDENT',
  status: 'ACTIVE',
  capabilities: ['profile.view_own'],
};

function authValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    status: 'authenticated',
    user: student,
    login: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn(),
    request: vi.fn(),
    updateUser: vi.fn(),
    hasPermission: vi.fn().mockReturnValue(false),
    ...overrides,
  };
}

function renderShell(value: AuthContextValue, initialEntries = ['/workspace']) {
  const router = createMemoryRouter(
    [
      {
        path: '/workspace',
        element: (
          <AuthContext.Provider value={value}>
            <AppShell />
          </AuthContext.Provider>
        ),
        children: [{ index: true, element: <h1>Workspace</h1> }],
      },
      { path: '/previous', element: <h1>Previous page</h1> },
      { path: '/next', element: <h1>Next page</h1> },
      { path: '/login', element: <h1>Login page</h1> },
    ],
    { initialEntries, initialIndex: initialEntries.length - 1 },
  );
  return { router, ...render(<RouterProvider router={router} />) };
}

describe('navigation components', () => {
  it('renders no private shell when the authenticated user is missing', () => {
    renderShell(authValue({ user: null }));
    expect(screen.queryByRole('heading', { name: 'Workspace' })).not.toBeInTheDocument();
  });

  it('navigates backward and signs out through the application shell', async () => {
    const context = authValue();
    const { router } = renderShell(context, ['/previous', '/workspace']);

    expect(screen.getByRole('link', { name: /Microlearning/ })).toHaveAttribute(
      'href',
      '/student/dashboard',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Quay lại trang trước' }));
    expect(await screen.findByRole('heading', { name: 'Previous page' })).toBeInTheDocument();

    await router.navigate('/workspace');
    expect(await screen.findByRole('heading', { name: 'Workspace' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }));
    await waitFor(() => expect(context.logout).toHaveBeenCalledOnce());
    expect(await screen.findByRole('heading', { name: 'Login page' })).toBeInTheDocument();
  });

  it('navigates forward through browser history', async () => {
    const { router } = renderShell(authValue(), ['/workspace', '/next']);
    await router.navigate(-1);
    expect(await screen.findByRole('heading', { name: 'Workspace' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Đi tới trang tiếp theo' }));
    expect(await screen.findByRole('heading', { name: 'Next page' })).toBeInTheDocument();
  });

  it('returns from the forbidden page using history navigation', async () => {
    const router = createMemoryRouter(
      [
        { path: '/before', element: <h1>Before</h1> },
        { path: '/forbidden', element: <ForbiddenPage /> },
      ],
      { initialEntries: ['/before', '/forbidden'], initialIndex: 1 },
    );
    render(<RouterProvider router={router} />);
    fireEvent.click(screen.getByRole('button', { name: 'Quay lại' }));
    expect(await screen.findByRole('heading', { name: 'Before' })).toBeInTheDocument();
  });

  it('toggles password visibility and exposes validation feedback', () => {
    render(<PasswordField id="secret" label="Mật khẩu" error="Mật khẩu không hợp lệ." />);
    const input = screen.getByLabelText('Mật khẩu');
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveAttribute('aria-describedby', 'secret-error');
    fireEvent.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }));
    expect(input).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByRole('button', { name: 'Ẩn mật khẩu' }));
    expect(input).toHaveAttribute('type', 'password');
    expect(screen.getByRole('alert')).toHaveTextContent('Mật khẩu không hợp lệ.');
  });
});
