import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className="centered-page">
      <section className="message-panel">
        <p className="eyebrow">404</p>
        <h1>Không tìm thấy trang</h1>
        <p>Đường dẫn này không tồn tại hoặc đã được thay đổi.</p>
        <button type="button" onClick={() => navigate(-1)}>
          Quay lại
        </button>
      </section>
    </main>
  );
}
