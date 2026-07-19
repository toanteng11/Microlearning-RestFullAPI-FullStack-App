import { ArrowLeft, CalendarClock, GraduationCap, Link2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { apiRequest } from '../../../shared/api/api-client';
import { ApiError } from '../../../shared/api/api-error';
import { useAuth } from '../../../shared/auth/auth-context';
import { displayDate } from '../classroom-format';
import { useInviteJoin } from '../invite-join-context';
import type { InvitePreview } from '../classroom.types';

export function InviteJoinPage() {
  const { token, captureFromLocation, clear } = useInviteJoin();
  const { status, user, request } = useAuth();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    captureFromLocation();
  }, [captureFromLocation]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    void apiRequest<{ success: true; data: InvitePreview }>('/classrooms/invite-links/preview', {
      method: 'POST',
      body: { token },
    })
      .then((response) => {
        if (active) {
          setPreview(response.data);
          setError(null);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError instanceof ApiError ? requestError.message : 'Invite Link không hợp lệ.',
          );
        }
      });
    return () => {
      active = false;
    };
  }, [token]);

  async function join() {
    if (!token) return;
    setJoining(true);
    setError(null);
    try {
      const response = await request<{
        success: true;
        data: { classroom: { id: string } };
      }>('/classrooms/join-by-token', { method: 'POST', body: { token } });
      clear();
      navigate(`/student/classrooms/${response.data.classroom.id}`, { replace: true });
    } catch (requestError) {
      setError(
        requestError instanceof ApiError ? requestError.message : 'Không thể tham gia lớp học.',
      );
      setJoining(false);
    }
  }

  function cancel() {
    clear();
    navigate(user?.role === 'STUDENT' ? '/student/dashboard' : '/login', { replace: true });
  }

  return (
    <main className="invite-join-page">
      <header className="invite-join-header">
        <Link className="brand" to="/">
          <GraduationCap size={22} /> Microlearning
        </Link>
        <button
          className="icon-button"
          type="button"
          onClick={cancel}
          aria-label="Quay lại"
          title="Quay lại"
        >
          <ArrowLeft size={18} />
        </button>
      </header>
      <section className="invite-join-content">
        {!token || error ? (
          <div className="message-panel">
            <h1>Không thể mở lời mời</h1>
            <p>{error ?? 'Invite Link không có token hợp lệ.'}</p>
            <button type="button" onClick={cancel}>
              Quay lại
            </button>
          </div>
        ) : null}
        {token && !preview && !error ? (
          <div className="list-state">
            <div className="spinner" />
            <p>Đang kiểm tra lời mời...</p>
          </div>
        ) : null}
        {preview ? (
          <section className="invite-preview-panel">
            <div className="invite-preview-icon">
              <Link2 size={26} />
            </div>
            <p className="eyebrow">Classroom invitation</p>
            <h1>{preview.classroomName}</h1>
            <dl className="detail-list">
              <div>
                <dt>Môn học</dt>
                <dd>{preview.subject ?? 'Chưa có'}</dd>
              </div>
              <div>
                <dt>Giảng viên</dt>
                <dd>{preview.teacher.fullName}</dd>
              </div>
              <div>
                <dt>Hết hạn</dt>
                <dd>
                  <CalendarClock size={16} /> {displayDate(preview.expiresAt)}
                </dd>
              </div>
            </dl>
            {status === 'authenticated' && user?.role === 'STUDENT' ? (
              <button
                className="primary-button"
                type="button"
                disabled={joining}
                onClick={() => void join()}
              >
                {joining ? 'Đang tham gia...' : 'Tham gia lớp học'}
              </button>
            ) : null}
            {status === 'authenticated' && user?.role !== 'STUDENT' ? (
              <div className="notice notice--error">
                Chỉ tài khoản Student có thể tham gia lớp học.
              </div>
            ) : null}
            {status === 'anonymous' ? (
              <div className="invite-auth-actions">
                <Link className="button-link" to="/login" state={{ returnUrl: '/join/invite' }}>
                  Đăng nhập
                </Link>
                <Link to="/register" state={{ returnUrl: '/join/invite' }}>
                  Đăng ký Student
                </Link>
              </div>
            ) : null}
          </section>
        ) : null}
      </section>
    </main>
  );
}
