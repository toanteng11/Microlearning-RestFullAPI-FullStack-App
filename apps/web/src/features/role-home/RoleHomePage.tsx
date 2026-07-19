import { BookOpenCheck, ClipboardList, GraduationCap, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../shared/auth/auth-context';

export function StudentHomePage() {
  const { user } = useAuth();
  return (
    <section className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Student workspace</p>
          <h1>Xin chào, {user?.fullName}</h1>
        </div>
      </header>
      <div className="dashboard-grid">
        <section className="work-panel work-panel--wide">
          <div className="panel-title">
            <ClipboardList size={21} />
            <h2>Việc cần làm</h2>
          </div>
          <div className="empty-state">
            <BookOpenCheck size={30} />
            <strong>Chưa có công việc cần hoàn thành</strong>
            <p>Bài học và bài tập chưa hoàn thành sẽ được tổng hợp tại đây.</p>
          </div>
        </section>
        <section className="work-panel">
          <div className="panel-title">
            <GraduationCap size={21} />
            <h2>Lớp học</h2>
          </div>
          <p>Các lớp học đã tham gia được tổng hợp tại trang lớp học của Student.</p>
        </section>
      </div>
    </section>
  );
}

export function TeacherHomePage() {
  const { user } = useAuth();
  return (
    <section className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Teacher workspace</p>
          <h1>Xin chào, {user?.fullName}</h1>
        </div>
      </header>
      <section className="work-panel">
        <div className="panel-title">
          <GraduationCap size={21} />
          <h2>Khóa học của tôi</h2>
        </div>
        <div className="empty-state">
          <p>Các lớp học do Teacher phụ trách được tổng hợp tại trang lớp học.</p>
        </div>
      </section>
    </section>
  );
}

export function AdminHomePage() {
  const { user } = useAuth();
  return (
    <section className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Admin workspace</p>
          <h1>Quản trị hệ thống</h1>
          <p>Đăng nhập với {user?.email}</p>
        </div>
      </header>
      <div className="action-list">
        <Link className="action-row" to="/admin/users">
          <UsersRound size={21} />
          <span>
            <strong>Quản lý người dùng</strong>
            <small>Student, Teacher và Admin theo danh sách riêng.</small>
          </span>
        </Link>
        <Link className="action-row" to="/admin/teacher-invitations">
          <GraduationCap size={21} />
          <span>
            <strong>Lời mời Teacher</strong>
            <small>Tạo và quản lý link mời thủ công.</small>
          </span>
        </Link>
      </div>
    </section>
  );
}
