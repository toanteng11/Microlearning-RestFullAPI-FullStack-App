import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, CircleAlert, Columns3, RefreshCw, Rows3 } from 'lucide-react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';

import { ApiError } from '../../../shared/api/api-error';
import { useAuth } from '../../../shared/auth/auth-context';
import { ExportCsvButton } from '../components/ExportCsvButton';
import { GradebookFilters, type GradebookFilterValues } from '../components/GradebookFilters';
import { GradebookTable } from '../components/GradebookTable';
import { ReportingFreshnessNotice } from '../components/ReportingFreshnessNotice';
import { getTeacherGradebook } from '../reporting-api';
import { reportingQueryKeys } from '../reporting-query-keys';
import type {
  GradebookColumn,
  GradebookCompletionStatus,
  GradebookGradingStatus,
  GradebookQuery,
} from '../reporting.types';

const activityTypes = new Set(['LESSON', 'QUIZ', 'ASSIGNMENT']);
const completionStatuses = new Set([
  'NOT_APPLICABLE',
  'NOT_STARTED',
  'IN_PROGRESS',
  'MISSING',
  'COMPLETED',
  'LATE',
]);
const gradingStatuses = new Set([
  'NOT_GRADABLE',
  'NOT_READY',
  'AWAITING_GRADE',
  'DRAFT',
  'RETURNED',
]);
const sortFields = new Set([
  'processScore',
  'progressPercentage',
  'returnedGradeAverage',
  'missingCount',
  'lateCount',
  'fullName',
]);

function positiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function optionalEnum<T extends string>(value: string | null, allowed: Set<string>) {
  return value && allowed.has(value) ? (value as T) : undefined;
}

export function TeacherGradebookPage() {
  const { courseId = '' } = useParams();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const { request, user } = useAuth();
  const query: GradebookQuery = {
    page: positiveInt(params.get('page'), 1),
    limit: Math.min(50, positiveInt(params.get('limit'), 20)),
    search: params.get('search')?.trim() || undefined,
    activityType: optionalEnum<GradebookColumn['activityType']>(
      params.get('activityType'),
      activityTypes,
    ),
    completionStatus: optionalEnum<GradebookCompletionStatus>(
      params.get('completionStatus'),
      completionStatuses,
    ),
    gradingStatus: optionalEnum<GradebookGradingStatus>(
      params.get('gradingStatus'),
      gradingStatuses,
    ),
    moduleId: params.get('moduleId') ?? undefined,
    activityLimit: Math.min(50, positiveInt(params.get('activityLimit'), 25)),
    activityCursor: params.get('activityCursor') ?? undefined,
    sortBy:
      optionalEnum<GradebookQuery['sortBy']>(params.get('sortBy'), sortFields) ?? 'processScore',
    sortOrder: params.get('sortOrder') === 'asc' ? 'asc' : 'desc',
  };
  const actorId = user?.id ?? 'anonymous';
  const gradebook = useQuery({
    queryKey: reportingQueryKeys.teacherGradebook(actorId, courseId, query),
    queryFn: () => getTeacherGradebook(request, courseId, query),
    enabled: Boolean(user && courseId),
    staleTime: 30_000,
  });

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    }
    setParams(next);
  };
  const applyFilters = (values: GradebookFilterValues) => {
    update({
      search: values.search ?? null,
      activityType: values.activityType ?? null,
      completionStatus: values.completionStatus ?? null,
      gradingStatus: values.gradingStatus ?? null,
      sortBy: values.sortBy,
      sortOrder: values.sortOrder,
      page: null,
      activityCursor: null,
    });
  };
  const resetFilters = () => setParams(new URLSearchParams());
  const returnTo = `${location.pathname}${location.search}`;
  const exportSearch = new URLSearchParams({
    activityLimit: String(query.activityLimit),
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });
  if (query.search) exportSearch.set('search', query.search);
  if (query.activityType) exportSearch.set('activityType', query.activityType);
  if (query.completionStatus) exportSearch.set('completionStatus', query.completionStatus);
  if (query.gradingStatus) exportSearch.set('gradingStatus', query.gradingStatus);
  if (query.moduleId) exportSearch.set('moduleId', query.moduleId);

  return (
    <section className="page-section gradebook-page" aria-labelledby="gradebook-title">
      <header className="page-header page-header--aligned">
        <div>
          <p className="eyebrow">Teacher Gradebook</p>
          <h1 id="gradebook-title">{gradebook.data?.data.course.title ?? 'Bảng điểm Course'}</h1>
          <p>Theo dõi tiến độ và trạng thái chấm điểm của từng Student.</p>
        </div>
        <div className="gradebook-header-actions">
          {gradebook.data?.data.allowedActions.includes('EXPORT_REPORT') ? (
            <ExportCsvButton
              path={`/teacher/courses/${courseId}/gradebook/export?${exportSearch.toString()}`}
              filename={`course-${courseId}-gradebook.csv`}
            />
          ) : null}
          <Link className="button-link button-link--secondary" to={`/teacher/courses/${courseId}`}>
            <ChevronLeft size={17} aria-hidden="true" /> Course
          </Link>
          <Link
            className="button-link button-link--secondary"
            to={`/teacher/courses/${courseId}/analytics`}
          >
            <Rows3 size={17} aria-hidden="true" /> Phân tích
          </Link>
        </div>
      </header>

      <GradebookFilters query={query} onApply={applyFilters} onReset={resetFilters} />

      {gradebook.isPending ? (
        <div className="reporting-loading" aria-live="polite">
          <div className="spinner" aria-hidden="true" /> Đang tải Gradebook...
        </div>
      ) : null}
      {gradebook.isError ? (
        <div className="notice notice--error reporting-inline-error" role="alert">
          <CircleAlert size={18} aria-hidden="true" />
          <span>
            {gradebook.error instanceof ApiError &&
            (gradebook.error.status === 403 || gradebook.error.status === 404)
              ? 'Bạn không có quyền xem Gradebook của Course này.'
              : gradebook.error instanceof ApiError
                ? gradebook.error.message
                : 'Không thể tải Gradebook.'}
          </span>
          <button type="button" onClick={() => void gradebook.refetch()}>
            <RefreshCw size={16} aria-hidden="true" /> Thử lại
          </button>
        </div>
      ) : null}

      {gradebook.data ? (
        <>
          <ReportingFreshnessNotice
            metadata={gradebook.data.data.reporting}
            refreshing={gradebook.isFetching}
            onRefresh={() => void gradebook.refetch()}
          />
          {gradebook.data.data.columns.length === 0 ? (
            <div className="empty-state">
              <Columns3 size={28} aria-hidden="true" />
              <h2>Chưa có hoạt động phù hợp</h2>
              <p>Course chưa có Quiz hoặc Assignment phù hợp với bộ lọc hiện tại.</p>
              <Link className="button-link" to={`/teacher/courses/${courseId}/content`}>
                Quản lý nội dung
              </Link>
            </div>
          ) : gradebook.data.data.rows.length === 0 ? (
            <div className="empty-state">
              <Rows3 size={28} aria-hidden="true" />
              <h2>Không có Student phù hợp</h2>
              <p>Không có hàng dữ liệu phù hợp với bộ lọc hoặc trang hiện tại.</p>
              <button type="button" onClick={resetFilters}>
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            <GradebookTable
              courseId={courseId}
              columns={gradebook.data.data.columns}
              rows={gradebook.data.data.rows}
              returnTo={returnTo}
            />
          )}

          <div className="gradebook-pagination-bands">
            <nav className="reporting-pagination" aria-label="Phân trang Student">
              <button
                type="button"
                disabled={!gradebook.data.meta.hasPreviousPage}
                onClick={() => update({ page: String(query.page - 1) })}
              >
                <ChevronLeft size={16} aria-hidden="true" /> Student trước
              </button>
              <span>
                Trang Student {gradebook.data.meta.page}/
                {Math.max(1, gradebook.data.meta.totalPages)}
              </span>
              <button
                type="button"
                disabled={!gradebook.data.meta.hasNextPage}
                onClick={() => update({ page: String(query.page + 1) })}
              >
                Student sau <ChevronRight size={16} aria-hidden="true" />
              </button>
            </nav>
            <nav className="reporting-pagination" aria-label="Phân trang hoạt động">
              <button
                type="button"
                disabled={!query.activityCursor}
                onClick={() => update({ activityCursor: null, page: null })}
              >
                <ChevronLeft size={16} aria-hidden="true" /> Cột đầu
              </button>
              <span>Tối đa {gradebook.data.data.activityPage.limit} hoạt động mỗi lượt</span>
              <button
                type="button"
                disabled={!gradebook.data.data.activityPage.nextCursor}
                onClick={() =>
                  update({
                    activityCursor: gradebook.data!.data.activityPage.nextCursor,
                    page: null,
                  })
                }
              >
                Cột tiếp theo <ChevronRight size={16} aria-hidden="true" />
              </button>
            </nav>
          </div>
        </>
      ) : null}
    </section>
  );
}
