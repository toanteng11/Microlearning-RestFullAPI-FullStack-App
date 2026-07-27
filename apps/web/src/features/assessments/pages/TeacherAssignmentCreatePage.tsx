import { ArrowLeft, Save } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../../../shared/auth/auth-context';
import { requestErrorMessage } from '../../learning/learning-format';

const DEFAULT_DUE = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 16);

export function TeacherAssignmentCreatePage() {
  const { courseId = '' } = useParams();
  const { request } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const response = await request<{ success: true; data: { assignment: { id: string } } }>(
        `/teacher/courses/${courseId}/assignments`,
        {
          method: 'POST',
          body: {
            moduleId: null,
            title: String(data.get('title') ?? ''),
            instruction: String(data.get('instruction') ?? ''),
            maxScore: Number(data.get('maxScore')),
            isRequired: data.get('isRequired') === 'on',
            allowedSubmissionTypes: ['TEXT'],
            allowLateSubmission: data.get('allowLateSubmission') === 'on',
            allowUnsubmit: data.get('allowUnsubmit') === 'on',
            allowResubmit: data.get('allowResubmit') === 'on',
            availableFrom: data.get('availableFrom')
              ? new Date(String(data.get('availableFrom'))).toISOString()
              : null,
            dueDate: new Date(String(data.get('dueDate'))).toISOString(),
          },
        },
      );
      navigate(`/teacher/assignments/${response.data.assignment.id}/edit`);
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể tạo bài tập.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page-section assessment-workspace">
      <Link className="back-link" to={`/teacher/courses/${courseId}/assessments?type=assignment`}>
        <ArrowLeft size={17} /> Danh sách bài tập
      </Link>
      <header className="page-header">
        <p className="eyebrow">Teacher assignment</p>
        <h1>Tạo bài tập</h1>
      </header>
      {error ? <div className="notice notice--error">{error}</div> : null}
      <form className="assessment-editor-form" onSubmit={(event) => void submit(event)}>
        <label className="form-field">
          <span>Tiêu đề</span>
          <input maxLength={150} minLength={2} name="title" required />
        </label>
        <label className="form-field">
          <span>Hướng dẫn</span>
          <textarea maxLength={100_000} minLength={1} name="instruction" required rows={8} />
        </label>
        <div className="form-grid">
          <label className="form-field">
            <span>Điểm tối đa</span>
            <input defaultValue={10} max={1000} min={1} name="maxScore" required type="number" />
          </label>
          <label className="form-field">
            <span>Thời hạn</span>
            <input defaultValue={DEFAULT_DUE} name="dueDate" required type="datetime-local" />
          </label>
          <label className="form-field">
            <span>Mở từ</span>
            <input name="availableFrom" type="datetime-local" />
          </label>
        </div>
        <fieldset className="policy-fieldset">
          <legend>Chính sách nộp bài</legend>
          <label>
            <input defaultChecked name="isRequired" type="checkbox" /> Bài tập bắt buộc
          </label>
          <label>
            <input name="allowLateSubmission" type="checkbox" /> Cho phép nộp muộn
          </label>
          <label>
            <input name="allowUnsubmit" type="checkbox" /> Cho phép hủy nộp trước hạn
          </label>
          <label>
            <input name="allowResubmit" type="checkbox" /> Cho phép nộp lại
          </label>
        </fieldset>
        <button disabled={busy} type="submit">
          <Save size={17} /> {busy ? 'Đang tạo...' : 'Tạo bản nháp'}
        </button>
      </form>
    </section>
  );
}
