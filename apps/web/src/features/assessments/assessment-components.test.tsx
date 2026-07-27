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
});
