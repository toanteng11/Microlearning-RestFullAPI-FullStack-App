import {
  Archive,
  ArrowLeft,
  Clipboard,
  KeyRound,
  Link2,
  RefreshCw,
  Save,
  Settings,
  UserMinus,
  UsersRound,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { ApiError } from '../../../shared/api/api-error';
import { useAuth } from '../../../shared/auth/auth-context';
import { ClassroomStatusBadge } from '../components/ClassroomStatusBadge';
import { classroomStatusLabel, displayDate } from '../classroom-format';
import type {
  ClassCodeMetadata,
  ClassroomDetail,
  ClassroomDetailEnvelope,
  InviteLinkMetadata,
  RosterEnvelope,
  RosterItem,
} from '../classroom.types';

type DetailTab = 'overview' | 'people' | 'join';

interface ClassCodeEnvelope {
  success: true;
  data: { credential: ClassCodeMetadata | null };
}

interface InviteListEnvelope {
  success: true;
  data: InviteLinkMetadata[];
}

function mutationMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback;
  if (error.code === 'CONCURRENT_MODIFICATION') {
    return 'Dữ liệu đã thay đổi. Vui lòng tải lại trước khi tiếp tục.';
  }
  return error.message;
}

export function TeacherClassroomDetailPage() {
  const { classroomId = '' } = useParams();
  const { request } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<DetailTab>('overview');
  const [reloadKey, setReloadKey] = useState(0);
  const [classroom, setClassroom] = useState<ClassroomDetail | null>(null);
  const [classCode, setClassCode] = useState<ClassCodeMetadata | null>(null);
  const [inviteLinks, setInviteLinks] = useState<InviteLinkMetadata[]>([]);
  const [roster, setRoster] = useState<RosterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [oneTimeValue, setOneTimeValue] = useState<{ label: string; value: string } | null>(null);
  const [removeTarget, setRemoveTarget] = useState<RosterItem | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      request<ClassroomDetailEnvelope>(`/classrooms/${classroomId}`),
      request<ClassCodeEnvelope>(`/classrooms/${classroomId}/class-code`),
      request<InviteListEnvelope>(`/classrooms/${classroomId}/invite-links`),
      request<RosterEnvelope>(
        `/classrooms/${classroomId}/students?limit=100&sortBy=fullName&sortOrder=asc`,
      ),
    ])
      .then(([detail, code, links, people]) => {
        if (!active) return;
        setClassroom(detail.data.classroom);
        setClassCode(code.data.credential);
        setInviteLinks(links.data);
        setRoster(people.data);
        setError(null);
      })
      .catch((requestError) => {
        if (active) setError(mutationMessage(requestError, 'Không thể tải lớp học.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [classroomId, reloadKey, request]);

  async function runMutation(operation: () => Promise<void>, success: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await operation();
      setNotice(success);
      setLoading(true);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      setError(mutationMessage(requestError, 'Không thể hoàn thành thao tác.'));
    } finally {
      setBusy(false);
    }
  }

  async function updateOverview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!classroom) return;
    const values = new FormData(event.currentTarget);
    await runMutation(async () => {
      await request(`/classrooms/${classroomId}`, {
        method: 'PATCH',
        body: {
          name: String(values.get('name') ?? '').trim(),
          description: String(values.get('description') ?? '').trim() || null,
          subject: String(values.get('subject') ?? '').trim() || null,
          section: String(values.get('section') ?? '').trim() || null,
          expectedUpdatedAt: classroom.updatedAt,
        },
      });
    }, 'Đã cập nhật lớp học.');
  }

  async function updateSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!classroom) return;
    const values = new FormData(event.currentTarget);
    await runMutation(async () => {
      await request(`/classrooms/${classroomId}/settings`, {
        method: 'PATCH',
        body: {
          enrollmentStatus: String(values.get('enrollmentStatus')),
          allowClassCodeJoin: values.get('allowClassCodeJoin') === 'on',
          allowInviteLinkJoin: values.get('allowInviteLinkJoin') === 'on',
          expectedUpdatedAt: classroom.updatedAt,
        },
      });
    }, 'Đã cập nhật cấu hình tham gia.');
  }

  async function archiveClassroom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!classroom) return;
    const reason = String(new FormData(event.currentTarget).get('reason') ?? '').trim();
    setBusy(true);
    try {
      await request(`/classrooms/${classroomId}`, {
        method: 'DELETE',
        body: { reason, expectedUpdatedAt: classroom.updatedAt },
      });
      navigate('/teacher/dashboard', { replace: true });
    } catch (requestError) {
      setError(mutationMessage(requestError, 'Không thể lưu trữ lớp học.'));
      setBusy(false);
    }
  }

  async function regenerateCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!classCode) return;
    const reason = String(new FormData(event.currentTarget).get('reason') ?? '').trim();
    await runMutation(async () => {
      const response = await request<{
        success: true;
        data: { classCode: string };
      }>(`/classrooms/${classroomId}/class-code/regenerate`, {
        method: 'POST',
        body: { reason, expectedCredentialUpdatedAt: classCode.updatedAt },
      });
      setOneTimeValue({ label: 'Class Code mới', value: response.data.classCode });
    }, 'Đã thay Class Code.');
  }

  async function disableCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!classCode) return;
    const reason = String(new FormData(event.currentTarget).get('reason') ?? '').trim();
    await runMutation(async () => {
      await request(`/classrooms/${classroomId}/class-code/disable`, {
        method: 'POST',
        body: { reason, expectedCredentialUpdatedAt: classCode.updatedAt },
      });
    }, 'Đã vô hiệu hóa Class Code.');
  }

  async function createInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const days = Number(new FormData(event.currentTarget).get('expiresInDays') ?? '30');
    await runMutation(async () => {
      const response = await request<{
        success: true;
        data: { inviteLink: string };
      }>(`/classrooms/${classroomId}/invite-links`, {
        method: 'POST',
        body: { expiresInDays: days },
      });
      setOneTimeValue({ label: 'Invite Link mới', value: response.data.inviteLink });
    }, 'Đã tạo Invite Link.');
  }

  async function regenerateInvite(
    event: React.FormEvent<HTMLFormElement>,
    link: InviteLinkMetadata,
  ) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    await runMutation(async () => {
      const response = await request<{
        success: true;
        data: { inviteLink: string };
      }>(`/classrooms/${classroomId}/invite-links/${link.id}/regenerate`, {
        method: 'POST',
        body: {
          expiresInDays: Number(values.get('expiresInDays') ?? '30'),
          reason: String(values.get('reason') ?? '').trim(),
          expectedCredentialUpdatedAt: link.updatedAt,
        },
      });
      setOneTimeValue({ label: 'Invite Link mới', value: response.data.inviteLink });
    }, 'Đã thay Invite Link.');
  }

  async function disableInvite(event: React.FormEvent<HTMLFormElement>, link: InviteLinkMetadata) {
    event.preventDefault();
    const reason = String(new FormData(event.currentTarget).get('reason') ?? '').trim();
    await runMutation(async () => {
      await request(`/classrooms/${classroomId}/invite-links/${link.id}/disable`, {
        method: 'POST',
        body: { reason, expectedCredentialUpdatedAt: link.updatedAt },
      });
    }, 'Đã vô hiệu hóa Invite Link.');
  }

  async function removeStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!removeTarget) return;
    const reason = String(new FormData(event.currentTarget).get('reason') ?? '').trim();
    await runMutation(async () => {
      await request(`/classrooms/${classroomId}/students/${removeTarget.student.id}/remove`, {
        method: 'POST',
        body: {
          reason,
          expectedEnrollmentUpdatedAt: removeTarget.enrollment.updatedAt,
        },
      });
      setRemoveTarget(null);
    }, 'Đã remove Student khỏi lớp học.');
  }

  if (loading) {
    return (
      <div className="list-state">
        <div className="spinner" />
        <p>Đang tải lớp học...</p>
      </div>
    );
  }
  if (!classroom) {
    return <div className="list-state list-state--error">{error ?? 'Không tìm thấy lớp học.'}</div>;
  }

  const activeInvite = inviteLinks.find((link) => link.status === 'ACTIVE') ?? null;

  return (
    <section className="page-section">
      <Link className="back-link" to="/teacher/dashboard">
        <ArrowLeft size={17} /> Lớp học của tôi
      </Link>
      <header className="classroom-detail-header">
        <div>
          <p className="eyebrow">{classroom.subject ?? 'Teacher Classroom'}</p>
          <h1>{classroom.name}</h1>
          <p>{classroom.section ?? 'Chưa có nhóm'}</p>
        </div>
        <div className="classroom-card__status">
          <ClassroomStatusBadge status={classroom.status} />
          <ClassroomStatusBadge status={classroom.enrollmentStatus} />
        </div>
      </header>

      <nav className="segmented-tabs" aria-label="Nội dung lớp học">
        <button
          className={tab === 'overview' ? 'active' : ''}
          type="button"
          onClick={() => setTab('overview')}
        >
          <Settings size={17} /> Tổng quan
        </button>
        <button
          className={tab === 'people' ? 'active' : ''}
          type="button"
          onClick={() => setTab('people')}
        >
          <UsersRound size={17} /> Thành viên
        </button>
        <button
          className={tab === 'join' ? 'active' : ''}
          type="button"
          onClick={() => setTab('join')}
        >
          <KeyRound size={17} /> Quyền tham gia
        </button>
      </nav>

      {notice ? <div className="notice notice--success">{notice}</div> : null}
      {error ? <div className="notice notice--error">{error}</div> : null}
      {oneTimeValue ? (
        <section className="one-time-credential">
          <div>
            <strong>{oneTimeValue.label}</strong>
            <p>Giá trị này chỉ hiển thị trong response hiện tại.</p>
          </div>
          <code>{oneTimeValue.value}</code>
          <button
            className="icon-button"
            type="button"
            title="Sao chép"
            aria-label={`Sao chép ${oneTimeValue.label}`}
            onClick={() => void navigator.clipboard.writeText(oneTimeValue.value)}
          >
            <Clipboard size={18} />
          </button>
        </section>
      ) : null}

      {tab === 'overview' ? (
        <div className="detail-layout">
          <section className="detail-panel">
            <h2>Thông tin lớp học</h2>
            <form onSubmit={(event) => void updateOverview(event)}>
              <div className="form-field">
                <label htmlFor="edit-name">Tên lớp học</label>
                <input id="edit-name" name="name" defaultValue={classroom.name} required />
              </div>
              <div className="form-field">
                <label htmlFor="edit-subject">Môn học</label>
                <input id="edit-subject" name="subject" defaultValue={classroom.subject ?? ''} />
              </div>
              <div className="form-field">
                <label htmlFor="edit-section">Nhóm</label>
                <input id="edit-section" name="section" defaultValue={classroom.section ?? ''} />
              </div>
              <div className="form-field">
                <label htmlFor="edit-description">Mô tả</label>
                <textarea
                  id="edit-description"
                  name="description"
                  defaultValue={classroom.description ?? ''}
                />
              </div>
              <button
                className="fit-button"
                type="submit"
                disabled={busy || classroom.status !== 'ACTIVE'}
              >
                <Save size={17} /> Lưu thay đổi
              </button>
            </form>
          </section>
          <section className="detail-panel danger-panel">
            <h2>Lưu trữ lớp học</h2>
            <form onSubmit={(event) => void archiveClassroom(event)}>
              <div className="form-field">
                <label htmlFor="archive-reason">Lý do</label>
                <textarea id="archive-reason" name="reason" minLength={5} required />
              </div>
              <button
                className="danger-button"
                type="submit"
                disabled={busy || classroom.status !== 'ACTIVE'}
              >
                <Archive size={17} /> Lưu trữ lớp học
              </button>
            </form>
          </section>
        </div>
      ) : null}

      {tab === 'people' ? (
        <section className="people-section">
          <div className="section-heading">
            <h2>Student</h2>
            <span>{roster.length} thành viên</span>
          </div>
          {roster.length === 0 ? (
            <div className="list-state">Chưa có Student trong lớp học.</div>
          ) : (
            <div className="data-table-wrap data-table-wrap--responsive">
              <table className="data-table roster-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Tham gia</th>
                    <th>Trạng thái</th>
                    <th aria-label="Thao tác" />
                  </tr>
                </thead>
                <tbody>
                  {roster.map((item) => (
                    <tr key={item.enrollment.id}>
                      <td data-label="Student">
                        <strong>{item.student.fullName}</strong>
                        <small>{item.student.email}</small>
                      </td>
                      <td data-label="Tham gia">{displayDate(item.enrollment.joinedAt)}</td>
                      <td data-label="Trạng thái">
                        {classroomStatusLabel(item.enrollment.status)}
                      </td>
                      <td data-label="Thao tác">
                        <button
                          className="icon-button"
                          type="button"
                          title="Remove"
                          aria-label={`Remove ${item.student.fullName}`}
                          onClick={() => setRemoveTarget(item)}
                        >
                          <UserMinus size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {removeTarget ? (
            <form className="inline-confirm" onSubmit={(event) => void removeStudent(event)}>
              <strong>Remove {removeTarget.student.fullName}</strong>
              <label className="sr-only" htmlFor="remove-reason">
                Lý do
              </label>
              <input
                id="remove-reason"
                name="reason"
                minLength={3}
                placeholder="Lý do remove"
                required
              />
              <button type="submit" disabled={busy}>
                <UserMinus size={17} /> Xác nhận
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setRemoveTarget(null)}
              >
                Hủy
              </button>
            </form>
          ) : null}
        </section>
      ) : null}

      {tab === 'join' ? (
        <div className="settings-layout">
          <section className="detail-panel">
            <h2>Cấu hình tham gia</h2>
            <form onSubmit={(event) => void updateSettings(event)}>
              <div className="form-field">
                <label htmlFor="enrollment-status">Trạng thái enrollment</label>
                <select
                  id="enrollment-status"
                  name="enrollmentStatus"
                  defaultValue={classroom.configuredSettings.enrollmentStatus}
                >
                  <option value="OPEN">Đang mở</option>
                  <option value="CLOSED">Đã đóng</option>
                </select>
              </div>
              <label className="toggle-row">
                <input
                  type="checkbox"
                  name="allowClassCodeJoin"
                  defaultChecked={classroom.configuredSettings.allowClassCodeJoin}
                />
                <span>Cho phép Class Code</span>
              </label>
              <label className="toggle-row">
                <input
                  type="checkbox"
                  name="allowInviteLinkJoin"
                  defaultChecked={classroom.configuredSettings.allowInviteLinkJoin}
                />
                <span>Cho phép Invite Link</span>
              </label>
              <button className="fit-button" type="submit" disabled={busy}>
                <Save size={17} /> Lưu cấu hình
              </button>
            </form>
          </section>

          <section className="detail-panel">
            <div className="panel-title">
              <KeyRound size={20} />
              <h2>Class Code</h2>
            </div>
            {classCode ? (
              <>
                <div className="credential-row">
                  <code>{classCode.maskedCode}</code>
                  <ClassroomStatusBadge status={classCode.status} />
                </div>
                {classCode.status === 'ACTIVE' ? (
                  <div className="credential-actions">
                    <form onSubmit={(event) => void regenerateCode(event)}>
                      <input name="reason" minLength={5} placeholder="Lý do thay mã" required />
                      <button type="submit" disabled={busy}>
                        <RefreshCw size={17} /> Thay mã
                      </button>
                    </form>
                    <form onSubmit={(event) => void disableCode(event)}>
                      <input name="reason" minLength={5} placeholder="Lý do vô hiệu" required />
                      <button className="danger-button" type="submit" disabled={busy}>
                        Vô hiệu
                      </button>
                    </form>
                  </div>
                ) : null}
              </>
            ) : (
              <p>Chưa có Class Code.</p>
            )}
          </section>

          <section className="detail-panel settings-layout__wide">
            <div className="panel-title">
              <Link2 size={20} />
              <h2>Invite Link</h2>
            </div>
            {!activeInvite ? (
              <form className="inline-create" onSubmit={(event) => void createInvite(event)}>
                <label htmlFor="invite-days">Số ngày hiệu lực</label>
                <input
                  id="invite-days"
                  name="expiresInDays"
                  type="number"
                  min={1}
                  max={90}
                  defaultValue={30}
                />
                <button type="submit" disabled={busy}>
                  <Link2 size={17} /> Tạo link
                </button>
              </form>
            ) : (
              <div className="credential-list">
                {inviteLinks.map((link) => (
                  <article className="credential-history-row" key={link.id}>
                    <div>
                      <ClassroomStatusBadge status={link.status} />
                      <small>Hết hạn {displayDate(link.expiresAt)}</small>
                    </div>
                    {link.status === 'ACTIVE' ? (
                      <div className="credential-actions credential-actions--horizontal">
                        <form onSubmit={(event) => void regenerateInvite(event, link)}>
                          <input
                            name="reason"
                            minLength={5}
                            placeholder="Lý do thay link"
                            required
                          />
                          <input
                            name="expiresInDays"
                            type="number"
                            min={1}
                            max={90}
                            defaultValue={30}
                            aria-label="Số ngày hiệu lực"
                          />
                          <button type="submit" disabled={busy}>
                            <RefreshCw size={17} /> Thay link
                          </button>
                        </form>
                        <form onSubmit={(event) => void disableInvite(event, link)}>
                          <input name="reason" minLength={5} placeholder="Lý do vô hiệu" required />
                          <button className="danger-button" type="submit" disabled={busy}>
                            Vô hiệu
                          </button>
                        </form>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </section>
  );
}
