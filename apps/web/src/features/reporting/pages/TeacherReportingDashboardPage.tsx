import { useQuery } from '@tanstack/react-query';
import { BarChart3, CircleAlert, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

import { ApiError } from '../../../shared/api/api-error';
import { useAuth } from '../../../shared/auth/auth-context';
import { getTeacherReportingDashboard } from '../reporting-api';
import { displayReportingPercentage } from '../reporting-format';
import { reportingQueryKeys } from '../reporting-query-keys';
import { ReportingFreshnessNotice } from '../components/ReportingFreshnessNotice';
import { TeacherProgressTable } from '../components/TeacherProgressTable';

export function TeacherReportingDashboardPage({ courseId }: { courseId: string }) {
  const { request, user } = useAuth();
  const actorId = user?.id ?? 'anonymous';
  const dashboard = useQuery({
    queryKey: reportingQueryKeys.teacherDashboard(actorId, courseId),
    queryFn: () => getTeacherReportingDashboard(request, courseId),
    enabled: Boolean(user && courseId),
    staleTime: 30_000,
  });

  if (dashboard.isPending) {
    return (
      <div className="reporting-loading" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <span>Đang tổng hợp báo cáo Course...</span>
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
            : 'Không thể tải báo cáo Course.'}
        </span>
        <button type="button" onClick={() => void dashboard.refetch()}>
          <RefreshCw size={16} aria-hidden="true" /> Thử lại
        </button>
      </div>
    );
  }
  const data = dashboard.data.data;
  return (
    <section className="teacher-reporting-dashboard" aria-labelledby="teacher-reporting-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Reporting</p>
          <h2 id="teacher-reporting-title">Tổng quan tiến độ</h2>
        </div>
        <Link className="button-link" to={`/teacher/courses/${courseId}/analytics`}>
          <BarChart3 size={17} aria-hidden="true" /> Phân tích chi tiết
        </Link>
      </div>
      <ReportingFreshnessNotice
        metadata={data.reporting}
        refreshing={dashboard.isFetching}
        onRefresh={() => void dashboard.refetch()}
      />
      <dl className="reporting-summary-strip teacher-summary-strip">
        <div>
          <dt>Student hoạt động</dt>
          <dd>{data.summary.activeStudentCount}</dd>
        </div>
        <div>
          <dt>Hoạt động bắt buộc</dt>
          <dd>{data.summary.requiredActivityCount}</dd>
        </div>
        <div>
          <dt>Tiến độ trung bình</dt>
          <dd>{displayReportingPercentage(data.summary.averageProgressPercentage)}</dd>
        </div>
        <div>
          <dt>Grade đã trả</dt>
          <dd>{displayReportingPercentage(data.summary.averageReturnedGrade)}</dd>
        </div>
        <div>
          <dt>Thiếu</dt>
          <dd>{data.summary.missingActivityCount}</dd>
        </div>
        <div>
          <dt>Chưa chấm</dt>
          <dd>{data.summary.ungradedActivityCount}</dd>
        </div>
      </dl>
      <div className="section-heading">
        <h3>Top Student theo tiến độ</h3>
        <Link className="row-link" to={`/teacher/courses/${courseId}/analytics`}>
          Xem toàn bộ
        </Link>
      </div>
      <TeacherProgressTable
        courseId={courseId}
        rows={data.topStudents}
        returnTo={`/teacher/courses/${courseId}`}
      />
    </section>
  );
}
