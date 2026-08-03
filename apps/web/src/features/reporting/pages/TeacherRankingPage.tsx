import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CircleAlert, RefreshCw } from 'lucide-react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';

import { useAuth } from '../../../shared/auth/auth-context';
import { displayLearningDate } from '../../learning/learning-format';
import {
  listTeacherActivities,
  listTeacherAssessments,
  listTeacherProgress,
} from '../reporting-api';
import { displayReportingPercentage } from '../reporting-format';
import { reportingQueryKeys } from '../reporting-query-keys';
import type {
  TeacherActivityQuery,
  TeacherAssessmentQuery,
  TeacherProgressQuery,
} from '../reporting.types';
import { ReportingFreshnessNotice } from '../components/ReportingFreshnessNotice';
import { TeacherProgressTable } from '../components/TeacherProgressTable';

type AnalyticsTab = 'progress' | 'activities' | 'assessments' | 'support';

function positiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function currentTab(value: string | null): AnalyticsTab {
  return ['progress', 'activities', 'assessments', 'support'].includes(value ?? '')
    ? (value as AnalyticsTab)
    : 'progress';
}

export function TeacherRankingPage() {
  const { courseId = '' } = useParams();
  const { request, user } = useAuth();
  const actorId = user?.id ?? 'anonymous';
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const tab = currentTab(params.get('tab'));
  const page = positiveInt(params.get('page'), 1);
  const limit = 20;
  const search = params.get('search')?.trim() || undefined;
  const sortOrder = params.get('sortOrder') === 'asc' ? 'asc' : 'desc';
  const progressQuery: TeacherProgressQuery = {
    page,
    limit,
    search,
    progressStatus: ['NOT_STARTED', 'IN_PROGRESS', 'MISSING', 'COMPLETED', 'LATE'].includes(
      params.get('progressStatus') ?? '',
    )
      ? (params.get('progressStatus') as TeacherProgressQuery['progressStatus'])
      : undefined,
    supportFlag:
      tab === 'support'
        ? 'HAS_MISSING_WORK'
        : params.get('supportFlag') === 'HAS_UNGRADED_WORK'
          ? 'HAS_UNGRADED_WORK'
          : undefined,
    sortBy: [
      'processScore',
      'progressPercentage',
      'returnedGradeAverage',
      'missingActivityCount',
      'lateActivityCount',
      'lastActiveAt',
      'fullName',
    ].includes(params.get('sortBy') ?? '')
      ? (params.get('sortBy') as TeacherProgressQuery['sortBy'])
      : 'processScore',
    sortOrder,
  };
  const activityQuery: TeacherActivityQuery = {
    page,
    limit,
    search,
    activityType: ['LESSON', 'QUIZ', 'ASSIGNMENT'].includes(params.get('activityType') ?? '')
      ? (params.get('activityType') as TeacherActivityQuery['activityType'])
      : undefined,
    sortBy: ['position', 'deadline', 'completionPercentage', 'missingCount', 'title'].includes(
      params.get('sortBy') ?? '',
    )
      ? (params.get('sortBy') as TeacherActivityQuery['sortBy'])
      : 'position',
    sortOrder: params.get('sortOrder') === 'desc' ? 'desc' : 'asc',
  };
  const assessmentQuery: TeacherAssessmentQuery = {
    page,
    limit,
    search,
    activityType: ['QUIZ', 'ASSIGNMENT'].includes(params.get('activityType') ?? '')
      ? (params.get('activityType') as TeacherAssessmentQuery['activityType'])
      : undefined,
    sortBy: [
      'position',
      'title',
      'submissionPercentage',
      'returnedGradeAverage',
      'missingCount',
    ].includes(params.get('sortBy') ?? '')
      ? (params.get('sortBy') as TeacherAssessmentQuery['sortBy'])
      : 'position',
    sortOrder: params.get('sortOrder') === 'desc' ? 'desc' : 'asc',
  };
  const progress = useQuery({
    queryKey: reportingQueryKeys.teacherProgress(actorId, courseId, progressQuery),
    queryFn: () => listTeacherProgress(request, courseId, progressQuery),
    enabled: Boolean(user && courseId && (tab === 'progress' || tab === 'support')),
  });
  const activities = useQuery({
    queryKey: reportingQueryKeys.teacherActivities(actorId, courseId, activityQuery),
    queryFn: () => listTeacherActivities(request, courseId, activityQuery),
    enabled: Boolean(user && courseId && tab === 'activities'),
  });
  const assessments = useQuery({
    queryKey: reportingQueryKeys.teacherAssessments(actorId, courseId, assessmentQuery),
    queryFn: () => listTeacherAssessments(request, courseId, assessmentQuery),
    enabled: Boolean(user && courseId && tab === 'assessments'),
  });
  const activeQuery =
    tab === 'activities' ? activities : tab === 'assessments' ? assessments : progress;
  const metadata = activeQuery.data?.data.reporting;
  const meta = activeQuery.data?.meta;

  function update(values: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next);
  }

  function selectTab(nextTab: AnalyticsTab) {
    setParams(new URLSearchParams({ tab: nextTab }));
  }

  return (
    <section className="page-section teacher-analytics-page">
      <Link className="back-link" to={`/teacher/courses/${courseId}`}>
        <ArrowLeft size={17} aria-hidden="true" /> Course Dashboard
      </Link>
      <header className="page-header">
        <div>
          <p className="eyebrow">Teacher analytics</p>
          <h1>{activeQuery.data?.data.course.title ?? 'Phân tích Course'}</h1>
          <p>Đối chiếu tiến độ, hoạt động và assessment theo dữ liệu phía server.</p>
        </div>
      </header>
      <div className="reporting-tabs" role="tablist" aria-label="Loại báo cáo">
        {[
          ['progress', 'Tiến độ'],
          ['activities', 'Hoạt động'],
          ['assessments', 'Assessment'],
          ['support', 'Cần hỗ trợ'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => selectTab(value as AnalyticsTab)}
          >
            {label}
          </button>
        ))}
      </div>
      <form
        className="reporting-filter-bar"
        onSubmit={(event) => {
          event.preventDefault();
          const values = new FormData(event.currentTarget);
          update({
            search: String(values.get('search') ?? '').trim() || null,
            progressStatus:
              tab === 'progress' || tab === 'support'
                ? String(values.get('status') ?? '') || null
                : null,
            activityType:
              tab === 'activities' || tab === 'assessments'
                ? String(values.get('status') ?? '') || null
                : null,
            page: null,
          });
        }}
      >
        <label>
          Tìm kiếm
          <input name="search" defaultValue={search} maxLength={100} placeholder="Tên hoặc mã" />
        </label>
        <label>
          {tab === 'progress' || tab === 'support' ? 'Trạng thái' : 'Loại hoạt động'}
          <select
            key={`status-${tab}`}
            name="status"
            defaultValue={
              tab === 'progress' || tab === 'support'
                ? progressQuery.progressStatus
                : tab === 'activities'
                  ? activityQuery.activityType
                  : assessmentQuery.activityType
            }
          >
            <option value="">Tất cả</option>
            {tab === 'progress' || tab === 'support' ? (
              <>
                <option value="NOT_STARTED">Chưa bắt đầu</option>
                <option value="IN_PROGRESS">Đang học</option>
                <option value="MISSING">Thiếu</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="LATE">Hoàn thành trễ</option>
              </>
            ) : (
              <>
                {tab === 'activities' ? <option value="LESSON">Bài học</option> : null}
                <option value="QUIZ">Quiz</option>
                <option value="ASSIGNMENT">Assignment</option>
              </>
            )}
          </select>
        </label>
        <label>
          Sắp xếp
          <select
            value={
              tab === 'progress' || tab === 'support'
                ? progressQuery.sortBy
                : tab === 'activities'
                  ? activityQuery.sortBy
                  : assessmentQuery.sortBy
            }
            onChange={(event) => update({ sortBy: event.target.value, page: null })}
          >
            {tab === 'progress' || tab === 'support' ? (
              <>
                <option value="processScore">Điểm quá trình</option>
                <option value="progressPercentage">Tiến độ</option>
                <option value="returnedGradeAverage">Grade đã trả</option>
                <option value="missingActivityCount">Số bài thiếu</option>
                <option value="lastActiveAt">Hoạt động gần nhất</option>
                <option value="fullName">Tên Student</option>
              </>
            ) : tab === 'activities' ? (
              <>
                <option value="position">Thứ tự nội dung</option>
                <option value="deadline">Deadline</option>
                <option value="completionPercentage">Tỷ lệ hoàn thành</option>
                <option value="missingCount">Số bài thiếu</option>
                <option value="title">Tiêu đề</option>
              </>
            ) : (
              <>
                <option value="position">Thứ tự nội dung</option>
                <option value="submissionPercentage">Tỷ lệ nộp</option>
                <option value="returnedGradeAverage">Grade đã trả</option>
                <option value="missingCount">Số bài thiếu</option>
                <option value="title">Tiêu đề</option>
              </>
            )}
          </select>
        </label>
        <label>
          Thứ tự
          <select
            value={
              tab === 'progress' || tab === 'support'
                ? progressQuery.sortOrder
                : tab === 'activities'
                  ? activityQuery.sortOrder
                  : assessmentQuery.sortOrder
            }
            onChange={(event) => update({ sortOrder: event.target.value, page: null })}
          >
            <option value="desc">Giảm dần</option>
            <option value="asc">Tăng dần</option>
          </select>
        </label>
        <button type="submit">Áp dụng</button>
      </form>
      {activeQuery.isPending ? (
        <div className="reporting-loading">
          <div className="spinner" /> Đang tải báo cáo...
        </div>
      ) : null}
      {activeQuery.isError ? (
        <div className="notice notice--error reporting-inline-error" role="alert">
          <CircleAlert size={18} />
          <span>Không thể tải báo cáo hoặc bạn không còn quyền trên Course này.</span>
          <button type="button" onClick={() => void activeQuery.refetch()}>
            <RefreshCw size={16} /> Thử lại
          </button>
        </div>
      ) : null}
      {metadata ? (
        <ReportingFreshnessNotice
          metadata={metadata}
          refreshing={activeQuery.isFetching}
          onRefresh={() => void activeQuery.refetch()}
        />
      ) : null}
      {(tab === 'progress' || tab === 'support') && progress.data ? (
        <TeacherProgressTable
          courseId={courseId}
          rows={progress.data.data.items}
          returnTo={`${location.pathname}${location.search}`}
        />
      ) : null}
      {tab === 'activities' && activities.data ? (
        <div className="reporting-table-scroll" role="region" aria-label="Phân tích hoạt động">
          <table className="reporting-table">
            <thead>
              <tr>
                <th>Hoạt động</th>
                <th>Hoàn thành</th>
                <th>Thiếu</th>
                <th>Trễ</th>
                <th>Chưa chấm</th>
                <th>Deadline</th>
              </tr>
            </thead>
            <tbody>
              {activities.data.data.items.map((row) => (
                <tr key={row.activityId}>
                  <td data-label="Hoạt động">
                    <Link to={row.actionUrl}>{row.title}</Link>
                    <small>{row.activityType}</small>
                  </td>
                  <td data-label="Hoàn thành">
                    {row.completedStudentCount}/{row.eligibleStudentCount} (
                    {displayReportingPercentage(row.completionPercentage)})
                  </td>
                  <td data-label="Thiếu">{row.missingStudentCount}</td>
                  <td data-label="Trễ">{row.lateStudentCount}</td>
                  <td data-label="Chưa chấm">{row.ungradedStudentCount}</td>
                  <td data-label="Deadline">{displayLearningDate(row.defaultDeadline)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {tab === 'assessments' && assessments.data ? (
        <div className="reporting-table-scroll" role="region" aria-label="Phân tích assessment">
          <table className="reporting-table">
            <thead>
              <tr>
                <th>Assessment</th>
                <th>Đã nộp</th>
                <th>Cần chấm</th>
                <th>Đã trả</th>
                <th>Thiếu</th>
                <th>Grade TB</th>
              </tr>
            </thead>
            <tbody>
              {assessments.data.data.items.map((row) => (
                <tr key={row.activityId}>
                  <td data-label="Assessment">
                    <Link to={row.actionUrl}>{row.title}</Link>
                    <small>{row.activityType}</small>
                  </td>
                  <td data-label="Đã nộp">
                    {row.submittedCount}/{row.eligibleStudentCount} (
                    {displayReportingPercentage(row.submissionPercentage)})
                  </td>
                  <td data-label="Cần chấm">{row.needsReviewCount}</td>
                  <td data-label="Đã trả">{row.returnedCount}</td>
                  <td data-label="Thiếu">{row.missingCount}</td>
                  <td data-label="Grade TB">
                    {displayReportingPercentage(row.returnedGradeAverage)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {meta ? (
        <nav className="reporting-pagination" aria-label="Phân trang báo cáo">
          <button
            type="button"
            disabled={!meta.hasPreviousPage}
            onClick={() => update({ page: String(page - 1) })}
          >
            Trang trước
          </button>
          <span>
            Trang {meta.page}/{Math.max(1, meta.totalPages)}
          </span>
          <button
            type="button"
            disabled={!meta.hasNextPage}
            onClick={() => update({ page: String(page + 1) })}
          >
            Trang sau
          </button>
        </nav>
      ) : null}
    </section>
  );
}
