import { BookOpen, CalendarClock, KeyRound, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { ApiError } from '../../../shared/api/api-error';
import { useAuth } from '../../../shared/auth/auth-context';
import { ProgressStatusBadge } from '../../learning/components/LearningStatusBadge';
import { displayLearningDate } from '../../learning/learning-format';
import type { TodoEnvelope } from '../../learning/learning.types';
import { ClassroomStatusBadge } from '../components/ClassroomStatusBadge';
import type { ClassroomListEnvelope } from '../classroom.types';

export function StudentClassroomsPage() {
  const { request, user } = useAuth();
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState<ClassroomListEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joinMessage, setJoinMessage] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [todo, setTodo] = useState<TodoEnvelope | null>(null);

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
        if (active) {
          setError(
            requestError instanceof ApiError
              ? requestError.message
              : 'Không thể tải danh sách lớp học.',
          );
        }
      });
    return () => {
      active = false;
    };
  }, [reloadKey, request]);

  useEffect(() => {
    let active = true;
    void request<TodoEnvelope>('/students/me/todo?page=1&limit=5&scope=ALL')
      .then((response) => {
        if (active && Array.isArray(response.data?.items)) setTodo(response);
      })
      .catch(() => {
        if (active) setTodo(null);
      });
    return () => {
      active = false;
    };
  }, [reloadKey, request]);

  async function joinByCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const code = String(new FormData(form).get('code') ?? '').trim();
    setJoining(true);
    setJoinMessage(null);
    setError(null);
    try {
      const response = await request<{
        success: true;
        data: { classroom: { name: string }; alreadyEnrolled: boolean };
      }>('/classrooms/join-by-code', { method: 'POST', body: { code } });
      setJoinMessage(
        response.data.alreadyEnrolled
          ? `Bạn đã tham gia ${response.data.classroom.name}.`
          : `Đã tham gia ${response.data.classroom.name}.`,
      );
      form.reset();
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Không thể tham gia bằng Class Code.',
      );
    } finally {
      setJoining(false);
    }
  }

  return (
    <section className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Student workspace</p>
          <h1>Xin chào, {user?.fullName}</h1>
        </div>
      </header>

      <div className="student-dashboard-grid">
        <section className="task-band">
          <div className="panel-title">
            <BookOpen size={20} />
            <h2>Việc cần làm</h2>
          </div>
          {todo?.data.items.length === 0 ? (
            <div className="empty-state">
              <strong>Chưa có bài học cần hoàn thành</strong>
            </div>
          ) : null}
          {todo && todo.data.items.length > 0 ? (
            <div className="dashboard-todo-list">
              {todo.data.items.map((item) => (
                <article key={item.id}>
                  <div>
                    <Link to={item.actionUrl}>{item.title}</Link>
                    <small>
                      {item.course.title} · {displayLearningDate(item.completionDeadline)}
                    </small>
                  </div>
                  <ProgressStatusBadge status={item.progress.derivedStatus} />
                </article>
              ))}
              <Link className="row-link" to="/student/todo">
                Xem tất cả
              </Link>
            </div>
          ) : null}
          {!todo ? (
            <div className="empty-state">
              <CalendarClock size={24} />
              <span>Đang tải việc cần làm...</span>
            </div>
          ) : null}
        </section>
        <section className="join-band">
          <div className="panel-title">
            <KeyRound size={20} />
            <h2>Tham gia lớp học</h2>
          </div>
          <form className="join-code-form" onSubmit={(event) => void joinByCode(event)}>
            <label className="sr-only" htmlFor="join-code">
              Class Code
            </label>
            <input id="join-code" name="code" placeholder="ABCD-EFGH" required />
            <button type="submit" disabled={joining}>
              {joining ? 'Đang tham gia...' : 'Tham gia'}
            </button>
          </form>
        </section>
      </div>

      {joinMessage ? <div className="notice notice--success">{joinMessage}</div> : null}
      {error ? (
        <div className="notice notice--error" role="alert">
          {error}
        </div>
      ) : null}

      <div className="section-heading">
        <h2>Lớp học của tôi</h2>
        <span>{result?.pagination.totalItems ?? 0} lớp học</span>
      </div>
      {!result && !error ? (
        <div className="list-state">
          <div className="spinner" />
          <p>Đang tải lớp học...</p>
        </div>
      ) : null}
      {result?.data.length === 0 ? (
        <div className="list-state">
          <BookOpen size={30} />
          <strong>Bạn chưa tham gia lớp học nào</strong>
        </div>
      ) : null}
      {result && result.data.length > 0 ? (
        <div className="classroom-grid">
          {result.data.map((classroom) => (
            <article className="classroom-card" key={classroom.id}>
              <div className="classroom-card__status">
                <ClassroomStatusBadge status={classroom.status} />
              </div>
              <div>
                <p className="eyebrow">{classroom.subject ?? 'Lớp học'}</p>
                <h2>{classroom.name}</h2>
                <p>{classroom.owner.fullName}</p>
              </div>
              <Link className="row-link" to={`/student/classrooms/${classroom.id}`}>
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
