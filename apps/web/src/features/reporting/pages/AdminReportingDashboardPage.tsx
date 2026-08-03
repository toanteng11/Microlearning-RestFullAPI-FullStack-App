import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  BookOpen,
  CircleAlert,
  GraduationCap,
  RefreshCw,
  School,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { ApiError } from '../../../shared/api/api-error';
import { useAuth } from '../../../shared/auth/auth-context';
import { AdminSummary } from '../components/AdminSummary';
import { ExportCsvButton } from '../components/ExportCsvButton';
import { ReportingFreshnessNotice } from '../components/ReportingFreshnessNotice';
import { getAdminReportingDashboard } from '../reporting-api';
import { displayReportingDate } from '../reporting-format';
import { reportingQueryKeys } from '../reporting-query-keys';

const roleLabels = {
  STUDENT: 'Student',
  TEACHER: 'Teacher',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
} as const;

export function AdminReportingDashboardPage() {
  const { request, user } = useAuth();
  const actorId = user?.id ?? 'anonymous';
  const dashboard = useQuery({
    queryKey: reportingQueryKeys.adminDashboard(actorId),
    queryFn: () => getAdminReportingDashboard(request),
    enabled: Boolean(user),
    staleTime: 30_000,
  });

  if (dashboard.isPending) {
    return (
      <div className="reporting-loading" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <span>Đang tải dữ liệu quản trị...</span>
      </div>
    );
  }
  if (dashboard.isError) {
    return (
      <div className="notice notice--error reporting-inline-error" role="alert">
        <CircleAlert size={19} aria-hidden="true" />
        <span>
          {dashboard.error instanceof ApiError
            ? dashboard.error.message
            : 'Không thể tải dashboard quản trị.'}
        </span>
        <button type="button" onClick={() => void dashboard.refetch()}>
          <RefreshCw size={16} aria-hidden="true" /> Thử lại
        </button>
      </div>
    );
  }

  const data = dashboard.data.data;
  return (
    <section className="page-section admin-reporting-page" aria-labelledby="admin-dashboard-title">
      <header className="page-header">
        <div>
          <p className="eyebrow">Admin reporting</p>
          <h1 id="admin-dashboard-title">Tổng quan hệ thống</h1>
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
              path="/admin/reports/governance/export"
              filename="admin-governance-report.csv"
            />
          ) : null}
          <Link className="button-link" to="/admin/reports/governance">
            <BarChart3 size={17} aria-hidden="true" /> Báo cáo quản trị
          </Link>
        </div>
      </header>

      <ReportingFreshnessNotice
        metadata={data.reporting}
        refreshing={dashboard.isFetching}
        onRefresh={() => void dashboard.refetch()}
      />

      <nav className="action-list admin-management-links" aria-label="Quản trị hệ thống">
        <Link className="action-row" to="/admin/users">
          <UsersRound size={21} aria-hidden="true" />
          <span>
            <strong>Người dùng</strong>
            <small>Student, Teacher và Admin</small>
          </span>
        </Link>
        <Link className="action-row" to="/admin/teacher-invitations">
          <GraduationCap size={21} aria-hidden="true" />
          <span>
            <strong>Lời mời Teacher</strong>
            <small>Vòng đời lời mời thủ công</small>
          </span>
        </Link>
        <Link className="action-row" to="/admin/classrooms">
          <School size={21} aria-hidden="true" />
          <span>
            <strong>Classroom</strong>
            <small>Trạng thái và quyền tham gia</small>
          </span>
        </Link>
        <Link className="action-row" to="/admin/courses">
          <BookOpen size={21} aria-hidden="true" />
          <span>
            <strong>Course</strong>
            <small>Vòng đời nội dung</small>
          </span>
        </Link>
      </nav>

      <div className="admin-reporting-grid">
        {Object.entries(data.users).map(([role, counts]) => (
          <AdminSummary
            key={role}
            title={roleLabels[role as keyof typeof roleLabels]}
            entries={[
              { label: 'Tổng', value: counts.total },
              { label: 'Hoạt động', value: counts.ACTIVE },
              { label: 'Chờ kích hoạt', value: counts.PENDING },
              { label: 'Đã khóa', value: counts.BLOCKED },
            ]}
          />
        ))}
      </div>

      <div className="admin-reporting-grid">
        <AdminSummary
          title="Teacher Invitation"
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
          entries={[{ label: 'ACTIVE', value: data.activeEnrollmentCount }]}
        />
      </div>

      <section className="work-panel">
        <div className="panel-title">
          <ShieldCheck size={21} aria-hidden="true" />
          <h2>Hoạt động quản trị gần đây</h2>
        </div>
        {data.recentGovernanceEvents.length === 0 ? (
          <p className="empty-state">Chưa có hoạt động quản trị trong phạm vi hiện tại.</p>
        ) : (
          <div className="data-table-wrap data-table-wrap--responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Resource</th>
                </tr>
              </thead>
              <tbody>
                {data.recentGovernanceEvents.map((event) => (
                  <tr key={event.id}>
                    <td data-label="Thời gian">{displayReportingDate(event.createdAt)}</td>
                    <td data-label="Actor">{event.actorRole}</td>
                    <td data-label="Action">
                      <code>{event.action}</code>
                    </td>
                    <td data-label="Resource">
                      {event.resourceType} / {event.resourceId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
