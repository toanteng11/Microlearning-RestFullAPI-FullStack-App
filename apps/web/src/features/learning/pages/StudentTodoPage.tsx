import { ArrowLeft, ArrowRight, CheckCircle2, ListTodo } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useAuth } from '../../../shared/auth/auth-context';
import type { ClassroomListEnvelope } from '../../classrooms/classroom.types';
import { displayLearningDate, requestErrorMessage } from '../learning-format';
import type { TodoEnvelope } from '../learning.types';
import { ProgressStatusBadge } from '../components/LearningStatusBadge';

type TodoScope = 'ALL' | 'OVERDUE' | 'UPCOMING';

const TODO_SCOPES: TodoScope[] = ['ALL', 'OVERDUE', 'UPCOMING'];
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/iu;

export function StudentTodoPage() {
  const { request } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState<TodoEnvelope | null>(null);
  const [classrooms, setClassrooms] = useState<ClassroomListEnvelope['data']>([]);
  const [error, setError] = useState<string | null>(null);
  const rawScope = searchParams.get('scope');
  const scope = TODO_SCOPES.includes(rawScope as TodoScope) ? (rawScope as TodoScope) : 'ALL';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const rawClassroomId = searchParams.get('classroomId') ?? '';
  const classroomId = OBJECT_ID_PATTERN.test(rawClassroomId) ? rawClassroomId : '';

  useEffect(() => {
    let active = true;
    void request<ClassroomListEnvelope>('/classrooms?page=1&limit=100&sortBy=name&sortOrder=asc')
      .then((response) => {
        if (active)
          setClassrooms(response.data.filter((item) => item.membership?.status === 'ACTIVE'));
      })
      .catch(() => {
        if (active) setClassrooms([]);
      });
    return () => {
      active = false;
    };
  }, [request]);

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({ scope, page: String(page), limit: '20' });
    if (classroomId) query.set('classroomId', classroomId);
    void request<TodoEnvelope>(`/students/me/todo?${query.toString()}`)
      .then((response) => {
        if (active) {
          setResult(response);
          setError(null);
        }
      })
      .catch((requestError) => {
        if (active) setError(requestErrorMessage(requestError, 'Không thể tải việc cần làm.'));
      });
    return () => {
      active = false;
    };
  }, [classroomId, page, request, scope]);

  function selectScope(nextScope: TodoScope) {
    const next = new URLSearchParams({ scope: nextScope, page: '1' });
    if (classroomId) next.set('classroomId', classroomId);
    setSearchParams(next);
  }

  function selectClassroom(nextClassroomId: string) {
    const next = new URLSearchParams({ scope, page: '1' });
    if (nextClassroomId) next.set('classroomId', nextClassroomId);
    setSearchParams(next);
  }

  return (
    <section className="page-section">
      <header className="page-header page-header--aligned">
        <div>
          <p className="eyebrow">Student workspace</p>
          <h1>Việc cần làm</h1>
          <p>Danh sách này chỉ gồm bài học bắt buộc chưa hoàn thành.</p>
        </div>
        <Link className="button-link" to="/student/deadlines">
          Xem tất cả deadline
        </Link>
      </header>
      <nav className="segmented-tabs" aria-label="Lọc việc cần làm">
        {(
          [
            ['ALL', 'Tất cả'],
            ['OVERDUE', 'Quá hạn'],
            ['UPCOMING', 'Sắp tới'],
          ] as const
        ).map(([value, label]) => (
          <button
            className={scope === value ? 'active' : ''}
            type="button"
            key={value}
            onClick={() => selectScope(value)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="learning-list-filter">
        <label htmlFor="todo-classroom-filter">Lớp học</label>
        <select
          id="todo-classroom-filter"
          value={classroomId}
          onChange={(event) => selectClassroom(event.target.value)}
        >
          <option value="">Tất cả lớp học</option>
          {classrooms.map((classroom) => (
            <option key={classroom.id} value={classroom.id}>
              {classroom.name}
            </option>
          ))}
        </select>
      </div>
      {error ? <div className="list-state list-state--error">{error}</div> : null}
      {!result && !error ? (
        <div className="list-state">
          <div className="spinner" />
        </div>
      ) : null}
      {result?.data.items.length === 0 ? (
        <div className="list-state">
          <CheckCircle2 size={32} />
          <strong>Không có bài học phù hợp bộ lọc</strong>
        </div>
      ) : null}
      {result && result.data.items.length > 0 ? (
        <div className="todo-list">
          {result.data.items.map((item) => (
            <article className="todo-row" key={item.id}>
              <ListTodo size={20} />
              <div>
                <Link to={item.actionUrl}>{item.title}</Link>
                <small>
                  {item.classroom.name} · {item.course.title}
                </small>
              </div>
              <time dateTime={item.completionDeadline}>
                {displayLearningDate(item.completionDeadline)}
              </time>
              <ProgressStatusBadge status={item.progress.derivedStatus} />
            </article>
          ))}
        </div>
      ) : null}
      {result && result.meta.totalPages > 1 ? (
        <div className="pagination">
          <button
            className="secondary-button"
            type="button"
            disabled={!result.meta.hasPreviousPage}
            aria-label="Trang trước"
            onClick={() => {
              const next = new URLSearchParams({ scope, page: String(page - 1) });
              if (classroomId) next.set('classroomId', classroomId);
              setSearchParams(next);
            }}
          >
            <ArrowLeft size={17} />
          </button>
          <span>
            Trang {page} / {result.meta.totalPages}
          </span>
          <button
            className="secondary-button"
            type="button"
            disabled={!result.meta.hasNextPage}
            aria-label="Trang sau"
            onClick={() => {
              const next = new URLSearchParams({ scope, page: String(page + 1) });
              if (classroomId) next.set('classroomId', classroomId);
              setSearchParams(next);
            }}
          >
            <ArrowRight size={17} />
          </button>
        </div>
      ) : null}
    </section>
  );
}
