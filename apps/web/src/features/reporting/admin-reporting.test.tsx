import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import {
  AuthContext,
  type AuthContextValue,
  type CurrentUser,
} from '../../shared/auth/auth-context';
import { SuppressedMetric } from './components/SuppressedMetric';
import { AdminGovernanceReportPage } from './pages/AdminGovernanceReportPage';
import { AdminReportingDashboardPage } from './pages/AdminReportingDashboardPage';
import { adminDashboardEnvelopeSchema } from './reporting.schemas';

const admin: CurrentUser = {
  id: '507f1f77bcf86cd799439011',
  fullName: 'Admin Example',
  email: 'admin@example.test',
  role: 'ADMIN',
  status: 'ACTIVE',
  capabilities: ['report.view_governance', 'report.audit_view'],
};
const metadata = {
  reportId: 'report-admin-1',
  definitionVersion: 'P06_ADMIN_GOVERNANCE_V1',
  sourceMetricVersion: null,
  descriptorVersion: null,
  dataState: 'READY',
  timezone: 'Asia/Ho_Chi_Minh',
  asOf: '2026-08-02T03:00:00.000Z',
  generatedAt: '2026-08-02T03:00:00.100Z',
  freshness: {
    status: 'FRESH',
    recalculatedAt: '2026-08-02T03:00:00.000Z',
    sourceChangedAt: '2026-08-02T02:59:00.000Z',
    staleAfterSeconds: 300,
    failedItemsCount: 0,
  },
  filters: {},
} as const;
const users = {
  STUDENT: { total: 12, PENDING: 1, ACTIVE: 10, INACTIVE: 0, BLOCKED: 1, DELETED: 0 },
  TEACHER: { total: 3, PENDING: 1, ACTIVE: 2, INACTIVE: 0, BLOCKED: 0, DELETED: 0 },
  ADMIN: { total: 1, PENDING: 0, ACTIVE: 1, INACTIVE: 0, BLOCKED: 0, DELETED: 0 },
  SUPER_ADMIN: { total: 1, PENDING: 0, ACTIVE: 1, INACTIVE: 0, BLOCKED: 0, DELETED: 0 },
};
const auditItem = {
  id: '507f1f77bcf86cd799439090',
  actorId: admin.id,
  actorRole: 'ADMIN',
  action: 'USER_STATUS_CHANGED',
  resourceType: 'User',
  resourceId: '507f1f77bcf86cd799439012',
  requestId: 'request-admin-1',
  createdAt: '2026-08-02T02:58:00.000Z',
} as const;
const dashboardEnvelope = {
  success: true,
  data: {
    users,
    registrationSources: {
      SELF_REGISTRATION: 12,
      TEACHER_INVITATION: 3,
      ADMIN_BOOTSTRAP: 2,
    },
    invitations: { PENDING: 1, ACCEPTED: 2, EXPIRED: 1, REVOKED: 0 },
    classrooms: { ACTIVE: 2, LOCKED: 0, ARCHIVED: 1 },
    courses: { DRAFT: 1, SCHEDULED: 0, PUBLISHED: 2, UNPUBLISHED: 0, ARCHIVED: 1 },
    activeEnrollmentCount: 10,
    recentGovernanceEvents: [auditItem],
    reporting: metadata,
  },
} as const;

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

function renderPage(
  element: React.ReactNode,
  requestMock: ReturnType<typeof vi.fn>,
  initialEntry: string,
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      {
        path: '*',
        element: (
          <QueryClientProvider client={client}>
            <AuthContext.Provider value={authValue(requestMock)}>{element}</AuthContext.Provider>
          </QueryClientProvider>
        ),
      },
    ],
    { initialEntries: [initialEntry] },
  );
  return render(<RouterProvider router={router} />);
}

describe('Phase 06 Admin Reporting Web', () => {
  it('renders operational metrics and preserves all management workflows', async () => {
    const requestMock = vi.fn().mockResolvedValue(dashboardEnvelope);
    renderPage(<AdminReportingDashboardPage />, requestMock, '/admin/dashboard');

    expect(await screen.findByRole('heading', { name: 'Tổng quan hệ thống' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Người dùng/u })).toHaveAttribute(
      'href',
      '/admin/users',
    );
    expect(screen.getByRole('link', { name: /Lời mời Teacher/u })).toHaveAttribute(
      'href',
      '/admin/teacher-invitations',
    );
    expect(screen.getByRole('link', { name: /Classroom/u })).toHaveAttribute(
      'href',
      '/admin/classrooms',
    );
    expect(screen.getByRole('link', { name: /Course/u })).toHaveAttribute('href', '/admin/courses');
    expect(screen.getByText('USER_STATUS_CHANGED')).toBeInTheDocument();
    expect(screen.queryByText(/password|feedback|answer/u)).not.toBeInTheDocument();
  });

  it('keeps governance and Audit Log filters URL-backed and bounded', async () => {
    const requestMock = vi.fn(async (path: string) => {
      if (path.startsWith('/admin/reports/governance')) {
        return {
          success: true,
          data: {
            users,
            registrationSources: dashboardEnvelope.data.registrationSources,
            invitations: dashboardEnvelope.data.invitations,
            classrooms: dashboardEnvelope.data.classrooms,
            courses: dashboardEnvelope.data.courses,
            enrollments: { ACTIVE: 10, REMOVED: 1, LEFT: 0, BLOCKED: 0 },
            reporting: metadata,
          },
        };
      }
      if (path.startsWith('/admin/audit-logs')) {
        return {
          success: true,
          data: { items: [auditItem], reporting: metadata },
          meta: {
            page: 1,
            limit: 20,
            totalItems: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        };
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    renderPage(
      <AdminGovernanceReportPage />,
      requestMock,
      '/admin/reports/governance?role=STUDENT&actorRole=ADMIN',
    );

    expect(await screen.findByRole('heading', { name: 'Báo cáo quản trị' })).toBeInTheDocument();
    await waitFor(() =>
      expect(requestMock).toHaveBeenCalledWith(expect.stringContaining('role=STUDENT')),
    );
    await waitFor(() =>
      expect(requestMock).toHaveBeenCalledWith(expect.stringContaining('actorRole=ADMIN')),
    );
    fireEvent.change(screen.getByLabelText('Action'), {
      target: { value: 'REPORT_VIEWED' },
    });
    await waitFor(() =>
      expect(requestMock).toHaveBeenCalledWith(expect.stringContaining('action=REPORT_VIEWED')),
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Trang Audit Log tiếp theo' })).toBeDisabled(),
    );
  });

  it('clears report content when loading fails and rejects unsafe audit fields', async () => {
    renderPage(
      <AdminReportingDashboardPage />,
      vi.fn().mockRejectedValue(new Error('Forbidden')),
      '/admin/dashboard',
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải dashboard quản trị');
    expect(screen.queryByText('USER_STATUS_CHANGED')).not.toBeInTheDocument();

    expect(() =>
      adminDashboardEnvelopeSchema.parse({
        ...dashboardEnvelope,
        data: {
          ...dashboardEnvelope.data,
          recentGovernanceEvents: [{ ...auditItem, metadata: { rawAnswer: 'secret' } }],
        },
      }),
    ).toThrow();
  });

  it('renders suppressed metrics without inferring the protected value', () => {
    render(<SuppressedMetric value={82.5} dataState="SUPPRESSED" />);
    expect(screen.getByLabelText('Dữ liệu được bảo vệ do nhóm nhỏ')).toHaveTextContent('N/A');
    expect(screen.queryByText('82.5')).not.toBeInTheDocument();
  });
});
