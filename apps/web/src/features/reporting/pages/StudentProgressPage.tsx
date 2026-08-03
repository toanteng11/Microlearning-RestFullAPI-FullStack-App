import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { ApiError } from '../../../shared/api/api-error';
import { useAuth } from '../../../shared/auth/auth-context';
import { ReportingFreshnessNotice } from '../components/ReportingFreshnessNotice';
import { StudentCourseProgressTable } from '../components/StudentCourseProgressTable';
import { listStudentCourseProgress } from '../reporting-api';
import { reportingQueryKeys } from '../reporting-query-keys';
import type { ReportingProgressStatus, StudentCourseProgressQuery } from '../reporting.types';

const statuses: Array<{ value: ReportingProgressStatus | ''; label: string }> = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'NOT_STARTED', label: 'Chưa bắt đầu' },
  { value: 'IN_PROGRESS', label: 'Đang học' },
  { value: 'MISSING', label: 'Thiếu bài' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'LATE', label: 'Hoàn thành trễ' },
];

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function queryFrom(search: URLSearchParams): StudentCourseProgressQuery {
  const status = search.get('progressStatus');
  const sortBy = search.get('sortBy');
  const sortOrder = search.get('sortOrder');
  return {
    page: positiveInteger(search.get('page'), 1),
    limit: Math.min(50, positiveInteger(search.get('limit'), 20)),
    ...(statuses.some((item) => item.value === status) && status
      ? { progressStatus: status as ReportingProgressStatus }
      : {}),
    sortBy:
      sortBy === 'courseTitle' || sortBy === 'processScore' || sortBy === 'lastActiveAt'
        ? sortBy
        : 'lastActiveAt',
    sortOrder: sortOrder === 'asc' ? 'asc' : 'desc',
  };
}

export function StudentProgressPage() {
  const { request, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = queryFrom(searchParams);
  const progress = useQuery({
    queryKey: reportingQueryKeys.studentCourses(user?.id ?? 'anonymous', query),
    queryFn: () => listStudentCourseProgress(request, query),
    enabled: Boolean(user),
    staleTime: 30_000,
  });

  function updateQuery(values: Partial<StudentCourseProgressQuery>) {
    const next = { ...query, ...values };
    const params = new URLSearchParams({
      page: String(next.page),
      limit: String(next.limit),
      sortBy: next.sortBy,
      sortOrder: next.sortOrder,
    });
    if (next.progressStatus) params.set('progressStatus', next.progressStatus);
    setSearchParams(params);
  }

  return (
    <section className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Student reporting</p>
          <h1>Tiến độ khóa học</h1>
          <p>So sánh mức độ hoàn thành và các công việc còn thiếu trong từng khóa học.</p>
        </div>
      </header>

      <div className="reporting-filter-bar" aria-label="Bộ lọc tiến độ">
        <label>
          Trạng thái
          <select
            value={query.progressStatus ?? ''}
            onChange={(event) =>
              updateQuery({
                page: 1,
                progressStatus: (event.target.value || undefined) as
                  ReportingProgressStatus | undefined,
              })
            }
          >
            {statuses.map((status) => (
              <option key={status.value || 'ALL'} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sắp xếp theo
          <select
            value={query.sortBy}
            onChange={(event) =>
              updateQuery({
                page: 1,
                sortBy: event.target.value as StudentCourseProgressQuery['sortBy'],
              })
            }
          >
            <option value="lastActiveAt">Hoạt động gần nhất</option>
            <option value="courseTitle">Tên khóa học</option>
            <option value="processScore">Điểm quá trình</option>
          </select>
        </label>
        <label>
          Thứ tự
          <select
            value={query.sortOrder}
            onChange={(event) =>
              updateQuery({
                page: 1,
                sortOrder: event.target.value as StudentCourseProgressQuery['sortOrder'],
              })
            }
          >
            <option value="desc">Giảm dần</option>
            <option value="asc">Tăng dần</option>
          </select>
        </label>
      </div>

      {progress.isPending ? (
        <div className="reporting-loading" aria-live="polite">
          <div className="spinner" aria-hidden="true" />
          <span>Đang tải tiến độ khóa học...</span>
        </div>
      ) : null}
      {progress.isError ? (
        <div className="notice notice--error reporting-inline-error" role="alert">
          <span>
            {progress.error instanceof ApiError
              ? progress.error.message
              : 'Không thể tải tiến độ khóa học.'}
          </span>
          <button type="button" onClick={() => void progress.refetch()}>
            <RefreshCw size={16} aria-hidden="true" /> Thử lại
          </button>
        </div>
      ) : null}

      {progress.data ? (
        <>
          <ReportingFreshnessNotice
            metadata={progress.data.data.reporting}
            refreshing={progress.isFetching}
            onRefresh={() => void progress.refetch()}
          />
          {progress.data.data.items.length === 0 ? (
            <div className="list-state">
              <strong>Không có khóa học phù hợp với bộ lọc</strong>
              <span>Hãy chọn trạng thái khác hoặc tham gia một lớp học.</span>
            </div>
          ) : (
            <StudentCourseProgressTable
              items={progress.data.data.items}
              timezone={progress.data.data.reporting.timezone}
            />
          )}
          <div className="pagination" aria-label="Phân trang tiến độ">
            <button
              type="button"
              disabled={!progress.data.meta.hasPreviousPage}
              onClick={() => updateQuery({ page: query.page - 1 })}
            >
              Trang trước
            </button>
            <span>
              Trang {progress.data.meta.page}/{Math.max(1, progress.data.meta.totalPages)}
            </span>
            <button
              type="button"
              disabled={!progress.data.meta.hasNextPage}
              onClick={() => updateQuery({ page: query.page + 1 })}
            >
              Trang sau
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
