import { zodResolver } from '@hookform/resolvers/zod';
import {
  ChevronLeft,
  ChevronRight,
  Clipboard,
  FilterX,
  Link2,
  MailPlus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { z } from 'zod';

import { ApiError } from '../../../shared/api/api-error';
import { useAuth } from '../../../shared/auth/auth-context';
import { InvitationStatusBadge } from '../components/InvitationStatusBadge';
import type {
  CreatedTeacherInvitation,
  TeacherInvitationChannel,
  TeacherInvitationListEnvelope,
  TeacherInvitationStatus,
} from '../teacher-invitation.types';

const createSchema = z.object({
  email: z.email('Email giảng viên không hợp lệ.'),
  expiresInDays: z.number().int().min(1).max(30),
});

type CreateValues = z.infer<typeof createSchema>;

const STATUS_OPTIONS: Array<{ value: TeacherInvitationStatus | ''; label: string }> = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ kích hoạt' },
  { value: 'ACCEPTED', label: 'Đã chấp nhận' },
  { value: 'EXPIRED', label: 'Đã hết hạn' },
  { value: 'REVOKED', label: 'Đã thu hồi' },
];

const CHANNEL_OPTIONS: Array<{ value: TeacherInvitationChannel; label: string }> = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'ZALO', label: 'Zalo' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'MESSENGER', label: 'Messenger' },
  { value: 'TEAMS', label: 'Microsoft Teams' },
  { value: 'OTHER', label: 'Kênh khác' },
];

function displayDate(value: string | null) {
  if (!value) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}

function createErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) return 'Không thể tạo lời mời. Vui lòng thử lại.';
  if (error.code === 'INVITATION_ALREADY_PENDING') {
    return 'Email này đang có một lời mời chờ kích hoạt.';
  }
  if (error.code === 'TEACHER_ALREADY_ACTIVE') {
    return 'Email này đã thuộc một tài khoản Teacher đang hoạt động.';
  }
  if (error.code === 'DUPLICATE_RESOURCE') {
    return 'Email này đã được sử dụng bởi một tài khoản khác.';
  }
  return error.message;
}

interface CopyAuditState {
  eventId: string;
  channel: TeacherInvitationChannel;
}

export function AdminTeacherInvitationsPage() {
  const { request, hasPermission } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryString = searchParams.toString();
  const page = Number(searchParams.get('page') ?? '1');
  const [reloadKey, setReloadKey] = useState(0);
  const requestKey = `${queryString}#${reloadKey}`;
  const [loadState, setLoadState] = useState<{
    key: string;
    result: TeacherInvitationListEnvelope | null;
    error: string | null;
  }>({ key: '', result: null, error: null });
  const [created, setCreated] = useState<CreatedTeacherInvitation | null>(null);
  const [channel, setChannel] = useState<TeacherInvitationChannel>('EMAIL');
  const [copying, setCopying] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [pendingAudit, setPendingAudit] = useState<CopyAuditState | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { email: '', expiresInDays: 7 },
  });

  useEffect(() => {
    let active = true;
    const suffix = queryString ? `?${queryString}` : '';
    void request<TeacherInvitationListEnvelope>(`/admin/teacher-invitations${suffix}`)
      .then((response) => {
        if (active) setLoadState({ key: requestKey, result: response, error: null });
      })
      .catch((error) => {
        if (!active) return;
        setLoadState({
          key: requestKey,
          result: null,
          error: error instanceof ApiError ? error.message : 'Không thể tải danh sách lời mời.',
        });
      });
    return () => {
      active = false;
    };
  }, [queryString, reloadKey, request, requestKey]);

  const loading = loadState.key !== requestKey;
  const result = loading ? null : loadState.result;
  const loadError = loading ? null : loadState.error;
  const totalSummary = useMemo(
    () => (result ? `${result.pagination.totalItems} lời mời` : ''),
    [result],
  );
  const returnUrl = `${location.pathname}${location.search}`;
  const emailFilter = searchParams.get('email') ?? '';
  const statusFilter = searchParams.get('status') ?? '';

  function updateQuery(updates: Record<string, string>) {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setSearchParams(next);
  }

  const submitCreate = handleSubmit(async (values) => {
    try {
      const response = await request<{
        success: true;
        data: { invitation: CreatedTeacherInvitation };
      }>('/admin/teacher-invitations', { method: 'POST', body: values });
      setCreated(response.data.invitation);
      setCopyFeedback(null);
      setPendingAudit(null);
      reset();
      setReloadKey((current) => current + 1);
    } catch (error) {
      setError('root', { message: createErrorMessage(error) });
    }
  });

  async function recordCopyEvent(audit: CopyAuditState) {
    if (!created) return;
    await request(`/admin/teacher-invitations/${created.id}/copy-events`, {
      method: 'POST',
      body: { eventId: audit.eventId, channelHint: audit.channel },
    });
    setPendingAudit(null);
    setCopyFeedback({ type: 'success', text: 'Đã sao chép link và ghi nhận Audit Log.' });
    setReloadKey((current) => current + 1);
  }

  async function copyInvitationLink() {
    if (!created) return;
    setCopying(true);
    setCopyFeedback(null);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(created.invitationLink);
      const audit = { eventId: crypto.randomUUID(), channel };
      try {
        await recordCopyEvent(audit);
      } catch {
        setPendingAudit(audit);
        setCopyFeedback({
          type: 'error',
          text: 'Link đã được sao chép, nhưng chưa ghi nhận được Audit Log. Hãy thử ghi nhận lại.',
        });
      }
    } catch {
      setCopyFeedback({
        type: 'error',
        text: 'Trình duyệt không cho phép sao chép. Hãy cấp quyền Clipboard rồi thử lại.',
      });
    } finally {
      setCopying(false);
    }
  }

  async function retryCopyAudit() {
    if (!pendingAudit) return;
    setCopying(true);
    try {
      await recordCopyEvent(pendingAudit);
    } catch {
      setCopyFeedback({
        type: 'error',
        text: 'Link đã được sao chép, nhưng Audit Log vẫn chưa được ghi nhận.',
      });
    } finally {
      setCopying(false);
    }
  }

  function submitFilter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get('email') ?? '').trim();
    updateQuery({ email, page: '' });
  }

  return (
    <section className="page-section">
      <header className="page-header page-header--aligned">
        <div>
          <p className="eyebrow">Teacher invitation administration</p>
          <h1>Lời mời Teacher</h1>
          <p>Admin tạo link một lần và tự gửi qua Email, Zalo, Facebook hoặc kênh phù hợp.</p>
        </div>
        <span className="result-summary" aria-live="polite">
          {totalSummary}
        </span>
      </header>

      {hasPermission('teacher_invitation.create') ? (
        <section className="invitation-create" aria-labelledby="create-invitation-title">
          <div>
            <div className="panel-title">
              <MailPlus size={21} />
              <h2 id="create-invitation-title">Tạo lời mời mới</h2>
            </div>
            <p className="muted-text">
              Email dùng để ràng buộc đúng người nhận; hệ thống không tự gửi thư và không lưu link
              gốc.
            </p>
          </div>
          <form className="invitation-create-form" onSubmit={(event) => void submitCreate(event)}>
            <div className="form-field">
              <label htmlFor="teacherEmail">Email giảng viên</label>
              <input
                id="teacherEmail"
                type="email"
                autoComplete="off"
                placeholder="teacher@example.com"
                {...register('email')}
              />
              {errors.email ? <span className="field-error">{errors.email.message}</span> : null}
            </div>
            <div className="form-field">
              <label htmlFor="expiresInDays">Hiệu lực</label>
              <select id="expiresInDays" {...register('expiresInDays', { valueAsNumber: true })}>
                <option value="1">1 ngày</option>
                <option value="3">3 ngày</option>
                <option value="7">7 ngày</option>
                <option value="14">14 ngày</option>
                <option value="30">30 ngày</option>
              </select>
            </div>
            <button className="fit-button" type="submit" disabled={isSubmitting}>
              <Link2 size={18} /> {isSubmitting ? 'Đang tạo...' : 'Tạo link mời'}
            </button>
            {errors.root ? (
              <div className="notice notice--error invitation-form-feedback" role="alert">
                {errors.root.message}
              </div>
            ) : null}
          </form>
        </section>
      ) : null}

      {created ? (
        <section className="one-time-link" aria-labelledby="one-time-link-title">
          <div className="one-time-link-heading">
            <div>
              <p className="eyebrow">One-time link</p>
              <h2 id="one-time-link-title">Link chỉ hiển thị trong lần tạo này</h2>
              <p>
                Hãy sao chép và gửi thủ công cho <strong>{created.email}</strong>. Sau khi đóng,
                link không thể xem lại.
              </p>
            </div>
            <button
              className="icon-button"
              type="button"
              aria-label="Đóng link một lần"
              title="Đóng link một lần"
              onClick={() => {
                setCreated(null);
                setPendingAudit(null);
                setCopyFeedback(null);
              }}
            >
              <X size={18} />
            </button>
          </div>
          <div className="one-time-link-value">
            <input aria-label="Link mời Teacher" readOnly value={created.invitationLink} />
            <label className="sr-only" htmlFor="invitationChannel">
              Kênh gửi link
            </label>
            <select
              id="invitationChannel"
              value={channel}
              onChange={(event) => setChannel(event.target.value as TeacherInvitationChannel)}
            >
              {CHANNEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button type="button" disabled={copying} onClick={() => void copyInvitationLink()}>
              <Clipboard size={18} /> {copying ? 'Đang xử lý...' : 'Sao chép'}
            </button>
          </div>
          {copyFeedback ? (
            <div
              className={`notice notice--${copyFeedback.type}`}
              role={copyFeedback.type === 'error' ? 'alert' : 'status'}
            >
              {copyFeedback.text}
              {pendingAudit ? (
                <button
                  className="text-button audit-retry"
                  type="button"
                  disabled={copying}
                  onClick={() => void retryCopyAudit()}
                >
                  <RefreshCw size={16} /> Ghi nhận lại
                </button>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      <form className="filter-bar invitation-filter" onSubmit={submitFilter}>
        <div className="filter-search">
          <label className="sr-only" htmlFor="invitationEmailFilter">
            Tìm theo email giảng viên
          </label>
          <Search size={18} aria-hidden="true" />
          <input
            key={emailFilter}
            id="invitationEmailFilter"
            name="email"
            defaultValue={emailFilter}
            placeholder="Tìm theo email giảng viên"
          />
        </div>
        <label className="sr-only" htmlFor="invitationStatusFilter">
          Lọc trạng thái lời mời
        </label>
        <select
          id="invitationStatusFilter"
          value={statusFilter}
          onChange={(event) => updateQuery({ status: event.target.value, page: '' })}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button className="primary-button primary-button--compact" type="submit">
          <Search size={17} /> Tìm kiếm
        </button>
        {emailFilter || statusFilter ? (
          <button
            className="icon-button"
            type="button"
            aria-label="Xóa bộ lọc"
            title="Xóa bộ lọc"
            onClick={() => setSearchParams({})}
          >
            <FilterX size={18} />
          </button>
        ) : null}
      </form>

      {loading ? (
        <div className="list-state" aria-live="polite">
          <div className="spinner" aria-hidden="true" />
          <p>Đang tải lời mời...</p>
        </div>
      ) : null}
      {!loading && loadError ? (
        <div className="list-state list-state--error" role="alert">
          <p>{loadError}</p>
          <button type="button" onClick={() => setReloadKey((current) => current + 1)}>
            <RefreshCw size={17} /> Thử lại
          </button>
        </div>
      ) : null}
      {!loading && !loadError && result?.data.length === 0 ? (
        <div className="list-state">
          <Link2 size={30} />
          <strong>Không có lời mời phù hợp</strong>
        </div>
      ) : null}
      {!loading && !loadError && result && result.data.length > 0 ? (
        <>
          <div className="data-table-wrap">
            <table className="data-table invitation-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Trạng thái</th>
                  <th>Hết hạn</th>
                  <th>Lần sao chép</th>
                  <th>Ngày tạo</th>
                  <th aria-label="Thao tác" />
                </tr>
              </thead>
              <tbody>
                {result.data.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.email}</strong>
                      <small>{item.deliveryMethod}</small>
                    </td>
                    <td>
                      <InvitationStatusBadge status={item.status} />
                    </td>
                    <td>{displayDate(item.expiresAt)}</td>
                    <td>
                      {item.copyCount}
                      <small>{item.channelHint ?? 'Chưa ghi nhận kênh'}</small>
                    </td>
                    <td>{displayDate(item.createdAt)}</td>
                    <td>
                      <Link
                        className="row-link"
                        to={`/admin/teacher-invitations/${item.id}`}
                        state={{ returnUrl }}
                        aria-label={`Xem lời mời ${item.email}`}
                      >
                        Xem
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mobile-user-list">
            {result.data.map((item) => (
              <article className="mobile-user-card" key={item.id}>
                <div>
                  <strong>{item.email}</strong>
                  <small>Hết hạn: {displayDate(item.expiresAt)}</small>
                </div>
                <InvitationStatusBadge status={item.status} />
                <span>Đã sao chép {item.copyCount} lần</span>
                <Link to={`/admin/teacher-invitations/${item.id}`} state={{ returnUrl }}>
                  Xem chi tiết
                </Link>
              </article>
            ))}
          </div>
        </>
      ) : null}

      {result && result.pagination.totalPages > 0 ? (
        <nav className="pagination" aria-label="Phân trang lời mời">
          <button
            className="icon-button"
            type="button"
            disabled={!result.pagination.hasPreviousPage}
            onClick={() => updateQuery({ page: page > 2 ? String(page - 1) : '' })}
            aria-label="Trang trước"
          >
            <ChevronLeft size={18} />
          </button>
          <span>
            Trang {result.pagination.page}/{result.pagination.totalPages}
          </span>
          <button
            className="icon-button"
            type="button"
            disabled={!result.pagination.hasNextPage}
            onClick={() => updateQuery({ page: String(page + 1) })}
            aria-label="Trang sau"
          >
            <ChevronRight size={18} />
          </button>
        </nav>
      ) : null}
    </section>
  );
}
