import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import {
  AuthContext,
  type AuthContextValue,
  type CurrentUser,
} from '../../shared/auth/auth-context';
import { AdminAnalyticsAdoptionPage } from './pages/AdminAnalyticsAdoptionPage';
import { AdminLearningOutcomesPage } from './pages/AdminLearningOutcomesPage';
import { StudentProgressTrendPage } from './pages/StudentProgressTrendPage';

const metadata = {
  reportId: 'conditional-report-1',
  definitionVersion: 'P06_CONDITIONAL_V1',
  sourceMetricVersion: 'P05_REQUIRED_ACTIVITY_COMPLETION_V1',
  descriptorVersion: 'P05_ACTIVITY_DESCRIPTOR_V2',
  dataState: 'READY',
  timezone: 'Asia/Ho_Chi_Minh',
  asOf: '2026-08-03T03:00:00.000Z',
  generatedAt: '2026-08-03T03:00:00.100Z',
  freshness: {
    status: 'FRESH',
    recalculatedAt: '2026-08-03T03:00:00.000Z',
    sourceChangedAt: '2026-08-03T02:59:00.000Z',
    staleAfterSeconds: 300,
    failedItemsCount: 0,
  },
  filters: {},
} as const;

const student: CurrentUser = {
  id: '507f1f77bcf86cd799439012',
  fullName: 'Student Example',
  email: 'student@example.test',
  role: 'STUDENT',
  status: 'ACTIVE',
  capabilities: ['learning.view_enrolled'],
};

const admin: CurrentUser = {
  id: '507f1f77bcf86cd799439011',
  fullName: 'Admin Example',
  email: 'admin@example.test',
  role: 'ADMIN',
  status: 'ACTIVE',
  capabilities: ['report.view_governance'],
};

function renderRoute(
  element: React.ReactNode,
  requestMock: ReturnType<typeof vi.fn>,
  user: CurrentUser,
  route: string,
  entry: string,
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const auth: AuthContextValue = {
    status: 'authenticated',
    user,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    request: requestMock as unknown as AuthContextValue['request'],
    updateUser: vi.fn(),
    hasPermission: (permission) => user.capabilities.includes(permission),
  };
  const router = createMemoryRouter(
    [
      {
        path: route,
        element: (
          <QueryClientProvider client={client}>
            <AuthContext.Provider value={auth}>{element}</AuthContext.Provider>
          </QueryClientProvider>
        ),
      },
      { path: '*', element: <p>Destination</p> },
    ],
    { initialEntries: [entry] },
  );
  return render(<RouterProvider router={router} />);
}

describe('Phase 06 conditional reporting Web', () => {
  it('renders only recorded trend snapshots and their change values', async () => {
    const request = vi.fn().mockResolvedValue({
      success: true,
      data: {
        course: { id: '507f1f77bcf86cd799439022', title: 'REST API Foundations' },
        points: [
          {
            capturedAt: '2026-08-01T03:00:00.000Z',
            progressPercentage: 25,
            processScore: 25,
            returnedGradeAverage: null,
            completedRequiredCount: 1,
            requiredActivityCount: 4,
            missingCount: 0,
            lateCount: 0,
          },
          {
            capturedAt: '2026-08-03T03:00:00.000Z',
            progressPercentage: 75,
            processScore: 75,
            returnedGradeAverage: 80,
            completedRequiredCount: 3,
            requiredActivityCount: 4,
            missingCount: 1,
            lateCount: 0,
          },
        ],
        change: { progressPercentage: 50, processScore: 50, returnedGradeAverage: null },
        noDataReason: null,
        reporting: metadata,
      },
    });
    renderRoute(
      <StudentProgressTrendPage />,
      request,
      student,
      '/student/progress/:courseId/trend',
      '/student/progress/507f1f77bcf86cd799439022/trend',
    );

    expect(await screen.findByText('REST API Foundations')).toBeInTheDocument();
    expect(screen.getAllByText('50%')).toHaveLength(2);
    expect(screen.getByText('1 / 0')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Từ ngày'), {
      target: { value: '2026-08-01' },
    });
    fireEvent.change(screen.getByLabelText('Đến ngày'), {
      target: { value: '2026-08-04' },
    });
    await waitFor(() =>
      expect(request).toHaveBeenLastCalledWith(expect.stringContaining('to=2026-08-04')),
    );
  });

  it('does not reveal protected learning outcome values for a small group', async () => {
    const request = vi.fn().mockResolvedValue({
      success: true,
      data: {
        items: [
          {
            course: {
              id: '507f1f77bcf86cd799439022',
              title: 'Private Cohort',
              status: 'PUBLISHED',
            },
            studentCountBucket: '<5',
            averageProgressPercentage: null,
            completionPercentage: null,
            returnedGradeAverage: null,
            missingActivityCount: null,
            lateActivityCount: null,
            dataState: 'SUPPRESSED',
            suppressionReason: 'SMALL_GROUP',
          },
        ],
        reporting: { ...metadata, dataState: 'SUPPRESSED' },
      },
    });
    renderRoute(
      <AdminLearningOutcomesPage />,
      request,
      admin,
      '/admin/reports/learning-outcomes',
      '/admin/reports/learning-outcomes',
    );

    expect(await screen.findByText('Private Cohort')).toBeInTheDocument();
    expect(screen.getByText('<5')).toBeInTheDocument();
    expect(screen.getAllByText('N/A')).toHaveLength(4);
    expect(screen.queryByText('91%')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Từ ngày'), {
      target: { value: '2026-08-01' },
    });
    fireEvent.change(screen.getByLabelText('Đến ngày'), {
      target: { value: '2026-08-04' },
    });
    fireEvent.change(screen.getByLabelText('Course status'), {
      target: { value: 'PUBLISHED' },
    });
    await waitFor(() =>
      expect(request).toHaveBeenLastCalledWith(expect.stringContaining('courseStatus=PUBLISHED')),
    );
  });

  it('renders adoption buckets while suppressing the exact event count', async () => {
    const request = vi.fn().mockResolvedValue({
      success: true,
      data: {
        items: [
          {
            periodStart: '2026-08-03T00:00:00.000Z',
            eventName: 'REPORT_VIEWED',
            actorRole: 'TEACHER',
            eventCount: null,
            distinctActorCountBucket: '<5',
            dataState: 'SUPPRESSED',
            suppressionReason: 'SMALL_GROUP',
          },
        ],
        reporting: { ...metadata, dataState: 'SUPPRESSED' },
      },
    });
    renderRoute(
      <AdminAnalyticsAdoptionPage />,
      request,
      admin,
      '/admin/reports/adoption',
      '/admin/reports/adoption?interval=DAY',
    );

    expect(await screen.findByText('REPORT_VIEWED')).toBeInTheDocument();
    expect(screen.getByText('<5')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Từ ngày'), {
      target: { value: '2026-08-01' },
    });
    fireEvent.change(screen.getByLabelText('Đến ngày'), {
      target: { value: '2026-08-04' },
    });
    fireEvent.change(screen.getByLabelText('Chu kỳ'), { target: { value: 'WEEK' } });
    await waitFor(() =>
      expect(request).toHaveBeenLastCalledWith(expect.stringContaining('interval=WEEK')),
    );
  });

  it('clears trend data on failure and executes an explicit retry', async () => {
    const request = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({
        success: true,
        data: {
          course: { id: '507f1f77bcf86cd799439022', title: 'Recovered Course' },
          points: [],
          change: {
            progressPercentage: null,
            processScore: null,
            returnedGradeAverage: null,
          },
          noDataReason: 'INSUFFICIENT_SNAPSHOTS',
          reporting: { ...metadata, dataState: 'NO_DATA' },
        },
      });
    renderRoute(
      <StudentProgressTrendPage />,
      request,
      student,
      '/student/progress/:courseId/trend',
      '/student/progress/507f1f77bcf86cd799439022/trend',
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải xu hướng tiến độ');
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('Recovered Course')).toBeInTheDocument();
  });
});
