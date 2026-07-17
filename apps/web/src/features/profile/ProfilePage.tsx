import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ApiError } from '../../shared/api/api-error';
import { useAuth, type CurrentUser } from '../../shared/auth/auth-context';

interface ProfileEnvelope {
  success: true;
  data: { user: CurrentUser };
}

export function ProfilePage() {
  const { user, request, updateUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void request<ProfileEnvelope>('/users/me')
      .then((response) => {
        if (!active) return;
        updateUser(response.data.user);
        setFullName(response.data.user.fullName);
      })
      .catch(() => active && setError('Không thể tải hồ sơ.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [request, updateUser]);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await request<ProfileEnvelope>('/users/me', {
        method: 'PATCH',
        body: { fullName },
      });
      updateUser(response.data.user);
      setMessage('Đã cập nhật hồ sơ.');
    } catch (requestError) {
      setError(
        requestError instanceof ApiError ? requestError.message : 'Không thể cập nhật hồ sơ.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="content-state">Đang tải hồ sơ...</div>;
  if (!user) return null;

  return (
    <section className="page-section" aria-labelledby="profile-title">
      <header className="page-header">
        <div>
          <p className="eyebrow">Tài khoản</p>
          <h1 id="profile-title">Hồ sơ cá nhân</h1>
        </div>
      </header>
      <form className="profile-form" onSubmit={(event) => void saveProfile(event)}>
        <div className="form-field">
          <label htmlFor="profileName">Họ và tên</label>
          <input
            id="profileName"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            minLength={2}
            maxLength={100}
            required
          />
        </div>
        <div className="read-only-grid">
          <div>
            <span>Email</span>
            <strong>{user.email}</strong>
          </div>
          <div>
            <span>Vai trò</span>
            <strong>{user.role}</strong>
          </div>
          <div>
            <span>Trạng thái</span>
            <strong>{user.status}</strong>
          </div>
        </div>
        {message ? <div className="notice notice--success">{message}</div> : null}
        {error ? <div className="notice notice--error">{error}</div> : null}
        <button className="primary-button fit-button" type="submit" disabled={saving}>
          <Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </form>
    </section>
  );
}
