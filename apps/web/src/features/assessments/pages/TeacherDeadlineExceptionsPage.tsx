import { ArrowLeft, CalendarPlus, Check, History, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { ApiError } from '../../../shared/api/api-error';
import { useAuth } from '../../../shared/auth/auth-context';
import { displayLearningDate, requestErrorMessage } from '../../learning/learning-format';
import { toLocalDateTime } from '../assessment-format';
import type {
  DeadlineException,
  DeadlineExceptionHistory,
  TeacherAssignment,
  TeacherQuiz,
} from '../assessment.types';

interface ActivitySummary {
  title: string;
  defaultDeadline: string;
  backUrl: string;
}

const INITIAL_NOW = Date.now();

function apiActivityType(value: string) {
  if (value === 'lessons' || value === 'quizzes' || value === 'assignments') return value;
  return null;
}

export function TeacherDeadlineExceptionsPage() {
  const { activityType: rawActivityType = '', activityId = '' } = useParams();
  const activityType = apiActivityType(rawActivityType);
  const { request } = useAuth();
  const [params, setParams] = useSearchParams();
  const [activity, setActivity] = useState<ActivitySummary | null>(null);
  const [items, setItems] = useState<DeadlineException[]>([]);
  const [history, setHistory] = useState<DeadlineExceptionHistory[]>([]);
  const [deadline, setDeadline] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [now, setNow] = useState(INITIAL_NOW);
  const selectedStudentId = params.get('studentId') ?? '';
  const selected = useMemo(
    () => items.find((item) => item.studentId === selectedStudentId) ?? null,
    [items, selectedStudentId],
  );

  const load = useCallback(async () => {
    if (!activityType) throw new Error('Unsupported activity type');
    const listPromise = request<{
      success: true;
      data: { items: DeadlineException[] };
    }>(`/teacher/activities/${activityType}/${activityId}/deadline-exceptions?page=1&limit=100`);
    const activityPromise =
      activityType === 'quizzes'
        ? request<{ success: true; data: TeacherQuiz }>(`/teacher/quizzes/${activityId}`).then(
            (response) => ({
              title: response.data.title,
              defaultDeadline: response.data.dueDate,
              backUrl: `/teacher/quizzes/${activityId}/results`,
            }),
          )
        : activityType === 'assignments'
          ? request<{ success: true; data: TeacherAssignment }>(
              `/teacher/assignments/${activityId}`,
            ).then((response) => ({
              title: response.data.title,
              defaultDeadline: response.data.dueDate,
              backUrl: `/teacher/assignments/${activityId}/submissions`,
            }))
          : request<{
              success: true;
              data: {
                lesson: { title: string; completionDeadline: string | null };
              };
            }>(`/lessons/${activityId}`).then((response) => ({
              title: response.data.lesson.title,
              defaultDeadline: response.data.lesson.completionDeadline ?? '',
              backUrl: `/teacher/lessons/${activityId}/edit`,
            }));
    const [listResponse, activityResponse] = await Promise.all([listPromise, activityPromise]);
    setItems(listResponse.data.items);
    setActivity(activityResponse);
    setError(null);
  }, [activityId, activityType, request]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load().catch((requestError) => {
        setError(requestErrorMessage(requestError, 'Không thể tải danh sách gia hạn.'));
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (!active || !activity) return;
      const effective = selected?.effectiveDeadline || activity.defaultDeadline;
      setDeadline(effective ? toLocalDateTime(effective) : '');
      setReason('');
      if (!activityType || !selectedStudentId) {
        setHistory([]);
        return;
      }
      void request<{
        success: true;
        data: { items: DeadlineExceptionHistory[] };
      }>(
        `/teacher/activities/${activityType}/${activityId}/deadline-exceptions/${selectedStudentId}/history?page=1&limit=50`,
      )
        .then((response) => {
          if (active) setHistory(response.data.items);
        })
        .catch(() => {
          if (active) setHistory([]);
        });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [activity, activityId, activityType, request, selected, selectedStudentId]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  async function saveException() {
    if (!activityType || !selectedStudentId || !deadline) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await request(
        `/teacher/activities/${activityType}/${activityId}/deadline-exceptions/${selectedStudentId}`,
        {
          method: 'PUT',
          body: {
            deadline: new Date(deadline).toISOString(),
            reason: reason.trim(),
            expectedRevision: selected?.revision ?? 0,
          },
        },
      );
      setNotice('Đã lưu deadline riêng cho học viên.');
      await load();
    } catch (requestError) {
      const fallback =
        requestError instanceof ApiError && requestError.status === 409
          ? 'Deadline đã thay đổi hoặc không còn hợp lệ. Hãy tải lại trước khi lưu.'
          : 'Không thể lưu deadline riêng.';
      setError(requestErrorMessage(requestError, fallback));
    } finally {
      setBusy(false);
    }
  }

  async function revokeException() {
    if (!activityType || !selectedStudentId || !selected?.active) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await request(
        `/teacher/activities/${activityType}/${activityId}/deadline-exceptions/${selectedStudentId}/revoke`,
        {
          method: 'POST',
          body: {
            reason: reason.trim(),
            expectedRevision: selected.revision,
          },
        },
      );
      setNotice('Đã thu hồi deadline riêng và khôi phục deadline mặc định.');
      await load();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể thu hồi deadline riêng.'));
    } finally {
      setBusy(false);
    }
  }

  const currentEffective = selected?.effectiveDeadline || activity?.defaultDeadline || '';
  const candidate = deadline ? new Date(deadline) : null;
  const validExtension =
    Boolean(candidate && Number.isFinite(candidate.getTime())) &&
    Boolean(currentEffective) &&
    candidate!.getTime() > new Date(currentEffective).getTime() &&
    candidate!.getTime() > now;

  if (!activityType)
    return <div className="list-state list-state--error">Loại hoạt động không hợp lệ.</div>;

  return (
    <section className="page-section assessment-workspace">
      <Link className="back-link" to={activity?.backUrl ?? '..'}>
        <ArrowLeft size={17} /> Quay lại hoạt động
      </Link>
      <header className="page-header">
        <p className="eyebrow">Deadline exceptions</p>
        <h1>{activity?.title ?? 'Gia hạn theo học viên'}</h1>
        <p>Deadline riêng chỉ áp dụng cho học viên được chọn và không được rút ngắn thời gian.</p>
      </header>
      {activity ? (
        <div className="notice">
          Deadline mặc định: <strong>{displayLearningDate(activity.defaultDeadline)}</strong>
        </div>
      ) : null}
      {error ? <div className="notice notice--error">{error}</div> : null}
      {notice ? (
        <div className="notice notice--success" role="status">
          <Check size={17} /> {notice}
        </div>
      ) : null}

      <div className="deadline-exception-layout">
        <section>
          <h2>Học viên</h2>
          {items.length === 0 && !selectedStudentId ? (
            <div className="list-state">
              <CalendarPlus size={28} />
              <strong>Chưa có deadline riêng.</strong>
              <p>Mở từ danh sách học viên của hoạt động để tạo gia hạn đầu tiên.</p>
            </div>
          ) : (
            <div className="deadline-student-list">
              {items.map((item) => (
                <button
                  className={item.studentId === selectedStudentId ? 'is-active' : ''}
                  key={item.id}
                  type="button"
                  onClick={() => setParams({ studentId: item.studentId })}
                >
                  <span>{item.student?.fullName ?? item.studentId}</span>
                  <small>{item.active ? 'Đang áp dụng' : 'Đã thu hồi'}</small>
                </button>
              ))}
              {selectedStudentId && !selected ? (
                <button className="is-active" type="button">
                  <span>Học viên đã chọn</span>
                  <small>{selectedStudentId}</small>
                </button>
              ) : null}
            </div>
          )}
        </section>

        <section className="deadline-editor">
          <h2>Thiết lập deadline</h2>
          {!selectedStudentId ? (
            <div className="list-state">Chọn học viên từ danh sách nộp bài hoặc kết quả Quiz.</div>
          ) : (
            <>
              <dl className="detail-list">
                <div>
                  <dt>Học viên</dt>
                  <dd>{selected?.student?.fullName ?? selectedStudentId}</dd>
                </div>
                <div>
                  <dt>Deadline hiện tại</dt>
                  <dd>{displayLearningDate(currentEffective)}</dd>
                </div>
                <div>
                  <dt>Revision</dt>
                  <dd>{selected?.revision ?? 0}</dd>
                </div>
              </dl>
              <label className="form-field">
                <span>Deadline mới</span>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                />
              </label>
              <label className="form-field">
                <span>Lý do</span>
                <textarea
                  rows={3}
                  minLength={10}
                  maxLength={500}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
                <small>{reason.trim().length}/500</small>
              </label>
              <div className="inline-actions">
                <button
                  className="primary-button"
                  type="button"
                  disabled={busy || !validExtension || reason.trim().length < 10}
                  onClick={() => void saveException()}
                >
                  <CalendarPlus size={17} /> Lưu gia hạn
                </button>
                {selected?.active ? (
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={busy || reason.trim().length < 10}
                    onClick={() => void revokeException()}
                  >
                    <RotateCcw size={17} /> Thu hồi
                  </button>
                ) : null}
              </div>
            </>
          )}
        </section>
      </div>

      {history.length > 0 ? (
        <section className="assessment-history deadline-exception-history">
          <h2>
            <History size={19} /> Lịch sử thay đổi
          </h2>
          <ol>
            {history.map((item) => (
              <li key={item.id}>
                <strong>
                  Revision {item.revision} · {item.action === 'SET' ? 'Gia hạn' : 'Thu hồi'}
                </strong>
                <p>
                  {item.fromDeadline ? displayLearningDate(item.fromDeadline) : 'Chưa có'} →{' '}
                  {item.toDeadline ? displayLearningDate(item.toDeadline) : 'Deadline mặc định'}
                </p>
                <p>{item.reason}</p>
                <small>{displayLearningDate(item.createdAt)}</small>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </section>
  );
}
