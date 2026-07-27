import { ArrowLeft, CalendarPlus, ClipboardCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { useAuth } from '../../../shared/auth/auth-context';
import { requestErrorMessage } from '../../learning/learning-format';

interface RosterRow {
  student: { id: string; fullName: string; email: string; studentCode: string | null };
  status: string;
  submission: { id: string; submittedAt: string | null; revision: number } | null;
  grade: { id: string; score: number; maxScore: number; status: string } | null;
  effectiveDeadline: string;
  hasDeadlineException: boolean;
}

export function TeacherAssignmentSubmissionsPage() {
  const { assignmentId = '' } = useParams();
  const { request } = useAuth();
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState<RosterRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const keyword = params.get('keyword') ?? '';
  const status = params.get('status') ?? '';
  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({ page: '1', limit: '100' });
    if (keyword) query.set('keyword', keyword);
    if (status) query.set('status', status);
    void request<{ success: true; data: { items: RosterRow[] } }>(
      `/teacher/assignments/${assignmentId}/submissions?${query}`,
    )
      .then((response) => {
        if (active) setRows(response.data.items);
      })
      .catch((requestError) => {
        if (active) setError(requestErrorMessage(requestError, 'Không thể tải danh sách nộp bài.'));
      });
    return () => {
      active = false;
    };
  }, [assignmentId, keyword, request, status]);
  return (
    <section className="page-section assessment-workspace">
      <Link className="back-link" to={`/teacher/assignments/${assignmentId}/edit`}>
        <ArrowLeft size={17} /> Quay lại bài tập
      </Link>
      <header className="page-header">
        <p className="eyebrow">Assignment roster</p>
        <h1>Danh sách nộp bài</h1>
      </header>
      <div className="assessment-filter">
        <label className="form-field">
          <span>Tìm học viên</span>
          <input
            value={keyword}
            onChange={(event) =>
              setParams({
                ...(status ? { status } : {}),
                ...(event.target.value ? { keyword: event.target.value } : {}),
              })
            }
          />
        </label>
        <label className="form-field">
          <span>Trạng thái</span>
          <select
            value={status}
            onChange={(event) =>
              setParams({
                ...(keyword ? { keyword } : {}),
                ...(event.target.value ? { status: event.target.value } : {}),
              })
            }
          >
            <option value="">Tất cả</option>
            {['ASSIGNED', 'IN_PROGRESS', 'MISSING', 'SUBMITTED', 'LATE', 'GRADED', 'RETURNED'].map(
              (value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ),
            )}
          </select>
        </label>
      </div>
      {error ? <div className="notice notice--error">{error}</div> : null}
      {!rows ? (
        <div className="list-state">
          <div className="spinner" />
        </div>
      ) : rows.length === 0 ? (
        <div className="list-state">
          <Users size={30} />
          <strong>Không có học viên phù hợp.</strong>
        </div>
      ) : (
        <div className="submission-table" role="table">
          {rows.map((row) => (
            <article
              className="submission-row submission-row--actions"
              key={row.student.id}
              role="row"
            >
              <div>
                <strong>{row.student.fullName}</strong>
                <small>{row.student.studentCode ?? row.student.email}</small>
              </div>
              <span>{row.status}</span>
              <span>
                {row.grade
                  ? `${row.grade.score}/${row.grade.maxScore} · ${row.grade.status}`
                  : row.submission
                    ? 'Chưa chấm'
                    : 'Chưa có bài làm'}
              </span>
              <div className="inline-actions">
                <Link
                  className="icon-button"
                  title="Gia hạn deadline"
                  aria-label={`Gia hạn cho ${row.student.fullName}`}
                  to={`/teacher/activities/assignments/${assignmentId}/deadline-exceptions?studentId=${row.student.id}`}
                >
                  <CalendarPlus size={18} />
                </Link>
                {row.submission ? (
                  <Link
                    className="button-link button-link--compact"
                    to={`/teacher/submissions/${row.submission.id}/grade?studentName=${encodeURIComponent(row.student.fullName)}`}
                  >
                    <ClipboardCheck size={17} /> Chấm bài
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
