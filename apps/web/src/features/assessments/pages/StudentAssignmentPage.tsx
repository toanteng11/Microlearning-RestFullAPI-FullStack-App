import { ArrowLeft, Clock3, History, Save, Send, Undo2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../../../shared/auth/auth-context';
import { requestErrorMessage } from '../../learning/learning-format';
import { useUnsavedChanges } from '../../learning/use-unsaved-changes';
import { displayAssessmentDate } from '../assessment-format';
import type { StudentAssignment, StudentSubmission } from '../assessment.types';
import { ActivityStatusBadge } from '../components/ActivityStatusBadge';
import { ReasonDialog } from '../components/ReasonDialog';

interface HistoryItem {
  id: string;
  revision: number;
  eventType: string;
  status: string;
  createdAt: string;
  reason: string | null;
}

export function StudentAssignmentPage() {
  const { assignmentId = '' } = useParams();
  const { request } = useAuth();
  const [assignment, setAssignment] = useState<StudentAssignment | null>(null);
  const [submission, setSubmission] = useState<StudentSubmission | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [textAnswer, setTextAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmTurnIn, setConfirmTurnIn] = useState(false);
  const [resubmitDialog, setResubmitDialog] = useState(false);
  const dirtyRef = useRef(false);
  useUnsavedChanges(dirtyRef);

  const fetchData = useCallback(async () => {
    const [assignmentResponse, submissionResponse] = await Promise.all([
      request<{ success: true; data: StudentAssignment }>(`/students/assignments/${assignmentId}`),
      request<{ success: true; data: StudentSubmission | null }>(
        `/students/assignments/${assignmentId}/submission`,
      ),
    ]);
    let historyItems: HistoryItem[] = [];
    if (submissionResponse.data) {
      const historyResponse = await request<{ success: true; data: { items: HistoryItem[] } }>(
        `/students/submissions/${submissionResponse.data.id}/history?page=1&limit=50`,
      );
      historyItems = historyResponse.data.items;
    }
    return {
      assignment: assignmentResponse.data,
      submission: submissionResponse.data,
      history: historyItems,
    };
  }, [assignmentId, request]);

  const applyData = useCallback((data: Awaited<ReturnType<typeof fetchData>>) => {
    setAssignment(data.assignment);
    setSubmission(data.submission);
    setTextAnswer(data.submission?.textAnswer ?? '');
    setHistory(data.history);
    dirtyRef.current = false;
  }, []);

  const refresh = useCallback(async () => {
    applyData(await fetchData());
  }, [applyData, fetchData]);

  useEffect(() => {
    let active = true;
    void fetchData()
      .then((data) => {
        if (active) applyData(data);
      })
      .catch((requestError) => {
        if (active) setError(requestErrorMessage(requestError, 'Không thể tải bài tập.'));
      });
    return () => {
      active = false;
    };
  }, [applyData, fetchData]);

  async function saveDraft() {
    setBusy(true);
    setError(null);
    try {
      const response = await request<{ success: true; data: StudentSubmission }>(
        `/students/assignments/${assignmentId}/submission`,
        {
          method: 'PUT',
          body: {
            submissionType: 'TEXT',
            textAnswer,
            links: [],
            markDone: false,
            expectedSubmissionRevision: submission?.revision ?? 0,
          },
        },
      );
      setSubmission(response.data);
      setNotice('Đã lưu bản nháp.');
      await refresh();
      return response.data;
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể lưu bản nháp.'));
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function turnIn() {
    let current = submission;
    if (!current || current.status === 'DRAFT') current = await saveDraft();
    if (!current) return;
    setBusy(true);
    setError(null);
    try {
      await request(`/students/submissions/${current.id}/turn-in`, {
        method: 'POST',
        body: { expectedSubmissionRevision: current.revision },
      });
      setNotice('Đã nộp bài tập.');
      setConfirmTurnIn(false);
      await refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể nộp bài tập.'));
    } finally {
      setBusy(false);
    }
  }

  async function unsubmit() {
    if (!submission) return;
    setBusy(true);
    setError(null);
    try {
      await request(`/students/submissions/${submission.id}/unsubmit`, {
        method: 'POST',
        body: { expectedSubmissionRevision: submission.revision },
      });
      setNotice('Bài làm đã trở lại bản nháp.');
      await refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể hủy nộp.'));
    } finally {
      setBusy(false);
    }
  }

  async function resubmit(reason: string) {
    if (!submission) return;
    setBusy(true);
    setError(null);
    try {
      await request(`/students/submissions/${submission.id}/resubmit`, {
        method: 'POST',
        body: { reason, expectedSubmissionRevision: submission.revision },
      });
      setNotice('Đã mở bản nháp nộp lại.');
      setResubmitDialog(false);
      await refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể bắt đầu nộp lại.'));
    } finally {
      setBusy(false);
    }
  }

  if (error && !assignment) return <div className="list-state list-state--error">{error}</div>;
  if (!assignment)
    return (
      <div className="list-state">
        <div className="spinner" />
      </div>
    );
  const editable = !submission || submission.status === 'DRAFT';
  const submitted = submission?.status === 'SUBMITTED' || submission?.status === 'LATE';
  return (
    <section className="page-section assessment-workspace">
      <Link className="back-link" to={`/student/courses/${assignment.courseId}`}>
        <ArrowLeft size={17} /> Quay lại khóa học
      </Link>
      <header className="page-header page-header--aligned">
        <div>
          <p className="eyebrow">Bài tập</p>
          <h1>{assignment.title}</h1>
          <p>{assignment.instruction}</p>
        </div>
        {submission ? <ActivityStatusBadge status={submission.status} /> : null}
      </header>
      <div className="assessment-facts">
        <div>
          <strong>{assignment.maxScore}</strong>
          <span>Điểm tối đa</span>
        </div>
        <div>
          <Clock3 size={20} />
          <span>Hạn {displayAssessmentDate(assignment.effectiveDeadline)}</span>
        </div>
      </div>
      {notice ? <div className="notice notice--success">{notice}</div> : null}
      {error ? <div className="notice notice--error">{error}</div> : null}
      <section className="submission-workspace">
        <h2>Bài làm của bạn</h2>
        <label className="form-field">
          <span>Nội dung trả lời</span>
          <textarea
            disabled={!editable}
            maxLength={100_000}
            onChange={(event) => {
              dirtyRef.current = true;
              setTextAnswer(event.target.value);
            }}
            rows={12}
            value={textAnswer}
          />
        </label>
        <div className="inline-actions">
          {editable ? (
            <>
              <button
                className="secondary-button"
                disabled={busy}
                onClick={() => void saveDraft()}
                type="button"
              >
                <Save size={17} /> Lưu bản nháp
              </button>
              <button
                disabled={busy || !textAnswer.trim()}
                onClick={() => setConfirmTurnIn(true)}
                type="button"
              >
                <Send size={17} /> Nộp bài
              </button>
            </>
          ) : null}
          {submitted && assignment.allowUnsubmit ? (
            <button
              className="secondary-button"
              disabled={busy}
              onClick={() => void unsubmit()}
              type="button"
            >
              <Undo2 size={17} /> Hủy nộp
            </button>
          ) : null}
          {submitted && assignment.allowResubmit ? (
            <button
              className="secondary-button"
              disabled={busy}
              onClick={() => setResubmitDialog(true)}
              type="button"
            >
              <Undo2 size={17} /> Nộp lại
            </button>
          ) : null}
        </div>
      </section>
      {history.length > 0 ? (
        <section className="assessment-history">
          <h2>
            <History size={19} /> Lịch sử phiên bản
          </h2>
          <div className="history-list">
            {history.map((item) => (
              <div key={item.id}>
                <strong>
                  Revision {item.revision} · {item.eventType}
                </strong>
                <span>{displayAssessmentDate(item.createdAt)}</span>
                {item.reason ? <small>{item.reason}</small> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}
      {confirmTurnIn ? (
        <div className="dialog-backdrop">
          <section aria-modal="true" className="reason-dialog" role="dialog">
            <header>
              <div>
                <h2>Nộp bài tập?</h2>
                <p>Bản hiện tại sẽ được khóa để giảng viên xem.</p>
              </div>
            </header>
            <div className="inline-actions reason-dialog__actions">
              <button
                className="secondary-button"
                onClick={() => setConfirmTurnIn(false)}
                type="button"
              >
                Hủy
              </button>
              <button disabled={busy} onClick={() => void turnIn()} type="button">
                Xác nhận nộp
              </button>
            </div>
          </section>
        </div>
      ) : null}
      {resubmitDialog ? (
        <ReasonDialog
          busy={busy}
          confirmLabel="Mở bản nộp lại"
          description="Lịch sử bản đã nộp vẫn được giữ nguyên."
          onCancel={() => setResubmitDialog(false)}
          onConfirm={resubmit}
          title="Nộp lại bài tập"
        />
      ) : null}
    </section>
  );
}
