import { ShieldCheck, UserRoundCog, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';

const entries = [
  {
    path: '/admin/users/students',
    title: 'Student List',
    description: 'Tài khoản học sinh tự đăng ký và trạng thái truy cập.',
    icon: UsersRound,
  },
  {
    path: '/admin/users/teachers',
    title: 'Teacher List',
    description: 'Tài khoản giảng viên đã kích hoạt qua invitation.',
    icon: UserRoundCog,
  },
  {
    path: '/admin/users/admins',
    title: 'Admin List',
    description: 'Tài khoản quản trị với dữ liệu và thao tác giới hạn.',
    icon: ShieldCheck,
  },
] as const;

export function AdminUsersPage() {
  return (
    <section className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">User administration</p>
          <h1>Quản lý người dùng</h1>
          <p>Mỗi nhóm tài khoản được truy vấn và kiểm soát theo phạm vi riêng.</p>
        </div>
      </header>
      <div className="management-grid">
        {entries.map(({ path, title, description, icon: Icon }) => (
          <Link className="management-card" to={path} key={path}>
            <Icon size={23} aria-hidden="true" />
            <span>
              <strong>{title}</strong>
              <small>{description}</small>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
