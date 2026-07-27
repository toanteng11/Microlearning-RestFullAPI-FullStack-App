import { ArrowLeft, ClipboardList, FileText, Pencil, Plus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { useAuth } from '../../../shared/auth/auth-context';
import { requestErrorMessage } from '../../learning/learning-format';
import { displayAssessmentDate } from '../assessment-format';
import type { AssignmentListEnvelope, QuizListEnvelope } from '../assessment.types';
import { ActivityStatusBadge } from '../components/ActivityStatusBadge';

export function TeacherAssessmentsPage() {
  const { courseId = '' } = useParams();
  const { request } = useAuth();
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState<QuizListEnvelope | AssignmentListEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);
  const search = params.get('search') ?? '';
  const status = params.get('status') ?? '';
  const type = params.get('type') === 'assignment' ? 'assignment' : 'quiz';

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({ page: '1', limit: '50' });
    if (search) query.set('search', search);
    if (status) query.set('status', status);
    const resource = type === 'assignment' ? 'assignments' : 'quizzes';
    void request<QuizListEnvelope | AssignmentListEnvelope>(
      `/teacher/courses/${courseId}/${resource}?${query}`,
    )
      .then((response) => {
        if (!active) return;
        setResult(response);
        setError(null);
      })
      .catch((requestError) => {
        if (active)
          setError(requestErrorMessage(requestError, 'Không thể tải danh sách đánh giá.'));
      });
    return () => {
      active = false;
    };
  }, [courseId, request, search, status, type]);

  function changeType(nextType: 'quiz' | 'assignment') {
    setResult(null);
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (nextType === 'assignment') next.set('type', 'assignment');
      else next.delete('type');
      next.delete('status');
      return next;
    });
  }

  return (
    <section className="page-section">
      <Link className="back-link" to={`/teacher/courses/${courseId}/content`}>
        <ArrowLeft size={17} /> Nội dung khóa học
      </Link>
      <header className="page-header page-header--aligned">
        <div>
          <p className="eyebrow">Teacher assessments</p>
          <h1>Đánh giá khóa học</h1>
        </div>
        <Link
          className="button-link"
          to={
            type === 'assignment'
              ? `/teacher/courses/${courseId}/assignments/new`
              : `/teacher/courses/${courseId}/quizzes/new`
          }
        >
          <Plus size={17} /> {type === 'assignment' ? 'Tạo bài tập' : 'Tạo bài kiểm tra'}
        </Link>
      </header>
      <div className="segmented-control" role="tablist" aria-label="Loại đánh giá">
        <button
          aria-selected={type === 'quiz'}
          className={type === 'quiz' ? 'is-active' : ''}
          onClick={() => changeType('quiz')}
          role="tab"
          type="button"
        >
          <ClipboardList size={17} /> Bài kiểm tra
        </button>
        <button
          aria-selected={type === 'assignment'}
          className={type === 'assignment' ? 'is-active' : ''}
          onClick={() => changeType('assignment')}
          role="tab"
          type="button"
        >
          <FileText size={17} /> Bài tập
        </button>
      </div>
      <div className="assessment-filter">
        <label className="form-field">
          <span>Tìm kiếm</span>
          <input
            value={search}
            onChange={(event) =>
              setParams((current) => {
                const next = new URLSearchParams(current);
                if (event.target.value) next.set('search', event.target.value);
                else next.delete('search');
                return next;
              })
            }
          />
        </label>
        <label className="form-field">
          <span>Trạng thái</span>
          <select
            value={status}
            onChange={(event) =>
              setParams((current) => {
                const next = new URLSearchParams(current);
                if (event.target.value) next.set('status', event.target.value);
                else next.delete('status');
                return next;
              })
            }
          >
            <option value="">Tất cả</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="SCHEDULED">Đã lên lịch</option>
            <option value="PUBLISHED">Đã xuất bản</option>
            <option value="UNPUBLISHED">Đã thu hồi</option>
            {type === 'assignment' ? <option value="CLOSED">Đã đóng</option> : null}
            <option value="ARCHIVED">Đã lưu trữ</option>
          </select>
        </label>
      </div>
      {error ? <div className="notice notice--error">{error}</div> : null}
      {!result && !error ? (
        <div className="list-state">
          <div className="spinner" />
        </div>
      ) : null}
      {result?.data.items.length === 0 ? (
        <div className="list-state">
          {type === 'assignment' ? <FileText size={30} /> : <ClipboardList size={30} />}
          <strong>Chưa có {type === 'assignment' ? 'bài tập' : 'bài kiểm tra'} phù hợp.</strong>
        </div>
      ) : null}
      <div className="assessment-list">
        {result?.data.items.map((activity) => (
          <article className="assessment-row" key={activity.id}>
            <div>
              <div className="assessment-row__title">
                <h2>{activity.title}</h2>
                <ActivityStatusBadge status={activity.status} />
              </div>
              <p>Hạn hoàn thành: {displayAssessmentDate(activity.dueDate)}</p>
              <small>
                {activity.maxScore} điểm
                {'attemptLimit' in activity
                  ? ` · ${activity.attemptLimit} lượt làm`
                  : ' · Nộp văn bản'}
              </small>
            </div>
            <div className="inline-actions">
              <Link
                className="icon-button"
                title={type === 'assignment' ? 'Danh sách nộp bài' : 'Kết quả bài kiểm tra'}
                to={
                  type === 'assignment'
                    ? `/teacher/assignments/${activity.id}/submissions`
                    : `/teacher/quizzes/${activity.id}/results`
                }
              >
                <Users size={18} />
              </Link>
              <Link
                className="icon-button"
                title="Mở trình soạn đánh giá"
                to={
                  type === 'assignment'
                    ? `/teacher/assignments/${activity.id}/edit`
                    : `/teacher/quizzes/${activity.id}/edit`
                }
              >
                <Pencil size={18} />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
