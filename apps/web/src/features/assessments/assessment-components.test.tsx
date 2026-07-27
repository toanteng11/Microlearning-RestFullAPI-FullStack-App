import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ActivityStatusBadge } from './components/ActivityStatusBadge';
import { QuestionEditor } from './components/QuestionEditor';
import { ReasonDialog } from './components/ReasonDialog';
import { QuizSettingsForm } from './components/QuizSettingsForm';
import type { TeacherQuestion } from './assessment.types';

const question: TeacherQuestion = {
  id: 'question-id',
  quizId: 'quiz-id',
  type: 'SINGLE_CHOICE',
  prompt: 'HTTP method nào tạo resource?',
  points: 2,
  isRequired: true,
  options: [
    { id: 'get', label: 'GET', displayOrder: 0 },
    { id: 'post', label: 'POST', displayOrder: 1 },
  ],
  correctOptionIds: ['post'],
  correctBoolean: null,
  rubric: null,
  explanation: null,
  media: null,
  displayOrder: 0,
  version: 1,
  status: 'ACTIVE',
  allowedActions: ['EDIT'],
};

describe('Phase 05 assessment components', () => {
  it('renders a localized lifecycle badge', () => {
    render(<ActivityStatusBadge status="PUBLISHED" />);
    expect(screen.getByText('Đã xuất bản')).toHaveClass('assessment-status--published');
  });

  it('builds a stable-ID update payload from a choice Question', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <QuestionEditor
        question={question}
        questionRevision={7}
        busy={false}
        onSave={onSave}
        onCancel={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText('Nội dung câu hỏi'), {
      target: { value: 'Method nào dùng để tạo resource?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu câu hỏi' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0]?.[0]).toMatchObject({
      expectedQuestionRevision: 7,
      options: [
        { id: 'get', label: 'GET' },
        { id: 'post', label: 'POST' },
      ],
      correctOptionIds: ['post'],
    });
  });

  it('creates a true/false payload without objective option IDs', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<QuestionEditor questionRevision={0} busy={false} onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Loại câu hỏi'), { target: { value: 'TRUE_FALSE' } });
    fireEvent.change(screen.getByLabelText('Nội dung câu hỏi'), {
      target: { value: 'HTTP là stateless.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu câu hỏi' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0]?.[0]).toMatchObject({
      type: 'TRUE_FALSE',
      correctBoolean: true,
      expectedQuestionRevision: 0,
    });
    expect(onSave.mock.calls[0]?.[0]).not.toHaveProperty('correctOptionIds');
  });

  it('collects a normalized audit reason in an accessible dialog', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(
      <ReasonDialog
        busy={false}
        confirmLabel="Xuất bản"
        description="Lý do được ghi vào nhật ký."
        title="Xác nhận thay đổi trạng thái"
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByRole('dialog', { name: 'Xác nhận thay đổi trạng thái' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Xuất bản' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Lý do'), {
      target: { value: '  Sẵn sàng cho học sinh  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Xuất bản' }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith('Sẵn sàng cho học sinh'));
  });

  it('shows an accurate disabled state instead of a false saving state', () => {
    render(
      <QuizSettingsForm busy={false} disabled submitLabel="Lưu thiết lập" onSubmit={vi.fn()} />,
    );
    expect(screen.getByLabelText('Tên bài kiểm tra')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Lưu thiết lập' })).toBeDisabled();
    expect(screen.queryByText('Đang lưu...')).not.toBeInTheDocument();
  });

  it('normalizes Quiz settings before saving', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<QuizSettingsForm busy={false} submitLabel="Tạo bài kiểm tra" onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText('Tên bài kiểm tra'), {
      target: { value: '  Kiểm tra REST API  ' },
    });
    fireEvent.change(screen.getByLabelText('Hướng dẫn'), {
      target: { value: '  Hoàn thành tất cả câu hỏi.  ' },
    });
    fireEvent.change(screen.getByLabelText('Mở từ'), {
      target: { value: '2026-08-01T08:00' },
    });
    fireEvent.change(screen.getByLabelText('Hạn hoàn thành'), {
      target: { value: '2026-08-02T08:00' },
    });
    fireEvent.change(screen.getByLabelText('Số lượt làm'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Thời gian (phút)'), { target: { value: '45' } });
    fireEvent.change(screen.getByLabelText('Công bố kết quả'), {
      target: { value: 'IMMEDIATE' },
    });
    fireEvent.click(screen.getByLabelText('Bắt buộc hoàn thành'));
    fireEvent.click(screen.getByRole('button', { name: 'Tạo bài kiểm tra' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Kiểm tra REST API',
      instruction: 'Hoàn thành tất cả câu hỏi.',
      isRequired: false,
      availableFrom: new Date('2026-08-01T08:00').toISOString(),
      dueDate: new Date('2026-08-02T08:00').toISOString(),
      attemptLimit: 3,
      timeLimitMinutes: 45,
      resultReleasePolicy: 'IMMEDIATE',
      scorePolicy: 'HIGHEST',
    });
  });

  it('supports multiple-choice option editing and stable answer indexes', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<QuestionEditor questionRevision={4} busy={false} onSave={onSave} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Loại câu hỏi'), {
      target: { value: 'MULTIPLE_CHOICE' },
    });
    fireEvent.change(screen.getByLabelText('Nội dung câu hỏi'), {
      target: { value: 'Chọn các HTTP method idempotent.' },
    });
    fireEvent.change(screen.getByLabelText('Nội dung phương án 1'), {
      target: { value: 'GET' },
    });
    fireEvent.change(screen.getByLabelText('Nội dung phương án 2'), {
      target: { value: 'PUT' },
    });
    fireEvent.click(screen.getByLabelText('Đáp án đúng 2'));
    fireEvent.click(screen.getByLabelText('Đáp án đúng 2'));
    fireEvent.click(screen.getByLabelText('Đáp án đúng 2'));

    fireEvent.click(screen.getByRole('button', { name: 'Thêm phương án' }));
    fireEvent.change(screen.getByLabelText('Nội dung phương án 3'), {
      target: { value: 'POST' },
    });
    fireEvent.click(screen.getAllByTitle('Xóa phương án')[0]!);
    fireEvent.click(screen.getByRole('button', { name: 'Lưu câu hỏi' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0]?.[0]).toMatchObject({
      type: 'MULTIPLE_CHOICE',
      expectedQuestionRevision: 4,
      options: [{ label: 'PUT' }, { label: 'POST' }],
      correctOptionIndexes: [0],
    });
  });

  it('creates a short-answer Question with an optional rubric', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<QuestionEditor questionRevision={2} busy={false} onSave={onSave} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Loại câu hỏi'), {
      target: { value: 'SHORT_ANSWER' },
    });
    fireEvent.change(screen.getByLabelText('Nội dung câu hỏi'), {
      target: { value: 'Giải thích tính idempotent.' },
    });
    fireEvent.change(screen.getByLabelText('Hướng dẫn chấm'), {
      target: { value: '  Nêu định nghĩa và ví dụ.  ' },
    });
    fireEvent.change(screen.getByLabelText('Giải thích sau khi chấm'), {
      target: { value: '  PUT là một ví dụ.  ' },
    });
    fireEvent.click(screen.getByLabelText('Bắt buộc trả lời'));
    fireEvent.click(screen.getByRole('button', { name: 'Lưu câu hỏi' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0]?.[0]).toMatchObject({
      type: 'SHORT_ANSWER',
      rubric: 'Nêu định nghĩa và ví dụ.',
      explanation: 'PUT là một ví dụ.',
      isRequired: false,
      expectedQuestionRevision: 2,
    });
  });
});
