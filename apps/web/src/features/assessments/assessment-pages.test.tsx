import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StudentAssignmentPage } from './pages/StudentAssignmentPage';
import { StudentQuizAttemptPage } from './pages/StudentQuizAttemptPage';
import { TeacherQuizAttemptReviewPage } from './pages/TeacherQuizAttemptReviewPage';
import { TeacherSubmissionGradingPage } from './pages/TeacherSubmissionGradingPage';
import { StudentGradesPage } from './pages/StudentGradesPage';

const requestMock = vi.fn();
vi.mock('../../shared/auth/auth-context', () => ({
  useAuth: () => ({ request: requestMock }),
}));

describe('Phase 05 Student assessment pages', () => {
  beforeEach(() => requestMock.mockReset());

  function renderRoute(path: string, routePath: string, element: ReactNode) {
    const router = createMemoryRouter([{ path: routePath, element }], { initialEntries: [path] });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );
  }

  it('saves a Student Quiz answer with the canonical Attempt revision', async () => {
    const attempt = {
      id: 'attempt-id',
      quizId: 'quiz-id',
      attemptNumber: 1,
      status: 'IN_PROGRESS',
      quiz: {
        title: 'HTTP Quiz',
        resultReleasePolicy: 'IMMEDIATE',
        maxScore: 2,
        timeLimitMinutes: 15,
      },
      questions: [
        {
          questionId: 'question-id',
          type: 'SINGLE_CHOICE',
          prompt: 'Create resource?',
          points: 2,
          isRequired: true,
          options: [{ id: 'post', label: 'POST', displayOrder: 0 }],
          media: null,
          displayOrder: 0,
        },
      ],
      answers: [],
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 600_000).toISOString(),
      lastSavedAt: null,
      submittedAt: null,
      attemptRevision: 3,
      progress: { answeredCount: 0, totalCount: 1 },
      resultPending: false,
      result: null,
    };
    requestMock.mockResolvedValueOnce({ success: true, data: attempt }).mockResolvedValueOnce({
      success: true,
      data: { ...attempt, attemptRevision: 4, progress: { answeredCount: 1, totalCount: 1 } },
    });
    renderRoute(
      '/student/quiz-attempts/attempt-id',
      '/student/quiz-attempts/:attemptId',
      <StudentQuizAttemptPage />,
    );
    expect(await screen.findByText('Create resource?')).toBeVisible();
    fireEvent.click(screen.getByLabelText('POST'));
    const unsavedEvent = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(unsavedEvent);
    expect(unsavedEvent.defaultPrevented).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Lưu bài' }));
    await waitFor(() => expect(requestMock).toHaveBeenCalledTimes(2));
    const savedEvent = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(savedEvent);
    expect(savedEvent.defaultPrevented).toBe(false);
    expect(requestMock.mock.calls[1]).toEqual([
      '/students/quiz-attempts/attempt-id/answers',
      {
        method: 'PATCH',
        body: {
          answers: [{ questionId: 'question-id', selectedOptionIds: ['post'], textAnswer: null }],
          expectedAttemptRevision: 3,
        },
      },
    ]);
  });

  it('does not render the due-date duration as a timer when the Quiz has no time limit', async () => {
    requestMock.mockResolvedValueOnce({
      success: true,
      data: {
        id: 'untimed-attempt-id',
        quizId: 'untimed-quiz-id',
        attemptNumber: 1,
        status: 'IN_PROGRESS',
        quiz: {
          title: 'Untimed HTTP Quiz',
          resultReleasePolicy: 'IMMEDIATE',
          maxScore: 1,
          timeLimitMinutes: null,
        },
        questions: [],
        answers: [],
        startedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        lastSavedAt: null,
        submittedAt: null,
        attemptRevision: 1,
        progress: { answeredCount: 0, totalCount: 0 },
        resultPending: false,
        result: null,
      },
    });
    renderRoute(
      '/student/quiz-attempts/untimed-attempt-id',
      '/student/quiz-attempts/:attemptId',
      <StudentQuizAttemptPage />,
    );

    expect(await screen.findByText('Untimed HTTP Quiz')).toBeVisible();
    expect(screen.getByText('Không giới hạn')).toBeVisible();
  });

  it('creates the first Assignment draft with revision zero and TEXT-only payload', async () => {
    requestMock
      .mockResolvedValueOnce({
        success: true,
        data: {
          id: 'assignment-id',
          classroomId: 'classroom-id',
          courseId: 'course-id',
          title: 'REST Assignment',
          instruction: 'Design an endpoint.',
          maxScore: 10,
          isRequired: true,
          allowedSubmissionTypes: ['TEXT'],
          allowLateSubmission: false,
          allowUnsubmit: true,
          allowResubmit: true,
          effectiveDeadline: new Date(Date.now() + 600_000).toISOString(),
          status: 'PUBLISHED',
        },
      })
      .mockResolvedValueOnce({ success: true, data: null })
      .mockResolvedValueOnce({
        success: true,
        data: {
          id: 'submission-id',
          assignmentId: 'assignment-id',
          status: 'DRAFT',
          submissionType: 'TEXT',
          textAnswer: 'POST /api/v1/books',
          links: [],
          markDone: false,
          revision: 1,
          submittedAt: null,
          isLate: false,
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          id: 'assignment-id',
          classroomId: 'classroom-id',
          courseId: 'course-id',
          title: 'REST Assignment',
          instruction: 'Design an endpoint.',
          maxScore: 10,
          isRequired: true,
          allowedSubmissionTypes: ['TEXT'],
          allowLateSubmission: false,
          allowUnsubmit: true,
          allowResubmit: true,
          effectiveDeadline: new Date(Date.now() + 600_000).toISOString(),
          status: 'PUBLISHED',
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          id: 'submission-id',
          assignmentId: 'assignment-id',
          status: 'DRAFT',
          submissionType: 'TEXT',
          textAnswer: 'POST /api/v1/books',
          links: [],
          markDone: false,
          revision: 1,
          submittedAt: null,
          isLate: false,
        },
      })
      .mockResolvedValueOnce({ success: true, data: { items: [] } });
    renderRoute(
      '/student/assignments/assignment-id',
      '/student/assignments/:assignmentId',
      <StudentAssignmentPage />,
    );
    expect(await screen.findByText('REST Assignment')).toBeVisible();
    fireEvent.change(screen.getByLabelText('Nội dung trả lời'), {
      target: { value: 'POST /api/v1/books' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }));
    await waitFor(() =>
      expect(requestMock).toHaveBeenCalledWith('/students/assignments/assignment-id/submission', {
        method: 'PUT',
        body: {
          submissionType: 'TEXT',
          textAnswer: 'POST /api/v1/books',
          links: [],
          markDone: false,
          expectedSubmissionRevision: 0,
        },
      }),
    );
  });

  it('saves manual Quiz review with the current review revision', async () => {
    const attempt = {
      id: '507f1f77bcf86cd799439301',
      quizId: '507f1f77bcf86cd799439302',
      studentId: '507f1f77bcf86cd799439303',
      classroomId: '507f1f77bcf86cd799439304',
      courseId: '507f1f77bcf86cd799439305',
      attemptNumber: 1,
      status: 'NEEDS_REVIEW',
      title: 'HTTP Review Quiz',
      objectiveScore: 2,
      manualScore: 0,
      totalScore: 2,
      maxScore: 6,
      attemptRevision: 3,
      reviewRevision: 0,
      submittedAt: new Date().toISOString(),
      gradedAt: null,
      releasedAt: null,
      questions: [
        {
          questionId: '507f1f77bcf86cd799439306',
          type: 'SHORT_ANSWER',
          prompt: 'Giải thích idempotency.',
          points: 4,
          rubric: 'Không tạo hiệu ứng trùng lặp.',
          answer: {
            selectedOptionIds: [],
            textAnswer: 'Retry cho cùng kết quả cuối.',
            savedAt: new Date().toISOString(),
          },
          review: null,
        },
      ],
    };
    requestMock.mockResolvedValueOnce({ success: true, data: attempt }).mockResolvedValueOnce({
      success: true,
      data: { ...attempt, manualScore: 3, totalScore: 5, reviewRevision: 1 },
    });
    renderRoute(
      `/teacher/quiz-attempts/${attempt.id}/review`,
      '/teacher/quiz-attempts/:attemptId/review',
      <TeacherQuizAttemptReviewPage />,
    );
    expect(await screen.findByText('Giải thích idempotency.')).toBeVisible();
    fireEvent.change(screen.getByLabelText('Điểm được chấm'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Nhận xét cho câu trả lời'), {
      target: { value: 'Đúng ý chính.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu review' }));
    await waitFor(() =>
      expect(requestMock).toHaveBeenCalledWith(`/teacher/quiz-attempts/${attempt.id}/review`, {
        method: 'PUT',
        body: {
          answers: [
            {
              questionId: '507f1f77bcf86cd799439306',
              awardedPoints: 3,
              feedback: 'Đúng ý chính.',
            },
          ],
          expectedReviewRevision: 0,
        },
      }),
    );
  });

  it('saves an Assignment Grade against canonical evidence and Grade revisions', async () => {
    const submissionId = '507f1f77bcf86cd799439311';
    const assignmentId = '507f1f77bcf86cd799439312';
    requestMock
      .mockResolvedValueOnce({
        success: true,
        data: {
          id: submissionId,
          assignmentId,
          studentId: '507f1f77bcf86cd799439313',
          classroomId: '507f1f77bcf86cd799439314',
          courseId: '507f1f77bcf86cd799439315',
          status: 'SUBMITTED',
          submissionType: 'TEXT',
          textAnswer: 'POST /books',
          links: [],
          markDone: false,
          revision: 4,
          submittedRevision: 4,
          submittedAt: new Date().toISOString(),
          isLate: false,
          effectiveDeadlineAtSubmit: new Date().toISOString(),
          gradedAt: null,
          returnedAt: null,
          grade: null,
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          id: assignmentId,
          title: 'Thiết kế REST API',
          maxScore: 10,
          dueDate: new Date().toISOString(),
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          grade: {
            id: '507f1f77bcf86cd799439316',
            score: 8,
            maxScore: 10,
            status: 'DRAFT',
            revision: 1,
          },
          auditId: '507f1f77bcf86cd799439317',
        },
      });
    renderRoute(
      `/teacher/submissions/${submissionId}/grade`,
      '/teacher/submissions/:submissionId/grade',
      <TeacherSubmissionGradingPage />,
    );
    expect(await screen.findByText('POST /books')).toBeVisible();
    fireEvent.change(screen.getByLabelText(/Điểm/u), { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText('Nhận xét riêng cho học viên'), {
      target: { value: 'Thiết kế hợp lệ.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu điểm' }));
    await waitFor(() =>
      expect(requestMock).toHaveBeenCalledWith(`/teacher/submissions/${submissionId}/grade`, {
        method: 'PUT',
        body: {
          score: 8,
          feedback: 'Thiết kế hợp lệ.',
          expectedEvidenceRevision: 4,
          expectedGradeRevision: 0,
        },
      }),
    );
  });

  it('renders only returned Student Grades and links to own Grade detail', async () => {
    requestMock.mockResolvedValueOnce({
      success: true,
      data: {
        items: [
          {
            id: '507f1f77bcf86cd799439321',
            activityType: 'ASSIGNMENT',
            activityId: '507f1f77bcf86cd799439322',
            classroomId: '507f1f77bcf86cd799439323',
            courseId: '507f1f77bcf86cd799439324',
            score: 9,
            maxScore: 10,
            percentage: 90,
            feedback: 'Tốt.',
            revision: 2,
            gradedAt: new Date().toISOString(),
            returnedAt: new Date().toISOString(),
            title: 'REST Assignment',
            actionUrl: '/student/assignments/507f1f77bcf86cd799439322',
          },
        ],
      },
      meta: {
        page: 1,
        limit: 20,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
    renderRoute('/student/grades', '/student/grades', <StudentGradesPage />);
    expect(await screen.findByText('REST Assignment')).toBeVisible();
    expect(screen.getByText('9/10')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Xem nhận xét' })).toHaveAttribute(
      'href',
      '/student/grades/507f1f77bcf86cd799439321',
    );
  });
});
