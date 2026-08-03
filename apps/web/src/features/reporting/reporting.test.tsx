import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import {
  AuthContext,
  type AuthContextValue,
  type CurrentUser,
} from '../../shared/auth/auth-context';
import { StudentProgressPage } from './pages/StudentProgressPage';
import { StudentReportingDashboardPage } from './pages/StudentReportingDashboardPage';

const student: CurrentUser = {
  id: '507f1f77bcf86cd799439012',
  fullName: 'Student Example',
  email: 'student@example.test',
  role: 'STUDENT',
  status: 'ACTIVE',
  capabilities: ['learning.view_enrolled', 'classroom.join', 'classroom.view_enrolled'],
};

const reporting = {
  reportId: 'report-1',
  definitionVersion: 'P06_STUDENT_DASHBOARD_V1',
  sourceMetricVersion: 'P05_REQUIRED_ACTIVITY_COMPLETION_V1',
  descriptorVersion: 'P05_ACTIVITY_DESCRIPTOR_V2',
  dataState: 'READY',
  timezone: 'Asia/Ho_Chi_Minh',
  asOf: '2026-07-30T03:00:00.000Z',
  generatedAt: '2026-07-30T03:00:00.100Z',
  freshness: {
    status: 'FRESH',
    recalculatedAt: '2026-07-30T02:59:00.000Z',
    sourceChangedAt: '2026-07-30T02:58:00.000Z',
    staleAfterSeconds: 300,
    failedItemsCount: 0,
  },
  filters: {},
} as const;

const course = {
  classroom: { id: '507f1f77bcf86cd799439021', name: 'Backend Classroom' },
  course: { id: '507f1f77bcf86cd799439022', title: 'REST API Foundations' },
  requiredActivityCount: 0,
  completedRequiredCount: 0,
  progressPercentage: null,
  processScore: null,
  progressStatus: 'NOT_STARTED',
  missingCount: 0,
  lateCount: 0,
  returnedGradeAverage: null,
  lastActiveAt: null,
  courseCompleted: false,
  actionUrl: '/student/courses/507f1f77bcf86cd799439022',
  recalculatedAt: '2026-07-30T02:59:00.000Z',
} as const;

const classroomEnvelope = {
  success: true,
  data: [],
  pagination: {
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  filters: {},
};

function authValue(requestMock: ReturnType<typeof vi.fn>): AuthContextValue {
  return {
    status: 'authenticated',
    user: student,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    request: requestMock as unknown as AuthContextValue['request'],
    updateUser: vi.fn(),
    hasPermission: (permission) => student.capabilities.includes(permission),
  };
}

function renderPage(
  element: React.ReactNode,
  requestMock: ReturnType<typeof vi.fn>,
  initialEntry: string,
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      {
        path: '*',
        element: (
          <QueryClientProvider client={queryClient}>
            <AuthContext.Provider value={authValue(requestMock)}>{element}</AuthContext.Provider>
          </QueryClientProvider>
        ),
      },
    ],
    { initialEntries: [initialEntry] },
  );
  return render(<RouterProvider router={router} />);
}

describe('Phase 06 Student reporting Web', () => {
  it('renders dashboard metrics, N/A semantics and returned Grades', async () => {
    const requestMock = vi.fn(async (path: string) => {
      if (path.startsWith('/students/me/dashboard')) {
        return {
          success: true,
          data: {
            summary: {
              activeClassroomCount: 1,
              activeCourseCount: 1,
              pendingCount: 2,
              dueSoonCount: 1,
              missingCount: 1,
            },
            todo: { items: [], totalItems: 0, scopeVersion: 'P05_MIXED_ACTIVITY_TODO_V2' },
            courses: [course],
            recentGrades: [
              {
                gradeId: '507f1f77bcf86cd799439030',
                activityId: '507f1f77bcf86cd799439031',
                activityType: 'QUIZ',
                activityTitle: 'HTTP Quiz',
                score: 8,
                maxScore: 10,
                normalizedScore: 80,
                returnedAt: '2026-07-30T02:30:00.000Z',
                actionUrl: '/student/grades/507f1f77bcf86cd799439030',
              },
            ],
            reporting,
          },
        };
      }
      if (path.startsWith('/classrooms?')) return classroomEnvelope;
      throw new Error(`Unexpected request: ${path}`);
    });
    renderPage(<StudentReportingDashboardPage />, requestMock, '/student/dashboard');
    expect(await screen.findByText('REST API Foundations')).toBeInTheDocument();
    expect(screen.getByText('HTTP Quiz')).toBeInTheDocument();
    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0);
    expect(screen.getByText('Sắp đến hạn').nextSibling).toHaveTextContent('1');
  });

  it('keeps join and Classroom workspace usable when reporting fails', async () => {
    const requestMock = vi.fn(async (path: string) => {
      if (path.startsWith('/students/me/dashboard')) throw new Error('Reporting unavailable');
      if (path.startsWith('/classrooms?')) return classroomEnvelope;
      throw new Error(`Unexpected request: ${path}`);
    });
    renderPage(<StudentReportingDashboardPage />, requestMock, '/student/dashboard');
    expect(await screen.findByText(/Không thể tải báo cáo học tập/u)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tham gia lớp học' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tham gia' })).toBeEnabled();
    expect(screen.getByText('Lớp học của tôi')).toBeInTheDocument();
  });

  it('keeps progress filters in the URL-backed query and renders empty state', async () => {
    const requestMock = vi.fn().mockResolvedValue({
      success: true,
      data: { items: [], reporting: { ...reporting, dataState: 'NO_DATA' } },
      meta: {
        page: 1,
        limit: 20,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
    renderPage(
      <StudentProgressPage />,
      requestMock,
      '/student/progress?progressStatus=MISSING&sortBy=courseTitle&sortOrder=asc',
    );
    expect(await screen.findByText('Không có khóa học phù hợp với bộ lọc')).toBeInTheDocument();
    await waitFor(() =>
      expect(requestMock).toHaveBeenCalledWith(expect.stringContaining('progressStatus=MISSING')),
    );
    fireEvent.change(screen.getByLabelText('Trạng thái'), { target: { value: '' } });
    await waitFor(() => {
      const latestPath = requestMock.mock.calls.at(-1)?.[0] as string;
      expect(latestPath).not.toContain('progressStatus=');
    });
  });
});
