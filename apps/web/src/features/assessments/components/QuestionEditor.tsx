import { Plus, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';

import type { QuestionType, TeacherQuestion } from '../assessment.types';
import { questionTypeLabels } from '../assessment-format';

interface EditableOption {
  id?: string;
  label: string;
}

export function QuestionEditor({
  question,
  questionRevision,
  busy,
  onSave,
  onCancel,
}: {
  question?: TeacherQuestion;
  questionRevision: number;
  busy: boolean;
  onSave(body: Record<string, unknown>): Promise<void>;
  onCancel(): void;
}) {
  const [type, setType] = useState<QuestionType>(question?.type ?? 'SINGLE_CHOICE');
  const [options, setOptions] = useState<EditableOption[]>(
    question?.options.map(({ id, label }) => ({ id, label })) ?? [{ label: '' }, { label: '' }],
  );
  const [correctIndexes, setCorrectIndexes] = useState<number[]>(
    question?.options.flatMap((option, index) =>
      question.correctOptionIds.includes(option.id) ? [index] : [],
    ) ?? [0],
  );

  function changeType(next: QuestionType) {
    setType(next);
    setOptions(
      next === 'SINGLE_CHOICE' || next === 'MULTIPLE_CHOICE' ? [{ label: '' }, { label: '' }] : [],
    );
    setCorrectIndexes(next === 'SINGLE_CHOICE' || next === 'MULTIPLE_CHOICE' ? [0] : []);
  }

  function toggleCorrect(index: number) {
    setCorrectIndexes((current) =>
      type === 'SINGLE_CHOICE'
        ? [index]
        : current.includes(index)
          ? current.filter((item) => item !== index)
          : [...current, index],
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const base = {
      prompt: String(values.get('prompt') ?? '').trim(),
      points: Number(values.get('points')),
      isRequired: values.get('isRequired') === 'on',
      explanation: String(values.get('explanation') ?? '').trim() || null,
      expectedQuestionRevision: questionRevision,
    };
    if (question) {
      const body: Record<string, unknown> = { ...base };
      if (type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE') {
        body.options = options.map((option) => ({ id: option.id, label: option.label.trim() }));
        body.correctOptionIds = correctIndexes.map((index) => options[index]?.id).filter(Boolean);
      } else if (type === 'TRUE_FALSE') {
        body.correctBoolean = values.get('correctBoolean') === 'true';
      } else {
        body.rubric = String(values.get('rubric') ?? '').trim() || null;
      }
      await onSave(body);
      return;
    }
    const body: Record<string, unknown> = { ...base, type };
    if (type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE') {
      body.options = options.map((option) => ({ label: option.label.trim() }));
      body.correctOptionIndexes = correctIndexes;
    } else if (type === 'TRUE_FALSE') {
      body.correctBoolean = values.get('correctBoolean') === 'true';
    } else {
      body.rubric = String(values.get('rubric') ?? '').trim() || null;
    }
    await onSave(body);
  }

  return (
    <form className="question-editor" onSubmit={(event) => void submit(event)}>
      <div className="question-editor__header">
        <h3>{question ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi'}</h3>
        <button
          type="button"
          className="icon-button"
          title="Đóng trình soạn câu hỏi"
          onClick={onCancel}
        >
          <X size={18} />
        </button>
      </div>
      <div className="editor-grid">
        <div className="form-field">
          <label htmlFor="question-type">Loại câu hỏi</label>
          <select
            id="question-type"
            value={type}
            disabled={Boolean(question)}
            onChange={(event) => changeType(event.target.value as QuestionType)}
          >
            {Object.entries(questionTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="question-points">Điểm</label>
          <input
            id="question-points"
            name="points"
            type="number"
            min={1}
            max={100}
            defaultValue={question?.points ?? 1}
            required
          />
        </div>
        <div className="form-field editor-grid__wide">
          <label htmlFor="question-prompt">Nội dung câu hỏi</label>
          <textarea
            id="question-prompt"
            name="prompt"
            maxLength={10_000}
            defaultValue={question?.prompt}
            required
          />
        </div>
      </div>

      {type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE' ? (
        <fieldset className="question-options">
          <legend>Phương án và đáp án đúng</legend>
          {options.map((option, index) => (
            <div className="question-option" key={option.id ?? `new-${index}`}>
              <input
                aria-label={`Đáp án đúng ${index + 1}`}
                type={type === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'}
                name="correct-option"
                checked={correctIndexes.includes(index)}
                onChange={() => toggleCorrect(index)}
              />
              <input
                aria-label={`Nội dung phương án ${index + 1}`}
                value={option.label}
                maxLength={1_000}
                required
                onChange={(event) =>
                  setOptions((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, label: event.target.value } : item,
                    ),
                  )
                }
              />
              {!question && options.length > 2 ? (
                <button
                  type="button"
                  className="icon-button"
                  title="Xóa phương án"
                  onClick={() => {
                    setOptions((current) => current.filter((_, itemIndex) => itemIndex !== index));
                    setCorrectIndexes((current) =>
                      current
                        .filter((item) => item !== index)
                        .map((item) => (item > index ? item - 1 : item)),
                    );
                  }}
                >
                  <Trash2 size={17} />
                </button>
              ) : null}
            </div>
          ))}
          {!question && options.length < 10 ? (
            <button
              type="button"
              className="button-link button-link--secondary"
              onClick={() => setOptions((current) => [...current, { label: '' }])}
            >
              <Plus size={17} /> Thêm phương án
            </button>
          ) : null}
        </fieldset>
      ) : null}

      {type === 'TRUE_FALSE' ? (
        <div className="form-field">
          <label htmlFor="correct-boolean">Đáp án đúng</label>
          <select
            id="correct-boolean"
            name="correctBoolean"
            defaultValue={String(question?.correctBoolean ?? true)}
          >
            <option value="true">Đúng</option>
            <option value="false">Sai</option>
          </select>
        </div>
      ) : null}
      {type === 'SHORT_ANSWER' ? (
        <div className="form-field">
          <label htmlFor="question-rubric">Hướng dẫn chấm</label>
          <textarea
            id="question-rubric"
            name="rubric"
            maxLength={10_000}
            defaultValue={question?.rubric ?? ''}
          />
        </div>
      ) : null}
      <div className="form-field">
        <label htmlFor="question-explanation">Giải thích sau khi chấm</label>
        <textarea
          id="question-explanation"
          name="explanation"
          maxLength={10_000}
          defaultValue={question?.explanation ?? ''}
        />
      </div>
      <label className="toggle-row">
        <input type="checkbox" name="isRequired" defaultChecked={question?.isRequired ?? true} />
        <span>Bắt buộc trả lời</span>
      </label>
      <div className="inline-actions">
        <button
          type="submit"
          disabled={
            busy ||
            (correctIndexes.length === 0 &&
              (type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE'))
          }
        >
          <Save size={17} /> {busy ? 'Đang lưu...' : 'Lưu câu hỏi'}
        </button>
        <button type="button" className="button-link button-link--secondary" onClick={onCancel}>
          Hủy
        </button>
      </div>
    </form>
  );
}
