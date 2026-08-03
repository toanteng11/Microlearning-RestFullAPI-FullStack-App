import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CircleAlert, RefreshCw } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import { ApiError } from '../../../shared/api/api-error';
import { useAuth } from '../../../shared/auth/auth-context';
import { ReportingFreshnessNotice } from '../components/ReportingFreshnessNotice';
import { getAdminAnalyticsAdoption } from '../reporting-api';
import { displayReportingDate } from '../reporting-format';
import { reportingQueryKeys } from '../reporting-query-keys';
import type { AdminAnalyticsAdoptionQuery } from '../reporting.types';

export function AdminAnalyticsAdoptionPage() {
  const { request, user } = useAuth();
  const [params, setParams] = useSearchParams();
  const interval = params.get('interval');
  const query: AdminAnalyticsAdoptionQuery = {
    from: params.get('from') || undefined,
    to: params.get('to') || undefined,
    timezone: params.get('timezone') || undefined,
    interval: interval === 'WEEK' || interval === 'MONTH' ? interval : 'DAY',
  };
  const report = useQuery({
    queryKey: reportingQueryKeys.adminAnalyticsAdoption(user?.id ?? 'anonymous', query),
    queryFn: () => getAdminAnalyticsAdoption(request, query),
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
      aria-labelledby="analytics-adoption-title"
    >
      <header className="page-header page-header--aligned">
        <div>
          <p className="eyebrow">Admin reporting</p>
          <h1 id="analytics-adoption-title">Mức độ sử dụng tính năng</h1>
          <p>Thống kê event theo vai trò; nhóm nhỏ không hiển thị số lượng chính xác.</p>
        </div>
        <Link className="button-link button-link--secondary" to="/admin/reports/governance">
          <ArrowLeft size={17} aria-hidden="true" /> Quản trị
        </Link>
      </header>

      <div className="reporting-filter-bar admin-reporting-filters" aria-label="Bộ lọc adoption">
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
          Chu kỳ
          <select
            value={query.interval}
            onChange={(event) => setFilter('interval', event.target.value)}
          >
            <option value="DAY">Ngày</option>
            <option value="WEEK">Tuần</option>
            <option value="MONTH">Tháng</option>
          </select>
        </label>
      </div>

      {report.isPending ? (
        <div className="reporting-loading" aria-live="polite">
          <div className="spinner" aria-hidden="true" /> Đang tải adoption...
        </div>
      ) : null}
      {report.isError ? (
        <div className="notice notice--error reporting-inline-error" role="alert">
          <CircleAlert size={18} aria-hidden="true" />
          <span>
            {report.error instanceof ApiError
              ? report.error.message
              : 'Không thể tải báo cáo adoption.'}
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
            <p className="empty-state">Chưa có event phù hợp trong khoảng đã chọn.</p>
          ) : (
            <div className="data-table-wrap data-table-wrap--responsive">
              <table className="data-table conditional-report-table">
                <thead>
                  <tr>
                    <th>Chu kỳ</th>
                    <th>Event</th>
                    <th>Role</th>
                    <th>Actor</th>
                    <th>Số event</th>
                  </tr>
                </thead>
                <tbody>
                  {report.data.data.items.map((item) => (
                    <tr key={`${item.periodStart}-${item.eventName}-${item.actorRole}`}>
                      <td data-label="Chu kỳ">
                        {displayReportingDate(
                          item.periodStart,
                          report.data.data.reporting.timezone,
                        )}
                      </td>
                      <td data-label="Event">
                        <code>{item.eventName}</code>
                      </td>
                      <td data-label="Role">{item.actorRole}</td>
                      <td data-label="Actor">{item.distinctActorCountBucket}</td>
                      <td data-label="Số event">
                        {item.dataState === 'SUPPRESSED' ? 'N/A' : item.eventCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
