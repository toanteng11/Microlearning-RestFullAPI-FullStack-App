import { BookOpenCheck, ClipboardList, GraduationCap } from 'lucide-react';

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
