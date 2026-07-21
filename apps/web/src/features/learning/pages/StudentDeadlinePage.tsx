import { ArrowLeft, ArrowRight, CalendarClock, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useAuth } from '../../../shared/auth/auth-context';
import type { ClassroomListEnvelope } from '../../classrooms/classroom.types';
import { ProgressStatusBadge } from '../components/LearningStatusBadge';
import { displayLearningDate, requestErrorMessage } from '../learning-format';
import type { TodoEnvelope, TodoItem } from '../learning.types';

const DEADLINE_PAGE_SIZE = 20;
const MAX_RANGE_DAYS = 366;
const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/iu;

function validDateInput(value: string) {
  if (!DATE_INPUT_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year!, month! - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month! - 1 &&
    parsed.getUTCDate() === day
  );
}

function startOfDay(date: string) {
  return new Date(`${date}T00:00:00.000Z`).toISOString();
}

function endOfDay(date: string) {
  return new Date(`${date}T23:59:59.999Z`).toISOString();
}

function deadlineDayKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function deadlineDayLabel(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function groupDeadlines(items: TodoItem[]) {
  const groups = new Map<string, { label: string; items: TodoItem[] }>();
  for (const item of items) {
    const key = deadlineDayKey(item.completionDeadline);
    const group = groups.get(key);
    if (group) group.items.push(item);
    else {
      groups.set(key, {
        label: deadlineDayLabel(item.completionDeadline),
        items: [item],
      });
    }
  }
  return [...groups.entries()].map(([key, group]) => ({ key, ...group }));
}

export function StudentDeadlinePage() {
  const { request } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState<TodoEnvelope | null>(null);
  const [classrooms, setClassrooms] = useState<ClassroomListEnvelope['data']>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);
  const rawClassroomId = searchParams.get('classroomId') ?? '';
  const rawFrom = searchParams.get('from') ?? '';
  const rawTo = searchParams.get('to') ?? '';
  const classroomId = OBJECT_ID_PATTERN.test(rawClassroomId) ? rawClassroomId : '';
  const from = validDateInput(rawFrom) ? rawFrom : '';
  const to = validDateInput(rawTo) ? rawTo : '';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const deadlineGroups = groupDeadlines(result?.data.items ?? []);

  useEffect(() => {
    let active = true;
    void request<ClassroomListEnvelope>('/classrooms?page=1&limit=100&sortBy=name&sortOrder=asc')
      .then((response) => {
        if (active) {
          setClassrooms(response.data.filter((item) => item.membership?.status === 'ACTIVE'));
        }
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
    const query = new URLSearchParams({
      page: String(page),
      limit: String(DEADLINE_PAGE_SIZE),
    });
    if (classroomId) query.set('classroomId', classroomId);
    if (from) query.set('from', startOfDay(from));
    if (to) query.set('to', endOfDay(to));

    void request<TodoEnvelope>(`/students/me/deadlines?${query.toString()}`)
      .then((response) => {
        if (active) {
          setResult(response);
          setError(null);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestErrorMessage(requestError, 'Không thể tải deadline.'));
        }
      });
    return () => {
      active = false;
    };
  }, [classroomId, from, page, request, to]);

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const nextClassroomId = String(values.get('classroomId') ?? '');
    const nextFrom = String(values.get('from') ?? '');
    const nextTo = String(values.get('to') ?? '');

    if (nextFrom && nextTo) {
      const rangeDays =
        (new Date(`${nextTo}T00:00:00.000Z`).getTime() -
          new Date(`${nextFrom}T00:00:00.000Z`).getTime()) /
        86_400_000;
      if (rangeDays < 0) {
        setFilterError('Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.');
        return;
      }
      if (rangeDays >= MAX_RANGE_DAYS) {
        setFilterError('Khoảng thời gian không được vượt quá 366 ngày.');
        return;
      }
    }

    setFilterError(null);
    const next = new URLSearchParams({ page: '1' });
    if (nextClassroomId) next.set('classroomId', nextClassroomId);
    if (nextFrom) next.set('from', nextFrom);
    if (nextTo) next.set('to', nextTo);
    setSearchParams(next);
  }

  function changePage(nextPage: number) {
    const next = new URLSearchParams({ page: String(nextPage) });
    if (classroomId) next.set('classroomId', classroomId);
    if (from) next.set('from', from);
    if (to) next.set('to', to);
    setSearchParams(next);
  }

  return (
    <section className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Student workspace</p>
          <h1>Deadline bài học</h1>
          <p>Theo dõi các bài học có hạn hoàn thành trong từng lớp học.</p>
        </div>
      </header>
      <form
        className="learning-list-filter learning-list-filter--deadline"
        key={`${classroomId}-${from}-${to}`}
        onSubmit={applyFilters}
      >
        <label htmlFor="deadline-classroom-filter">
          Lớp học
          <select id="deadline-classroom-filter" name="classroomId" defaultValue={classroomId}>
            <option value="">Tất cả lớp học</option>
            {classrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.name}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="deadline-from-filter">
          Từ ngày
          <input id="deadline-from-filter" name="from" type="date" defaultValue={from} />
        </label>
        <label htmlFor="deadline-to-filter">
          Đến ngày
          <input id="deadline-to-filter" name="to" type="date" defaultValue={to} />
        </label>
        <button className="primary-button primary-button--compact" type="submit">
          Lọc
        </button>
        <button
          className="secondary-button"
          type="button"
          aria-label="Xóa bộ lọc deadline"
          onClick={() => {
            setFilterError(null);
            setSearchParams({ page: '1' });
          }}
        >
          <RotateCcw size={17} /> Xóa lọc
        </button>
      </form>
      {filterError ? (
        <p className="field-error learning-filter-error" role="alert">
          {filterError}
        </p>
      ) : null}
      {error ? <div className="list-state list-state--error">{error}</div> : null}
      {!result && !error ? (
        <div className="list-state">
          <div className="spinner" />
        </div>
      ) : null}
      {result?.data.items.length === 0 ? (
        <div className="list-state">
          <CalendarClock size={32} />
          <strong>Không có deadline phù hợp bộ lọc</strong>
        </div>
      ) : null}
      {result && result.data.items.length > 0 ? (
        <div className="deadline-groups">
          {deadlineGroups.map((group) => (
            <section
              className="deadline-group"
              key={group.key}
              aria-labelledby={`day-${group.key}`}
            >
              <h2 id={`day-${group.key}`}>{group.label}</h2>
              <div className="todo-list">
                {group.items.map((item) => (
                  <article className="todo-row" key={item.id}>
                    <CalendarClock size={20} />
                    <div>
                      <Link to={item.actionUrl}>{item.title}</Link>
                      <small>
                        {item.classroom.name} &middot; {item.course.title}
                      </small>
                    </div>
                    <time dateTime={item.completionDeadline}>
                      {displayLearningDate(item.completionDeadline)}
                    </time>
                    <ProgressStatusBadge status={item.progress.derivedStatus} />
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
      {result && result.meta.totalPages > 1 ? (
        <div className="pagination">
          <button
            className="secondary-button"
            type="button"
            disabled={!result.meta.hasPreviousPage}
            aria-label="Trang deadline trước"
            onClick={() => changePage(page - 1)}
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
            aria-label="Trang deadline sau"
            onClick={() => changePage(page + 1)}
          >
            <ArrowRight size={17} />
          </button>
        </div>
      ) : null}
    </section>
  );
}
