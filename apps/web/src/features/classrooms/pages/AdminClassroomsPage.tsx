import { Search, School } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { ApiError } from '../../../shared/api/api-error';
import { useAuth } from '../../../shared/auth/auth-context';
import { ClassroomStatusBadge } from '../components/ClassroomStatusBadge';
import type { ClassroomListEnvelope } from '../classroom.types';

export function AdminClassroomsPage() {
  const { request } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState<ClassroomListEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);
  const query = searchParams.toString();

  useEffect(() => {
    let active = true;
    void request<ClassroomListEnvelope>(`/admin/classrooms${query ? `?${query}` : ''}`)
      .then((response) => {
        if (active) {
          setResult(response);
          setError(null);
        }
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError instanceof ApiError ? requestError.message : 'Không thể tải Classroom.',
          );
      });
    return () => {
      active = false;
    };
  }, [query, request]);

  function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const keyword = String(new FormData(event.currentTarget).get('keyword') ?? '').trim();
    setSearchParams(keyword ? { keyword } : {});
  }

  return (
    <section className="page-section">
      <header className="page-header page-header--aligned">
        <div>
          <p className="eyebrow">Classroom governance</p>
          <h1>Classroom List</h1>
        </div>
        <span className="result-summary">{result?.pagination.totalItems ?? 0} lớp học</span>
      </header>
      <form className="filter-bar governance-filter" onSubmit={search}>
        <div className="filter-search">
          <Search size={18} />
          <input
            name="keyword"
            defaultValue={searchParams.get('keyword') ?? ''}
            placeholder="Tìm theo tên lớp"
          />
        </div>
        <button type="submit">
          <Search size={17} /> Tìm kiếm
        </button>
      </form>
      {error ? <div className="notice notice--error">{error}</div> : null}
      {!result && !error ? (
        <div className="list-state">
          <div className="spinner" />
        </div>
      ) : null}
      {result?.data.length === 0 ? (
        <div className="list-state">
          <School size={30} />
          <strong>Chưa có Classroom</strong>
        </div>
      ) : null}
      {result && result.data.length > 0 ? (
        <div className="data-table-wrap data-table-wrap--responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Classroom</th>
                <th>Teacher</th>
                <th>Trạng thái</th>
                <th>Thành viên</th>
                <th aria-label="Thao tác" />
              </tr>
            </thead>
            <tbody>
              {result.data.map((classroom) => (
                <tr key={classroom.id}>
                  <td data-label="Classroom">
                    <strong>{classroom.name}</strong>
                    <small>{classroom.subject ?? 'Chưa có môn học'}</small>
                  </td>
                  <td data-label="Teacher">{classroom.owner.fullName}</td>
                  <td data-label="Trạng thái">
                    <ClassroomStatusBadge status={classroom.status} />
                  </td>
                  <td data-label="Thành viên">{classroom.memberCount ?? 0}</td>
                  <td data-label="Thao tác">
                    <Link className="row-link" to={`/admin/classrooms/${classroom.id}`}>
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
