import { ArrowLeft, Eye, Save, Send, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../../../shared/auth/auth-context';
import { requestErrorMessage } from '../../learning/learning-format';
import { displayAssessmentDate, toLocalDateTime } from '../assessment-format';
import type { AssignmentStatus, TeacherAssignment } from '../assessment.types';
import { ActivityStatusBadge } from '../components/ActivityStatusBadge';
import { ReasonDialog } from '../components/ReasonDialog';

export function TeacherAssignmentEditorPage() {
  const { assignmentId = '' } = useParams();
  const { request } = useAuth();
  const [assignment, setAssignment] = useState<TeacherAssignment | null>(null);
  const [preview, setPreview] = useState(false);
  const [statusTarget, setStatusTarget] = useState<AssignmentStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    void request<{ success: true; data: TeacherAssignment }>(`/teacher/assignments/${assignmentId}`)
      .then((response) => {
        if (active) setAssignment(response.data);
      })
      .catch((requestError) => {
        if (active) setError(requestErrorMessage(requestError, 'Không thể tải bài tập.'));
      });
    return () => {
      active = false;
    };
  }, [assignmentId, reload, request]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!assignment) return;
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await request(`/teacher/assignments/${assignment.id}`, {
        method: 'PATCH',
        body: {
          title: String(data.get('title') ?? ''),
          instruction: String(data.get('instruction') ?? ''),
          maxScore: Number(data.get('maxScore')),
          isRequired: data.get('isRequired') === 'on',
          allowedSubmissionTypes: ['TEXT'],
          allowLateSubmission: data.get('allowLateSubmission') === 'on',
          allowUnsubmit: data.get('allowUnsubmit') === 'on',
          allowResubmit: data.get('allowResubmit') === 'on',
          availableFrom: data.get('availableFrom')
            ? new Date(String(data.get('availableFrom'))).toISOString()
            : null,
          dueDate: new Date(String(data.get('dueDate'))).toISOString(),
          expectedContentRevision: assignment.contentRevision,
        },
      });
      setNotice('Đã lưu bài tập.');
      setReload((value) => value + 1);
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể lưu bài tập.'));
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(reason: string) {
    if (!assignment || !statusTarget) return;
    setBusy(true);
    setError(null);
    try {
      await request(`/teacher/assignments/${assignment.id}/status`, {
        method: 'PATCH',
        body: {
          status: statusTarget,
          scheduledPublishAt: null,
          reason,
          expectedContentRevision: assignment.contentRevision,
        },
      });
      setNotice('Đã cập nhật trạng thái bài tập.');
      setStatusTarget(null);
      setReload((value) => value + 1);
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể đổi trạng thái bài tập.'));
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
  const editable = assignment.allowedActions.includes('UPDATE');
  const nextStatuses: AssignmentStatus[] =
    assignment.status === 'DRAFT' ||
    assignment.status === 'UNPUBLISHED' ||
    assignment.status === 'CLOSED'
      ? ['PUBLISHED']
      : assignment.status === 'PUBLISHED'
        ? ['UNPUBLISHED', 'CLOSED']
        : [];
  return (
    <section className="page-section assessment-workspace">
      <Link
        className="back-link"
        to={`/teacher/courses/${assignment.courseId}/assessments?type=assignment`}
      >
        <ArrowLeft size={17} /> Danh sách bài tập
      </Link>
      <header className="page-header page-header--aligned">
        <div>
          <p className="eyebrow">Teacher assignment</p>
          <h1>{assignment.title}</h1>
        </div>
        <ActivityStatusBadge status={assignment.status} />
      </header>
      {notice ? <div className="notice notice--success">{notice}</div> : null}
      {error ? <div className="notice notice--error">{error}</div> : null}
      <div className="inline-actions assessment-toolbar">
        <button
          className="secondary-button"
          onClick={() => setPreview((value) => !value)}
          type="button"
        >
          <Eye size={17} /> Xem trước
        </button>
        <Link
          className="button-link button-link--secondary"
          to={`/teacher/assignments/${assignment.id}/submissions`}
        >
          <Users size={17} /> Danh sách nộp bài
        </Link>
        {nextStatuses.map((status) => (
          <button key={status} onClick={() => setStatusTarget(status)} type="button">
            <Send size={17} />{' '}
            {status === 'PUBLISHED' ? 'Xuất bản' : status === 'CLOSED' ? 'Đóng bài' : 'Thu hồi'}
          </button>
        ))}
      </div>
      {preview ? (
        <section className="assignment-preview">
          <h2>{assignment.title}</h2>
          <p>{assignment.instruction}</p>
          <small>
            Hạn {displayAssessmentDate(assignment.dueDate)} · {assignment.maxScore} điểm
          </small>
        </section>
      ) : null}
      <form className="assessment-editor-form" onSubmit={(event) => void save(event)}>
        <label className="form-field">
          <span>Tiêu đề</span>
          <input
            defaultValue={assignment.title}
            disabled={!editable}
            maxLength={150}
            minLength={2}
            name="title"
            required
          />
        </label>
        <label className="form-field">
          <span>Hướng dẫn</span>
          <textarea
            defaultValue={assignment.instruction}
            disabled={!editable}
            maxLength={100_000}
            name="instruction"
            required
            rows={8}
          />
        </label>
        <div className="form-grid">
          <label className="form-field">
            <span>Điểm tối đa</span>
            <input
              defaultValue={assignment.maxScore}
              disabled={!editable}
              max={1000}
              min={1}
              name="maxScore"
              type="number"
            />
          </label>
          <label className="form-field">
            <span>Thời hạn</span>
            <input
              defaultValue={toLocalDateTime(assignment.dueDate)}
              disabled={!editable}
              name="dueDate"
              type="datetime-local"
            />
          </label>
          <label className="form-field">
            <span>Mở từ</span>
            <input
              defaultValue={toLocalDateTime(assignment.availableFrom)}
              disabled={!editable}
              name="availableFrom"
              type="datetime-local"
            />
          </label>
        </div>
        <fieldset className="policy-fieldset" disabled={!editable}>
          <legend>Chính sách nộp bài</legend>
          <label>
            <input defaultChecked={assignment.isRequired} name="isRequired" type="checkbox" /> Bắt
            buộc
          </label>
          <label>
            <input
              defaultChecked={assignment.allowLateSubmission}
              name="allowLateSubmission"
              type="checkbox"
            />{' '}
            Nộp muộn
          </label>
          <label>
            <input defaultChecked={assignment.allowUnsubmit} name="allowUnsubmit" type="checkbox" />{' '}
            Hủy nộp
          </label>
          <label>
            <input defaultChecked={assignment.allowResubmit} name="allowResubmit" type="checkbox" />{' '}
            Nộp lại
          </label>
        </fieldset>
        {editable ? (
          <button disabled={busy} type="submit">
            <Save size={17} /> Lưu thay đổi
          </button>
        ) : (
          <div className="notice">Thu hồi bài tập trước khi chỉnh sửa nội dung.</div>
        )}
      </form>
      {statusTarget ? (
        <ReasonDialog
          busy={busy}
          confirmLabel="Xác nhận"
          description="Thay đổi này ảnh hưởng khả năng xem và nộp bài của học viên."
          onCancel={() => setStatusTarget(null)}
          onConfirm={changeStatus}
          title="Đổi trạng thái bài tập"
        />
      ) : null}
    </section>
  );
}
