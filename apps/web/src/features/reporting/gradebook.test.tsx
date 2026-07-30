import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../shared/api/api-error';
import {
  AuthContext,
  type AuthContextValue,
  type CurrentUser,
} from '../../shared/auth/auth-context';
import { TeacherGradebookPage } from './pages/TeacherGradebookPage';
import { invalidateOwnedCourseReporting } from './reporting-invalidation';
import { reportingQueryKeys } from './reporting-query-keys';

const courseId = '507f1f77bcf86cd799439022';
const studentId = '507f1f77bcf86cd799439012';
const assignmentId = '507f1f77bcf86cd799439032';
const teacher: CurrentUser = {
  id: '507f1f77bcf86cd799439011',
  fullName: 'Teacher Example',
  email: 'teacher@example.test',
  role: 'TEACHER',
  status: 'ACTIVE',
  capabilities: ['grade.manage_owned'],
};
const reporting = {
  reportId: 'gradebook-report-1',
  definitionVersion: 'P06_GRADEBOOK_V1',
  sourceMetricVersion: 'P05_REQUIRED_ACTIVITY_COMPLETION_V1',
  descriptorVersion: 'P05_ACTIVITY_DESCRIPTOR_V2',
  dataState: 'READY',
  timezone: 'Asia/Ho_Chi_Minh',
  asOf: '2026-07-30T03:00:00.000Z',
  generatedAt: '2026-07-30T03:00:00.100Z',
  freshness: {
    status: 'FRESH',
    recalculatedAt: '2026-07-30T03:00:00.000Z',
    sourceChangedAt: '2026-07-30T02:59:00.000Z',
    staleAfterSeconds: 300,
    failedItemsCount: 0,
  },
  filters: {},
} as const;
const pagination = {
  page: 1,
  limit: 20,
  totalItems: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

function response(overrides: Record<string, unknown> = {}) {
  return {
    success: true,
    data: {
      course: { id: courseId, title: 'REST API' },
      columns: [
        {
          activityId: assignmentId,
          activityType: 'ASSIGNMENT',
          title: 'A very long REST API assignment title that must remain readable',
          isRequired: true,
          maxScore: 20,
          effectiveDefaultDeadline: '2026-07-29T03:00:00.000Z',
          lifecycleStatus: 'PUBLISHED',
          position: 1,
        },
      ],
      rows: [
        {
          student: {
            id: studentId,
            fullName: 'Nguyen Van An With A Long Student Name',
            email: 'an@example.test',
            studentCode: 'S001',
          },
          processScore: 75,
          progressPercentage: 80,
          returnedGradeAverage: 80,
          missingCount: 1,
          lateCount: 1,
          cells: [
            {
              activityId: assignmentId,
              completionStatus: 'LATE',
              gradingStatus: 'RETURNED',
              displayStatus: 'RETURNED',
              score: 16,
              maxScore: 20,
              normalizedScore: 80,
              submittedAt: '2026-07-30T02:00:00.000Z',
              returnedAt: '2026-07-30T03:00:00.000Z',
              effectiveDeadline: '2026-07-29T03:00:00.000Z',
              isDeadlineExceptionApplied: false,
              allowedActions: ['OPEN_GRADING'],
            },
          ],
        },
      ],
      activityPage: {
        limit: 25,
        nextCursor: 'next-column-cursor',
        truncated: true,
      },
      reporting,
      ...overrides,
    },
    meta: pagination,
  };
}

function authValue(requestMock: ReturnType<typeof vi.fn>): AuthContextValue {
  return {
    status: 'authenticated',
    user: teacher,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    request: requestMock as unknown as AuthContextValue['request'],
    updateUser: vi.fn(),
    hasPermission: (permission) => teacher.capabilities.includes(permission),
  };
}

function renderPage(
  requestMock: ReturnType<typeof vi.fn>,
  entry = `/teacher/courses/${courseId}/gradebook`,
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      {
        path: '/teacher/courses/:courseId/gradebook',
        element: (
          <QueryClientProvider client={queryClient}>
            <AuthContext.Provider value={authValue(requestMock)}>
              <TeacherGradebookPage />
            </AuthContext.Provider>
          </QueryClientProvider>
        ),
      },
      { path: '*', element: <p>Destination</p> },
    ],
    { initialEntries: [entry] },
  );
  return render(<RouterProvider router={router} />);
}

describe('Phase 06 Teacher Gradebook Web', () => {
  it('renders server-provided orthogonal status, score and drill-down actions', async () => {
    const requestMock = vi.fn().mockResolvedValue(response());
    renderPage(requestMock);

    expect(await screen.findByText('Nguyen Van An With A Long Student Name')).toBeInTheDocument();
    expect(screen.getAllByText('Đã trả điểm')).toHaveLength(2);
    expect(screen.getByText('16/20')).toBeInTheDocument();
    expect(screen.getByText(/Hoàn thành: LATE · Chấm điểm: RETURNED/u)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Mở chấm điểm/u })).toHaveAttribute(
      'href',
      `/teacher/assignments/${assignmentId}/submissions`,
    );
    expect(screen.getByRole('region', { name: 'Bảng điểm Gradebook' })).toHaveAttribute(
      'tabindex',
      '0',
    );
  });

  it('serializes source-dimension filters and sort state into the request URL', async () => {
    const requestMock = vi.fn().mockResolvedValue(response());
    renderPage(
      requestMock,
      `/teacher/courses/${courseId}/gradebook?activityType=ASSIGNMENT&gradingStatus=RETURNED`,
    );
    expect(await screen.findByText('Nguyen Van An With A Long Student Name')).toBeInTheDocument();
    await waitFor(() =>
      expect(requestMock).toHaveBeenCalledWith(
        expect.stringMatching(/activityType=ASSIGNMENT.*gradingStatus=RETURNED/u),
      ),
    );

    fireEvent.change(screen.getByLabelText('Tìm Student'), {
      target: { value: 'Nguyen' },
    });
    fireEvent.change(screen.getByLabelText('Trạng thái hoàn thành'), {
      target: { value: 'LATE' },
    });
    fireEvent.change(screen.getByLabelText('Sắp xếp'), {
      target: { value: 'fullName' },
    });
    fireEvent.submit(screen.getByLabelText('Tìm Student').closest('form')!);
    await waitFor(() => {
      const paths = requestMock.mock.calls.map(([path]) => String(path));
      expect(paths.some((path) => path.includes('search=Nguyen'))).toBe(true);
      expect(paths.some((path) => path.includes('completionStatus=LATE'))).toBe(true);
      expect(paths.some((path) => path.includes('sortBy=fullName'))).toBe(true);
    });
  });

  it('moves through the independent activity cursor without changing Student bounds', async () => {
    const requestMock = vi.fn().mockResolvedValue(response());
    renderPage(requestMock);
    expect(await screen.findByText('Nguyen Van An With A Long Student Name')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Cột tiếp theo/u }));
    await waitFor(() =>
      expect(requestMock).toHaveBeenCalledWith(
        expect.stringMatching(/page=1.*limit=20.*activityCursor=next-column-cursor/u),
      ),
    );
  });

  it('shows a specific forbidden state and recovers through retry', async () => {
    const requestMock = vi
      .fn()
      .mockRejectedValueOnce(new ApiError(404, 'RESOURCE_NOT_FOUND', 'Not found'))
      .mockResolvedValue(response());
    renderPage(requestMock);

    expect(
      await screen.findByText('Bạn không có quyền xem Gradebook của Course này.'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('Nguyen Van An With A Long Student Name')).toBeInTheDocument();
  });

  it('renders an actionable empty activity state without an empty matrix', async () => {
    const requestMock = vi.fn().mockResolvedValue(
      response({
        columns: [],
        rows: [],
        activityPage: { limit: 25, nextCursor: null, truncated: false },
        reporting: { ...reporting, dataState: 'NO_DATA' },
      }),
    );
    renderPage(requestMock);

    expect(await screen.findByRole('heading', { name: 'Chưa có hoạt động phù hợp' })).toBeVisible();
    expect(screen.queryByRole('region', { name: 'Bảng điểm Gradebook' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Quản lý nội dung' })).toHaveAttribute(
      'href',
      `/teacher/courses/${courseId}/content`,
    );
  });

  it('invalidates only the mutated Teacher Course Gradebook scope', async () => {
    const queryClient = new QueryClient();
    const query = {
      page: 1,
      limit: 20,
      activityLimit: 25,
      sortBy: 'processScore',
      sortOrder: 'desc',
    } as const;
    const currentKey = reportingQueryKeys.teacherGradebook(teacher.id, courseId, query);
    const otherKey = reportingQueryKeys.teacherGradebook(
      teacher.id,
      '507f1f77bcf86cd799439099',
      query,
    );
    queryClient.setQueryData(currentKey, response());
    queryClient.setQueryData(otherKey, response());

    await invalidateOwnedCourseReporting(queryClient, teacher.id, courseId);

    expect(queryClient.getQueryState(currentKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(otherKey)?.isInvalidated).toBe(false);
  });
});
