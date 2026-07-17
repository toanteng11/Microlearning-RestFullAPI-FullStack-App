import {
  ChevronLeft,
  ChevronRight,
  FilterX,
  RefreshCw,
  Search,
  UserRoundSearch,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';

import { ApiError } from '../../../shared/api/api-error';
import { useAuth } from '../../../shared/auth/auth-context';
import { StatusBadge } from '../components/StatusBadge';
import type {
  AccountStatus,
  AdminUserListEnvelope,
  AdminUserListItem,
  AdminUserScope,
} from '../admin-user.types';

const STATUS_OPTIONS: Array<{ value: AccountStatus | ''; label: string }> = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'BLOCKED', label: 'Đã khóa' },
  { value: 'INACTIVE', label: 'Ngừng hoạt động' },
  { value: 'PENDING', label: 'Chờ kích hoạt' },
  { value: 'DELETED', label: 'Đã xóa' },
];

const SCOPE_CONFIG = {
  students: {
    title: 'Student List',
    description: 'Danh sách tài khoản học sinh.',
    empty: 'Chưa có tài khoản Student',
    sortOptions: [
      ['createdAt', 'Ngày tạo'],
      ['fullName', 'Họ tên'],
      ['email', 'Email'],
      ['status', 'Trạng thái'],
      ['lastActiveAt', 'Hoạt động gần nhất'],
    ],
  },
  teachers: {
    title: 'Teacher List',
    description: 'Danh sách giảng viên đã kích hoạt.',
    empty: 'Chưa có tài khoản Teacher',
    sortOptions: [
      ['createdAt', 'Ngày tạo'],
      ['fullName', 'Họ tên'],
      ['email', 'Email'],
      ['status', 'Trạng thái'],
      ['department', 'Đơn vị'],
      ['lastActiveAt', 'Hoạt động gần nhất'],
    ],
  },
  admins: {
    title: 'Admin List',
    description: 'Danh sách Admin và Super Admin.',
    empty: 'Chưa có tài khoản Admin',
    sortOptions: [
      ['createdAt', 'Ngày tạo'],
      ['fullName', 'Họ tên'],
      ['email', 'Email'],
      ['role', 'Vai trò'],
      ['status', 'Trạng thái'],
      ['lastActiveAt', 'Hoạt động gần nhất'],
    ],
  },
} as const;

function displayDate(value: string | null | undefined) {
  if (!value) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}

function roleLabel(item: AdminUserListItem, scope: AdminUserScope) {
  if (scope === 'students') return item.studentCode ?? 'Chưa có mã học sinh';
  if (scope === 'teachers') return item.department ?? 'Chưa cập nhật đơn vị';
  return item.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin';
}

export function AdminUserListPage({ scope }: { scope: AdminUserScope }) {
  const { request } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryString = searchParams.toString();
  const keyword = searchParams.get('keyword') ?? '';
  const status = searchParams.get('status') ?? '';
  const page = Number(searchParams.get('page') ?? '1');
  const [reloadKey, setReloadKey] = useState(0);
  const requestKey = `${scope}?${queryString}#${reloadKey}`;
  const [loadState, setLoadState] = useState<{
    key: string;
    result: AdminUserListEnvelope | null;
    error: string | null;
  }>({ key: '', result: null, error: null });
  const config = SCOPE_CONFIG[scope];

  useEffect(() => {
    let active = true;
    const suffix = queryString ? `?${queryString}` : '';
    void request<AdminUserListEnvelope>(`/admin/users/${scope}${suffix}`)
      .then((response) => {
        if (active) setLoadState({ key: requestKey, result: response, error: null });
      })
      .catch((requestError) => {
        if (!active) return;
        setLoadState({
          key: requestKey,
          result: null,
          error:
            requestError instanceof ApiError
              ? requestError.message
              : 'Không thể tải danh sách người dùng.',
        });
      });
    return () => {
      active = false;
    };
  }, [queryString, request, requestKey, scope]);

  const loading = loadState.key !== requestKey;
  const result = loading ? null : loadState.result;
  const error = loading ? null : loadState.error;

  const returnUrl = `${location.pathname}${location.search}`;
  const hasFilters = Boolean(keyword || status);
  const summary = useMemo(() => {
    if (!result) return '';
    return `${result.pagination.totalItems} tài khoản`;
  }, [result]);

  function updateQuery(updates: Record<string, string>) {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setSearchParams(next);
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submittedKeyword = String(new FormData(event.currentTarget).get('keyword') ?? '').trim();
    updateQuery({ keyword: submittedKeyword, page: '' });
  }

  function changePage(nextPage: number) {
    updateQuery({ page: nextPage > 1 ? String(nextPage) : '' });
  }

  return (
    <section className="page-section">
      <header className="page-header page-header--aligned">
        <div>
          <p className="eyebrow">User administration</p>
          <h1>{config.title}</h1>
          <p>{config.description}</p>
        </div>
        <span className="result-summary" aria-live="polite">
          {summary}
        </span>
      </header>

      <nav className="section-tabs" aria-label="Nhóm người dùng">
        <Link className={scope === 'students' ? 'active' : ''} to="/admin/users/students">
          Students
        </Link>
        <Link className={scope === 'teachers' ? 'active' : ''} to="/admin/users/teachers">
          Teachers
        </Link>
        <Link className={scope === 'admins' ? 'active' : ''} to="/admin/users/admins">
          Admins
        </Link>
      </nav>

      <form className="filter-bar" onSubmit={submitSearch}>
        <div className="filter-search">
          <label className="sr-only" htmlFor={`${scope}-keyword`}>
            Tìm theo họ tên hoặc email
          </label>
          <Search size={18} aria-hidden="true" />
          <input
            key={keyword}
            id={`${scope}-keyword`}
            name="keyword"
            defaultValue={keyword}
            placeholder="Tìm theo họ tên hoặc email"
          />
        </div>
        <label className="sr-only" htmlFor={`${scope}-status`}>
          Lọc trạng thái
        </label>
        <select
          id={`${scope}-status`}
          value={status}
          onChange={(event) => updateQuery({ status: event.target.value, page: '' })}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor={`${scope}-sort`}>
          Sắp xếp theo
        </label>
        <select
          id={`${scope}-sort`}
          value={searchParams.get('sortBy') ?? 'createdAt'}
          onChange={(event) => updateQuery({ sortBy: event.target.value, page: '' })}
        >
          {config.sortOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button className="primary-button primary-button--compact" type="submit">
          <Search size={17} /> Tìm kiếm
        </button>
        {hasFilters ? (
          <button
            className="icon-button"
            type="button"
            aria-label="Xóa bộ lọc"
            title="Xóa bộ lọc"
            onClick={() => setSearchParams({})}
          >
            <FilterX size={18} />
          </button>
        ) : null}
      </form>

      {loading ? (
        <div className="list-state" aria-live="polite">
          <div className="spinner" aria-hidden="true" />
          <p>Đang tải danh sách...</p>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="list-state list-state--error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setReloadKey((current) => current + 1)}>
            <RefreshCw size={17} /> Thử lại
          </button>
        </div>
      ) : null}

      {!loading && !error && result?.data.length === 0 ? (
        <div className="list-state">
          <UserRoundSearch size={30} aria-hidden="true" />
          <strong>{hasFilters ? 'Không tìm thấy tài khoản phù hợp' : config.empty}</strong>
        </div>
      ) : null}

      {!loading && !error && result && result.data.length > 0 ? (
        <>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Thông tin nhóm</th>
                  <th>Trạng thái</th>
                  <th>Hoạt động gần nhất</th>
                  <th aria-label="Thao tác" />
                </tr>
              </thead>
              <tbody>
                {result.data.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.fullName}</strong>
                      <small>{item.email}</small>
                    </td>
                    <td>{roleLabel(item, scope)}</td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>{displayDate(item.lastActiveAt)}</td>
                    <td>
                      <Link
                        className="row-link"
                        to={`/admin/users/${item.id}`}
                        state={{ returnUrl }}
                        aria-label={`Xem ${item.fullName}`}
                      >
                        Xem
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mobile-user-list">
            {result.data.map((item) => (
              <article className="mobile-user-card" key={item.id}>
                <div>
                  <strong>{item.fullName}</strong>
                  <small>{item.email}</small>
                </div>
                <StatusBadge status={item.status} />
                <span>{roleLabel(item, scope)}</span>
                <Link to={`/admin/users/${item.id}`} state={{ returnUrl }}>
                  Xem chi tiết
                </Link>
              </article>
            ))}
          </div>
        </>
      ) : null}

      {result && result.pagination.totalPages > 0 ? (
        <nav className="pagination" aria-label="Phân trang">
          <button
            className="icon-button"
            type="button"
            disabled={!result.pagination.hasPreviousPage}
            onClick={() => changePage(page - 1)}
            aria-label="Trang trước"
          >
            <ChevronLeft size={18} />
          </button>
          <span>
            Trang {result.pagination.page}/{result.pagination.totalPages}
          </span>
          <button
            className="icon-button"
            type="button"
            disabled={!result.pagination.hasNextPage}
            onClick={() => changePage(page + 1)}
            aria-label="Trang sau"
          >
            <ChevronRight size={18} />
          </button>
        </nav>
      ) : null}
    </section>
  );
}
