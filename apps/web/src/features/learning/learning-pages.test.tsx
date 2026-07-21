import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import {
  AuthContext,
  type AuthContextValue,
  type CurrentUser,
} from '../../shared/auth/auth-context';
import type { ClassroomListEnvelope } from '../classrooms/classroom.types';
import type { TodoEnvelope } from './learning.types';
import { StudentDeadlinePage } from './pages/StudentDeadlinePage';
import { StudentTodoPage } from './pages/StudentTodoPage';

const classroomId = '507f1f77bcf86cd799439021';
const student: CurrentUser = {
  id: '507f1f77bcf86cd799439012',
  fullName: 'Student Example',
  email: 'student@example.test',
  role: 'STUDENT',
  status: 'ACTIVE',
  capabilities: ['learning.read_own'],
};

const classroomResponse: ClassroomListEnvelope = {
  success: true,
  data: [
    {
      id: classroomId,
      name: 'Backend Classroom',
      description: null,
      subject: 'REST API',
      section: null,
      owner: { id: '507f1f77bcf86cd799439011', fullName: 'Teacher Example' },
      status: 'ACTIVE',
      enrollmentStatus: 'OPEN',
      membership: {
        id: '507f1f77bcf86cd799439031',
        classroomId,
        studentId: student.id,
        status: 'ACTIVE',
        joinedBy: 'CLASS_CODE',
        joinedAt: '2026-07-20T09:00:00.000Z',
        updatedAt: '2026-07-20T09:00:00.000Z',
      },
      archivedAt: null,
      createdAt: '2026-07-20T09:00:00.000Z',
      updatedAt: '2026-07-20T09:00:00.000Z',
    },
  ],
  pagination: {
    page: 1,
    limit: 100,
    totalItems: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  filters: {},
};

const learningResponse: TodoEnvelope = {
  success: true,
  data: {
    items: [
      {
        id: '507f1f77bcf86cd799439041',
        title: 'HTTP status codes',
        classroom: { id: classroomId, name: 'Backend Classroom' },
        course: { id: '507f1f77bcf86cd799439022', title: 'REST API Course' },
        completionDeadline: '2026-08-15T09:00:00.000Z',
        progress: {
          status: null,
          startedAt: null,
          completedAt: null,
          lastActiveAt: null,
          derivedStatus: 'NOT_STARTED',
        },
        actionUrl: '/student/lessons/507f1f77bcf86cd799439041',
      },
    ],
    asOf: '2026-07-20T09:00:00.000Z',
  },
  meta: {
    page: 1,
    limit: 20,
    totalItems: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

function renderStudentPage(
  element: React.ReactNode,
  requestMock: ReturnType<typeof vi.fn>,
  initialEntries: string[] = ['/'],
) {
  const value: AuthContextValue = {
    status: 'authenticated',
    user: student,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    request: requestMock as unknown as AuthContextValue['request'],
    updateUser: vi.fn(),
    hasPermission: () => true,
  };
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthContext.Provider value={value}>{element}</AuthContext.Provider>
    </MemoryRouter>,
  );
}

function studentRequest(path: string) {
  if (path.startsWith('/classrooms?')) return Promise.resolve(classroomResponse);
  return Promise.resolve(learningResponse);
}

describe('Phase 04 Student learning pages', () => {
  it('filters the to-do list by active classroom while preserving scope', async () => {
    const requestMock = vi.fn(studentRequest);
    renderStudentPage(<StudentTodoPage />, requestMock);

    expect(await screen.findByRole('link', { name: 'HTTP status codes' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Quá hạn' }));
    fireEvent.change(screen.getByLabelText('Lớp học'), { target: { value: classroomId } });

    await waitFor(() =>
      expect(requestMock).toHaveBeenCalledWith(
        `/students/me/todo?scope=OVERDUE&page=1&limit=20&classroomId=${classroomId}`,
      ),
    );
  });

  it('applies classroom and inclusive date filters to the deadline request', async () => {
    const requestMock = vi.fn(studentRequest);
    renderStudentPage(<StudentDeadlinePage />, requestMock);

    expect(await screen.findByRole('link', { name: 'HTTP status codes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('15/08/2026');
    fireEvent.change(screen.getByLabelText('Lớp học'), { target: { value: classroomId } });
    fireEvent.change(screen.getByLabelText('Từ ngày'), { target: { value: '2026-08-01' } });
    fireEvent.change(screen.getByLabelText('Đến ngày'), { target: { value: '2026-08-31' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lọc' }));

    const query = new URLSearchParams({
      page: '1',
      limit: '20',
      classroomId,
      from: '2026-08-01T00:00:00.000Z',
      to: '2026-08-31T23:59:59.999Z',
    });
    await waitFor(() =>
      expect(requestMock).toHaveBeenCalledWith(`/students/me/deadlines?${query.toString()}`),
    );
  });

  it('rejects an invalid deadline range without sending another deadline request', async () => {
    const requestMock = vi.fn(studentRequest);
    renderStudentPage(<StudentDeadlinePage />, requestMock);

    await screen.findByRole('link', { name: 'HTTP status codes' });
    const requestsBeforeSubmit = requestMock.mock.calls.filter(([path]) =>
      String(path).startsWith('/students/me/deadlines?'),
    ).length;
    fireEvent.change(screen.getByLabelText('Từ ngày'), { target: { value: '2026-09-01' } });
    fireEvent.change(screen.getByLabelText('Đến ngày'), { target: { value: '2026-08-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lọc' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.',
    );
    expect(
      requestMock.mock.calls.filter(([path]) => String(path).startsWith('/students/me/deadlines?')),
    ).toHaveLength(requestsBeforeSubmit);
  });

  it('ignores malformed URL filters instead of sending an invalid API query', async () => {
    const requestMock = vi.fn(studentRequest);
    renderStudentPage(<StudentDeadlinePage />, requestMock, [
      '/student/deadlines?from=2026-02-31&to=invalid&page=invalid&classroomId=invalid',
    ]);

    await screen.findByRole('link', { name: 'HTTP status codes' });
    expect(requestMock).toHaveBeenCalledWith('/students/me/deadlines?page=1&limit=20');
  });
});
