import { ArrowLeft, ArrowRight, BookOpen, Plus, RefreshCw, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../../shared/auth/auth-context';
import { requestErrorMessage } from '../learning-format';
import type { ContentStatus, ItemEnvelope, TeacherCourse } from '../learning.types';
import { ContentStatusBadge } from './LearningStatusBadge';

export function TeacherClassworkPanel({ classroomId }: { classroomId: string }) {
  const { request } = useAuth();
  const [result, setResult] = useState<ItemEnvelope<TeacherCourse> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ContentStatus | ''>('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({
      classroomId,
      page: String(page),
      limit: '10',
      sortBy: 'displayOrder',
      sortOrder: 'asc',
    });
    if (search) query.set('search', search);
    if (status) query.set('status', status);
    void request<ItemEnvelope<TeacherCourse>>(`/courses?${query.toString()}`)
      .then((response) => {
        if (active) {
          setResult(response);
          setError(null);
        }
      })
      .catch((requestError) => {
        if (active) setError(requestErrorMessage(requestError, 'Không thể tải khóa học.'));
      });
    return () => {
      active = false;
    };
  }, [classroomId, page, reloadKey, request, search, status]);

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setSearch(String(values.get('search') ?? '').trim());
    setStatus(String(values.get('status') ?? '') as ContentStatus | '');
    setPage(1);
  }

  return (
    <section>
      <div className="section-heading">
        <div>
          <h2>Khóa học</h2>
          <span>{result?.meta.totalItems ?? 0} khóa học</span>
        </div>
        <Link className="button-link" to={`/teacher/classrooms/${classroomId}/courses/new`}>
          <Plus size={17} /> Tạo khóa học
        </Link>
      </div>
      <form className="filter-bar learning-filter" onSubmit={applyFilters}>
        <div className="filter-search">
          <Search size={17} aria-hidden="true" />
          <label className="sr-only" htmlFor="teacher-course-search">
            Tìm khóa học
          </label>
          <input
            id="teacher-course-search"
            name="search"
            defaultValue={search}
            placeholder="Tìm theo tên hoặc mô tả"
          />
        </div>
        <label className="sr-only" htmlFor="teacher-course-status">
          Trạng thái khóa học
        </label>
        <select id="teacher-course-status" name="status" defaultValue={status}>
          <option value="">Tất cả trạng thái</option>
          <option value="DRAFT">Bản nháp</option>
          <option value="SCHEDULED">Đã lên lịch</option>
          <option value="PUBLISHED">Đã xuất bản</option>
          <option value="UNPUBLISHED">Đã thu hồi</option>
          <option value="ARCHIVED">Đã lưu trữ</option>
        </select>
        <button className="primary-button primary-button--compact" type="submit">
          Lọc
        </button>
      </form>
      {error ? (
        <div className="list-state list-state--error">
          <p>{error}</p>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
            <RefreshCw size={17} /> Thử lại
          </button>
        </div>
      ) : null}
      {!result && !error ? (
        <div className="list-state">
          <div className="spinner" />
        </div>
      ) : null}
      {result?.data.items.length === 0 ? (
        <div className="list-state">
          <BookOpen size={30} />
          <strong>Chưa có khóa học</strong>
        </div>
      ) : null}
      {result && result.data.items.length > 0 ? (
        <div className="course-row-list">
          {result.data.items.map((course) => (
            <article className="course-row" key={course.id}>
              <div>
                <Link to={`/teacher/courses/${course.id}`}>{course.title}</Link>
                <p>{course.description || 'Chưa có mô tả.'}</p>
              </div>
              <ContentStatusBadge status={course.effectiveStatus} />
              <Link className="row-link" to={`/teacher/courses/${course.id}`}>
                Quản lý
              </Link>
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
            aria-label="Trang khóa học trước"
            onClick={() => setPage((current) => current - 1)}
          >
            <ArrowLeft size={17} />
          </button>
          <span>
            Trang {result.meta.page} / {result.meta.totalPages}
          </span>
          <button
            className="secondary-button"
            type="button"
            disabled={!result.meta.hasNextPage}
            aria-label="Trang khóa học sau"
            onClick={() => setPage((current) => current + 1)}
          >
            <ArrowRight size={17} />
          </button>
        </div>
      ) : null}
    </section>
  );
}
