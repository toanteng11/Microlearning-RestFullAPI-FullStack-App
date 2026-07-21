import { ArrowLeft, BookOpen, UsersRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ApiError } from '../../../shared/api/api-error';
import { useAuth } from '../../../shared/auth/auth-context';
import { ClassroomStatusBadge } from '../components/ClassroomStatusBadge';
import { displayDate } from '../classroom-format';
import type { ClassroomDetail } from '../classroom.types';

export function AdminClassroomDetailPage() {
  const { classroomId = '' } = useParams();
  const { request } = useAuth();
  const [classroom, setClassroom] = useState<(ClassroomDetail & { memberCount: number }) | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void request<{ success: true; data: { classroom: ClassroomDetail & { memberCount: number } } }>(
      `/admin/classrooms/${classroomId}`,
    )
      .then((response) => {
        if (active) setClassroom(response.data.classroom);
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError instanceof ApiError ? requestError.message : 'Không thể tải Classroom.',
          );
      });
    return () => {
      active = false;
    };
  }, [classroomId, request]);

  if (error) return <div className="list-state list-state--error">{error}</div>;
  if (!classroom)
    return (
      <div className="list-state">
        <div className="spinner" />
      </div>
    );
  return (
    <section className="page-section">
      <Link className="back-link" to="/admin/classrooms">
        <ArrowLeft size={17} /> Classroom List
      </Link>
      <header className="classroom-detail-header">
        <div>
          <p className="eyebrow">Governance detail</p>
          <h1>{classroom.name}</h1>
        </div>
        <ClassroomStatusBadge status={classroom.status} />
      </header>
      <div className="detail-layout">
        <section className="detail-panel">
          <dl className="detail-list">
            <div>
              <dt>Teacher</dt>
              <dd>{classroom.owner.fullName}</dd>
            </div>
            <div>
              <dt>Môn học</dt>
              <dd>{classroom.subject ?? 'Chưa có'}</dd>
            </div>
            <div>
              <dt>Enrollment</dt>
              <dd>{classroom.enrollmentStatus}</dd>
            </div>
            <div>
              <dt>Cập nhật</dt>
              <dd>{displayDate(classroom.updatedAt)}</dd>
            </div>
          </dl>
        </section>
        <section className="governance-metrics">
          <div>
            <UsersRound size={24} />
            <strong>{classroom.memberCount}</strong>
            <span>thành viên đang hoạt động</span>
          </div>
          <div>
            <BookOpen size={24} />
            <strong>{classroom.contentCount ?? 0}</strong>
            <span>Course đang quản trị</span>
          </div>
          <div>
            <BookOpen size={24} />
            <strong>{classroom.contentSummary?.lessonCount ?? 0}</strong>
            <span>bài học</span>
          </div>
        </section>
      </div>
    </section>
  );
}
