import { Archive, ArrowLeft, BookOpen, CalendarClock, Pencil, Save, Send, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../../../shared/auth/auth-context';
import { TeacherReportingDashboardPage } from '../../reporting/pages/TeacherReportingDashboardPage';
import { requestErrorMessage } from '../learning-format';
import type { ContentStatus, TeacherCourse } from '../learning.types';
import { ContentStatusBadge } from '../components/LearningStatusBadge';

export function TeacherCourseDashboardPage() {
  const { courseId = '' } = useParams();
  const { request } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<TeacherCourse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    void request<{ success: true; data: { course: TeacherCourse } }>(`/courses/${courseId}`)
      .then((courseResponse) => {
        if (active) {
          setCourse(courseResponse.data.course);
          setError(null);
        }
      })
      .catch((requestError) => {
        if (active) setError(requestErrorMessage(requestError, 'Không thể tải Course Dashboard.'));
      });
    return () => {
      active = false;
    };
  }, [courseId, reloadKey, request]);

  async function updateCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!course) return;
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await request(`/courses/${course.id}`, {
        method: 'PATCH',
        body: {
          title: String(values.get('title') ?? '').trim(),
          description: String(values.get('description') ?? '').trim(),
          expectedUpdatedAt: course.updatedAt,
        },
      });
      setNotice('Đã cập nhật khóa học.');
      setEditing(false);
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể cập nhật khóa học.'));
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(
    targetStatus: Exclude<ContentStatus, 'ARCHIVED'>,
    scheduledAt?: string,
  ) {
    if (!course) return;
    setBusy(true);
    setError(null);
    try {
      await request(`/courses/${course.id}/status`, {
        method: 'PATCH',
        body: {
          targetStatus,
          ...(targetStatus === 'SCHEDULED'
            ? { scheduledPublishAt: new Date(scheduledAt ?? '').toISOString() }
            : {}),
          expectedUpdatedAt: course.updatedAt,
        },
      });
      setNotice(
        targetStatus === 'PUBLISHED'
          ? 'Đã xuất bản khóa học.'
          : targetStatus === 'SCHEDULED'
            ? 'Đã lên lịch xuất bản khóa học.'
            : 'Đã thu hồi khóa học.',
      );
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể đổi trạng thái khóa học.'));
    } finally {
      setBusy(false);
    }
  }

  async function scheduleCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const scheduledAt = String(new FormData(event.currentTarget).get('scheduledAt') ?? '');
    if (scheduledAt) await changeStatus('SCHEDULED', scheduledAt);
  }

  async function archiveCourse() {
    if (!course) return;
    const reason = window.prompt('Nhập lý do lưu trữ khóa học:')?.trim();
    if (!reason) return;
    setBusy(true);
    setError(null);
    try {
      await request(`/courses/${course.id}`, {
        method: 'DELETE',
        body: { reason, expectedUpdatedAt: course.updatedAt },
      });
      navigate(`/teacher/classrooms/${course.classroomId}`, { replace: true });
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể lưu trữ khóa học.'));
      setBusy(false);
    }
  }

  if (error && !course) return <div className="list-state list-state--error">{error}</div>;
  if (!course)
    return (
      <div className="list-state">
        <div className="spinner" />
      </div>
    );
  return (
    <section className="page-section">
      <Link className="back-link" to={`/teacher/classrooms/${course.classroomId}`}>
        <ArrowLeft size={17} /> Quay lại lớp học
      </Link>
      <header className="page-header page-header--aligned">
        <div>
          <p className="eyebrow">Course Dashboard</p>
          <h1>{course.title}</h1>
          <p>Tiến độ dựa trên mọi bài học, bài kiểm tra và bài tập bắt buộc.</p>
        </div>
        <div className="course-header-actions">
          <ContentStatusBadge status={course.effectiveStatus} />
          <Link className="button-link" to={`/teacher/courses/${courseId}/content`}>
            <BookOpen size={17} /> Quản lý nội dung
          </Link>
        </div>
      </header>
      {notice ? (
        <div className="notice notice--success" role="status">
          {notice}
        </div>
      ) : null}
      {error ? (
        <div className="notice notice--error" role="alert">
          {error}
        </div>
      ) : null}
      <section className="course-command-bar" aria-label="Quản lý khóa học">
        <div className="inline-actions">
          {course.allowedActions.includes('UPDATE') ? (
            <button className="secondary-button" type="button" onClick={() => setEditing(true)}>
              <Pencil size={17} /> Sửa thông tin
            </button>
          ) : null}
          {['DRAFT', 'UNPUBLISHED'].includes(course.status) ? (
            <button type="button" disabled={busy} onClick={() => void changeStatus('PUBLISHED')}>
              <Send size={17} /> Xuất bản
            </button>
          ) : null}
          {['PUBLISHED', 'SCHEDULED'].includes(course.status) ? (
            <button
              className="secondary-button"
              type="button"
              disabled={busy}
              onClick={() => void changeStatus('UNPUBLISHED')}
            >
              Thu hồi
            </button>
          ) : null}
          {course.allowedActions.includes('ARCHIVE') ? (
            <button
              className="secondary-button danger-command"
              type="button"
              disabled={busy}
              onClick={() => void archiveCourse()}
            >
              <Archive size={17} /> Lưu trữ
            </button>
          ) : null}
        </div>
        {['DRAFT', 'UNPUBLISHED'].includes(course.status) ? (
          <form className="schedule-course-form" onSubmit={(event) => void scheduleCourse(event)}>
            <label htmlFor="course-scheduled-at">Lịch xuất bản</label>
            <input id="course-scheduled-at" name="scheduledAt" type="datetime-local" required />
            <button className="secondary-button" type="submit" disabled={busy}>
              <CalendarClock size={17} /> Lên lịch
            </button>
          </form>
        ) : null}
      </section>
      {editing ? (
        <form
          className="learning-form course-edit-form"
          onSubmit={(event) => void updateCourse(event)}
        >
          <div className="form-field">
            <label htmlFor="edit-course-title">Tên khóa học</label>
            <input
              id="edit-course-title"
              name="title"
              defaultValue={course.title}
              minLength={2}
              maxLength={150}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="edit-course-description">Mô tả</label>
            <textarea
              id="edit-course-description"
              name="description"
              defaultValue={course.description}
              maxLength={5_000}
            />
          </div>
          <div className="inline-actions">
            <button type="submit" disabled={busy}>
              <Save size={17} /> Lưu khóa học
            </button>
            <button className="secondary-button" type="button" onClick={() => setEditing(false)}>
              <X size={17} /> Hủy
            </button>
          </div>
        </form>
      ) : null}
      <TeacherReportingDashboardPage courseId={courseId} />
    </section>
  );
}
