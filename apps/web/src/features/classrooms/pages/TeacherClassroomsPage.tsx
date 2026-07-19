import { BookOpen, Plus, RefreshCw, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { ApiError } from '../../../shared/api/api-error';
import { useAuth } from '../../../shared/auth/auth-context';
import { ClassroomStatusBadge } from '../components/ClassroomStatusBadge';
import type { ClassroomDetail, ClassroomListEnvelope } from '../classroom.types';

interface CreateClassroomEnvelope {
  success: true;
  data: { classroom: ClassroomDetail; classCode: string | null; auditId: string };
}

export function TeacherClassroomsPage() {
  const { request, user } = useAuth();
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState<ClassroomListEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [oneTimeCode, setOneTimeCode] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void request<ClassroomListEnvelope>('/classrooms?sortBy=updatedAt&sortOrder=desc')
      .then((response) => {
        if (active) {
          setResult(response);
          setError(null);
        }
      })
      .catch((requestError) => {
        if (!active) return;
        setError(
          requestError instanceof ApiError
            ? requestError.message
            : 'Không thể tải danh sách lớp học.',
        );
      });
    return () => {
      active = false;
    };
  }, [reloadKey, request]);

  async function submitCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setSubmitting(true);
    setError(null);
    try {
      const response = await request<CreateClassroomEnvelope>('/classrooms', {
        method: 'POST',
        body: {
          name: String(values.get('name') ?? '').trim(),
          description: String(values.get('description') ?? '').trim() || null,
          subject: String(values.get('subject') ?? '').trim() || null,
          section: String(values.get('section') ?? '').trim() || null,
        },
      });
      setOneTimeCode(response.data.classCode);
      setCreating(false);
      form.reset();
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể tạo lớp học.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page-section">
      <header className="page-header page-header--aligned">
        <div>
          <p className="eyebrow">Teacher workspace</p>
          <h1>Lớp học của {user?.fullName}</h1>
        </div>
        <button className="fit-button" type="button" onClick={() => setCreating(true)}>
          <Plus size={18} /> Tạo lớp học
        </button>
      </header>

      {oneTimeCode ? (
        <section className="one-time-credential" aria-live="polite">
          <div>
            <strong>Class Code mới</strong>
            <p>Mã này chỉ hiển thị trong lần tạo này.</p>
          </div>
          <code>{oneTimeCode}</code>
          <button
            className="icon-button"
            type="button"
            aria-label="Đóng thông báo mã lớp"
            title="Đóng"
            onClick={() => setOneTimeCode(null)}
          >
            <X size={18} />
          </button>
        </section>
      ) : null}

      {creating ? (
        <section className="editor-band" aria-labelledby="create-classroom-title">
          <div className="editor-band__heading">
            <h2 id="create-classroom-title">Tạo lớp học</h2>
            <button
              className="icon-button"
              type="button"
              aria-label="Đóng biểu mẫu"
              title="Đóng"
              onClick={() => setCreating(false)}
            >
              <X size={18} />
            </button>
          </div>
          <form className="classroom-form" onSubmit={(event) => void submitCreate(event)}>
            <div className="form-field">
              <label htmlFor="classroom-name">Tên lớp học</label>
              <input id="classroom-name" name="name" minLength={2} maxLength={120} required />
            </div>
            <div className="form-field">
              <label htmlFor="classroom-subject">Môn học</label>
              <input id="classroom-subject" name="subject" maxLength={120} />
            </div>
            <div className="form-field">
              <label htmlFor="classroom-section">Nhóm</label>
              <input id="classroom-section" name="section" maxLength={120} />
            </div>
            <div className="form-field classroom-form__wide">
              <label htmlFor="classroom-description">Mô tả</label>
              <textarea id="classroom-description" name="description" maxLength={1000} />
            </div>
            <button className="fit-button" type="submit" disabled={submitting}>
              <Plus size={18} /> {submitting ? 'Đang tạo...' : 'Tạo lớp học'}
            </button>
          </form>
        </section>
      ) : null}

      {error ? (
        <div className="notice notice--error" role="alert">
          {error}
        </div>
      ) : null}

      {!result && !error ? (
        <div className="list-state" aria-live="polite">
          <div className="spinner" aria-hidden="true" />
          <p>Đang tải lớp học...</p>
        </div>
      ) : null}

      {result?.data.length === 0 ? (
        <div className="list-state">
          <BookOpen size={30} />
          <strong>Chưa có lớp học</strong>
          <button type="button" onClick={() => setCreating(true)}>
            <Plus size={18} /> Tạo lớp học đầu tiên
          </button>
        </div>
      ) : null}

      {result && result.data.length > 0 ? (
        <div className="classroom-grid">
          {result.data.map((classroom) => (
            <article className="classroom-card" key={classroom.id}>
              <div className="classroom-card__status">
                <ClassroomStatusBadge status={classroom.status} />
                <ClassroomStatusBadge status={classroom.enrollmentStatus} />
              </div>
              <div>
                <p className="eyebrow">{classroom.subject ?? 'Chưa đặt môn học'}</p>
                <h2>{classroom.name}</h2>
                <p>{classroom.section ?? 'Không có nhóm'}</p>
              </div>
              <Link className="row-link" to={`/teacher/classrooms/${classroom.id}`}>
                Mở lớp học
              </Link>
            </article>
          ))}
        </div>
      ) : null}

      {error ? (
        <button className="fit-button" type="button" onClick={() => setReloadKey((key) => key + 1)}>
          <RefreshCw size={17} /> Thử lại
        </button>
      ) : null}
    </section>
  );
}
