import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  GraduationCap,
  RefreshCw,
} from 'lucide-react';
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { ApiError } from '../../../shared/api/api-error';
import { useAuth } from '../../../shared/auth/auth-context';
import { AdminSummary } from '../components/AdminSummary';
import { ExportCsvButton } from '../components/ExportCsvButton';
import { ReportingFreshnessNotice } from '../components/ReportingFreshnessNotice';
import { getAdminGovernanceReport, listAdminAuditLogs } from '../reporting-api';
import { displayReportingDate } from '../reporting-format';
import { reportingQueryKeys } from '../reporting-query-keys';
import type { AdminAuditQuery, AdminGovernanceQuery } from '../reporting.types';

function optional(params: URLSearchParams, key: string) {
  return params.get(key) || undefined;
}

export function AdminGovernanceReportPage() {
  const { request, user } = useAuth();
  const actorId = user?.id ?? 'anonymous';
  const [params, setParams] = useSearchParams();
  const governanceQuery = useMemo<AdminGovernanceQuery>(
    () => ({
      from: optional(params, 'from'),
      to: optional(params, 'to'),
      timezone: optional(params, 'timezone'),
      role: optional(params, 'role') as AdminGovernanceQuery['role'],
      userStatus: optional(params, 'userStatus') as AdminGovernanceQuery['userStatus'],
      invitationStatus: optional(
        params,
        'invitationStatus',
      ) as AdminGovernanceQuery['invitationStatus'],
      classroomStatus: optional(
        params,
        'classroomStatus',
      ) as AdminGovernanceQuery['classroomStatus'],
      courseStatus: optional(params, 'courseStatus') as AdminGovernanceQuery['courseStatus'],
    }),
    [params],
  );
  const auditQuery = useMemo<AdminAuditQuery>(
    () => ({
      page: Math.max(1, Number(params.get('page') ?? 1) || 1),
      limit: 20,
      from: governanceQuery.from,
      to: governanceQuery.to,
      timezone: governanceQuery.timezone,
      actorRole: optional(params, 'actorRole') as AdminAuditQuery['actorRole'],
      action: optional(params, 'auditAction'),
      sortOrder: 'desc',
    }),
    [governanceQuery, params],
  );
  const governance = useQuery({
    queryKey: reportingQueryKeys.adminGovernance(actorId, governanceQuery),
    queryFn: () => getAdminGovernanceReport(request, governanceQuery),
    enabled: Boolean(user),
    staleTime: 30_000,
  });
  const audit = useQuery({
    queryKey: reportingQueryKeys.adminAudit(actorId, auditQuery),
    queryFn: () => listAdminAuditLogs(request, auditQuery),
    enabled: Boolean(user),
    staleTime: 15_000,
  });

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setParams(next, { replace: true });
  }
  function setPage(page: number) {
    const next = new URLSearchParams(params);
    if (page <= 1) next.delete('page');
    else next.set('page', String(page));
    setParams(next, { replace: true });
  }

  const governanceExportSearch = new URLSearchParams();
  for (const [key, value] of Object.entries(governanceQuery)) {
    if (value) governanceExportSearch.set(key, value);
  }
  const auditExportSearch = new URLSearchParams();
  for (const [key, value] of Object.entries(auditQuery)) {
    if (key !== 'page' && key !== 'limit' && value) auditExportSearch.set(key, String(value));
  }

  if (governance.isPending || audit.isPending) {
    return (
      <div className="reporting-loading" aria-live="polite">
        <div className="spinner" />
        <span>Đang tải báo cáo quản trị...</span>
      </div>
    );
  }
  if (governance.isError || audit.isError) {
    const error = governance.error ?? audit.error;
    return (
      <div className="notice notice--error reporting-inline-error" role="alert">
        <CircleAlert size={19} aria-hidden="true" />
        <span>{error instanceof ApiError ? error.message : 'Không thể tải báo cáo quản trị.'}</span>
        <button
          type="button"
          onClick={() => void Promise.all([governance.refetch(), audit.refetch()])}
        >
          <RefreshCw size={16} aria-hidden="true" /> Thử lại
        </button>
      </div>
    );
  }

  const data = governance.data.data;
  return (
    <section className="page-section admin-reporting-page" aria-labelledby="governance-title">
      <header className="page-header">
        <div>
          <p className="eyebrow">Admin reporting</p>
          <h1 id="governance-title">Báo cáo quản trị</h1>
        </div>
        <div className="reporting-heading-actions">
          {data.allowedActions.includes('VIEW_ANALYTICS_ADOPTION') ? (
            <Link className="button-link button-link--secondary" to="/admin/reports/adoption">
              <BarChart3 size={17} aria-hidden="true" /> Adoption
            </Link>
          ) : null}
          {data.allowedActions.includes('VIEW_LEARNING_OUTCOMES') ? (
            <Link
              className="button-link button-link--secondary"
              to="/admin/reports/learning-outcomes"
            >
              <GraduationCap size={17} aria-hidden="true" /> Learning outcomes
            </Link>
          ) : null}
          {data.allowedActions.includes('EXPORT_REPORT') ? (
            <ExportCsvButton
              path={`/admin/reports/governance/export${governanceExportSearch.size ? `?${governanceExportSearch.toString()}` : ''}`}
              filename="admin-governance-report.csv"
            />
          ) : null}
        </div>
      </header>
      <div className="reporting-filter-bar admin-reporting-filters" aria-label="Bộ lọc báo cáo">
        <label>
          Từ ngày
          <input
            type="date"
            value={governanceQuery.from ?? ''}
            onChange={(event) => setFilter('from', event.target.value)}
          />
        </label>
        <label>
          Đến ngày
          <input
            type="date"
            value={governanceQuery.to ?? ''}
            onChange={(event) => setFilter('to', event.target.value)}
          />
        </label>
        <label>
          Timezone
          <select
            value={governanceQuery.timezone ?? ''}
            onChange={(event) => setFilter('timezone', event.target.value)}
          >
            <option value="">Asia/Ho_Chi_Minh</option>
            <option value="UTC">UTC</option>
          </select>
        </label>
        <label>
          Role
          <select
            aria-label="Role"
            value={governanceQuery.role ?? ''}
            onChange={(event) => setFilter('role', event.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="STUDENT">Student</option>
            <option value="TEACHER">Teacher</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
        </label>
        <label>
          User status
          <select
            value={governanceQuery.userStatus ?? ''}
            onChange={(event) => setFilter('userStatus', event.target.value)}
          >
            <option value="">Tất cả</option>
            {['PENDING', 'ACTIVE', 'INACTIVE', 'BLOCKED', 'DELETED'].map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
      </div>
      <ReportingFreshnessNotice
        metadata={data.reporting}
        refreshing={governance.isFetching}
        onRefresh={() => void governance.refetch()}
      />
      <div className="admin-reporting-grid">
        {Object.entries(data.users).map(([role, counts]) => (
          <AdminSummary
            key={role}
            title={role}
            entries={[
              { label: 'TOTAL', value: counts.total },
              { label: 'ACTIVE', value: counts.ACTIVE },
              { label: 'PENDING', value: counts.PENDING },
              { label: 'BLOCKED', value: counts.BLOCKED },
            ]}
          />
        ))}
      </div>
      <div className="admin-reporting-grid">
        <AdminSummary
          title="Registration Source"
          entries={Object.entries(data.registrationSources).map(([label, value]) => ({
            label,
            value,
          }))}
        />
        <AdminSummary
          title="Invitation"
          entries={Object.entries(data.invitations).map(([label, value]) => ({ label, value }))}
        />
        <AdminSummary
          title="Classroom"
          entries={Object.entries(data.classrooms).map(([label, value]) => ({ label, value }))}
        />
        <AdminSummary
          title="Course"
          entries={Object.entries(data.courses).map(([label, value]) => ({ label, value }))}
        />
        <AdminSummary
          title="Enrollment"
          entries={Object.entries(data.enrollments).map(([label, value]) => ({ label, value }))}
        />
      </div>
      <section className="work-panel" aria-labelledby="audit-log-title">
        <div className="section-heading">
          <h2 id="audit-log-title">Audit Log</h2>
          <div className="reporting-heading-actions">
            <span>{audit.data.meta.totalItems} bản ghi</span>
            {data.allowedActions.includes('EXPORT_REPORT') ? (
              <ExportCsvButton
                path={`/admin/audit-logs/export${auditExportSearch.size ? `?${auditExportSearch.toString()}` : ''}`}
                filename="admin-audit-log.csv"
                label="Tải Audit CSV"
              />
            ) : null}
          </div>
        </div>
        <div className="reporting-filter-bar">
          <label>
            Actor role
            <select
              value={auditQuery.actorRole ?? ''}
              onChange={(event) => setFilter('actorRole', event.target.value)}
            >
              <option value="">Tất cả</option>
              {['STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN', 'SYSTEM'].map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </label>
          <label>
            Action
            <input
              maxLength={100}
              value={auditQuery.action ?? ''}
              onChange={(event) => setFilter('auditAction', event.target.value)}
            />
          </label>
        </div>
        {audit.data.data.items.length === 0 ? (
          <p className="empty-state">Không có Audit Log phù hợp.</p>
        ) : (
          <div className="data-table-wrap data-table-wrap--responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Request ID</th>
                </tr>
              </thead>
              <tbody>
                {audit.data.data.items.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Thời gian">{displayReportingDate(item.createdAt)}</td>
                    <td data-label="Actor">{item.actorRole}</td>
                    <td data-label="Action">
                      <code>{item.action}</code>
                    </td>
                    <td data-label="Resource">
                      {item.resourceType} / {item.resourceId}
                    </td>
                    <td data-label="Request ID">
                      <code>{item.requestId}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="pagination-controls" aria-label="Phân trang Audit Log">
          <button
            className="icon-button"
            type="button"
            aria-label="Trang Audit Log trước"
            disabled={!audit.data.meta.hasPreviousPage}
            onClick={() => setPage(auditQuery.page - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          <span>
            Trang {audit.data.meta.page} / {Math.max(1, audit.data.meta.totalPages)}
          </span>
          <button
            className="icon-button"
            type="button"
            aria-label="Trang Audit Log tiếp theo"
            disabled={!audit.data.meta.hasNextPage}
            onClick={() => setPage(auditQuery.page + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </section>
    </section>
  );
}
