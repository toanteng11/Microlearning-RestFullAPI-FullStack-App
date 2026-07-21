import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarClock,
  ListTodo,
  LogOut,
  School,
  Settings,
  UserRound,
} from 'lucide-react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';

import { dashboardForRole } from '../../app/route-paths';
import { useAuth } from '../auth/auth-context';

export function AppShell() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="app-frame">
      <header className="app-header">
        <Link className="brand" to={dashboardForRole(user.role)}>
          <BookOpen size={22} aria-hidden="true" />
          <span>Microlearning</span>
        </Link>
        <div className="history-controls" aria-label="Điều hướng lịch sử">
          <button
            className="icon-button"
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Quay lại trang trước"
            title="Quay lại"
          >
            <ArrowLeft size={19} />
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={() => navigate(1)}
            aria-label="Đi tới trang tiếp theo"
            title="Tiến tới"
          >
            <ArrowRight size={19} />
          </button>
        </div>
        <nav className="app-nav" aria-label="Điều hướng chính">
          <NavLink to={dashboardForRole(user.role)}>Tổng quan</NavLink>
          {user.role === 'STUDENT' ? (
            <>
              <NavLink to="/student/todo">
                <ListTodo size={17} /> Việc cần làm
              </NavLink>
              <NavLink to="/student/deadlines">
                <CalendarClock size={17} /> Deadline
              </NavLink>
            </>
          ) : null}
          {user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? (
            <>
              <NavLink to="/admin/classrooms">
                <School size={17} /> Classroom
              </NavLink>
              <NavLink to="/admin/courses">
                <BookOpen size={17} /> Course
              </NavLink>
              <NavLink to="/admin/settings/enrollment-policy">
                <Settings size={17} /> Policy
              </NavLink>
            </>
          ) : null}
          <NavLink to="/profile">
            <UserRound size={17} /> Hồ sơ
          </NavLink>
          <button
            className="text-button"
            type="button"
            onClick={() => void logout().then(() => navigate('/login'))}
          >
            <LogOut size={17} /> Đăng xuất
          </button>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
