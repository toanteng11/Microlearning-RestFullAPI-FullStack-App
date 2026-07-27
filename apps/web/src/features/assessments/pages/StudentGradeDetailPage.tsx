import { ArrowLeft, ExternalLink, MessageSquareText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../../../shared/auth/auth-context';
import { requestErrorMessage } from '../../learning/learning-format';
import { displayAssessmentDate } from '../assessment-format';
import type { StudentGrade } from '../assessment.types';

export function StudentGradeDetailPage() {
  const { gradeId = '' } = useParams();
  const { request } = useAuth();
  const [grade, setGrade] = useState<StudentGrade | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void request<{ success: true; data: StudentGrade }>(`/students/me/grades/${gradeId}`)
      .then((response) => {
        if (active) setGrade(response.data);
      })
      .catch((requestError) => {
        if (active) setError(requestErrorMessage(requestError, 'Không thể tải chi tiết điểm.'));
      });
    return () => {
      active = false;
    };
  }, [gradeId, request]);

  if (error) return <div className="list-state list-state--error">{error}</div>;
  if (!grade)
    return (
      <div className="list-state">
        <div className="spinner" />
      </div>
    );

  return (
    <section className="page-section assessment-workspace">
      <Link className="back-link" to="/student/grades">
        <ArrowLeft size={17} /> Điểm và nhận xét
      </Link>
      <header className="page-header page-header--aligned">
        <div>
          <p className="eyebrow">
            {grade.activityType === 'QUIZ' ? 'Quiz grade' : 'Assignment grade'}
          </p>
          <h1>{grade.title}</h1>
          <p>
            Trả ngày {grade.returnedAt ? displayAssessmentDate(grade.returnedAt) : 'Chưa xác định'}
          </p>
        </div>
        <div className="grade-hero-score" aria-label={`${grade.score} trên ${grade.maxScore} điểm`}>
          <strong>
            {grade.score}/{grade.maxScore}
          </strong>
          <span>{grade.percentage}%</span>
        </div>
      </header>
      <section className="grade-feedback">
        <h2>
          <MessageSquareText size={20} /> Nhận xét của giảng viên
        </h2>
        <p>{grade.feedback || 'Giảng viên chưa để lại nhận xét.'}</p>
      </section>
      <Link className="button-link button-link--compact" to={grade.actionUrl}>
        <ExternalLink size={17} /> Mở hoạt động
      </Link>
    </section>
  );
}
