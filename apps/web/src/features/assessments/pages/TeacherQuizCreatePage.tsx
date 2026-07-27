import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../../../shared/auth/auth-context';
import { requestErrorMessage } from '../../learning/learning-format';
import { QuizSettingsForm, type QuizSettingsValue } from '../components/QuizSettingsForm';
import type { TeacherQuiz } from '../assessment.types';

export function TeacherQuizCreatePage() {
  const { courseId = '' } = useParams();
  const navigate = useNavigate();
  const { request } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(value: QuizSettingsValue) {
    setBusy(true);
    setError(null);
    try {
      const response = await request<{ success: true; data: { quiz: TeacherQuiz } }>(
        `/teacher/courses/${courseId}/quizzes`,
        { method: 'POST', body: { moduleId: null, ...value } },
      );
      navigate(`/teacher/quizzes/${response.data.quiz.id}/edit`, { replace: true });
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể tạo bài kiểm tra.'));
      setBusy(false);
    }
  }

  return (
    <section className="page-section">
      <Link className="back-link" to={`/teacher/courses/${courseId}/assessments`}>
        <ArrowLeft size={17} /> Bài kiểm tra
      </Link>
      <header className="page-header">
        <div>
          <p className="eyebrow">Teacher authoring</p>
          <h1>Tạo bài kiểm tra</h1>
        </div>
      </header>
      {error ? <div className="notice notice--error">{error}</div> : null}
      <section className="editor-section">
        <QuizSettingsForm busy={busy} submitLabel="Tạo bài kiểm tra" onSubmit={create} />
      </section>
    </section>
  );
}
