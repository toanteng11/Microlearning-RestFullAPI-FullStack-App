import { ArrowLeft, BookOpen, Layers3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../../../shared/auth/auth-context';
import { displayLearningDate, requestErrorMessage } from '../learning-format';
import type { CourseGovernanceSummary } from '../learning.types';
import { ContentStatusBadge } from '../components/LearningStatusBadge';

export function AdminCourseDetailPage() {
  const { courseId = '' } = useParams();
  const { request } = useAuth();
  const [course, setCourse] = useState<CourseGovernanceSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void request<{ success: true; data: { course: CourseGovernanceSummary } }>(
      `/admin/courses/${courseId}`,
    )
      .then((response) => {
        if (active) setCourse(response.data.course);
      })
      .catch((requestError) => {
        if (active) setError(requestErrorMessage(requestError, 'Không thể tải Course.'));
      });
    return () => {
      active = false;
    };
  }, [courseId, request]);
  if (error) return <div className="list-state list-state--error">{error}</div>;
  if (!course)
    return (
      <div className="list-state">
        <div className="spinner" />
      </div>
    );
  return (
    <section className="page-section">
      <Link className="back-link" to="/admin/courses">
        <ArrowLeft size={17} /> Course List
      </Link>
      <header className="page-header page-header--aligned">
        <div>
          <p className="eyebrow">Governance detail</p>
          <h1>{course.title}</h1>
          <p>{course.classroom.name}</p>
        </div>
        <ContentStatusBadge status={course.effectiveStatus} />
      </header>
      <div className="detail-layout">
        <section className="detail-panel">
          <dl className="detail-list">
            <div>
              <dt>Teacher</dt>
              <dd>{course.owner.fullName}</dd>
            </div>
            <div>
              <dt>Classroom</dt>
              <dd>{course.classroom.name}</dd>
            </div>
            <div>
              <dt>Cập nhật</dt>
              <dd>{displayLearningDate(course.updatedAt)}</dd>
            </div>
            <div>
              <dt>Xuất bản</dt>
              <dd>{displayLearningDate(course.publishedAt)}</dd>
            </div>
          </dl>
        </section>
        <section className="governance-metrics">
          <div>
            <Layers3 size={22} />
            <strong>{course.moduleCount}</strong>
            <span>Module</span>
          </div>
          <div>
            <BookOpen size={22} />
            <strong>{course.lessonCount}</strong>
            <span>Bài học</span>
          </div>
        </section>
      </div>
      <p className="security-note">
        Màn hình quản trị chỉ hiển thị metadata. Nội dung bài học và tiến độ Student không được cung
        cấp tại đây.
      </p>
    </section>
  );
}
