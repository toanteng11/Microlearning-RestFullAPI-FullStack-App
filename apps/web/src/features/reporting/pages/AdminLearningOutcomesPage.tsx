import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CircleAlert, RefreshCw } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import { ApiError } from '../../../shared/api/api-error';
import { useAuth } from '../../../shared/auth/auth-context';
import { ReportingFreshnessNotice } from '../components/ReportingFreshnessNotice';
import { getAdminLearningOutcomes } from '../reporting-api';
import { displayReportingPercentage } from '../reporting-format';
import { reportingQueryKeys } from '../reporting-query-keys';
import type { AdminLearningOutcomeQuery } from '../reporting.types';

const courseStatuses = ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'] as const;

export function AdminLearningOutcomesPage() {
  const { request, user } = useAuth();
  const [params, setParams] = useSearchParams();
  const status = params.get('courseStatus');
  const query: AdminLearningOutcomeQuery = {
    from: params.get('from') || undefined,
    to: params.get('to') || undefined,
    timezone: params.get('timezone') || undefined,
    courseStatus: courseStatuses.find((candidate) => candidate === status),
  };
  const report = useQuery({
    queryKey: reportingQueryKeys.adminLearningOutcomes(user?.id ?? 'anonymous', query),
    queryFn: () => getAdminLearningOutcomes(request, query),
    enabled: Boolean(user),
    staleTime: 30_000,
  });

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  return (
    <section
      className="page-section admin-reporting-page"
      aria-labelledby="learning-outcomes-title"
    >
      <header className="page-header page-header--aligned">
        <div>
          <p className="eyebrow">Admin reporting</p>
          <h1 id="learning-outcomes-title">Kết quả học tập theo Course</h1>
          <p>Chỉ hiển thị số liệu tổng hợp; nhóm nhỏ được ẩn để bảo vệ quyền riêng tư.</p>
        </div>
        <Link className="button-link button-link--secondary" to="/admin/reports/governance">
          <ArrowLeft size={17} aria-hidden="true" /> Quản trị
        </Link>
      </header>

      <div
        className="reporting-filter-bar admin-reporting-filters"
        aria-label="Bộ lọc kết quả học tập"
      >
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
        <label>
          Course status
          <select
            value={query.courseStatus ?? ''}
            onChange={(event) => setFilter('courseStatus', event.target.value)}
          >
            <option value="">Tất cả</option>
            {courseStatuses.map((courseStatus) => (
              <option key={courseStatus}>{courseStatus}</option>
            ))}
          </select>
        </label>
      </div>

      {report.isPending ? (
        <div className="reporting-loading" aria-live="polite">
          <div className="spinner" aria-hidden="true" /> Đang tải kết quả học tập...
        </div>
      ) : null}
      {report.isError ? (
        <div className="notice notice--error reporting-inline-error" role="alert">
          <CircleAlert size={18} aria-hidden="true" />
          <span>
            {report.error instanceof ApiError
              ? report.error.message
              : 'Không thể tải kết quả học tập.'}
          </span>
          <button type="button" onClick={() => void report.refetch()}>
            <RefreshCw size={16} aria-hidden="true" /> Thử lại
          </button>
        </div>
      ) : null}
      {report.data ? (
        <>
          <ReportingFreshnessNotice
            metadata={report.data.data.reporting}
            refreshing={report.isFetching}
            onRefresh={() => void report.refetch()}
          />
          {report.data.data.items.length === 0 ? (
            <p className="empty-state">Không có Course phù hợp với bộ lọc.</p>
          ) : (
            <div className="data-table-wrap data-table-wrap--responsive">
              <table className="data-table conditional-report-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Student</th>
                    <th>Tiến độ TB</th>
                    <th>Hoàn thành</th>
                    <th>Grade đã trả</th>
                    <th>Thiếu / trễ</th>
                  </tr>
                </thead>
                <tbody>
                  {report.data.data.items.map((item) => {
                    const suppressed = item.dataState === 'SUPPRESSED';
                    return (
                      <tr key={item.course.id}>
                        <td data-label="Course">
                          <strong>{item.course.title}</strong>
                          <small>{item.course.status}</small>
                        </td>
                        <td data-label="Student">{item.studentCountBucket}</td>
                        <td data-label="Tiến độ TB">
                          {suppressed
                            ? 'N/A'
                            : displayReportingPercentage(item.averageProgressPercentage)}
                        </td>
                        <td data-label="Hoàn thành">
                          {suppressed
                            ? 'N/A'
                            : displayReportingPercentage(item.completionPercentage)}
                        </td>
                        <td data-label="Grade đã trả">
                          {suppressed
                            ? 'N/A'
                            : displayReportingPercentage(item.returnedGradeAverage)}
                        </td>
                        <td data-label="Thiếu / trễ">
                          {suppressed
                            ? 'N/A'
                            : `${item.missingActivityCount} / ${item.lateActivityCount}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
