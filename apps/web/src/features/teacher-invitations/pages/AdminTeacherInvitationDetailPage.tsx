import { ArrowLeft, Ban, Link2, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { ApiError } from '../../../shared/api/api-error';
import { useAuth } from '../../../shared/auth/auth-context';
import { InvitationStatusBadge } from '../components/InvitationStatusBadge';
import type { TeacherInvitationSummary } from '../teacher-invitation.types';

function safeReturnUrl(state: unknown) {
  const candidate = (state as { returnUrl?: unknown } | null)?.returnUrl;
  return typeof candidate === 'string' &&
    candidate.startsWith('/admin/teacher-invitations') &&
    !candidate.startsWith('//')
    ? candidate
    : '/admin/teacher-invitations';
}

function displayDate(value: string | null) {
  if (!value) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}

export function AdminTeacherInvitationDetailPage() {
  const { invitationId } = useParams();
  const { request, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const returnUrl = safeReturnUrl(location.state);
  const [invitation, setInvitation] = useState<TeacherInvitationSummary | null>(null);
  const [loading, setLoading] = useState(Boolean(invitationId));
  const [pageError, setPageError] = useState<string | null>(
    invitationId ? null : 'Không tìm thấy mã lời mời.',
  );
  const [reason, setReason] = useState('');
  const [revoking, setRevoking] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  useEffect(() => {
    let active = true;
    if (!invitationId) return undefined;
    void request<{
      success: true;
      data: { invitation: TeacherInvitationSummary };
    }>(`/admin/teacher-invitations/${invitationId}`)
      .then((response) => {
        if (active) setInvitation(response.data.invitation);
      })
      .catch((error) => {
        if (active) {
          setPageError(error instanceof ApiError ? error.message : 'Không thể tải lời mời.');
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [invitationId, request]);

  async function revokeInvitation() {
    if (!invitation || !invitationId || reason.trim().length < 5) return;
    if (!window.confirm(`Thu hồi lời mời dành cho ${invitation.email}?`)) return;
    setRevoking(true);
    setFeedback(null);
    try {
      const response = await request<{
        success: true;
        data: { invitation: TeacherInvitationSummary; auditId: string };
      }>(`/admin/teacher-invitations/${invitationId}/revoke`, {
        method: 'POST',
        body: { reason: reason.trim() },
      });
      setInvitation(response.data.invitation);
      setReason('');
      setFeedback({ type: 'success', text: 'Đã thu hồi lời mời và ghi nhận Audit Log.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error instanceof ApiError ? error.message : 'Không thể thu hồi lời mời.',
      });
    } finally {
      setRevoking(false);
    }
  }

  return (
    <section className="page-section">
      <header className="detail-header">
        <button
          className="icon-button"
          type="button"
          onClick={() => navigate(returnUrl)}
          aria-label="Quay lại danh sách lời mời"
          title="Quay lại danh sách lời mời"
        >
          <ArrowLeft size={19} />
        </button>
        <div>
          <p className="eyebrow">Teacher invitation detail</p>
          <h1>Chi tiết lời mời</h1>
        </div>
      </header>

      {loading ? (
        <div className="list-state" aria-live="polite">
          <div className="spinner" aria-hidden="true" />
          <p>Đang tải lời mời...</p>
        </div>
      ) : null}
      {!loading && pageError ? (
        <div className="list-state list-state--error" role="alert">
          {pageError}
        </div>
      ) : null}

      {!loading && invitation ? (
        <div className="detail-layout">
          <section className="detail-panel" aria-labelledby="invitation-summary">
            <div className="panel-title">
              <Link2 size={21} />
              <h2 id="invitation-summary">Thông tin lời mời</h2>
            </div>
            <dl className="detail-list">
              <div>
                <dt>Email Teacher</dt>
                <dd>{invitation.email}</dd>
              </div>
              <div>
                <dt>Trạng thái</dt>
                <dd>
                  <InvitationStatusBadge status={invitation.status} />
                </dd>
              </div>
              <div>
                <dt>Phương thức gửi</dt>
                <dd>Admin sao chép và gửi thủ công</dd>
              </div>
              <div>
                <dt>Hết hạn</dt>
                <dd>{displayDate(invitation.expiresAt)}</dd>
              </div>
              <div>
                <dt>Số lần sao chép</dt>
                <dd>{invitation.copyCount}</dd>
              </div>
              <div>
                <dt>Kênh gần nhất</dt>
                <dd>{invitation.channelHint ?? 'Chưa ghi nhận'}</dd>
              </div>
              <div>
                <dt>Sao chép gần nhất</dt>
                <dd>{displayDate(invitation.lastCopiedAt)}</dd>
              </div>
              <div>
                <dt>Ngày tạo</dt>
                <dd>{displayDate(invitation.createdAt)}</dd>
              </div>
              <div>
                <dt>Ngày chấp nhận</dt>
                <dd>{displayDate(invitation.acceptedAt)}</dd>
              </div>
              <div>
                <dt>Ngày thu hồi</dt>
                <dd>{displayDate(invitation.revokedAt)}</dd>
              </div>
            </dl>
            <p className="security-note">
              Link và token không được lưu để hiển thị lại. Nếu cần link mới, hãy thu hồi lời mời
              đang chờ rồi tạo lời mời khác.
            </p>
          </section>

          <section className="detail-panel" aria-labelledby="invitation-governance">
            <div className="panel-title">
              <ShieldCheck size={21} />
              <h2 id="invitation-governance">Quản trị lời mời</h2>
            </div>
            {invitation.status === 'PENDING' && hasPermission('teacher_invitation.revoke') ? (
              <div className="governance-form">
                <div className="form-field">
                  <label htmlFor="revokeReason">Lý do thu hồi</label>
                  <textarea
                    id="revokeReason"
                    value={reason}
                    minLength={5}
                    maxLength={500}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </div>
                <button
                  className="danger-button"
                  type="button"
                  disabled={revoking || reason.trim().length < 5}
                  onClick={() => void revokeInvitation()}
                >
                  <Ban size={17} /> {revoking ? 'Đang thu hồi...' : 'Thu hồi lời mời'}
                </button>
              </div>
            ) : (
              <p className="muted-text">Lời mời này không còn thao tác quản trị hợp lệ.</p>
            )}
            {feedback ? (
              <div
                className={`notice notice--${feedback.type}`}
                role={feedback.type === 'error' ? 'alert' : 'status'}
              >
                {feedback.text}
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </section>
  );
}
