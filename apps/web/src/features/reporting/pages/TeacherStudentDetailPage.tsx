import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CircleAlert, RefreshCw } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { useAuth } from '../../../shared/auth/auth-context';
import { ProgressStatusBadge } from '../../learning/components/LearningStatusBadge';
import { displayLearningDate } from '../../learning/learning-format';
import { getTeacherStudentProgress } from '../reporting-api';
import { displayReportingPercentage } from '../reporting-format';
import { reportingQueryKeys } from '../reporting-query-keys';
import { ReportingFreshnessNotice } from '../components/ReportingFreshnessNotice';

function safeReturnTo(value: string | null, courseId: string) {
  const prefix = `/teacher/courses/${courseId}`;
  return value?.startsWith(prefix) ? value : `${prefix}/analytics`;
}

export function TeacherStudentDetailPage() {
  const { courseId = '', studentId = '' } = useParams();
  const [params] = useSearchParams();
  const { request, user } = useAuth();
  const actorId = user?.id ?? 'anonymous';
  const detail = useQuery({
    queryKey: reportingQueryKeys.teacherStudent(actorId, courseId, studentId),
    queryFn: () => getTeacherStudentProgress(request, courseId, studentId),
    enabled: Boolean(user && courseId && studentId),
  });
  const backTo = safeReturnTo(params.get('returnTo'), courseId);

  if (detail.isPending) {
    return (
      <div className="list-state">
        <div className="spinner" />
      </div>
    );
  }
  if (detail.isError) {
    return (
      <section className="page-section">
        <Link className="back-link" to={backTo}>
          <ArrowLeft size={17} /> Quay lại báo cáo
        </Link>
        <div className="notice notice--error reporting-inline-error" role="alert">
          <CircleAlert size={18} />
          <span>Không thể tải Student hoặc Student không thuộc roster của Course.</span>
          <button type="button" onClick={() => void detail.refetch()}>
            <RefreshCw size={16} /> Thử lại
          </button>
        </div>
      </section>
    );
  }
  const data = detail.data.data;
  return (
    <section className="page-section teacher-student-detail">
      <Link className="back-link" to={backTo}>
        <ArrowLeft size={17} /> Quay lại báo cáo
      </Link>
      <header className="page-header">
        <div>
          <p className="eyebrow">Student learning detail</p>
          <h1>{data.student.fullName}</h1>
          <p>{data.student.studentCode ?? data.student.email}</p>
        </div>
        <ProgressStatusBadge status={data.summary.progressStatus} />
      </header>
      <ReportingFreshnessNotice
        metadata={data.reporting}
        refreshing={detail.isFetching}
        onRefresh={() => void detail.refetch()}
      />
      <dl className="reporting-summary-strip">
        <div>
          <dt>Hoàn thành</dt>
          <dd>
            {data.summary.completedRequiredCount}/{data.summary.requiredActivityCount}
          </dd>
        </div>
        <div>
          <dt>Điểm quá trình</dt>
          <dd>{displayReportingPercentage(data.summary.processScore)}</dd>
        </div>
        <div>
          <dt>Grade đã trả</dt>
          <dd>{displayReportingPercentage(data.summary.returnedGradeAverage)}</dd>
        </div>
        <div>
          <dt>Thiếu</dt>
          <dd>{data.summary.missingCount}</dd>
        </div>
        <div>
          <dt>Trễ</dt>
          <dd>{data.summary.lateCount}</dd>
        </div>
        <div>
          <dt>Chưa chấm</dt>
          <dd>{data.summary.ungradedCount}</dd>
        </div>
      </dl>
      <div className="section-heading">
        <h2>Chi tiết hoạt động</h2>
      </div>
      {data.activities.length === 0 ? (
        <p className="muted-text">Course chưa có hoạt động được xuất bản.</p>
      ) : (
        <div className="reporting-table-scroll" role="region" aria-label="Tiến độ từng hoạt động">
          <table className="reporting-table">
            <thead>
              <tr>
                <th>Hoạt động</th>
                <th>Tiến độ</th>
                <th>Chấm điểm</th>
                <th>Deadline</th>
                <th>Điểm</th>
              </tr>
            </thead>
            <tbody>
              {data.activities.map((row) => (
                <tr key={`${row.activityType}:${row.activityId}`}>
                  <td data-label="Hoạt động">
                    <Link to={row.actionUrl}>{row.title}</Link>
                    <small>{row.activityType}</small>
                  </td>
                  <td data-label="Tiến độ">{row.completionStatus}</td>
                  <td data-label="Chấm điểm">{row.gradingStatus}</td>
                  <td data-label="Deadline">{displayLearningDate(row.effectiveDeadline)}</td>
                  <td data-label="Điểm">
                    {row.score === null || row.maxScore === null
                      ? 'N/A'
                      : `${row.score}/${row.maxScore}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
