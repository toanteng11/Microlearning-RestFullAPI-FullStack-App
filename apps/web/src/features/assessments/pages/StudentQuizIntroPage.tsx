import { ArrowLeft, Clock3, Play, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../../../shared/auth/auth-context';
import { requestErrorMessage } from '../../learning/learning-format';
import { displayAssessmentDate } from '../assessment-format';
import type { StudentQuizIntro } from '../assessment.types';

interface AttemptSummary {
  id: string;
  attemptNumber: number;
  status: string;
  submittedAt: string | null;
  resultAvailable: boolean;
  score: number | null;
  maxScore: number;
}

export function StudentQuizIntroPage() {
  const { quizId = '' } = useParams();
  const { request } = useAuth();
  const navigate = useNavigate();
  const [intro, setIntro] = useState<StudentQuizIntro | null>(null);
  const [history, setHistory] = useState<AttemptSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([
      request<{ success: true; data: StudentQuizIntro }>(`/students/quizzes/${quizId}`),
      request<{ success: true; data: { items: AttemptSummary[] } }>(
        `/students/quizzes/${quizId}/attempts?page=1&limit=20`,
      ),
    ])
      .then(([introResponse, historyResponse]) => {
        if (!active) return;
        setIntro(introResponse.data);
        setHistory(historyResponse.data.items);
        setError(null);
      })
      .catch((requestError) => {
        if (active)
          setError(requestErrorMessage(requestError, 'Không thể tải thông tin bài kiểm tra.'));
      });
    return () => {
      active = false;
    };
  }, [quizId, request]);

  async function startAttempt() {
    setBusy(true);
    setError(null);
    try {
      const response = await request<{
        success: true;
        data: { attempt: { id: string }; resumed: boolean };
      }>(`/students/quizzes/${quizId}/attempts`, { method: 'POST', body: {} });
      navigate(`/student/quiz-attempts/${response.data.attempt.id}`);
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể bắt đầu bài kiểm tra.'));
    } finally {
      setBusy(false);
    }
  }

  if (error && !intro) return <div className="list-state list-state--error">{error}</div>;
  if (!intro)
    return (
      <div className="list-state">
        <div className="spinner" />
      </div>
    );

  return (
    <section className="page-section assessment-workspace">
      <Link className="back-link" to={`/student/courses/${intro.courseId}`}>
        <ArrowLeft size={17} /> Quay lại khóa học
      </Link>
      <header className="page-header page-header--aligned">
        <div>
          <p className="eyebrow">Bài kiểm tra</p>
          <h1>{intro.title}</h1>
          <p>{intro.instruction}</p>
        </div>
        <button
          disabled={busy || !intro.canStart}
          onClick={() => void startAttempt()}
          type="button"
        >
          {intro.activeAttemptId ? <RotateCcw size={17} /> : <Play size={17} />}
          {intro.activeAttemptId ? 'Tiếp tục làm bài' : 'Bắt đầu làm bài'}
        </button>
      </header>
      {error ? <div className="notice notice--error">{error}</div> : null}
      {!intro.canStart && intro.unavailableReason ? (
        <div className="notice notice--warning">
          Hiện chưa thể bắt đầu: {intro.unavailableReason}
        </div>
      ) : null}
      <div className="assessment-facts">
        <div>
          <strong>{intro.attemptsRemaining}</strong>
          <span>Lượt còn lại</span>
        </div>
        <div>
          <strong>{intro.timeLimitMinutes ?? 'Không giới hạn'}</strong>
          <span>{intro.timeLimitMinutes ? 'Phút' : 'Thời gian'}</span>
        </div>
        <div>
          <Clock3 size={20} />
          <span>Hạn {displayAssessmentDate(intro.effectiveDeadline)}</span>
        </div>
      </div>
      <section className="assessment-history">
        <h2>Lịch sử làm bài</h2>
        {history.length === 0 ? (
          <p>Chưa có lượt làm nào.</p>
        ) : (
          <div className="assessment-list">
            {history.map((attempt) => (
              <article className="assessment-row" key={attempt.id}>
                <div>
                  <strong>Lượt {attempt.attemptNumber}</strong>
                  <p>
                    {attempt.submittedAt ? displayAssessmentDate(attempt.submittedAt) : 'Đang làm'}
                  </p>
                </div>
                {attempt.resultAvailable ? (
                  <Link
                    className="button-link button-link--secondary"
                    to={`/student/quiz-attempts/${attempt.id}/result`}
                  >
                    {attempt.score}/{attempt.maxScore} điểm
                  </Link>
                ) : attempt.status === 'IN_PROGRESS' ? (
                  <Link
                    className="button-link button-link--secondary"
                    to={`/student/quiz-attempts/${attempt.id}`}
                  >
                    Tiếp tục
                  </Link>
                ) : (
                  <span>Chờ kết quả</span>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
