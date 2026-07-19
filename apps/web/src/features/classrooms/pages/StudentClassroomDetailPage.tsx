import { ArrowLeft, Archive, BookOpen, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ApiError } from '../../../shared/api/api-error';
import { useAuth } from '../../../shared/auth/auth-context';
import { ClassroomStatusBadge } from '../components/ClassroomStatusBadge';
import { displayDate } from '../classroom-format';
import type { ClassroomDetail, ClassroomDetailEnvelope } from '../classroom.types';

export function StudentClassroomDetailPage() {
  const { classroomId = '' } = useParams();
  const { request } = useAuth();
  const [classroom, setClassroom] = useState<ClassroomDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void request<ClassroomDetailEnvelope>(`/classrooms/${classroomId}`)
      .then((response) => {
        if (active) setClassroom(response.data.classroom);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError instanceof ApiError ? requestError.message : 'Không thể tải lớp học.',
          );
        }
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
      <Link className="back-link" to="/student/dashboard">
        <ArrowLeft size={17} /> Lớp học của tôi
      </Link>
      <header className="classroom-detail-header">
        <div>
          <p className="eyebrow">{classroom.subject ?? 'Lớp học'}</p>
          <h1>{classroom.name}</h1>
          <p>{classroom.description ?? 'Chưa có mô tả.'}</p>
        </div>
        <ClassroomStatusBadge status={classroom.status} />
      </header>
      {classroom.status === 'ARCHIVED' ? (
        <div className="notice notice--error">
          <Archive size={17} /> Lớp học đã được lưu trữ và chỉ còn quyền xem.
        </div>
      ) : null}
      <div className="detail-layout">
        <section className="detail-panel">
          <div className="panel-title">
            <BookOpen size={20} />
            <h2>Thông tin lớp học</h2>
          </div>
          <dl className="detail-list">
            <div>
              <dt>Nhóm</dt>
              <dd>{classroom.section ?? 'Chưa có'}</dd>
            </div>
            <div>
              <dt>Ngày tham gia</dt>
              <dd>{displayDate(classroom.membership?.joinedAt)}</dd>
            </div>
          </dl>
        </section>
        <section className="detail-panel">
          <div className="panel-title">
            <UserRound size={20} />
            <h2>Giảng viên</h2>
          </div>
          <strong>{classroom.owner.fullName}</strong>
        </section>
      </div>
    </section>
  );
}
