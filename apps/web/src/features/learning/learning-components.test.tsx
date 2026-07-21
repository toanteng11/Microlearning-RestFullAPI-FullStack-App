import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AuthContext,
  type AuthContextValue,
  type CurrentUser,
} from '../../shared/auth/auth-context';
import { FlashcardViewer } from './components/FlashcardViewer';
import { ContentStatusBadge, ProgressStatusBadge } from './components/LearningStatusBadge';
import { ProgressBar } from './components/ProgressBar';
import { StudentClassworkPanel } from './components/StudentClassworkPanel';
import { StudentStreamPanel } from './components/StudentStreamPanel';
import { TeacherClassworkPanel } from './components/TeacherClassworkPanel';
import { TeacherStreamPanel } from './components/TeacherStreamPanel';
import {
  contentStatusLabel,
  displayLearningDate,
  progressStatusLabel,
  requestErrorMessage,
} from './learning-format';
import type {
  ClassworkLesson,
  ItemEnvelope,
  StudentAnnouncement,
  StudentClassworkEnvelope,
  TeacherAnnouncement,
  TeacherCourse,
} from './learning.types';

const classroomId = '507f1f77bcf86cd799439021';
const courseId = '507f1f77bcf86cd799439022';
const lessonId = '507f1f77bcf86cd799439023';
const teacher: CurrentUser = {
  id: '507f1f77bcf86cd799439011',
  fullName: 'Teacher Example',
  email: 'teacher@example.test',
  role: 'TEACHER',
  status: 'ACTIVE',
  capabilities: ['announcement.manage_owned', 'course.manage_owned'],
};

const meta = {
  page: 1,
  limit: 20,
  totalItems: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

function itemEnvelope<T>(items: T[], metaOverrides: Partial<typeof meta> = {}): ItemEnvelope<T> {
  return {
    success: true,
    data: { items, asOf: '2026-07-20T09:00:00.000Z' },
    meta: { ...meta, ...metaOverrides },
  };
}

function renderWithRequest(element: React.ReactNode, requestMock: ReturnType<typeof vi.fn>) {
  const value: AuthContextValue = {
    status: 'authenticated',
    user: teacher,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    request: requestMock as unknown as AuthContextValue['request'],
    updateUser: vi.fn(),
    hasPermission: () => true,
  };
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={value}>{element}</AuthContext.Provider>
    </MemoryRouter>,
  );
}

function progress(status: ClassworkLesson['progress']['derivedStatus'] = 'NOT_STARTED') {
  return {
    status: null,
    startedAt: null,
    completedAt: null,
    lastActiveAt: null,
    derivedStatus: status,
  } as const;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Phase 04 learning presentation components', () => {
  it('formats dates, statuses, errors and progress values consistently', () => {
    expect(displayLearningDate(null)).toBe('Chưa đặt');
    expect(displayLearningDate('2026-07-20T09:00:00.000Z')).not.toBe('Chưa đặt');
    expect(contentStatusLabel('DRAFT')).toBe('Bản nháp');
    expect(contentStatusLabel('ARCHIVED')).toBe('Đã lưu trữ');
    expect(progressStatusLabel('MISSING')).toBe('Quá hạn');
    expect(progressStatusLabel('LATE')).toBe('Hoàn thành trễ');
    expect(requestErrorMessage(new Error('Runtime failure'), 'Fallback')).toBe('Runtime failure');
    expect(requestErrorMessage('invalid', 'Fallback')).toBe('Fallback');

    render(
      <>
        <ContentStatusBadge status="PUBLISHED" />
        <ProgressStatusBadge status="IN_PROGRESS" />
        <ProgressBar value={145} label="Tiến độ kiểm thử" />
      </>,
    );
    expect(screen.getByText('Đã xuất bản')).toBeInTheDocument();
    expect(screen.getByText('Đang học')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('supports flashcard flip and bounded previous/next navigation', () => {
    const { rerender } = render(
      <FlashcardViewer
        cards={[
          {
            id: 'f1',
            lessonId,
            frontHtml: '<p>Front one</p>',
            backHtml: '<p>Back one</p>',
            displayOrder: 0,
          },
          {
            id: 'f2',
            lessonId,
            frontHtml: '<p>Front two</p>',
            backHtml: '<p>Back two</p>',
            displayOrder: 1,
          },
        ]}
      />,
    );
    const card = screen.getByRole('button', { pressed: false });
    expect(card).toHaveTextContent('Front one');
    fireEvent.click(card);
    expect(screen.getByRole('button', { pressed: true })).toHaveTextContent('Back one');
    fireEvent.click(screen.getByRole('button', { name: /Thẻ sau/u }));
    expect(screen.getByText('Front two')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Thẻ trước/u }));
    expect(screen.getByText('Front one')).toBeInTheDocument();
    rerender(<FlashcardViewer cards={[]} />);
    expect(screen.queryByRole('heading', { name: 'Thẻ ghi nhớ' })).not.toBeInTheDocument();
  });

  it('renders Student Classwork in canonical course/module order and retries errors', async () => {
    const rootLesson: ClassworkLesson = {
      id: lessonId,
      courseId,
      moduleId: null,
      title: 'Root lesson',
      contentHtml: '<p>Root</p>',
      contentFormat: 'MARKDOWN',
      estimatedMinutes: 8,
      isRequired: true,
      completionDeadline: '2026-08-01T09:00:00.000Z',
      displayOrder: 0,
      publishedRevision: 1,
      progress: progress(),
    };
    const response: StudentClassworkEnvelope = {
      success: true,
      data: {
        classroom: { id: classroomId, name: 'Backend Classroom' },
        courses: [
          {
            id: courseId,
            title: 'REST API Course',
            description: 'Course description',
            displayOrder: 0,
            lessons: [rootLesson],
            modules: [
              {
                id: 'module-one',
                title: 'HTTP Foundations',
                description: 'Module description',
                displayOrder: 0,
                lessons: [
                  {
                    ...rootLesson,
                    id: 'lesson-two',
                    moduleId: 'module-one',
                    title: 'Status codes',
                  },
                ],
              },
            ],
          },
        ],
        asOf: '2026-07-20T09:00:00.000Z',
      },
    };
    const requestMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValue(response);
    renderWithRequest(<StudentClassworkPanel classroomId={classroomId} />, requestMock);
    expect(await screen.findByRole('alert')).toHaveTextContent('Network unavailable');
    fireEvent.click(screen.getByRole('button', { name: /Thử lại/u }));
    expect(await screen.findByRole('link', { name: 'REST API Course' })).toHaveAttribute(
      'href',
      `/student/courses/${courseId}`,
    );
    expect(screen.getByText('Root lesson')).toBeInTheDocument();
    expect(screen.getByText('HTTP Foundations')).toBeInTheDocument();
    expect(screen.getByText('Status codes')).toBeInTheDocument();
  });

  it('renders only the sanitized announcement projection delivered to Student Stream', async () => {
    const announcement: StudentAnnouncement = {
      id: 'announcement-one',
      classroomId,
      teacherId: teacher.id,
      contentHtml: '<p>Published update</p>',
      publishedAt: '2026-07-20T09:00:00.000Z',
    };
    const requestMock = vi.fn().mockImplementation((path: string) =>
      Promise.resolve(
        itemEnvelope([announcement], {
          page: path.includes('page=2') ? 2 : 1,
          totalItems: 21,
          totalPages: 2,
          hasNextPage: !path.includes('page=2'),
          hasPreviousPage: path.includes('page=2'),
        }),
      ),
    );
    renderWithRequest(<StudentStreamPanel classroomId={classroomId} />, requestMock);
    expect(await screen.findByText('Published update')).toBeInTheDocument();
    expect(requestMock).toHaveBeenCalledWith(
      `/classrooms/${classroomId}/announcements?page=1&limit=20`,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Trang bảng tin sau' }));
    await waitFor(() =>
      expect(requestMock).toHaveBeenCalledWith(
        `/classrooms/${classroomId}/announcements?page=2&limit=20`,
      ),
    );
  });

  it('renders Teacher courses with status and management links', async () => {
    const course: TeacherCourse = {
      id: courseId,
      classroomId,
      title: 'REST API Course',
      description: '',
      status: 'DRAFT',
      effectiveStatus: 'DRAFT',
      scheduledPublishAt: null,
      publishedAt: null,
      unpublishedAt: null,
      archivedAt: null,
      displayOrder: 0,
      structureRevision: 0,
      createdAt: '2026-07-20T09:00:00.000Z',
      updatedAt: '2026-07-20T09:00:00.000Z',
      allowedActions: ['VIEW', 'UPDATE'],
    };
    const requestMock = vi.fn().mockResolvedValue(itemEnvelope([course]));
    renderWithRequest(<TeacherClassworkPanel classroomId={classroomId} />, requestMock);
    expect(await screen.findByRole('link', { name: 'REST API Course' })).toHaveAttribute(
      'href',
      `/teacher/courses/${courseId}`,
    );
    expect(screen.getByText('Chưa có mô tả.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Tạo khóa học/u })).toHaveAttribute(
      'href',
      `/teacher/classrooms/${classroomId}/courses/new`,
    );
    expect(requestMock).toHaveBeenCalledWith(
      `/courses?classroomId=${classroomId}&page=1&limit=10&sortBy=displayOrder&sortOrder=asc`,
    );

    fireEvent.change(screen.getByLabelText('Tìm khóa học'), {
      target: { value: 'REST API' },
    });
    fireEvent.change(screen.getByLabelText('Trạng thái khóa học'), {
      target: { value: 'DRAFT' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Lọc' }));

    await waitFor(() =>
      expect(requestMock).toHaveBeenCalledWith(
        `/courses?classroomId=${classroomId}&page=1&limit=10&sortBy=displayOrder&sortOrder=asc&search=REST+API&status=DRAFT`,
      ),
    );
  });

  it('executes Teacher announcement create, edit, publish and archive commands', async () => {
    const announcement: TeacherAnnouncement = {
      id: 'announcement-one',
      classroomId,
      teacherId: teacher.id,
      content: 'Initial update',
      contentHtml: '<p>Initial update</p>',
      status: 'DRAFT',
      effectiveStatus: 'DRAFT',
      scheduledPublishAt: null,
      publishedAt: null,
      unpublishedAt: null,
      archivedAt: null,
      createdAt: '2026-07-20T09:00:00.000Z',
      updatedAt: '2026-07-20T09:00:00.000Z',
      allowedActions: ['UPDATE', 'ARCHIVE'],
    };
    const requestMock = vi
      .fn()
      .mockImplementation((path: string, options?: { method?: string }) => {
        if (!options?.method) return Promise.resolve(itemEnvelope([announcement]));
        return Promise.resolve({ success: true, data: {} });
      });
    vi.spyOn(window, 'prompt').mockReturnValue('Announcement is no longer current');
    renderWithRequest(<TeacherStreamPanel classroomId={classroomId} />, requestMock);
    expect(await screen.findByText('Initial update')).toBeInTheDocument();
    expect(requestMock).toHaveBeenCalledWith(
      `/classrooms/${classroomId}/announcements?page=1&limit=10`,
    );

    fireEvent.change(screen.getByLabelText('Trạng thái'), { target: { value: 'DRAFT' } });
    await waitFor(() =>
      expect(requestMock).toHaveBeenCalledWith(
        `/classrooms/${classroomId}/announcements?page=1&limit=10&status=DRAFT`,
      ),
    );

    fireEvent.change(screen.getByLabelText('Thông báo mới'), { target: { value: 'New update' } });
    fireEvent.click(screen.getByRole('button', { name: /Tạo bản nháp/u }));
    await waitFor(() =>
      expect(requestMock).toHaveBeenCalledWith(`/classrooms/${classroomId}/announcements`, {
        method: 'POST',
        body: { content: 'New update' },
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Sửa thông báo' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Sửa thông báo' }), {
      target: { value: 'Edited update' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }));
    await waitFor(() =>
      expect(requestMock).toHaveBeenCalledWith(`/announcements/${announcement.id}`, {
        method: 'PATCH',
        body: { content: 'Edited update', expectedUpdatedAt: announcement.updatedAt },
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Xuất bản thông báo' }));
    await waitFor(() =>
      expect(requestMock).toHaveBeenCalledWith(`/announcements/${announcement.id}/status`, {
        method: 'PATCH',
        body: { targetStatus: 'PUBLISHED', expectedUpdatedAt: announcement.updatedAt },
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Lưu trữ thông báo' }));
    await waitFor(() =>
      expect(requestMock).toHaveBeenCalledWith(`/announcements/${announcement.id}`, {
        method: 'DELETE',
        body: {
          reason: 'Announcement is no longer current',
          expectedUpdatedAt: announcement.updatedAt,
        },
      }),
    );
  });
});
