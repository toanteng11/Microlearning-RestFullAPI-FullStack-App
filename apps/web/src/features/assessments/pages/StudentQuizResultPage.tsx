import { ArrowLeft, CheckCircle2, Clock3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../../../shared/auth/auth-context';
import { requestErrorMessage } from '../../learning/learning-format';
import { displayAssessmentDate } from '../assessment-format';
import type { StudentQuizResult } from '../assessment.types';

export function StudentQuizResultPage() {
  const { attemptId = '' } = useParams();
  const { request } = useAuth();
  const [result, setResult] = useState<StudentQuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void request<{ success: true; data: StudentQuizResult }>(
      `/students/quiz-attempts/${attemptId}/result`,
    )
      .then((response) => {
        if (active) setResult(response.data);
      })
      .catch((requestError) => {
        if (active) setError(requestErrorMessage(requestError, 'Không thể tải kết quả.'));
      });
    return () => {
      active = false;
    };
  }, [attemptId, request]);

  if (error) return <div className="list-state list-state--error">{error}</div>;
  if (!result)
    return (
      <div className="list-state">
        <div className="spinner" />
      </div>
    );
  return (
    <section className="page-section assessment-workspace">
      <Link className="back-link" to={`/student/quizzes/${result.quizId}`}>
        <ArrowLeft size={17} /> Quay lại bài kiểm tra
      </Link>
      <header className="page-header">
        <p className="eyebrow">Kết quả lượt {result.attemptNumber}</p>
        <h1>{result.title}</h1>
      </header>
      {result.result ? (
        <div className="result-summary">
          <CheckCircle2 size={34} />
          <strong>
            {result.result.score}/{result.result.maxScore}
          </strong>
          <span>điểm</span>
          <p>Nộp lúc {displayAssessmentDate(result.submittedAt)}</p>
        </div>
      ) : (
        <div className="list-state">
          <Clock3 size={30} />
          <strong>Bài làm đang chờ giảng viên chấm.</strong>
          <p>Điểm tạm thời không được hiển thị cho đến khi hoàn tất review.</p>
        </div>
      )}
    </section>
  );
}
