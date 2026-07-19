import { Save, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ApiError } from '../../../shared/api/api-error';
import { useAuth } from '../../../shared/auth/auth-context';
import { displayDate } from '../classroom-format';
import type { EnrollmentPolicy } from '../classroom.types';

export function AdminEnrollmentPolicyPage() {
  const { request } = useAuth();
  const [policy, setPolicy] = useState<EnrollmentPolicy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void request<{ success: true; data: { policy: EnrollmentPolicy } }>(
      '/admin/settings/enrollment-policy',
    )
      .then((response) => {
        if (active) setPolicy(response.data.policy);
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError instanceof ApiError ? requestError.message : 'Không thể tải policy.',
          );
      });
    return () => {
      active = false;
    };
  }, [request]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!policy) return;
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await request<{ success: true; data: { policy: EnrollmentPolicy } }>(
        '/admin/settings/enrollment-policy',
        {
          method: 'PATCH',
          body: {
            allowClassCodeJoin: values.get('allowClassCodeJoin') === 'on',
            allowInviteLinkJoin: values.get('allowInviteLinkJoin') === 'on',
            defaultInviteLinkLifetimeDays: Number(values.get('defaultInviteLinkLifetimeDays')),
            expectedRevision: policy.revision,
            reason: String(values.get('reason') ?? '').trim(),
          },
        },
      );
      setPolicy(response.data.policy);
      setNotice('Đã cập nhật Enrollment Policy.');
      event.currentTarget.reset();
    } catch (requestError) {
      setError(
        requestError instanceof ApiError ? requestError.message : 'Không thể cập nhật policy.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Classroom governance</p>
          <h1>Enrollment Policy</h1>
        </div>
      </header>
      {error ? <div className="notice notice--error">{error}</div> : null}
      {notice ? <div className="notice notice--success">{notice}</div> : null}
      {!policy ? (
        <div className="list-state">
          <div className="spinner" />
        </div>
      ) : null}
      {policy ? (
        <div className="detail-layout">
          <section className="detail-panel">
            <div className="panel-title">
              <ShieldCheck size={20} />
              <h2>Chính sách hiện tại</h2>
            </div>
            <dl className="detail-list">
              <div>
                <dt>Revision</dt>
                <dd>{policy.revision}</dd>
              </div>
              <div>
                <dt>Cập nhật</dt>
                <dd>{displayDate(policy.updatedAt)}</dd>
              </div>
            </dl>
          </section>
          <section className="detail-panel">
            <form onSubmit={(event) => void submit(event)}>
              <label className="toggle-row">
                <input
                  type="checkbox"
                  name="allowClassCodeJoin"
                  defaultChecked={policy.allowClassCodeJoin}
                />
                <span>Cho phép Class Code toàn hệ thống</span>
              </label>
              <label className="toggle-row">
                <input
                  type="checkbox"
                  name="allowInviteLinkJoin"
                  defaultChecked={policy.allowInviteLinkJoin}
                />
                <span>Cho phép Invite Link toàn hệ thống</span>
              </label>
              <div className="form-field">
                <label htmlFor="default-link-days">Thời hạn Invite Link mặc định</label>
                <input
                  id="default-link-days"
                  name="defaultInviteLinkLifetimeDays"
                  type="number"
                  min={1}
                  max={90}
                  defaultValue={policy.defaultInviteLinkLifetimeDays}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="policy-reason">Lý do thay đổi</label>
                <textarea id="policy-reason" name="reason" minLength={5} required />
              </div>
              <button className="fit-button" type="submit" disabled={busy}>
                <Save size={17} /> {busy ? 'Đang lưu...' : 'Lưu policy'}
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}
