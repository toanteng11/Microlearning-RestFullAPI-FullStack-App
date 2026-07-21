import { ArrowLeft, Save } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../../../shared/auth/auth-context';
import { requestErrorMessage } from '../learning-format';
import type { TeacherCourse } from '../learning.types';
import { useUnsavedChanges } from '../use-unsaved-changes';

export function TeacherCourseCreatePage() {
  const { classroomId = '' } = useParams();
  const { request } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const dirtyRef = useRef(false);
  useUnsavedChanges(dirtyRef);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const response = await request<{
        success: true;
        data: { course: TeacherCourse; auditId: string };
      }>('/courses', {
        method: 'POST',
        body: {
          classroomId,
          title: String(values.get('title') ?? '').trim(),
          description: String(values.get('description') ?? '').trim(),
        },
      });
      dirtyRef.current = false;
      navigate(`/teacher/courses/${response.data.course.id}`, { replace: true });
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể tạo khóa học.'));
      setBusy(false);
    }
  }

  return (
    <section className="page-section">
      <Link className="back-link" to={`/teacher/classrooms/${classroomId}`}>
        <ArrowLeft size={17} /> Quay lại lớp học
      </Link>
      <header className="page-header">
        <div>
          <p className="eyebrow">Teacher authoring</p>
          <h1>Tạo khóa học</h1>
        </div>
      </header>
      {error ? <div className="notice notice--error">{error}</div> : null}
      <form
        className="learning-form"
        onChange={() => {
          dirtyRef.current = true;
        }}
        onSubmit={(event) => void submit(event)}
      >
        <div className="form-field">
          <label htmlFor="course-title">Tên khóa học</label>
          <input id="course-title" name="title" minLength={2} maxLength={150} required />
        </div>
        <div className="form-field">
          <label htmlFor="course-description">Mô tả</label>
          <textarea id="course-description" name="description" maxLength={5_000} />
        </div>
        <div className="inline-actions">
          <button type="submit" disabled={busy}>
            <Save size={17} /> {busy ? 'Đang tạo...' : 'Tạo khóa học'}
          </button>
          <Link
            className="button-link button-link--secondary"
            to={`/teacher/classrooms/${classroomId}`}
          >
            Hủy
          </Link>
        </div>
      </form>
    </section>
  );
}
