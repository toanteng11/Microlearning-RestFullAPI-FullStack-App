import { useQuery } from '@tanstack/react-query';
import { Award, BookOpen, CalendarClock, CircleAlert, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

import { ApiError } from '../../../shared/api/api-error';
import { useAuth } from '../../../shared/auth/auth-context';
import { StudentClassroomsPage } from '../../classrooms/pages/StudentClassroomsPage';
import { ProgressStatusBadge } from '../../learning/components/LearningStatusBadge';
import { displayLearningDate } from '../../learning/learning-format';
import { getStudentReportingDashboard } from '../reporting-api';
import { displayReportingDate, displayReportingPercentage } from '../reporting-format';
import { reportingQueryKeys } from '../reporting-query-keys';
import { ReportingFreshnessNotice } from '../components/ReportingFreshnessNotice';
import { StudentCourseProgressTable } from '../components/StudentCourseProgressTable';

function errorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : 'Không thể tải báo cáo học tập. Các chức năng lớp học vẫn có thể sử dụng.';
}

export function StudentReportingDashboardPage() {
  const { request, user } = useAuth();
  const actorId = user?.id ?? 'anonymous';
  const dashboard = useQuery({
    queryKey: reportingQueryKeys.studentDashboard(actorId),
    queryFn: () => getStudentReportingDashboard(request),
    enabled: Boolean(user),
    staleTime: 30_000,
  });

  return (
    <section className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Student workspace</p>
          <h1>Xin chào, {user?.fullName}</h1>
          <p>Theo dõi công việc cần làm và tiến độ học tập của bạn.</p>
        </div>
      </header>

      <section className="reporting-dashboard-band" aria-labelledby="learning-overview-title">
        <div className="section-heading">
          <h2 id="learning-overview-title">Tổng quan học tập</h2>
          <Link className="row-link" to="/student/progress">
            Xem toàn bộ tiến độ
          </Link>
        </div>

        {dashboard.isPending ? (
          <div className="reporting-loading" aria-live="polite">
            <div className="spinner" aria-hidden="true" />
            <span>Đang tổng hợp dữ liệu học tập...</span>
          </div>
        ) : null}
        {dashboard.isError ? (
          <div className="notice notice--error reporting-inline-error" role="alert">
            <CircleAlert size={19} aria-hidden="true" />
            <span>{errorMessage(dashboard.error)}</span>
            <button type="button" onClick={() => void dashboard.refetch()}>
              <RefreshCw size={16} aria-hidden="true" /> Thử lại
            </button>
          </div>
        ) : null}

        {dashboard.data ? (
          <>
            <dl className="reporting-summary-strip">
              <div>
                <dt>Lớp đang tham gia</dt>
                <dd>{dashboard.data.data.summary.activeClassroomCount}</dd>
              </div>
              <div>
                <dt>Khóa đang học</dt>
                <dd>{dashboard.data.data.summary.activeCourseCount}</dd>
              </div>
              <div>
                <dt>Chưa hoàn thành</dt>
                <dd>{dashboard.data.data.summary.pendingCount}</dd>
              </div>
              <div>
                <dt>Sắp đến hạn</dt>
                <dd>{dashboard.data.data.summary.dueSoonCount}</dd>
              </div>
              <div>
                <dt>Thiếu bài</dt>
                <dd>{dashboard.data.data.summary.missingCount}</dd>
              </div>
            </dl>

            <ReportingFreshnessNotice
              metadata={dashboard.data.data.reporting}
              refreshing={dashboard.isFetching}
              onRefresh={() => void dashboard.refetch()}
            />

            <div className="reporting-dashboard-columns">
              <section className="reporting-list-band" aria-labelledby="student-todo-preview">
                <div className="panel-title">
                  <CalendarClock size={20} aria-hidden="true" />
                  <h2 id="student-todo-preview">Việc cần làm</h2>
                </div>
                {dashboard.data.data.todo.items.length === 0 ? (
                  <div className="empty-state">
                    <strong>Bạn đã hoàn thành các công việc hiện có</strong>
                  </div>
                ) : (
                  <div className="dashboard-todo-list">
                    {dashboard.data.data.todo.items.map((item) => (
                      <article key={`${item.activityType}:${item.activityId}`}>
                        <div>
                          <Link to={item.actionUrl}>{item.title}</Link>
                          <small>
                            {item.course.title} · {displayLearningDate(item.effectiveDeadline)}
                          </small>
                        </div>
                        <ProgressStatusBadge status={item.progress.derivedStatus} />
                      </article>
                    ))}
                    <Link className="row-link" to="/student/todo">
                      Xem tất cả {dashboard.data.data.todo.totalItems} công việc
                    </Link>
                  </div>
                )}
              </section>

              <section className="reporting-list-band" aria-labelledby="student-grade-preview">
                <div className="panel-title">
                  <Award size={20} aria-hidden="true" />
                  <h2 id="student-grade-preview">Kết quả mới trả</h2>
                </div>
                {dashboard.data.data.recentGrades.length === 0 ? (
                  <div className="empty-state">
                    <strong>Chưa có kết quả được trả</strong>
                  </div>
                ) : (
                  <div className="reporting-grade-list">
                    {dashboard.data.data.recentGrades.map((grade) => (
                      <article key={grade.gradeId}>
                        <div>
                          <Link to={grade.actionUrl}>{grade.activityTitle}</Link>
                          <small>
                            {displayReportingDate(
                              grade.returnedAt,
                              dashboard.data.data.reporting.timezone,
                            )}
                          </small>
                        </div>
                        <strong>{displayReportingPercentage(grade.normalizedScore)}</strong>
                      </article>
                    ))}
                    <Link className="row-link" to="/student/grades">
                      Xem tất cả điểm
                    </Link>
                  </div>
                )}
              </section>
            </div>

            <section className="reporting-course-preview" aria-labelledby="course-progress-preview">
              <div className="panel-title">
                <BookOpen size={20} aria-hidden="true" />
                <h2 id="course-progress-preview">Tiến độ khóa học</h2>
              </div>
              {dashboard.data.data.courses.length === 0 ? (
                <div className="empty-state">
                  <strong>Chưa có dữ liệu tiến độ khóa học</strong>
                </div>
              ) : (
                <StudentCourseProgressTable
                  items={dashboard.data.data.courses}
                  timezone={dashboard.data.data.reporting.timezone}
                />
              )}
            </section>
          </>
        ) : null}
      </section>

      <StudentClassroomsPage embedded showHeader={false} showTodo={false} />
    </section>
  );
}
