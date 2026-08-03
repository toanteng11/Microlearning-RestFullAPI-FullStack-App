import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import {
  AuthContext,
  type AuthContextValue,
  type CurrentUser,
} from '../../shared/auth/auth-context';
import { TeacherRankingPage } from './pages/TeacherRankingPage';
import { TeacherReportingDashboardPage } from './pages/TeacherReportingDashboardPage';
import { TeacherStudentDetailPage } from './pages/TeacherStudentDetailPage';

const courseId = '507f1f77bcf86cd799439022';
const studentId = '507f1f77bcf86cd799439012';
const teacher: CurrentUser = {
  id: '507f1f77bcf86cd799439011',
  fullName: 'Teacher Example',
  email: 'teacher@example.test',
  role: 'TEACHER',
  status: 'ACTIVE',
  capabilities: ['course.progress_view_owned'],
};
const reporting = {
  reportId: 'teacher-report-1',
  definitionVersion: 'P06_TEACHER_RANKING_V1',
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
const progressRow = {
  rank: 1,
  student: {
    id: studentId,
    fullName: 'Nguyen Van An',
    email: 'an@example.test',
    studentCode: 'S001',
  },
  requiredActivityCount: 4,
  completedRequiredCount: 3,
  progressPercentage: 75,
  processScore: 75,
  progressStatus: 'IN_PROGRESS',
  returnedGradeAverage: 82,
  missingCount: 1,
  lateCount: 0,
  ungradedCount: 1,
  lastActiveAt: '2026-07-30T02:00:00.000Z',
  courseCompleted: false,
  supportFlags: ['HAS_MISSING_WORK'],
  allowedActions: ['VIEW_STUDENT_PROGRESS'],
} as const;
const pagination = {
  page: 1,
  limit: 20,
  totalItems: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

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

function renderRoute(
  element: React.ReactNode,
  requestMock: ReturnType<typeof vi.fn>,
  path: string,
  entry: string,
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      {
        path,
        element: (
          <QueryClientProvider client={queryClient}>
            <AuthContext.Provider value={authValue(requestMock)}>{element}</AuthContext.Provider>
          </QueryClientProvider>
        ),
      },
      { path: '*', element: <p>Destination</p> },
    ],
    { initialEntries: [entry] },
  );
  return render(<RouterProvider router={router} />);
}

describe('Phase 06 Teacher reporting Web', () => {
  it('renders Course summary and top ranking without replacing management actions', async () => {
    const requestMock = vi.fn().mockResolvedValue({
      success: true,
      data: {
        course: {
          id: courseId,
          title: 'REST API',
          status: 'PUBLISHED',
          classroomId: '507f1f77bcf86cd799439021',
          classroomName: 'Backend Classroom',
        },
        summary: {
          totalActivityCount: 5,
          publishedActivityCount: 5,
          requiredActivityCount: 4,
          activeStudentCount: 1,
          averageProgressPercentage: 75,
          averageReturnedGrade: 82,
          missingActivityCount: 1,
          lateActivityCount: 0,
          ungradedActivityCount: 1,
        },
        topActivities: [],
        topStudents: [progressRow],
        allowedActions: ['VIEW_SOURCE_LIST'],
        reporting,
      },
    });
    renderRoute(
      <TeacherReportingDashboardPage courseId={courseId} />,
      requestMock,
      '/teacher/courses/:courseId',
      `/teacher/courses/${courseId}`,
    );
    expect(await screen.findByText('Nguyen Van An')).toBeInTheDocument();
    expect(screen.getAllByText('75%')).toHaveLength(2);
    expect(screen.getByRole('link', { name: /Phân tích chi tiết/u })).toHaveAttribute(
      'href',
      `/teacher/courses/${courseId}/analytics`,
    );
  });

  it('keeps ranking filters in the request and detail Back state in the URL', async () => {
    const requestMock = vi.fn().mockResolvedValue({
      success: true,
      data: {
        course: { id: courseId, title: 'REST API' },
        items: [progressRow],
        reporting,
      },
      meta: pagination,
    });
    const entry = `/teacher/courses/${courseId}/analytics?tab=progress&progressStatus=MISSING&sortBy=processScore&sortOrder=desc`;
    renderRoute(<TeacherRankingPage />, requestMock, '/teacher/courses/:courseId/analytics', entry);
    expect(await screen.findByText('Nguyen Van An')).toBeInTheDocument();
    await waitFor(() =>
      expect(requestMock).toHaveBeenCalledWith(expect.stringContaining('progressStatus=MISSING')),
    );
    const detailLink = screen.getByRole('link', { name: 'Xem tiến độ của Nguyen Van An' });
    expect(detailLink.getAttribute('href')).toContain('returnTo=');
  });

  it('drives ranking search, sort, order and pagination from URL state', async () => {
    const requestMock = vi.fn().mockResolvedValue({
      success: true,
      data: {
        course: { id: courseId, title: 'REST API' },
        items: [progressRow],
        reporting,
      },
      meta: {
        ...pagination,
        totalItems: 21,
        totalPages: 2,
        hasNextPage: true,
      },
    });
    renderRoute(
      <TeacherRankingPage />,
      requestMock,
      '/teacher/courses/:courseId/analytics',
      `/teacher/courses/${courseId}/analytics?tab=progress`,
    );
    expect(await screen.findByText('Nguyen Van An')).toBeInTheDocument();

    const filterForm = screen.getByRole('textbox').closest('form');
    expect(filterForm).not.toBeNull();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Nguyen' } });
    fireEvent.change(screen.getAllByRole('combobox')[0]!, { target: { value: 'MISSING' } });
    fireEvent.submit(filterForm!);
    await waitFor(() =>
      expect(requestMock).toHaveBeenCalledWith(
        expect.stringMatching(/search=Nguyen.*progressStatus=MISSING/u),
      ),
    );

    fireEvent.change(screen.getAllByRole('combobox')[1]!, { target: { value: 'fullName' } });
    await waitFor(() =>
      expect(requestMock).toHaveBeenCalledWith(expect.stringContaining('sortBy=fullName')),
    );
    fireEvent.change(screen.getAllByRole('combobox')[2]!, { target: { value: 'asc' } });
    await waitFor(() =>
      expect(requestMock).toHaveBeenCalledWith(expect.stringContaining('sortOrder=asc')),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }));
    await waitFor(() =>
      expect(requestMock).toHaveBeenCalledWith(expect.stringContaining('page=2')),
    );
  });

  it('recovers ranking data after a controlled request error', async () => {
    const requestMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('Reporting unavailable'))
      .mockResolvedValue({
        success: true,
        data: {
          course: { id: courseId, title: 'REST API' },
          items: [progressRow],
          reporting,
        },
        meta: pagination,
      });
    renderRoute(
      <TeacherRankingPage />,
      requestMock,
      '/teacher/courses/:courseId/analytics',
      `/teacher/courses/${courseId}/analytics`,
    );
    const alert = await screen.findByRole('alert');
    fireEvent.click(alert.querySelector('button')!);
    expect(await screen.findByText('Nguyen Van An')).toBeInTheDocument();
  });

  it('switches to assessment analytics and renders independent tab data', async () => {
    const requestMock = vi.fn(async (path: string) => {
      if (path.includes('/assessments?')) {
        return {
          success: true,
          data: {
            course: { id: courseId, title: 'REST API' },
            items: [
              {
                activityId: '507f1f77bcf86cd799439031',
                activityType: 'QUIZ',
                title: 'HTTP Quiz',
                lifecycleStatus: 'PUBLISHED',
                position: 1,
                eligibleStudentCount: 1,
                notStartedCount: 0,
                inProgressCount: 0,
                submittedCount: 1,
                needsReviewCount: 0,
                draftGradeCount: 0,
                returnedCount: 1,
                missingCount: 0,
                lateCount: 0,
                submissionPercentage: 100,
                returnedGradeAverage: 82,
                scoreDistribution: [{ bucket: '80_89', count: 1 }],
                actionUrl: '/teacher/quizzes/507f1f77bcf86cd799439031/results',
              },
            ],
            reporting,
          },
          meta: pagination,
        };
      }
      return {
        success: true,
        data: { course: { id: courseId, title: 'REST API' }, items: [], reporting },
        meta: { ...pagination, totalItems: 0, totalPages: 0 },
      };
    });
    renderRoute(
      <TeacherRankingPage />,
      requestMock,
      '/teacher/courses/:courseId/analytics',
      `/teacher/courses/${courseId}/analytics`,
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Assessment' }));
    expect(await screen.findByText('HTTP Quiz')).toBeInTheDocument();
  });

  it('uses a validated return path on Student detail', async () => {
    const requestMock = vi.fn().mockResolvedValue({
      success: true,
      data: {
        student: progressRow.student,
        summary: {
          ...progressRow,
          rank: undefined,
          student: undefined,
          allowedActions: undefined,
        },
        activities: [],
        reporting,
      },
    });
    renderRoute(
      <TeacherStudentDetailPage />,
      requestMock,
      '/teacher/courses/:courseId/students/:studentId/progress',
      `/teacher/courses/${courseId}/students/${studentId}/progress?returnTo=${encodeURIComponent(`/teacher/courses/${courseId}/analytics?tab=progress&page=2`)}`,
    );
    expect(await screen.findByRole('heading', { name: 'Nguyen Van An' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Quay lại báo cáo' })).toHaveAttribute(
      'href',
      `/teacher/courses/${courseId}/analytics?tab=progress&page=2`,
    );
  });

  it('refreshes a stale Course dashboard snapshot on demand', async () => {
    const requestMock = vi.fn().mockResolvedValue({
      success: true,
      data: {
        course: {
          id: courseId,
          title: 'REST API',
          status: 'PUBLISHED',
          classroomId: '507f1f77bcf86cd799439021',
          classroomName: 'Backend Classroom',
        },
        summary: {
          totalActivityCount: 0,
          publishedActivityCount: 0,
          requiredActivityCount: 0,
          activeStudentCount: 0,
          averageProgressPercentage: null,
          averageReturnedGrade: null,
          missingActivityCount: 0,
          lateActivityCount: 0,
          ungradedActivityCount: 0,
        },
        topActivities: [],
        topStudents: [],
        allowedActions: ['VIEW_SOURCE_LIST'],
        reporting: {
          ...reporting,
          freshness: { ...reporting.freshness, status: 'STALE' },
        },
      },
    });
    renderRoute(
      <TeacherReportingDashboardPage courseId={courseId} />,
      requestMock,
      '/teacher/courses/:courseId',
      `/teacher/courses/${courseId}`,
    );
    const status = await screen.findByRole('status');
    fireEvent.click(status.querySelector('button')!);
    await waitFor(() => expect(requestMock).toHaveBeenCalledTimes(2));
  });
});
