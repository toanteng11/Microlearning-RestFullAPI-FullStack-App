import { ArrowLeft, Save, ShieldCheck, UserRoundCog } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { ApiError } from '../../../shared/api/api-error';
import { useAuth } from '../../../shared/auth/auth-context';
import { StatusBadge } from '../components/StatusBadge';
import type {
  AccountRole,
  AccountStatus,
  AdminUserDetail,
  AdminUserDetailEnvelope,
  AdminUserMutationEnvelope,
} from '../admin-user.types';

const ROLE_TRANSITIONS: Record<AccountRole, AccountRole[]> = {
  STUDENT: ['ADMIN'],
  TEACHER: ['ADMIN'],
  ADMIN: ['STUDENT', 'TEACHER', 'SUPER_ADMIN'],
  SUPER_ADMIN: ['ADMIN'],
};

function safeReturnUrl(state: unknown) {
  const candidate = (state as { returnUrl?: unknown } | null)?.returnUrl;
  return typeof candidate === 'string' &&
    candidate.startsWith('/admin/users') &&
    !candidate.startsWith('//')
    ? candidate
    : '/admin/users';
}

function displayDate(value: string | null | undefined) {
  if (!value) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}

function statusChoices(user: AdminUserDetail): AccountStatus[] {
  const choices: AccountStatus[] = [];
  if (user.allowedActions.includes('STATUS_BLOCK')) choices.push('BLOCKED');
  if (user.allowedActions.includes('STATUS_DEACTIVATE')) choices.push('INACTIVE');
  if (user.allowedActions.includes('STATUS_ACTIVATE')) choices.push('ACTIVE');
  return choices;
}

function mutationMessage(error: unknown) {
  if (!(error instanceof ApiError)) return 'Không thể cập nhật tài khoản.';
  if (error.code === 'CONCURRENT_MODIFICATION') {
    return 'Dữ liệu vừa được thay đổi. Hãy tải lại trước khi tiếp tục.';
  }
  if (error.code === 'FINAL_SUPER_ADMIN_REQUIRED') {
    return 'Hệ thống phải còn ít nhất một Super Admin đang hoạt động.';
  }
  return error.message;
}

export function AdminUserDetailPage() {
  const { userId } = useParams();
  const { request } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const returnUrl = safeReturnUrl(location.state);
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(Boolean(userId));
  const [pageError, setPageError] = useState<string | null>(
    userId ? null : 'Không tìm thấy mã người dùng.',
  );
  const [status, setStatus] = useState<AccountStatus | ''>('');
  const [role, setRole] = useState<AccountRole | ''>('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  useEffect(() => {
    let active = true;
    if (!userId) return undefined;
    void request<AdminUserDetailEnvelope>(`/admin/users/${userId}`)
      .then((response) => {
        if (active) setUser(response.data.user);
      })
      .catch((error) => {
        if (active) {
          setPageError(error instanceof ApiError ? error.message : 'Không thể tải người dùng.');
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [request, userId]);

  const availableStatuses = useMemo(() => (user ? statusChoices(user) : []), [user]);
  const availableRoles = user ? ROLE_TRANSITIONS[user.role] : [];

  async function submitMutation(type: 'status' | 'role') {
    if (!user || !userId || reason.trim().length < 5) return;
    const nextValue = type === 'status' ? status : role;
    if (!nextValue) return;
    const confirmed = window.confirm(
      type === 'status'
        ? `Xác nhận đổi trạng thái thành ${nextValue}?`
        : `Xác nhận đổi vai trò thành ${nextValue}?`,
    );
    if (!confirmed) return;

    setSaving(true);
    setFeedback(null);
    try {
      const response = await request<AdminUserMutationEnvelope>(`/admin/users/${userId}/${type}`, {
        method: 'PATCH',
        body: {
          [type]: nextValue,
          reason: reason.trim(),
          expectedUpdatedAt: user.updatedAt,
        },
      });
      setUser(response.data.user);
      setStatus('');
      setRole('');
      setReason('');
      setFeedback({ type: 'success', text: 'Đã cập nhật tài khoản và ghi nhận Audit Log.' });
    } catch (error) {
      setFeedback({ type: 'error', text: mutationMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page-section">
      <header className="detail-header">
        <button
          className="icon-button"
          type="button"
          onClick={() => navigate(returnUrl)}
          aria-label="Quay lại danh sách"
          title="Quay lại danh sách"
        >
          <ArrowLeft size={19} />
        </button>
        <div>
          <p className="eyebrow">User detail</p>
          <h1>Chi tiết người dùng</h1>
        </div>
      </header>

      {loading ? (
        <div className="list-state" aria-live="polite">
          <div className="spinner" aria-hidden="true" />
          <p>Đang tải người dùng...</p>
        </div>
      ) : null}
      {!loading && pageError ? (
        <div className="list-state list-state--error" role="alert">
          {pageError}
        </div>
      ) : null}

      {!loading && user ? (
        <div className="detail-layout">
          <section className="detail-panel" aria-labelledby="account-summary">
            <div className="panel-title">
              <UserRoundCog size={21} />
              <h2 id="account-summary">Thông tin tài khoản</h2>
            </div>
            <dl className="detail-list">
              <div>
                <dt>Họ và tên</dt>
                <dd>{user.fullName}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt>Vai trò</dt>
                <dd>{user.role}</dd>
              </div>
              <div>
                <dt>Trạng thái</dt>
                <dd>
                  <StatusBadge status={user.status} />
                </dd>
              </div>
              <div>
                <dt>Nguồn đăng ký</dt>
                <dd>{user.registrationSource}</dd>
              </div>
              <div>
                <dt>Đơn vị</dt>
                <dd>{user.department ?? 'Chưa cập nhật'}</dd>
              </div>
              <div>
                <dt>Đăng nhập gần nhất</dt>
                <dd>{displayDate(user.lastLoginAt)}</dd>
              </div>
              <div>
                <dt>Ngày tạo</dt>
                <dd>{displayDate(user.createdAt)}</dd>
              </div>
            </dl>
          </section>

          <section className="detail-panel" aria-labelledby="account-governance">
            <div className="panel-title">
              <ShieldCheck size={21} />
              <h2 id="account-governance">Quản trị tài khoản</h2>
            </div>
            {availableStatuses.length === 0 && !user.allowedActions.includes('ROLE_CHANGE') ? (
              <p className="muted-text">Không có thao tác quản trị hợp lệ cho tài khoản này.</p>
            ) : (
              <div className="governance-form">
                {availableStatuses.length > 0 ? (
                  <div className="form-field">
                    <label htmlFor="nextStatus">Trạng thái mới</label>
                    <select
                      id="nextStatus"
                      value={status}
                      onChange={(event) => setStatus(event.target.value as AccountStatus)}
                    >
                      <option value="">Chọn trạng thái</option>
                      {availableStatuses.map((value) => (
                        <option value={value} key={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                {user.allowedActions.includes('ROLE_CHANGE') ? (
                  <div className="form-field">
                    <label htmlFor="nextRole">Vai trò mới</label>
                    <select
                      id="nextRole"
                      value={role}
                      onChange={(event) => setRole(event.target.value as AccountRole)}
                    >
                      <option value="">Chọn vai trò</option>
                      {availableRoles.map((value) => (
                        <option value={value} key={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <div className="form-field">
                  <label htmlFor="governanceReason">Lý do thay đổi</label>
                  <textarea
                    id="governanceReason"
                    maxLength={500}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </div>
                <div className="governance-actions">
                  {availableStatuses.length > 0 ? (
                    <button
                      type="button"
                      disabled={saving || !status || reason.trim().length < 5}
                      onClick={() => void submitMutation('status')}
                    >
                      <Save size={17} /> Cập nhật trạng thái
                    </button>
                  ) : null}
                  {user.allowedActions.includes('ROLE_CHANGE') ? (
                    <button
                      type="button"
                      disabled={saving || !role || reason.trim().length < 5}
                      onClick={() => void submitMutation('role')}
                    >
                      <Save size={17} /> Cập nhật vai trò
                    </button>
                  ) : null}
                </div>
              </div>
            )}
            {feedback ? (
              <div
                className={`notice notice--${feedback.type === 'success' ? 'success' : 'error'}`}
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
