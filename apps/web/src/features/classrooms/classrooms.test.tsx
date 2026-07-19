import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AuthContext,
  type AuthContextValue,
  type CurrentUser,
} from '../../shared/auth/auth-context';
import { InviteJoinProvider } from './InviteJoinContext';
import { classroomStatusLabel, displayDate } from './classroom-format';
import { AdminClassroomDetailPage } from './pages/AdminClassroomDetailPage';
import { AdminClassroomsPage } from './pages/AdminClassroomsPage';
import { AdminEnrollmentPolicyPage } from './pages/AdminEnrollmentPolicyPage';
import { InviteJoinPage } from './pages/InviteJoinPage';
import { StudentClassroomDetailPage } from './pages/StudentClassroomDetailPage';
import { StudentClassroomsPage } from './pages/StudentClassroomsPage';
import { TeacherClassroomDetailPage } from './pages/TeacherClassroomDetailPage';
import { TeacherClassroomsPage } from './pages/TeacherClassroomsPage';
import type { ClassroomDetail, ClassroomListEnvelope, EnrollmentPolicy } from './classroom.types';

const teacher: CurrentUser = {
  id: '507f1f77bcf86cd799439011',
  fullName: 'Teacher Example',
  email: 'teacher@example.test',
  role: 'TEACHER',
  status: 'ACTIVE',
  capabilities: ['classroom.create', 'classroom.view_owned'],
};
const student: CurrentUser = {
  ...teacher,
  id: '507f1f77bcf86cd799439012',
  fullName: 'Student Example',
  email: 'student@example.test',
  role: 'STUDENT',
  capabilities: ['classroom.join', 'classroom.view_enrolled'],
};
const admin: CurrentUser = {
  ...teacher,
  id: '507f1f77bcf86cd799439013',
  fullName: 'Admin Example',
  email: 'admin@example.test',
  role: 'ADMIN',
  capabilities: ['enrollment_policy.view', 'enrollment_policy.update'],
};

function listEnvelope(items: ClassroomListEnvelope['data'] = []): ClassroomListEnvelope {
  return {
    success: true,
    data: items,
    pagination: {
      page: 1,
      limit: 20,
      totalItems: items.length,
      totalPages: items.length ? 1 : 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
    filters: {},
  };
}

const classroom = {
  id: '507f1f77bcf86cd799439021',
  name: 'Node.js Microlearning',
  description: 'Backend class',
  subject: 'Backend',
  section: 'SE-01',
  owner: { id: teacher.id, fullName: teacher.fullName },
  status: 'ACTIVE' as const,
  enrollmentStatus: 'OPEN' as const,
  membership: null,
  archivedAt: null,
  createdAt: '2026-07-19T09:00:00.000Z',
  updatedAt: '2026-07-19T09:00:00.000Z',
};

const classroomDetail: ClassroomDetail = {
  ...classroom,
  configuredSettings: {
    enrollmentStatus: 'OPEN',
    allowClassCodeJoin: true,
    allowInviteLinkJoin: true,
  },
  effectiveSettings: {
    enrollmentStatus: 'OPEN',
    allowClassCodeJoin: true,
    allowInviteLinkJoin: true,
  },
  allowedActions: ['VIEW', 'UPDATE', 'MANAGE_JOIN', 'VIEW_ROSTER', 'REMOVE_STUDENT'],
};

function authValue(
  user: CurrentUser | null,
  requestMock: ReturnType<typeof vi.fn>,
): AuthContextValue {
  return {
    status: user ? 'authenticated' : 'anonymous',
    user,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    request: requestMock as unknown as AuthContextValue['request'],
    updateUser: vi.fn(),
    hasPermission: (permission) => user?.capabilities.includes(permission) ?? false,
  };
}

function renderWithAuth(
  element: React.ReactNode,
  user: CurrentUser | null,
  requestMock: ReturnType<typeof vi.fn>,
  route: { path: string; initialEntry: string } = { path: '*', initialEntry: '/' },
) {
  const router = createMemoryRouter(
    [
      {
        path: route.path,
        element: (
          <AuthContext.Provider value={authValue(user, requestMock)}>
            {element}
          </AuthContext.Provider>
        ),
      },
    ],
    { initialEntries: [route.initialEntry] },
  );
  return render(<RouterProvider router={router} />);
}

function jsonResponse(payload: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

describe('Phase 03 Classroom UI', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.replaceState({}, '', '/');
  });

  it('formats Classroom dates and known or forward-compatible statuses', () => {
    expect(displayDate(null)).toBe('Chưa có');
    expect(displayDate('2026-07-19T09:00:00.000Z')).not.toBe('Chưa có');
    expect(classroomStatusLabel('ARCHIVED')).toBe('Đã lưu trữ');
    expect(classroomStatusLabel('FUTURE_STATUS')).toBe('FUTURE_STATUS');
  });

  it('lets a Teacher create a Classroom and shows the raw Class Code once', async () => {
    let listCalls = 0;
    const requestMock = vi.fn().mockImplementation((path: string, options?: RequestInit) => {
      if (path === '/classrooms' && options?.method === 'POST') {
        return Promise.resolve({
          success: true,
          data: {
            classroom: {
              ...classroom,
              configuredSettings: {
                enrollmentStatus: 'OPEN',
                allowClassCodeJoin: true,
                allowInviteLinkJoin: true,
              },
              effectiveSettings: {
                enrollmentStatus: 'OPEN',
                allowClassCodeJoin: true,
                allowInviteLinkJoin: true,
              },
              allowedActions: ['VIEW'],
            },
            classCode: '7KMQ-9RTP',
            auditId: 'audit-one',
          },
        });
      }
      listCalls += 1;
      return Promise.resolve(listCalls === 1 ? listEnvelope() : listEnvelope([classroom]));
    });
    renderWithAuth(<TeacherClassroomsPage />, teacher, requestMock);

    expect(await screen.findByText('Chưa có lớp học')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tạo lớp học' }));
    const createForm = screen.getByRole('heading', { name: 'Tạo lớp học' }).closest('section');
    expect(createForm).not.toBeNull();
    fireEvent.change(screen.getByLabelText('Tên lớp học'), {
      target: { value: 'Node.js Microlearning' },
    });
    fireEvent.click(within(createForm!).getByRole('button', { name: 'Tạo lớp học' }));

    expect(await screen.findByText('7KMQ-9RTP')).toBeInTheDocument();
    expect(requestMock).toHaveBeenCalledWith('/classrooms', {
      method: 'POST',
      body: {
        name: 'Node.js Microlearning',
        description: null,
        subject: null,
        section: null,
      },
    });
    expect(await screen.findByRole('link', { name: 'Mở lớp học' })).toBeInTheDocument();
  });

  it('lets a Student join by Class Code and refreshes enrolled Classroom scope', async () => {
    let listCalls = 0;
    const requestMock = vi.fn().mockImplementation((path: string, options?: RequestInit) => {
      if (path === '/classrooms/join-by-code' && options?.method === 'POST') {
        return Promise.resolve({
          success: true,
          data: { classroom, alreadyEnrolled: false },
        });
      }
      listCalls += 1;
      return Promise.resolve(listCalls === 1 ? listEnvelope() : listEnvelope([classroom]));
    });
    renderWithAuth(<StudentClassroomsPage />, student, requestMock);

    await screen.findByText('Bạn chưa tham gia lớp học nào');
    fireEvent.change(screen.getByLabelText('Class Code'), { target: { value: '7KMQ-9RTP' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tham gia' }));
    expect(await screen.findByText('Đã tham gia Node.js Microlearning.')).toBeInTheDocument();
    expect(requestMock).toHaveBeenCalledWith('/classrooms/join-by-code', {
      method: 'POST',
      body: { code: '7KMQ-9RTP' },
    });
    expect(await screen.findByRole('link', { name: 'Mở lớp học' })).toBeInTheDocument();
  });

  it('scrubs Invite token from the URL before preview and keeps it only in memory', async () => {
    const rawToken = 'a'.repeat(43);
    window.history.replaceState({}, '', `/join/invite#token=${rawToken}`);
    const fetchMock = vi.fn().mockImplementation(() =>
      jsonResponse({
        success: true,
        data: {
          classroomName: 'Node.js Microlearning',
          subject: 'Backend',
          teacher: { fullName: 'Teacher Example' },
          joinable: true,
          expiresAt: '2026-08-19T09:00:00.000Z',
        },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const requestMock = vi.fn();
    const router = createMemoryRouter(
      [
        {
          path: '/join/invite',
          element: (
            <AuthContext.Provider value={authValue(null, requestMock)}>
              <InviteJoinProvider>
                <InviteJoinPage />
              </InviteJoinProvider>
            </AuthContext.Provider>
          ),
        },
      ],
      { initialEntries: ['/join/invite'] },
    );
    render(<RouterProvider router={router} />);

    await waitFor(() => expect(window.location.hash).toBe(''));
    expect(
      await screen.findByRole('heading', { name: 'Node.js Microlearning' }),
    ).toBeInTheDocument();
    const requestBody = JSON.parse(String((fetchMock.mock.calls[0]?.[1] as RequestInit).body));
    expect(requestBody).toEqual({ token: rawToken });
    expect(window.sessionStorage.length).toBe(0);
    expect(window.localStorage.length).toBe(0);
  });

  it('shows a safe error when an Invite Link cannot be validated', async () => {
    window.history.replaceState({}, '', '/join/invite#token=invalid-runtime-token');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        jsonResponse(
          {
            success: false,
            error: { code: 'INVITE_LINK_INVALID', message: 'Invite Link không hợp lệ.' },
          },
          404,
        ),
      ),
    );
    const router = createMemoryRouter(
      [
        {
          path: '/join/invite',
          element: (
            <AuthContext.Provider value={authValue(null, vi.fn())}>
              <InviteJoinProvider>
                <InviteJoinPage />
              </InviteJoinProvider>
            </AuthContext.Provider>
          ),
        },
      ],
      { initialEntries: ['/join/invite'] },
    );
    render(<RouterProvider router={router} />);

    expect(
      await screen.findByRole('heading', { name: 'Không thể mở lời mời' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Invite Link không hợp lệ.')).toBeInTheDocument();
    expect(window.location.hash).toBe('');
  });

  it('updates Enrollment Policy with revision and a required reason', async () => {
    const policy: EnrollmentPolicy = {
      allowClassCodeJoin: true,
      allowInviteLinkJoin: true,
      defaultInviteLinkLifetimeDays: 30,
      revision: 1,
      updatedBy: null,
      createdAt: '2026-07-19T09:00:00.000Z',
      updatedAt: '2026-07-19T09:00:00.000Z',
    };
    const requestMock = vi
      .fn()
      .mockResolvedValueOnce({ success: true, data: { policy } })
      .mockResolvedValueOnce({ success: true, data: { policy: { ...policy, revision: 2 } } });
    renderWithAuth(<AdminEnrollmentPolicyPage />, admin, requestMock);

    expect(await screen.findByText('Revision')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Lý do thay đổi'), {
      target: { value: 'Academic term policy review' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu policy' }));
    expect(await screen.findByText('Đã cập nhật Enrollment Policy.')).toBeInTheDocument();
    expect(requestMock).toHaveBeenLastCalledWith('/admin/settings/enrollment-policy', {
      method: 'PATCH',
      body: {
        allowClassCodeJoin: true,
        allowInviteLinkJoin: true,
        defaultInviteLinkLifetimeDays: 30,
        expectedRevision: 1,
        reason: 'Academic term policy review',
      },
    });
  });

  it('renders Student Classroom detail from enrolled scope', async () => {
    const enrolledDetail: ClassroomDetail = {
      ...classroomDetail,
      membership: {
        id: '507f1f77bcf86cd799439031',
        classroomId: classroom.id,
        studentId: student.id,
        status: 'ACTIVE',
        joinedBy: 'CLASS_CODE',
        joinedAt: '2026-07-19T09:30:00.000Z',
        updatedAt: '2026-07-19T09:30:00.000Z',
      },
    };
    const requestMock = vi.fn().mockResolvedValue({
      success: true,
      data: { classroom: enrolledDetail },
    });
    renderWithAuth(<StudentClassroomDetailPage />, student, requestMock, {
      path: '/student/classrooms/:classroomId',
      initialEntry: `/student/classrooms/${classroom.id}`,
    });

    expect(
      await screen.findByRole('heading', { name: 'Node.js Microlearning' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Teacher Example')).toBeInTheDocument();
    expect(requestMock).toHaveBeenCalledWith(`/classrooms/${classroom.id}`);
  });

  it('renders Admin governance list, search and detail projections', async () => {
    const requestMock = vi.fn().mockResolvedValue(listEnvelope([{ ...classroom, memberCount: 2 }]));
    const list = renderWithAuth(<AdminClassroomsPage />, admin, requestMock, {
      path: '/admin/classrooms',
      initialEntry: '/admin/classrooms',
    });

    expect(await screen.findByRole('table')).toHaveTextContent('Node.js Microlearning');
    fireEvent.change(screen.getByPlaceholderText('Tìm theo tên lớp'), {
      target: { value: 'Node' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Tìm kiếm' }));
    await waitFor(() => expect(requestMock).toHaveBeenCalledWith('/admin/classrooms?keyword=Node'));
    list.unmount();

    const detailRequest = vi.fn().mockResolvedValue({
      success: true,
      data: { classroom: { ...classroomDetail, memberCount: 2 } },
    });
    renderWithAuth(<AdminClassroomDetailPage />, admin, detailRequest, {
      path: '/admin/classrooms/:classroomId',
      initialEntry: `/admin/classrooms/${classroom.id}`,
    });
    expect(
      await screen.findByRole('heading', { name: 'Node.js Microlearning' }),
    ).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(detailRequest).toHaveBeenCalledWith(`/admin/classrooms/${classroom.id}`);
  });

  it('manages Teacher Classroom overview, roster and join credentials', async () => {
    let rosterActive = true;
    const rosterItem = {
      student: {
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        studentCode: 'ST0001',
        status: 'ACTIVE',
      },
      enrollment: {
        id: '507f1f77bcf86cd799439031',
        classroomId: classroom.id,
        studentId: student.id,
        status: 'ACTIVE' as const,
        joinedBy: 'CLASS_CODE' as const,
        joinedAt: '2026-07-19T09:30:00.000Z',
        updatedAt: '2026-07-19T09:30:00.000Z',
      },
    };
    const requestMock = vi.fn().mockImplementation((path: string, options?: RequestInit) => {
      if (path === `/classrooms/${classroom.id}` && !options?.method) {
        return Promise.resolve({ success: true, data: { classroom: classroomDetail } });
      }
      if (path === `/classrooms/${classroom.id}/class-code` && !options?.method) {
        return Promise.resolve({
          success: true,
          data: {
            credential: {
              id: '507f1f77bcf86cd799439041',
              status: 'ACTIVE',
              maskedCode: '****-9RTP',
              generatedAt: '2026-07-19T09:00:00.000Z',
              expiresAt: null,
              createdAt: '2026-07-19T09:00:00.000Z',
              updatedAt: '2026-07-19T09:00:00.000Z',
            },
          },
        });
      }
      if (path === `/classrooms/${classroom.id}/invite-links` && !options?.method) {
        return Promise.resolve({ success: true, data: [] });
      }
      if (path.includes('/students?')) {
        return Promise.resolve({
          success: true,
          data: rosterActive ? [rosterItem] : [],
          pagination: listEnvelope().pagination,
          filters: {},
        });
      }
      if (path.endsWith(`/students/${student.id}/remove`)) {
        rosterActive = false;
        return Promise.resolve({ success: true, data: {} });
      }
      if (path.endsWith('/class-code/regenerate')) {
        return Promise.resolve({ success: true, data: { classCode: '8LMN-7QRS' } });
      }
      if (path.endsWith('/invite-links') && options?.method === 'POST') {
        return Promise.resolve({
          success: true,
          data: { inviteLink: 'https://microlearning.test/join/invite#token=runtime-only' },
        });
      }
      return Promise.resolve({ success: true, data: {} });
    });
    renderWithAuth(<TeacherClassroomDetailPage />, teacher, requestMock, {
      path: '/teacher/classrooms/:classroomId',
      initialEntry: `/teacher/classrooms/${classroom.id}`,
    });

    expect(
      await screen.findByRole('heading', { name: 'Node.js Microlearning' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Thành viên/u }));
    expect(screen.getByText('Student Example')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove Student Example' }));
    fireEvent.change(screen.getByLabelText('Lý do'), {
      target: { value: 'Student moved to another cohort' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));
    expect(await screen.findByText('Đã remove Student khỏi lớp học.')).toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: /Quyền tham gia/u }));
    fireEvent.change(screen.getByPlaceholderText('Lý do thay mã'), {
      target: { value: 'Rotate exposed classroom code' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Thay mã' }));
    expect(await screen.findByText('8LMN-7QRS')).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: 'Tạo link' }));
    expect(
      await screen.findByText('https://microlearning.test/join/invite#token=runtime-only'),
    ).toBeInTheDocument();
  });
});
