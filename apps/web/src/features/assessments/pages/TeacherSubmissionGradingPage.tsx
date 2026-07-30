import { ArrowLeft, Check, RefreshCw, Send } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { ApiError } from '../../../shared/api/api-error';
import { useAuth } from '../../../shared/auth/auth-context';
import { requestErrorMessage } from '../../learning/learning-format';
import { invalidateOwnedCourseReporting } from '../../reporting/reporting-invalidation';
import { displayAssessmentDate } from '../assessment-format';
import type { TeacherAssignment, TeacherGrade, TeacherSubmissionDetail } from '../assessment.types';
import { ActivityStatusBadge } from '../components/ActivityStatusBadge';

interface GradeHistoryRow {
  id: string;
  revision: number;
  oldScore: number | null;
  newScore: number;
  oldStatus: string | null;
  newStatus: string;
  reason: string | null;
  createdAt: string;
}

export function TeacherSubmissionGradingPage() {
  const { submissionId = '' } = useParams();
  const { request, user } = useAuth();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const [submission, setSubmission] = useState<TeacherSubmissionDetail | null>(null);
  const [assignment, setAssignment] = useState<TeacherAssignment | null>(null);
  const [history, setHistory] = useState<GradeHistoryRow[]>([]);
  const [score, setScore] = useState('0');
  const [feedback, setFeedback] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const studentName = params.get('studentName') ?? 'Học viên';

  const load = useCallback(async () => {
    const submissionResponse = await request<{
      success: true;
      data: TeacherSubmissionDetail;
    }>(`/teacher/submissions/${submissionId}`);
    const assignmentResponse = await request<{ success: true; data: TeacherAssignment }>(
      `/teacher/assignments/${submissionResponse.data.assignmentId}`,
    );
    setSubmission(submissionResponse.data);
    setAssignment(assignmentResponse.data);
    setScore(String(submissionResponse.data.grade?.score ?? 0));
    setFeedback(submissionResponse.data.grade?.feedback ?? '');
    if (submissionResponse.data.grade) {
      const historyResponse = await request<{
        success: true;
        data: { items: GradeHistoryRow[] };
      }>(`/teacher/grades/${submissionResponse.data.grade.id}/history?page=1&limit=20`);
      setHistory(historyResponse.data.items);
    } else {
      setHistory([]);
    }
    setConflict(false);
    setError(null);
  }, [request, submissionId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load().catch((requestError) => {
        setError(requestErrorMessage(requestError, 'Không thể tải bài nộp để chấm.'));
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function handleError(requestError: unknown) {
    setConflict(requestError instanceof ApiError && requestError.status === 409);
    setError(requestErrorMessage(requestError, 'Không thể cập nhật điểm.'));
  }

  async function saveGrade() {
    if (!submission || !assignment) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await request<{
        success: true;
        data: { grade: TeacherGrade; auditId: string };
      }>(`/teacher/submissions/${submission.id}/grade`, {
        method: 'PUT',
        body: {
          score: Number(score),
          feedback: feedback.trim() || null,
          expectedEvidenceRevision: submission.revision,
          expectedGradeRevision: submission.grade?.revision ?? 0,
        },
      });
      setSubmission({ ...submission, grade: response.data.grade, status: 'GRADED' });
      setNotice('Đã lưu bản nháp điểm.');
      setConflict(false);
      await invalidateOwnedCourseReporting(queryClient, user?.id, submission.courseId);
    } catch (requestError) {
      handleError(requestError);
    } finally {
      setBusy(false);
    }
  }

  async function returnWork() {
    if (!submission?.grade) return;
    setBusy(true);
    setError(null);
    try {
      const response = await request<{
        success: true;
        data: { grade: TeacherGrade; auditId: string };
      }>(`/teacher/submissions/${submission.id}/return`, {
        method: 'POST',
        body: { expectedGradeRevision: submission.grade.revision },
      });
      setSubmission({ ...submission, grade: response.data.grade, status: 'RETURNED' });
      setNotice('Đã trả điểm và nhận xét cho học viên.');
      setConflict(false);
      await invalidateOwnedCourseReporting(queryClient, user?.id, submission.courseId);
    } catch (requestError) {
      handleError(requestError);
    } finally {
      setBusy(false);
    }
  }

  async function regrade() {
    if (!submission?.grade) return;
    setBusy(true);
    setError(null);
    try {
      const response = await request<{
        success: true;
        data: { grade: TeacherGrade; auditId: string };
      }>(`/teacher/grades/${submission.grade.id}/regrade`, {
        method: 'POST',
        body: {
          score: Number(score),
          feedback: feedback.trim() || null,
          reason: reason.trim(),
          expectedGradeRevision: submission.grade.revision,
        },
      });
      setSubmission({ ...submission, grade: response.data.grade });
      setReason('');
      setNotice('Đã chấm lại và lưu lịch sử thay đổi.');
      setConflict(false);
      await invalidateOwnedCourseReporting(queryClient, user?.id, submission.courseId);
    } catch (requestError) {
      handleError(requestError);
    } finally {
      setBusy(false);
    }
  }

  const numericScore = Number(score);
  const scoreValid =
    assignment !== null &&
    Number.isInteger(numericScore) &&
    numericScore >= 0 &&
    numericScore <= assignment.maxScore;

  if (!submission && !error)
    return (
      <div className="list-state">
        <div className="spinner" />
      </div>
    );

  return (
    <section className="page-section assessment-workspace">
      <Link
        className="back-link"
        to={submission ? `/teacher/assignments/${submission.assignmentId}/submissions` : '..'}
      >
        <ArrowLeft size={17} /> Danh sách nộp bài
      </Link>
      <header className="page-header page-header--aligned">
        <div>
          <p className="eyebrow">Submission grader</p>
          <h1>{assignment?.title ?? 'Chấm bài tập'}</h1>
          <p>{studentName}</p>
        </div>
        {submission ? <ActivityStatusBadge status={submission.status} /> : null}
      </header>

      {error ? <div className="notice notice--error">{error}</div> : null}
      {notice ? (
        <div className="notice notice--success" role="status">
          <Check size={17} /> {notice}
        </div>
      ) : null}
      {conflict ? (
        <button className="secondary-button" type="button" onClick={() => void load()}>
          <RefreshCw size={17} /> Tải revision mới nhất
        </button>
      ) : null}

      {submission && assignment ? (
        <div className="grading-layout">
          <section className="submission-evidence">
            <h2>Bài làm</h2>
            <dl className="detail-list">
              <div>
                <dt>Trạng thái</dt>
                <dd>{submission.status}</dd>
              </div>
              <div>
                <dt>Thời gian nộp</dt>
                <dd>
                  {submission.submittedAt
                    ? displayAssessmentDate(submission.submittedAt)
                    : 'Chưa nộp'}
                </dd>
              </div>
              <div>
                <dt>Revision bài làm</dt>
                <dd>{submission.revision}</dd>
              </div>
            </dl>
            <div className="review-answer">
              <strong>Nội dung trả lời</strong>
              <p>{submission.textAnswer || 'Không có nội dung văn bản.'}</p>
              {submission.links.length > 0 ? (
                <ul>
                  {submission.links.map((link) => (
                    <li key={link}>
                      <a href={link} target="_blank" rel="noreferrer">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>

          <section className="grade-editor">
            <h2>Điểm và nhận xét</h2>
            <label className="form-field">
              <span>Điểm (tối đa {assignment.maxScore})</span>
              <input
                type="number"
                min="0"
                max={assignment.maxScore}
                step="1"
                value={score}
                onChange={(event) => setScore(event.target.value)}
              />
            </label>
            {!scoreValid ? (
              <p className="field-error" role="alert">
                Điểm phải là số nguyên từ 0 đến {assignment.maxScore}.
              </p>
            ) : null}
            <label className="form-field">
              <span>Nhận xét riêng cho học viên</span>
              <textarea
                rows={6}
                maxLength={20_000}
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
              />
            </label>
            {submission.grade?.status === 'RETURNED' ? (
              <label className="form-field">
                <span>Lý do chấm lại</span>
                <textarea
                  rows={3}
                  minLength={10}
                  maxLength={500}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
                <small>{reason.trim().length}/500</small>
              </label>
            ) : null}
            <div className="inline-actions">
              {submission.grade?.status === 'RETURNED' ? (
                <button
                  className="primary-button"
                  type="button"
                  disabled={busy || !scoreValid || reason.trim().length < 10}
                  onClick={() => void regrade()}
                >
                  <RefreshCw size={17} /> Chấm lại
                </button>
              ) : (
                <>
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={busy || !scoreValid}
                    onClick={() => void saveGrade()}
                  >
                    <Check size={17} /> Lưu điểm
                  </button>
                  <button
                    className="primary-button"
                    type="button"
                    disabled={busy || submission.grade?.status !== 'DRAFT'}
                    onClick={() => void returnWork()}
                  >
                    <Send size={17} /> Trả bài
                  </button>
                </>
              )}
            </div>
          </section>
        </div>
      ) : null}

      {history.length > 0 ? (
        <section className="assessment-history">
          <h2>Lịch sử chấm điểm</h2>
          <ol>
            {history.map((item) => (
              <li key={item.id}>
                <strong>
                  Revision {item.revision}: {item.newScore} điểm
                </strong>
                <p>
                  {item.oldStatus ?? 'Chưa có'} → {item.newStatus}
                  {item.reason ? ` · ${item.reason}` : ''}
                </p>
                <small>{displayAssessmentDate(item.createdAt)}</small>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </section>
  );
}
