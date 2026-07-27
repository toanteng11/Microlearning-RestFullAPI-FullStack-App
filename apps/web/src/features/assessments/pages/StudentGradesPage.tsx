import { ArrowLeft, ArrowRight, Award, BookOpenCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useAuth } from '../../../shared/auth/auth-context';
import { requestErrorMessage } from '../../learning/learning-format';
import { displayAssessmentDate } from '../assessment-format';
import type { StudentGradesEnvelope } from '../assessment.types';

const PAGE_SIZE = 20;

export function StudentGradesPage() {
  const { request } = useAuth();
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState<StudentGradesEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activityType = params.get('activityType') ?? '';
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      status: 'RETURNED',
    });
    if (activityType) query.set('activityType', activityType);
    void request<StudentGradesEnvelope>(`/students/me/grades?${query}`)
      .then((response) => {
        if (!active) return;
        setResult(response);
        setError(null);
      })
      .catch((requestError) => {
        if (active) setError(requestErrorMessage(requestError, 'Không thể tải bảng điểm.'));
      });
    return () => {
      active = false;
    };
  }, [activityType, page, request]);

  return (
    <section className="page-section assessment-workspace">
      <header className="page-header page-header--aligned">
        <div>
          <p className="eyebrow">Student grades</p>
          <h1>Điểm và nhận xét</h1>
          <p>Chỉ các kết quả đã được giảng viên trả mới xuất hiện tại đây.</p>
        </div>
        <Award size={30} aria-hidden="true" />
      </header>
      <div className="segmented-control" role="tablist" aria-label="Loại điểm">
        {[
          ['', 'Tất cả'],
          ['QUIZ', 'Bài kiểm tra'],
          ['ASSIGNMENT', 'Bài tập'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={activityType === value}
            className={activityType === value ? 'is-active' : ''}
            onClick={() => {
              const next = new URLSearchParams({ page: '1' });
              if (value) next.set('activityType', value);
              setParams(next);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {error ? <div className="notice notice--error">{error}</div> : null}
      {!result && !error ? (
        <div className="list-state">
          <div className="spinner" />
        </div>
      ) : null}
      {result?.data.items.length === 0 ? (
        <div className="list-state">
          <BookOpenCheck size={30} />
          <strong>Chưa có điểm đã trả.</strong>
        </div>
      ) : null}
      {result && result.data.items.length > 0 ? (
        <div className="grade-list">
          {result.data.items.map((grade) => (
            <article className="grade-row" key={grade.id}>
              <div>
                <span className="activity-type-label">
                  {grade.activityType === 'QUIZ' ? 'Bài kiểm tra' : 'Bài tập'}
                </span>
                <h2>{grade.title}</h2>
                <small>
                  Trả ngày{' '}
                  {grade.returnedAt ? displayAssessmentDate(grade.returnedAt) : 'Chưa xác định'}
                </small>
              </div>
              <div className="grade-score">
                <strong>
                  {grade.score}/{grade.maxScore}
                </strong>
                <span>{grade.percentage}%</span>
              </div>
              <Link className="button-link button-link--compact" to={`/student/grades/${grade.id}`}>
                Xem nhận xét
              </Link>
            </article>
          ))}
        </div>
      ) : null}
      {result && result.meta.totalPages > 1 ? (
        <div className="pagination">
          <button
            className="secondary-button"
            type="button"
            disabled={!result.meta.hasPreviousPage}
            aria-label="Trang điểm trước"
            onClick={() => {
              const next = new URLSearchParams({ page: String(page - 1) });
              if (activityType) next.set('activityType', activityType);
              setParams(next);
            }}
          >
            <ArrowLeft size={17} />
          </button>
          <span>
            Trang {page} / {result.meta.totalPages}
          </span>
          <button
            className="secondary-button"
            type="button"
            disabled={!result.meta.hasNextPage}
            aria-label="Trang điểm sau"
            onClick={() => {
              const next = new URLSearchParams({ page: String(page + 1) });
              if (activityType) next.set('activityType', activityType);
              setParams(next);
            }}
          >
            <ArrowRight size={17} />
          </button>
        </div>
      ) : null}
    </section>
  );
}
