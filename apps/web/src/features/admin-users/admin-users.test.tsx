import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../shared/api/api-error';
import {
  AuthContext,
  type AuthContextValue,
  type CurrentUser,
} from '../../shared/auth/auth-context';
import type { AccountStatus, AdminUserDetail, AdminUserListEnvelope } from './admin-user.types';
import { AdminUserDetailPage } from './pages/AdminUserDetailPage';
import { AdminUserListPage } from './pages/AdminUserListPage';
import { AdminUsersPage } from './pages/AdminUsersPage';

const admin: CurrentUser = {
  id: 'admin-one',
  fullName: 'Admin Example',
  email: 'admin@example.com',
  role: 'SUPER_ADMIN',
  status: 'ACTIVE',
  capabilities: [
    'user.view_students',
    'user.view_teachers',
    'user.view_admins',
    'user.update_status',
    'role.assign_limited',
  ],
};

function authValue(requestMock: ReturnType<typeof vi.fn>): AuthContextValue {
  return {
    status: 'authenticated',
    user: admin,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    request: requestMock as unknown as AuthContextValue['request'],
    updateUser: vi.fn(),
    hasPermission: (permission) => admin.capabilities.includes(permission),
  };
}

function withAuth(element: React.ReactNode, requestMock: ReturnType<typeof vi.fn>) {
  return <AuthContext.Provider value={authValue(requestMock)}>{element}</AuthContext.Provider>;
}

function listResponse(overrides: Partial<AdminUserListEnvelope> = {}): AdminUserListEnvelope {
  return {
    success: true,
    data: [
      {
        id: 'user-one',
        fullName: 'Nguyen Van An',
        email: 'an@example.com',
        status: 'ACTIVE',
        studentCode: 'ST-001',
        lastActiveAt: null,
        createdAt: '2026-07-17T08:00:00.000Z',
      },
    ],
    pagination: {
      page: 1,
      limit: 20,
      totalItems: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
    filters: { keyword: null, status: null },
    ...overrides,
  };
}

function detail(overrides: Partial<AdminUserDetail> = {}): AdminUserDetail {
  return {
    id: 'user-one',
    fullName: 'Nguyen Van An',
    email: 'an@example.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    avatarUrl: null,
    studentCode: null,
    department: 'Academic Affairs',
    registrationSource: 'ADMIN_BOOTSTRAP',
    activatedAt: '2026-07-17T08:00:00.000Z',
    lastLoginAt: null,
    lastActiveAt: null,
    createdAt: '2026-07-17T08:00:00.000Z',
    updatedAt: '2026-07-17T08:00:00.000Z',
    allowedActions: ['STATUS_BLOCK', 'STATUS_DEACTIVATE', 'ROLE_CHANGE'],
    ...overrides,
  };
}

function LocationStateProbe() {
  const location = useLocation();
  return <span>{String((location.state as { returnUrl?: string } | null)?.returnUrl ?? '')}</span>;
}

describe('Admin user management UI', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders three separate management entries', () => {
    const router = createMemoryRouter([{ path: '/', element: <AdminUsersPage /> }]);
    render(<RouterProvider router={router} />);
    expect(screen.getByRole('link', { name: /Student List/ })).toHaveAttribute(
      'href',
      '/admin/users/students',
    );
    expect(screen.getByRole('link', { name: /Teacher List/ })).toHaveAttribute(
      'href',
      '/admin/users/teachers',
    );
    expect(screen.getByRole('link', { name: /Admin List/ })).toHaveAttribute(
      'href',
      '/admin/users/admins',
    );
  });

  it('loads a Student-only table, keeps filters in URL, and preserves return context', async () => {
    const requestMock = vi.fn().mockResolvedValue(listResponse());
    const router = createMemoryRouter(
      [
        {
          path: '/admin/users/students',
          element: withAuth(<AdminUserListPage scope="students" />, requestMock),
        },
        { path: '/admin/users/:userId', element: <LocationStateProbe /> },
      ],
      { initialEntries: ['/admin/users/students?keyword=an&page=2'] },
    );
    render(<RouterProvider router={router} />);
    expect(screen.getByText('Đang tải danh sách...')).toBeInTheDocument();
    const table = await screen.findByRole('table');
    expect(within(table).getByText('Nguyen Van An')).toBeInTheDocument();
    expect(within(table).getByText('ST-001')).toBeInTheDocument();
    expect(requestMock).toHaveBeenCalledWith('/admin/users/students?keyword=an&page=2');

    const keyword = screen.getByLabelText('Tìm theo họ tên hoặc email');
    fireEvent.change(keyword, { target: { value: 'binh' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tìm kiếm' }));
    await waitFor(() =>
      expect(requestMock).toHaveBeenLastCalledWith('/admin/users/students?keyword=binh'),
    );

    await waitFor(() =>
      expect(screen.queryByText('Đang tải danh sách...')).not.toBeInTheDocument(),
    );
    fireEvent.click(
      within(screen.getByRole('table')).getByRole('link', { name: 'Xem Nguyen Van An' }),
    );
    expect(await screen.findByText('/admin/users/students?keyword=binh')).toBeInTheDocument();
  });

  it.each([
    ['teachers', 'Teacher List', 'TEACHER_INVITATION', 'Academic Affairs'],
    ['admins', 'Admin List', 'SUPER_ADMIN', 'Super Admin'],
  ] as const)('renders safe %s projection', async (scope, title, extraValue, expectedLabel) => {
    const item = {
      ...listResponse().data[0]!,
      ...(scope === 'teachers'
        ? { department: expectedLabel, registrationSource: extraValue, studentCode: undefined }
        : { role: extraValue, studentCode: undefined }),
    };
    const requestMock = vi.fn().mockResolvedValue(listResponse({ data: [item] }));
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: withAuth(<AdminUserListPage scope={scope} />, requestMock),
        },
      ],
      { initialEntries: ['/'] },
    );
    render(<RouterProvider router={router} />);
    expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument();
    expect(within(await screen.findByRole('table')).getByText(expectedLabel)).toBeInTheDocument();
    expect(requestMock).toHaveBeenCalledWith(`/admin/users/${scope}`);
  });

  it('supports filter-empty, API error, retry, clearing filters, and pagination', async () => {
    const empty = listResponse({
      data: [],
      pagination: {
        page: 2,
        limit: 20,
        totalItems: 21,
        totalPages: 2,
        hasNextPage: false,
        hasPreviousPage: true,
      },
      filters: { keyword: 'none', status: 'BLOCKED' },
    });
    const requestMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue(empty);
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: withAuth(<AdminUserListPage scope="students" />, requestMock),
        },
      ],
      { initialEntries: ['/?keyword=none&status=BLOCKED&page=2'] },
    );
    render(<RouterProvider router={router} />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không thể tải danh sách người dùng.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('Không tìm thấy tài khoản phù hợp')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Trang trước' }));
    await waitFor(() => expect(router.state.location.search).toBe('?keyword=none&status=BLOCKED'));
    fireEvent.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }));
    await waitFor(() => expect(router.state.location.search).toBe(''));
  });

  it('loads detail, updates status with optimistic version, and returns to list context', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const current = detail();
    const updated = detail({
      status: 'BLOCKED',
      updatedAt: '2026-07-17T09:00:00.000Z',
      allowedActions: ['STATUS_ACTIVATE', 'ROLE_CHANGE'],
    });
    const requestMock = vi
      .fn()
      .mockResolvedValueOnce({ success: true, data: { user: current } })
      .mockResolvedValueOnce({ success: true, data: { user: updated, auditId: 'audit-one' } });
    const router = createMemoryRouter(
      [
        {
          path: '/admin/users/:userId',
          element: withAuth(<AdminUserDetailPage />, requestMock),
        },
        { path: '/admin/users/admins', element: <h1>Admin return list</h1> },
      ],
      {
        initialEntries: [
          {
            pathname: '/admin/users/user-one',
            state: { returnUrl: '/admin/users/admins?status=ACTIVE' },
          },
        ],
      },
    );
    render(<RouterProvider router={router} />);
    expect(await screen.findByText('Nguyen Van An')).toBeInTheDocument();
    const statusButton = screen.getByRole('button', { name: 'Cập nhật trạng thái' });
    expect(screen.getByRole('option', { name: 'Đã khóa' })).toHaveValue('BLOCKED');
    expect(screen.getByRole('option', { name: 'Ngừng hoạt động' })).toHaveValue('INACTIVE');
    expect(statusButton).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Trạng thái mới'), { target: { value: 'BLOCKED' } });
    expect(statusButton).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Lý do thay đổi'), {
      target: { value: 'Security policy review' },
    });
    expect(screen.getByText('Lý do hợp lệ. Bạn có thể thực hiện cập nhật.')).toBeInTheDocument();
    expect(statusButton).toBeEnabled();
    fireEvent.click(statusButton);
    expect(window.confirm).toHaveBeenCalledWith(
      'Xác nhận đổi trạng thái của an@example.com thành Đã khóa?',
    );
    await waitFor(() =>
      expect(requestMock).toHaveBeenLastCalledWith('/admin/users/user-one/status', {
        method: 'PATCH',
        body: {
          status: 'BLOCKED',
          reason: 'Security policy review',
          expectedUpdatedAt: '2026-07-17T08:00:00.000Z',
        },
      }),
    );
    expect(await screen.findByRole('status')).toHaveTextContent('Đã cập nhật tài khoản');

    fireEvent.click(screen.getByRole('button', { name: 'Quay lại danh sách' }));
    expect(await screen.findByRole('heading', { name: 'Admin return list' })).toBeInTheDocument();
    expect(router.state.location.search).toBe('?status=ACTIVE');
  });

  it('handles role cancellation, concurrent mutation errors, no-action detail, and load errors', async () => {
    const confirm = vi
      .spyOn(window, 'confirm')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    const requestMock = vi
      .fn()
      .mockResolvedValueOnce({ success: true, data: { user: detail() } })
      .mockRejectedValueOnce(
        new ApiError(409, 'CONCURRENT_MODIFICATION', 'Changed by another request'),
      );
    const router = createMemoryRouter(
      [
        {
          path: '/admin/users/:userId',
          element: withAuth(<AdminUserDetailPage />, requestMock),
        },
      ],
      { initialEntries: ['/admin/users/user-one'] },
    );
    const first = render(<RouterProvider router={router} />);
    await screen.findByText('Nguyen Van An');
    fireEvent.change(screen.getByLabelText('Vai trò mới'), { target: { value: 'SUPER_ADMIN' } });
    fireEvent.change(screen.getByLabelText('Lý do thay đổi'), {
      target: { value: 'Governance approval' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cập nhật vai trò' }));
    expect(confirm).toHaveBeenCalledOnce();
    expect(requestMock).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Cập nhật vai trò' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Dữ liệu vừa được thay đổi');
    first.unmount();

    const noActionMock = vi.fn().mockResolvedValue({
      success: true,
      data: { user: detail({ allowedActions: [], status: 'DELETED' as AccountStatus }) },
    });
    const noActionRouter = createMemoryRouter(
      [
        {
          path: '/admin/users/:userId',
          element: withAuth(<AdminUserDetailPage />, noActionMock),
        },
      ],
      { initialEntries: ['/admin/users/deleted-one'] },
    );
    const second = render(<RouterProvider router={noActionRouter} />);
    expect(
      await screen.findByText(/Trạng thái hoặc quyền hiện tại không cho phép/),
    ).toBeInTheDocument();
    second.unmount();

    const failedMock = vi
      .fn()
      .mockRejectedValue(new ApiError(404, 'RESOURCE_NOT_FOUND', 'Not found'));
    const failedRouter = createMemoryRouter(
      [
        {
          path: '/admin/users/:userId',
          element: withAuth(<AdminUserDetailPage />, failedMock),
        },
      ],
      { initialEntries: ['/admin/users/missing'] },
    );
    render(<RouterProvider router={failedRouter} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Not found');
  });

  it('explains a teacher status update blocked by active classrooms', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const requestMock = vi
      .fn()
      .mockResolvedValueOnce({
        success: true,
        data: {
          user: detail({
            role: 'TEACHER',
            allowedActions: ['STATUS_BLOCK', 'STATUS_DEACTIVATE'],
          }),
        },
      })
      .mockRejectedValueOnce(
        new ApiError(
          409,
          'TEACHER_HAS_ACTIVE_CLASSROOM',
          'Teacher owns at least one active classroom',
        ),
      );
    const router = createMemoryRouter(
      [
        {
          path: '/admin/users/:userId',
          element: withAuth(<AdminUserDetailPage />, requestMock),
        },
      ],
      { initialEntries: ['/admin/users/teacher-one'] },
    );
    render(<RouterProvider router={router} />);
    await screen.findByText('Nguyen Van An');
    fireEvent.change(screen.getByLabelText('Trạng thái mới'), { target: { value: 'BLOCKED' } });
    fireEvent.change(screen.getByLabelText('Lý do thay đổi'), {
      target: { value: 'Tạm khóa theo yêu cầu quản trị' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cập nhật trạng thái' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Giảng viên vẫn đang sở hữu lớp học hoạt động',
    );
  });
});
