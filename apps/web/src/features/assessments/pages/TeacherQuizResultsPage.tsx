import {
  ArrowLeft,
  ArrowRight,
  CalendarPlus,
  CheckCircle2,
  ClipboardCheck,
  Search,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { useAuth } from '../../../shared/auth/auth-context';
import { requestErrorMessage } from '../../learning/learning-format';
import { displayAssessmentDate } from '../assessment-format';
import type { TeacherQuiz, TeacherQuizResultsEnvelope } from '../assessment.types';
import { ActivityStatusBadge } from '../components/ActivityStatusBadge';

const PAGE_SIZE = 20;

export function TeacherQuizResultsPage() {
  const { quizId = '' } = useParams();
  const { request } = useAuth();
  const [params, setParams] = useSearchParams();
  const [quiz, setQuiz] = useState<TeacherQuiz | null>(null);
  const [result, setResult] = useState<TeacherQuizResultsEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);
  const keyword = params.get('keyword') ?? '';
  const status = params.get('status') ?? '';
  const sort = params.get('sort') ?? 'submittedAt:asc';
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      sort,
    });
    if (keyword) query.set('keyword', keyword);
    if (status) query.set('status', status);
    void Promise.all([
      request<{ success: true; data: TeacherQuiz }>(`/teacher/quizzes/${quizId}`),
      request<TeacherQuizResultsEnvelope>(`/teacher/quizzes/${quizId}/results?${query}`),
    ])
      .then(([quizResponse, resultResponse]) => {
        if (!active) return;
        setQuiz(quizResponse.data);
        setResult(resultResponse);
        setError(null);
      })
      .catch((requestError) => {
        if (active)
          setError(requestErrorMessage(requestError, 'Không thể tải kết quả bài kiểm tra.'));
      });
    return () => {
      active = false;
    };
  }, [keyword, page, quizId, request, sort, status]);

  function updateQuery(name: string, value: string) {
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(name, value);
      else next.delete(name);
      next.set('page', '1');
      return next;
    });
  }

  return (
    <section className="page-section assessment-workspace">
      <Link className="back-link" to={quiz ? `/teacher/quizzes/${quiz.id}/edit` : '..'}>
        <ArrowLeft size={17} /> Quay lại bài kiểm tra
      </Link>
      <header className="page-header page-header--aligned">
        <div>
          <p className="eyebrow">Quiz results</p>
          <h1>{quiz?.title ?? 'Kết quả bài kiểm tra'}</h1>
          <p>Review câu trả lời, chấm phần tự luận và phát hành kết quả cho học viên.</p>
        </div>
        {quiz ? <ActivityStatusBadge status={quiz.status} /> : null}
      </header>

      {result ? (
        <div className="assessment-facts assessment-facts--compact">
          <div>
            <strong>{result.summary.totalAttempts}</strong>
            <span>Lượt làm</span>
          </div>
          <div>
            <strong>{result.summary.needsReview}</strong>
            <span>Chờ review</span>
          </div>
          <div>
            <strong>{result.summary.released}</strong>
            <span>Đã trả kết quả</span>
          </div>
        </div>
      ) : null}

      <div className="assessment-filter assessment-filter--results">
        <label className="form-field">
          <span>Tìm học viên</span>
          <div className="input-with-icon">
            <Search size={17} />
            <input
              value={keyword}
              onChange={(event) => updateQuery('keyword', event.target.value)}
              placeholder="Tên, email hoặc mã học viên"
            />
          </div>
        </label>
        <label className="form-field">
          <span>Trạng thái</span>
          <select value={status} onChange={(event) => updateQuery('status', event.target.value)}>
            <option value="">Tất cả</option>
            <option value="NEEDS_REVIEW">Chờ review</option>
            <option value="GRADED">Đã chấm</option>
            <option value="RESULT_RELEASED">Đã trả kết quả</option>
            <option value="SUBMITTED">Đã nộp</option>
            <option value="TIMED_OUT">Hết giờ</option>
            <option value="IN_PROGRESS">Đang làm</option>
          </select>
        </label>
        <label className="form-field">
          <span>Sắp xếp</span>
          <select value={sort} onChange={(event) => updateQuery('sort', event.target.value)}>
            <option value="submittedAt:asc">Thời gian nộp</option>
            <option value="score:desc">Điểm cao trước</option>
            <option value="studentName:asc">Tên học viên</option>
          </select>
        </label>
      </div>

      {error ? <div className="notice notice--error">{error}</div> : null}
      {!result && !error ? (
        <div className="list-state">
          <div className="spinner" />
        </div>
      ) : null}
      {result?.data.items.length === 0 ? (
        <div className="list-state">
          <CheckCircle2 size={30} />
          <strong>Chưa có lượt làm phù hợp.</strong>
        </div>
      ) : null}
      {result && result.data.items.length > 0 ? (
        <div className="submission-table" role="table" aria-label="Kết quả bài kiểm tra">
          {result.data.items.map((row) => (
            <article
              className="submission-row submission-row--actions"
              key={row.attemptId}
              role="row"
            >
              <div>
                <strong>{row.student.fullName}</strong>
                <small>{row.student.studentCode ?? row.student.email}</small>
              </div>
              <div>
                <ActivityStatusBadge status={row.status} />
                <small>Lượt {row.attemptNumber}</small>
              </div>
              <div>
                <strong>{row.score === null ? 'Chưa chấm' : `${row.score}/${row.maxScore}`}</strong>
                <small>
                  {row.submittedAt ? displayAssessmentDate(row.submittedAt) : 'Chưa nộp'}
                </small>
              </div>
              <div className="inline-actions">
                <Link
                  className="icon-button"
                  title="Gia hạn deadline"
                  aria-label={`Gia hạn cho ${row.student.fullName}`}
                  to={`/teacher/activities/quizzes/${quizId}/deadline-exceptions?studentId=${row.student.id}`}
                >
                  <CalendarPlus size={18} />
                </Link>
                <Link
                  className="button-link button-link--compact"
                  to={`/teacher/quiz-attempts/${row.attemptId}/review`}
                >
                  <ClipboardCheck size={17} /> Review
                </Link>
              </div>
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
            aria-label="Trang trước"
            onClick={() =>
              setParams((current) => {
                const next = new URLSearchParams(current);
                next.set('page', String(page - 1));
                return next;
              })
            }
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
            aria-label="Trang sau"
            onClick={() =>
              setParams((current) => {
                const next = new URLSearchParams(current);
                next.set('page', String(page + 1));
                return next;
              })
            }
          >
            <ArrowRight size={17} />
          </button>
        </div>
      ) : null}
    </section>
  );
}
