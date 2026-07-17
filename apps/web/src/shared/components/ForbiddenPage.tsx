import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ForbiddenPage() {
  const navigate = useNavigate();
  return (
    <main className="centered-page">
      <section className="message-panel" aria-labelledby="forbidden-title">
        <ShieldAlert size={28} aria-hidden="true" />
        <h1 id="forbidden-title">Không có quyền truy cập</h1>
        <p>Tài khoản hiện tại không được phép mở khu vực này.</p>
        <button type="button" onClick={() => navigate(-1)}>
          Quay lại
        </button>
      </section>
    </main>
  );
}
