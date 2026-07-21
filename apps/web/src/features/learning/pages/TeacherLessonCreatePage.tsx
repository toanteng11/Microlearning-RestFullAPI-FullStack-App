import { ArrowLeft, Save } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../../../shared/auth/auth-context';
import { requestErrorMessage } from '../learning-format';
import { useUnsavedChanges } from '../use-unsaved-changes';

interface ModuleOption {
  id: string;
  title: string;
  status: string;
}

export function TeacherLessonCreatePage() {
  const { courseId = '' } = useParams();
  const { request } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules] = useState<ModuleOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const dirtyRef = useRef(false);
  useUnsavedChanges(dirtyRef);

  useEffect(() => {
    let active = true;
    void request<{ success: true; data: { items: ModuleOption[] } }>(`/courses/${courseId}/modules`)
      .then((response) => {
        if (active)
          setModules(response.data.items.filter((module) => module.status !== 'ARCHIVED'));
      })
      .catch((requestError) => {
        if (active) setError(requestErrorMessage(requestError, 'Không thể tải Module.'));
      });
    return () => {
      active = false;
    };
  }, [courseId, request]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const deadline = String(values.get('completionDeadline') ?? '');
    const moduleId = String(values.get('moduleId') ?? '');
    setBusy(true);
    setError(null);
    try {
      const response = await request<{ success: true; data: { lesson: { id: string } } }>(
        '/lessons',
        {
          method: 'POST',
          body: {
            courseId,
            moduleId: moduleId || null,
            title: String(values.get('title') ?? '').trim(),
            content: String(values.get('content') ?? '').trim(),
            contentFormat: 'MARKDOWN',
            estimatedMinutes: Number(values.get('estimatedMinutes')),
            isRequired: values.get('isRequired') === 'on',
            completionDeadline: deadline ? new Date(deadline).toISOString() : null,
          },
        },
      );
      dirtyRef.current = false;
      navigate(`/teacher/lessons/${response.data.lesson.id}/edit`, { replace: true });
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể tạo bài học.'));
      setBusy(false);
    }
  }

  return (
    <section className="page-section">
      <Link className="back-link" to={`/teacher/courses/${courseId}/content`}>
        <ArrowLeft size={17} /> Cấu trúc khóa học
      </Link>
      <header className="page-header">
        <div>
          <p className="eyebrow">Teacher authoring</p>
          <h1>Tạo bài học</h1>
        </div>
      </header>
      {error ? <div className="notice notice--error">{error}</div> : null}
      <form
        className="lesson-editor-form"
        onChange={() => {
          dirtyRef.current = true;
        }}
        onSubmit={(event) => void submit(event)}
      >
        <section className="editor-section">
          <h2>Thông tin bài học</h2>
          <div className="editor-grid">
            <div className="form-field editor-grid__wide">
              <label htmlFor="lesson-title">Tên bài học</label>
              <input id="lesson-title" name="title" minLength={2} maxLength={150} required />
            </div>
            <div className="form-field">
              <label htmlFor="lesson-module">Module</label>
              <select id="lesson-module" name="moduleId">
                <option value="">Bài học chung</option>
                {modules.map((module) => (
                  <option value={module.id} key={module.id}>
                    {module.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="estimated-minutes">Thời lượng dự kiến</label>
              <input
                id="estimated-minutes"
                name="estimatedMinutes"
                type="number"
                min={1}
                max={60}
                defaultValue={10}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="completion-deadline">Deadline theo múi giờ thiết bị</label>
              <input id="completion-deadline" name="completionDeadline" type="datetime-local" />
            </div>
            <label className="toggle-row">
              <input type="checkbox" name="isRequired" defaultChecked />
              <span>Bài học bắt buộc</span>
            </label>
          </div>
        </section>
        <section className="editor-section">
          <h2>Nội dung Markdown</h2>
          <div className="form-field">
            <label className="sr-only" htmlFor="lesson-content">
              Nội dung
            </label>
            <textarea
              id="lesson-content"
              className="markdown-editor"
              name="content"
              minLength={1}
              maxLength={500_000}
              required
            />
          </div>
        </section>
        <div className="inline-actions">
          <button type="submit" disabled={busy}>
            <Save size={17} /> {busy ? 'Đang tạo...' : 'Tạo bài học'}
          </button>
          <Link
            className="button-link button-link--secondary"
            to={`/teacher/courses/${courseId}/content`}
          >
            Hủy
          </Link>
        </div>
      </form>
    </section>
  );
}
