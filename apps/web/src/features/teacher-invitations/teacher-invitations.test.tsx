import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../shared/api/api-error';
import {
  AuthContext,
  type AuthContextValue,
  type CurrentUser,
} from '../../shared/auth/auth-context';
import { AdminTeacherInvitationDetailPage } from './pages/AdminTeacherInvitationDetailPage';
import { AdminTeacherInvitationsPage } from './pages/AdminTeacherInvitationsPage';
import { TeacherInvitationActivationPage } from './pages/TeacherInvitationActivationPage';
import type {
  TeacherInvitationListEnvelope,
  TeacherInvitationSummary,
} from './teacher-invitation.types';

const rawToken = 'a'.repeat(64);
const invitationLink = `http://localhost:5173/teacher/invite?token=${rawToken}`;

const admin: CurrentUser = {
  id: 'admin-one',
  fullName: 'Admin Example',
  email: 'admin@example.com',
  role: 'ADMIN',
  status: 'ACTIVE',
  capabilities: [
    'teacher_invitation.create',
    'teacher_invitation.view',
    'teacher_invitation.copy_link',
    'teacher_invitation.revoke',
  ],
};

function invitation(overrides: Partial<TeacherInvitationSummary> = {}): TeacherInvitationSummary {
  return {
    id: '507f1f77bcf86cd799439011',
    email: 'teacher@example.com',
    status: 'PENDING',
    deliveryMethod: 'MANUAL_COPY',
    invitedBy: admin.id,
    expiresAt: '2026-07-24T08:00:00.000Z',
    acceptedAt: null,
    revokedAt: null,
    copyCount: 0,
    lastCopiedAt: null,
    channelHint: null,
    createdAt: '2026-07-17T08:00:00.000Z',
    updatedAt: '2026-07-17T08:00:00.000Z',
    ...overrides,
  };
}

function listEnvelope(
  overrides: Partial<TeacherInvitationListEnvelope> = {},
): TeacherInvitationListEnvelope {
  return {
    success: true,
    data: [invitation()],
    pagination: {
      page: 1,
      limit: 20,
      totalItems: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
    filters: { email: null, status: null },
    ...overrides,
  };
}

function authValue(
  requestMock: ReturnType<typeof vi.fn>,
  capabilities = admin.capabilities,
): AuthContextValue {
  const user = { ...admin, capabilities };
  return {
    status: 'authenticated',
    user,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    request: requestMock as unknown as AuthContextValue['request'],
    updateUser: vi.fn(),
    hasPermission: (permission) => capabilities.includes(permission),
  };
}

function withAuth(
  element: React.ReactNode,
  requestMock: ReturnType<typeof vi.fn>,
  capabilities = admin.capabilities,
) {
  return (
    <AuthContext.Provider value={authValue(requestMock, capabilities)}>
      {element}
    </AuthContext.Provider>
  );
}

function jsonResponse(payload: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

describe('Teacher invitation Admin UI', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.replaceState({}, '', '/');
  });

  it('creates a one-time link, copies it, records the selected channel, and closes it', async () => {
    const clipboardWrite = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: clipboardWrite },
    });
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('11111111-1111-4111-8111-111111111111');
    const requestMock = vi.fn().mockImplementation((path: string, options?: RequestInit) => {
      if (path === '/admin/teacher-invitations' && options?.method === 'POST') {
        return Promise.resolve({
          success: true,
          data: { invitation: { ...invitation(), invitationLink } },
        });
      }
      if (path.endsWith('/copy-events')) {
        return Promise.resolve({ success: true, data: { copyEventId: 'audit-one' } });
      }
      return Promise.resolve(listEnvelope());
    });
    const router = createMemoryRouter([
      {
        path: '/',
        element: withAuth(<AdminTeacherInvitationsPage />, requestMock),
      },
    ]);
    render(<RouterProvider router={router} />);

    expect(await screen.findAllByText('teacher@example.com')).not.toHaveLength(0);
    fireEvent.change(screen.getByLabelText('Email giảng viên'), {
      target: { value: 'teacher@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Hiệu lực'), { target: { value: '14' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tạo link mời' }));

    const linkInput = await screen.findByLabelText('Link mời Teacher');
    expect(linkInput).toHaveValue(invitationLink);
    expect(requestMock).toHaveBeenCalledWith('/admin/teacher-invitations', {
      method: 'POST',
      body: { email: 'teacher@example.com', expiresInDays: 14 },
    });
    fireEvent.change(screen.getByLabelText('Kênh gửi link'), { target: { value: 'ZALO' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sao chép' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Đã sao chép link');
    expect(clipboardWrite).toHaveBeenCalledWith(invitationLink);
    expect(requestMock).toHaveBeenCalledWith(
      '/admin/teacher-invitations/507f1f77bcf86cd799439011/copy-events',
      {
        method: 'POST',
        body: {
          eventId: '11111111-1111-4111-8111-111111111111',
          channelHint: 'ZALO',
        },
      },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Đóng link một lần' }));
    expect(screen.queryByLabelText('Link mời Teacher')).not.toBeInTheDocument();
  });

  it('retains one idempotency key when copy audit fails and retries without copying again', async () => {
    const clipboardWrite = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: clipboardWrite },
    });
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('22222222-2222-4222-8222-222222222222');
    let copyAttempts = 0;
    const requestMock = vi.fn().mockImplementation((path: string, options?: RequestInit) => {
      if (path === '/admin/teacher-invitations' && options?.method === 'POST') {
        return Promise.resolve({
          success: true,
          data: { invitation: { ...invitation(), invitationLink } },
        });
      }
      if (path.endsWith('/copy-events')) {
        copyAttempts += 1;
        return copyAttempts === 1
          ? Promise.reject(new Error('audit unavailable'))
          : Promise.resolve({ success: true, data: { copyEventId: 'audit-two' } });
      }
      return Promise.resolve(listEnvelope());
    });
    const router = createMemoryRouter([
      { path: '/', element: withAuth(<AdminTeacherInvitationsPage />, requestMock) },
    ]);
    render(<RouterProvider router={router} />);
    await screen.findAllByText('teacher@example.com');
    fireEvent.change(screen.getByLabelText('Email giảng viên'), {
      target: { value: 'teacher@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Tạo link mời' }));
    await screen.findByLabelText('Link mời Teacher');
    fireEvent.click(screen.getByRole('button', { name: 'Sao chép' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Link đã được sao chép');
    fireEvent.click(screen.getByRole('button', { name: 'Ghi nhận lại' }));
    expect(await screen.findByRole('status')).toHaveTextContent('ghi nhận Audit Log');
    expect(clipboardWrite).toHaveBeenCalledOnce();

    const copyCalls = requestMock.mock.calls.filter(([path]) =>
      String(path).endsWith('/copy-events'),
    );
    expect(copyCalls).toHaveLength(2);
    expect(copyCalls[0]?.[1]).toEqual(copyCalls[1]?.[1]);
  });

  it('supports list filters, pagination, empty retry, and hides creation without permission', async () => {
    const paged = listEnvelope({
      data: [],
      pagination: {
        page: 2,
        limit: 20,
        totalItems: 21,
        totalPages: 2,
        hasNextPage: false,
        hasPreviousPage: true,
      },
      filters: { email: 'none@example.com', status: 'REVOKED' },
    });
    const requestMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue(paged);
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: withAuth(<AdminTeacherInvitationsPage />, requestMock, [
            'teacher_invitation.view',
          ]),
        },
      ],
      { initialEntries: ['/?email=none%40example.com&status=REVOKED&page=2'] },
    );
    render(<RouterProvider router={router} />);
    expect(screen.queryByRole('heading', { name: 'Tạo lời mời mới' })).not.toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải danh sách lời mời');
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('Không có lời mời phù hợp')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Trang trước' }));
    await waitFor(() => expect(router.state.location.search).not.toContain('page='));
    fireEvent.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }));
    await waitFor(() => expect(router.state.location.search).toBe(''));
  });

  it('shows clipboard and duplicate invitation errors', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    let createAttempts = 0;
    const requestMock = vi.fn().mockImplementation((path: string, options?: RequestInit) => {
      if (path === '/admin/teacher-invitations' && options?.method === 'POST') {
        createAttempts += 1;
        if (createAttempts === 1) {
          return Promise.reject(
            new ApiError(409, 'INVITATION_ALREADY_PENDING', 'Invitation pending'),
          );
        }
        return Promise.resolve({
          success: true,
          data: { invitation: { ...invitation(), invitationLink } },
        });
      }
      return Promise.resolve(listEnvelope());
    });
    const router = createMemoryRouter([
      { path: '/', element: withAuth(<AdminTeacherInvitationsPage />, requestMock) },
    ]);
    render(<RouterProvider router={router} />);
    await screen.findAllByText('teacher@example.com');
    fireEvent.change(screen.getByLabelText('Email giảng viên'), {
      target: { value: 'teacher@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Tạo link mời' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('đang có một lời mời');
    fireEvent.click(screen.getByRole('button', { name: 'Tạo link mời' }));
    await screen.findByLabelText('Link mời Teacher');
    fireEvent.click(screen.getByRole('button', { name: 'Sao chép' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('không cho phép sao chép');
  });

  it('loads detail, preserves return context, and revokes a pending invitation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const revoked = invitation({
      status: 'REVOKED',
      revokedAt: '2026-07-17T09:00:00.000Z',
    });
    const requestMock = vi
      .fn()
      .mockResolvedValueOnce({ success: true, data: { invitation: invitation() } })
      .mockResolvedValueOnce({ success: true, data: { invitation: revoked, auditId: 'audit' } });
    const router = createMemoryRouter(
      [
        {
          path: '/admin/teacher-invitations/:invitationId',
          element: withAuth(<AdminTeacherInvitationDetailPage />, requestMock),
        },
        { path: '/admin/teacher-invitations', element: <h1>Invitation return list</h1> },
      ],
      {
        initialEntries: [
          {
            pathname: '/admin/teacher-invitations/507f1f77bcf86cd799439011',
            state: { returnUrl: '/admin/teacher-invitations?status=PENDING' },
          },
        ],
      },
    );
    render(<RouterProvider router={router} />);
    expect(await screen.findByText('teacher@example.com')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Lý do thu hồi'), {
      target: { value: 'Admin sent invitation to the wrong address' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Thu hồi lời mời' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Đã thu hồi lời mời');
    expect(requestMock).toHaveBeenLastCalledWith(
      '/admin/teacher-invitations/507f1f77bcf86cd799439011/revoke',
      { method: 'POST', body: { reason: 'Admin sent invitation to the wrong address' } },
    );
    expect(screen.getByText('Lời mời này không còn thao tác quản trị hợp lệ.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Quay lại danh sách lời mời' }));
    expect(
      await screen.findByRole('heading', { name: 'Invitation return list' }),
    ).toBeInTheDocument();
    expect(router.state.location.search).toBe('?status=PENDING');
  });

  it('handles detail cancellation, mutation failure, and load failure', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const requestMock = vi
      .fn()
      .mockResolvedValue({ success: true, data: { invitation: invitation() } });
    const router = createMemoryRouter(
      [
        {
          path: '/admin/teacher-invitations/:invitationId',
          element: withAuth(<AdminTeacherInvitationDetailPage />, requestMock),
        },
      ],
      { initialEntries: ['/admin/teacher-invitations/507f1f77bcf86cd799439011'] },
    );
    const first = render(<RouterProvider router={router} />);
    await screen.findByText('teacher@example.com');
    fireEvent.change(screen.getByLabelText('Lý do thu hồi'), { target: { value: 'Valid reason' } });
    fireEvent.click(screen.getByRole('button', { name: 'Thu hồi lời mời' }));
    expect(requestMock).toHaveBeenCalledOnce();
    first.unmount();

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const failedMutation = vi
      .fn()
      .mockResolvedValueOnce({ success: true, data: { invitation: invitation() } })
      .mockRejectedValueOnce(new ApiError(409, 'INVITATION_REVOKED', 'Already revoked'));
    const mutationRouter = createMemoryRouter(
      [
        {
          path: '/admin/teacher-invitations/:invitationId',
          element: withAuth(<AdminTeacherInvitationDetailPage />, failedMutation),
        },
      ],
      { initialEntries: ['/admin/teacher-invitations/507f1f77bcf86cd799439011'] },
    );
    const second = render(<RouterProvider router={mutationRouter} />);
    await screen.findByText('teacher@example.com');
    fireEvent.change(screen.getByLabelText('Lý do thu hồi'), { target: { value: 'Valid reason' } });
    fireEvent.click(screen.getByRole('button', { name: 'Thu hồi lời mời' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Already revoked');
    second.unmount();

    const failedLoad = vi
      .fn()
      .mockRejectedValue(new ApiError(404, 'RESOURCE_NOT_FOUND', 'Missing'));
    const failedRouter = createMemoryRouter(
      [
        {
          path: '/admin/teacher-invitations/:invitationId',
          element: withAuth(<AdminTeacherInvitationDetailPage />, failedLoad),
        },
      ],
      { initialEntries: ['/admin/teacher-invitations/507f1f77bcf86cd799439011'] },
    );
    render(<RouterProvider router={failedRouter} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Missing');
  });
});

describe('Teacher invitation activation UI', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.replaceState({}, '', '/');
  });

  it('scrubs token from the URL before preview and activates without automatic login', async () => {
    window.history.replaceState({}, '', `/teacher/invite?token=${rawToken}`);
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() =>
        jsonResponse({
          success: true,
          data: {
            invitation: {
              email: 'teacher@example.com',
              expiresAt: '2026-07-24T08:00:00.000Z',
              status: 'PENDING',
              deliveryMethod: 'MANUAL_COPY',
            },
          },
        }),
      )
      .mockImplementationOnce(() =>
        jsonResponse(
          {
            success: true,
            data: {
              user: {
                id: 'teacher-one',
                fullName: 'Teacher Example',
                email: 'teacher@example.com',
                role: 'TEACHER',
                status: 'ACTIVE',
              },
              nextAction: 'LOGIN',
            },
          },
          201,
        ),
      );
    vi.stubGlobal('fetch', fetchMock);
    const router = createMemoryRouter(
      [
        { path: '/teacher/invite', element: <TeacherInvitationActivationPage /> },
        {
          path: '/login',
          element: <h1>Login after activation</h1>,
        },
      ],
      { initialEntries: ['/teacher/invite'] },
    );
    render(<RouterProvider router={router} />);

    expect(window.location.search).toBe('');
    expect(await screen.findByDisplayValue('teacher@example.com')).toHaveAttribute('readonly');
    expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain(rawToken);
    expect(JSON.parse(String((fetchMock.mock.calls[0]?.[1] as RequestInit).body))).toEqual({
      token: rawToken,
    });
    fireEvent.change(screen.getByLabelText('Họ và tên'), {
      target: { value: 'Teacher Example' },
    });
    fireEvent.change(screen.getByLabelText('Mật khẩu mới'), {
      target: { value: 'StrongPassword123' },
    });
    fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu'), {
      target: { value: 'StrongPassword123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Kích hoạt tài khoản' }));
    expect(
      await screen.findByRole('heading', { name: 'Login after activation' }),
    ).toBeInTheDocument();
    expect(router.state.location.state).toEqual({
      message: 'Kích hoạt teacher@example.com thành công. Hãy đăng nhập để tiếp tục.',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('shows missing, expired, and acceptance errors with safe messages', async () => {
    const noTokenFetch = vi.fn();
    vi.stubGlobal('fetch', noTokenFetch);
    window.history.replaceState({}, '', '/teacher/invite');
    const missingRouter = createMemoryRouter(
      [{ path: '/teacher/invite', element: <TeacherInvitationActivationPage /> }],
      { initialEntries: ['/teacher/invite'] },
    );
    const first = render(<RouterProvider router={missingRouter} />);
    expect(screen.getByRole('alert')).toHaveTextContent('thiếu token kích hoạt');
    expect(noTokenFetch).not.toHaveBeenCalled();
    first.unmount();

    window.history.replaceState({}, '', `/teacher/invite?token=${rawToken}`);
    const expiredFetch = vi
      .fn()
      .mockImplementation(() =>
        jsonResponse(
          { error: { code: 'INVITATION_EXPIRED', message: 'Teacher invitation has expired' } },
          409,
        ),
      );
    vi.stubGlobal('fetch', expiredFetch);
    const expiredRouter = createMemoryRouter(
      [{ path: '/teacher/invite', element: <TeacherInvitationActivationPage /> }],
      { initialEntries: ['/teacher/invite'] },
    );
    const second = render(<RouterProvider router={expiredRouter} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Link mời đã hết hạn');
    second.unmount();

    window.history.replaceState({}, '', `/teacher/invite?token=${rawToken}`);
    const acceptFetch = vi
      .fn()
      .mockImplementationOnce(() =>
        jsonResponse({
          success: true,
          data: {
            invitation: {
              email: 'teacher@example.com',
              expiresAt: '2026-07-24T08:00:00.000Z',
              status: 'PENDING',
              deliveryMethod: 'MANUAL_COPY',
            },
          },
        }),
      )
      .mockImplementationOnce(() =>
        jsonResponse({ error: { code: 'DUPLICATE_RESOURCE', message: 'Duplicate account' } }, 409),
      );
    vi.stubGlobal('fetch', acceptFetch);
    const acceptRouter = createMemoryRouter(
      [{ path: '/teacher/invite', element: <TeacherInvitationActivationPage /> }],
      { initialEntries: ['/teacher/invite'] },
    );
    render(<RouterProvider router={acceptRouter} />);
    await screen.findByDisplayValue('teacher@example.com');
    fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: 'Teacher Example' } });
    fireEvent.change(screen.getByLabelText('Mật khẩu mới'), {
      target: { value: 'StrongPassword123' },
    });
    fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu'), {
      target: { value: 'StrongPassword123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Kích hoạt tài khoản' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('đã thuộc một tài khoản');
  });
});
