import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CircleAlert, RefreshCw } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { ApiError } from '../../../shared/api/api-error';
import { useAuth } from '../../../shared/auth/auth-context';
import { ReportingFreshnessNotice } from '../components/ReportingFreshnessNotice';
import { getStudentProgressTrend } from '../reporting-api';
import { displayReportingDate, displayReportingPercentage } from '../reporting-format';
import { reportingQueryKeys } from '../reporting-query-keys';
import type { StudentProgressTrendQuery } from '../reporting.types';

export function StudentProgressTrendPage() {
  const { courseId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const { request, user } = useAuth();
  const query: StudentProgressTrendQuery = {
    courseId,
    from: params.get('from') || undefined,
    to: params.get('to') || undefined,
    timezone: params.get('timezone') || undefined,
  };
  const trend = useQuery({
    queryKey: reportingQueryKeys.studentTrend(user?.id ?? 'anonymous', query),
    queryFn: () => getStudentProgressTrend(request, query),
    enabled: Boolean(user && courseId),
    staleTime: 30_000,
  });

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  return (
    <section className="page-section" aria-labelledby="student-trend-title">
      <header className="page-header page-header--aligned">
        <div>
          <p className="eyebrow">Student reporting</p>
          <h1 id="student-trend-title">Xu hướng tiến độ</h1>
          <p>Các mốc dưới đây là snapshot đã ghi nhận, không nội suy dữ liệu giữa hai thời điểm.</p>
        </div>
        <Link className="button-link button-link--secondary" to="/student/progress">
          <ArrowLeft size={17} aria-hidden="true" /> Tiến độ
        </Link>
      </header>

      <div className="reporting-filter-bar" aria-label="Bộ lọc xu hướng">
        <label>
          Từ ngày
          <input
            type="date"
            value={query.from ?? ''}
            onChange={(event) => setFilter('from', event.target.value)}
          />
        </label>
        <label>
          Đến ngày
          <input
            type="date"
            value={query.to ?? ''}
            onChange={(event) => setFilter('to', event.target.value)}
          />
        </label>
      </div>

      {trend.isPending ? (
        <div className="reporting-loading" aria-live="polite">
          <div className="spinner" aria-hidden="true" /> Đang tải xu hướng...
        </div>
      ) : null}
      {trend.isError ? (
        <div className="notice notice--error reporting-inline-error" role="alert">
          <CircleAlert size={18} aria-hidden="true" />
          <span>
            {trend.error instanceof ApiError
              ? trend.error.message
              : 'Không thể tải xu hướng tiến độ.'}
          </span>
          <button type="button" onClick={() => void trend.refetch()}>
            <RefreshCw size={16} aria-hidden="true" /> Thử lại
          </button>
        </div>
      ) : null}

      {trend.data ? (
        <>
          <ReportingFreshnessNotice
            metadata={trend.data.data.reporting}
            refreshing={trend.isFetching}
            onRefresh={() => void trend.refetch()}
          />
          <h2>{trend.data.data.course.title}</h2>
          {trend.data.data.reporting.dataState === 'NO_DATA' ? (
            <div className="empty-state">
              <strong>Chưa đủ dữ liệu để tạo xu hướng</strong>
              <span>
                {trend.data.data.noDataReason === 'INCOMPATIBLE_VERSION'
                  ? 'Các snapshot hiện có không cùng phiên bản metric.'
                  : 'Cần ít nhất hai snapshot khác thời điểm trong khoảng đã chọn.'}
              </span>
            </div>
          ) : (
            <>
              <dl className="reporting-summary-strip">
                <div>
                  <dt>Thay đổi tiến độ</dt>
                  <dd>{displayReportingPercentage(trend.data.data.change.progressPercentage)}</dd>
                </div>
                <div>
                  <dt>Thay đổi điểm quá trình</dt>
                  <dd>{displayReportingPercentage(trend.data.data.change.processScore)}</dd>
                </div>
                <div>
                  <dt>Thay đổi Grade</dt>
                  <dd>{displayReportingPercentage(trend.data.data.change.returnedGradeAverage)}</dd>
                </div>
              </dl>
              <div className="data-table-wrap data-table-wrap--responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Thời điểm</th>
                      <th>Tiến độ</th>
                      <th>Điểm quá trình</th>
                      <th>Grade đã trả</th>
                      <th>Hoàn thành</th>
                      <th>Thiếu / trễ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trend.data.data.points.map((point) => (
                      <tr key={point.capturedAt}>
                        <td data-label="Thời điểm">
                          {displayReportingDate(
                            point.capturedAt,
                            trend.data.data.reporting.timezone,
                          )}
                        </td>
                        <td data-label="Tiến độ">
                          {displayReportingPercentage(point.progressPercentage)}
                        </td>
                        <td data-label="Điểm quá trình">
                          {displayReportingPercentage(point.processScore)}
                        </td>
                        <td data-label="Grade đã trả">
                          {displayReportingPercentage(point.returnedGradeAverage)}
                        </td>
                        <td data-label="Hoàn thành">
                          {point.completedRequiredCount}/{point.requiredActivityCount}
                        </td>
                        <td data-label="Thiếu / trễ">
                          {point.missingCount} / {point.lateCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      ) : null}
    </section>
  );
}
