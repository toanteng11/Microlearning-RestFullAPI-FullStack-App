import { BookOpen, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useAuth } from '../../../shared/auth/auth-context';
import { requestErrorMessage } from '../learning-format';
import type { CourseGovernanceSummary, ItemEnvelope } from '../learning.types';
import { ContentStatusBadge } from '../components/LearningStatusBadge';

export function AdminCoursesPage() {
  const { request } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState<ItemEnvelope<CourseGovernanceSummary> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const query = searchParams.toString();

  useEffect(() => {
    let active = true;
    void request<ItemEnvelope<CourseGovernanceSummary>>(`/admin/courses${query ? `?${query}` : ''}`)
      .then((response) => {
        if (active) setResult(response);
      })
      .catch((requestError) => {
        if (active) setError(requestErrorMessage(requestError, 'Không thể tải Course governance.'));
      });
    return () => {
      active = false;
    };
  }, [query, request]);

  function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    const keyword = String(values.get('search') ?? '').trim();
    const status = String(values.get('status') ?? '');
    if (keyword) next.set('search', keyword);
    if (status) next.set('status', status);
    setSearchParams(next);
  }

  return (
    <section className="page-section">
      <header className="page-header page-header--aligned">
        <div>
          <p className="eyebrow">Content governance</p>
          <h1>Course List</h1>
        </div>
        <span className="result-summary">{result?.meta.totalItems ?? 0} khóa học</span>
      </header>
      <form className="filter-bar governance-filter" onSubmit={search}>
        <div className="filter-search">
          <Search size={18} />
          <input
            name="search"
            defaultValue={searchParams.get('search') ?? ''}
            placeholder="Tìm tên khóa học"
          />
        </div>
        <select
          name="status"
          defaultValue={searchParams.get('status') ?? ''}
          aria-label="Trạng thái"
        >
          <option value="">Mọi trạng thái</option>
          <option value="DRAFT">Bản nháp</option>
          <option value="SCHEDULED">Đã lên lịch</option>
          <option value="PUBLISHED">Đã xuất bản</option>
          <option value="UNPUBLISHED">Đã thu hồi</option>
          <option value="ARCHIVED">Đã lưu trữ</option>
        </select>
        <button type="submit">
          <Search size={17} /> Tìm
        </button>
      </form>
      {error ? <div className="list-state list-state--error">{error}</div> : null}
      {!result && !error ? (
        <div className="list-state">
          <div className="spinner" />
        </div>
      ) : null}
      {result?.data.items.length === 0 ? (
        <div className="list-state">
          <BookOpen size={30} />
          <strong>Chưa có Course</strong>
        </div>
      ) : null}
      {result && result.data.items.length > 0 ? (
        <div className="data-table-wrap data-table-wrap--responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Classroom</th>
                <th>Teacher</th>
                <th>Nội dung</th>
                <th>Trạng thái</th>
                <th aria-label="Thao tác" />
              </tr>
            </thead>
            <tbody>
              {result.data.items.map((course) => (
                <tr key={course.id}>
                  <td data-label="Course">
                    <strong>{course.title}</strong>
                  </td>
                  <td data-label="Classroom">{course.classroom.name}</td>
                  <td data-label="Teacher">{course.owner.fullName}</td>
                  <td data-label="Nội dung">
                    {course.moduleCount} Module · {course.lessonCount} bài
                  </td>
                  <td data-label="Trạng thái">
                    <ContentStatusBadge status={course.effectiveStatus} />
                  </td>
                  <td data-label="Thao tác">
                    <Link className="row-link" to={`/admin/courses/${course.id}`}>
                      Xem
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
