import { Save } from 'lucide-react';

import type { TeacherQuiz } from '../assessment.types';
import { toLocalDateTime } from '../assessment-format';

export interface QuizSettingsValue {
  title: string;
  instruction: string;
  isRequired: boolean;
  availableFrom: string | null;
  dueDate: string;
  attemptLimit: number;
  timeLimitMinutes: number | null;
  resultReleasePolicy: TeacherQuiz['resultReleasePolicy'];
  scorePolicy: 'HIGHEST';
}

export function QuizSettingsForm({
  quiz,
  busy,
  disabled = false,
  submitLabel,
  onSubmit,
}: {
  quiz?: TeacherQuiz;
  busy: boolean;
  disabled?: boolean;
  submitLabel: string;
  onSubmit(value: QuizSettingsValue): Promise<void>;
}) {
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const availableFrom = String(values.get('availableFrom') ?? '');
    const dueDate = String(values.get('dueDate') ?? '');
    const timeLimit = String(values.get('timeLimitMinutes') ?? '');
    void onSubmit({
      title: String(values.get('title') ?? '').trim(),
      instruction: String(values.get('instruction') ?? '').trim(),
      isRequired: values.get('isRequired') === 'on',
      availableFrom: availableFrom ? new Date(availableFrom).toISOString() : null,
      dueDate: new Date(dueDate).toISOString(),
      attemptLimit: Number(values.get('attemptLimit')),
      timeLimitMinutes: timeLimit ? Number(timeLimit) : null,
      resultReleasePolicy: String(
        values.get('resultReleasePolicy'),
      ) as TeacherQuiz['resultReleasePolicy'],
      scorePolicy: 'HIGHEST',
    });
  }

  return (
    <form className="assessment-settings" onSubmit={submit}>
      <fieldset className="assessment-settings__fields editor-grid" disabled={busy || disabled}>
        <div className="form-field editor-grid__wide">
          <label htmlFor="quiz-title">Tên bài kiểm tra</label>
          <input
            id="quiz-title"
            name="title"
            minLength={2}
            maxLength={150}
            defaultValue={quiz?.title}
            required
          />
        </div>
        <div className="form-field editor-grid__wide">
          <label htmlFor="quiz-instruction">Hướng dẫn</label>
          <textarea
            id="quiz-instruction"
            name="instruction"
            maxLength={100_000}
            defaultValue={quiz?.instruction}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="quiz-available">Mở từ</label>
          <input
            id="quiz-available"
            name="availableFrom"
            type="datetime-local"
            defaultValue={toLocalDateTime(quiz?.availableFrom ?? null)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="quiz-due">Hạn hoàn thành</label>
          <input
            id="quiz-due"
            name="dueDate"
            type="datetime-local"
            defaultValue={toLocalDateTime(quiz?.dueDate ?? null)}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="quiz-attempt-limit">Số lượt làm</label>
          <input
            id="quiz-attempt-limit"
            name="attemptLimit"
            type="number"
            min={1}
            max={10}
            defaultValue={quiz?.attemptLimit ?? 1}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="quiz-time-limit">Thời gian (phút)</label>
          <input
            id="quiz-time-limit"
            name="timeLimitMinutes"
            type="number"
            min={1}
            max={180}
            defaultValue={quiz?.timeLimitMinutes ?? ''}
          />
        </div>
        <div className="form-field">
          <label htmlFor="quiz-release">Công bố kết quả</label>
          <select
            id="quiz-release"
            name="resultReleasePolicy"
            defaultValue={quiz?.resultReleasePolicy ?? 'AFTER_REVIEW'}
          >
            <option value="IMMEDIATE">Ngay sau khi nộp</option>
            <option value="AFTER_REVIEW">Sau khi chấm xong</option>
            <option value="TEACHER_RETURN">Khi giảng viên trả điểm</option>
          </select>
        </div>
        <label className="toggle-row">
          <input type="checkbox" name="isRequired" defaultChecked={quiz?.isRequired ?? true} />
          <span>Bắt buộc hoàn thành</span>
        </label>
      </fieldset>
      <button type="submit" disabled={busy || disabled}>
        <Save size={17} /> {busy ? 'Đang lưu...' : submitLabel}
      </button>
    </form>
  );
}
