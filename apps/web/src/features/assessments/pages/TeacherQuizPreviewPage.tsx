import { ArrowLeft, Circle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../../../shared/auth/auth-context';
import { requestErrorMessage } from '../../learning/learning-format';
import type { StudentPreviewQuestion, TeacherQuiz } from '../assessment.types';

export function TeacherQuizPreviewPage() {
  const { quizId = '' } = useParams();
  const { request } = useAuth();
  const [data, setData] = useState<{
    quiz: TeacherQuiz;
    questions: StudentPreviewQuestion[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void request<{
      success: true;
      data: { quiz: TeacherQuiz; questions: StudentPreviewQuestion[] };
    }>(`/teacher/quizzes/${quizId}/preview`, { method: 'POST', body: {} })
      .then((response) => {
        if (active) setData(response.data);
      })
      .catch((requestError) => {
        if (active) setError(requestErrorMessage(requestError, 'Không thể tải bản xem trước.'));
      });
    return () => {
      active = false;
    };
  }, [quizId, request]);
  if (error) return <div className="list-state list-state--error">{error}</div>;
  if (!data)
    return (
      <div className="list-state">
        <div className="spinner" />
      </div>
    );
  return (
    <section className="page-section assessment-preview">
      <Link className="back-link" to={`/teacher/quizzes/${quizId}/edit`}>
        <ArrowLeft size={17} /> Trình soạn bài kiểm tra
      </Link>
      <header className="page-header">
        <div>
          <p className="eyebrow">Student preview</p>
          <h1>{data.quiz.title}</h1>
          <p>{data.quiz.instruction}</p>
        </div>
      </header>
      {data.questions.map((question, index) => (
        <article className="preview-question" key={question.id}>
          <div className="preview-question__heading">
            <strong>Câu {index + 1}</strong>
            <span>{question.points} điểm</span>
          </div>
          <h2>{question.prompt}</h2>
          {question.media ? (
            <figure>
              <img src={question.media.url} alt={question.media.altText ?? ''} />
              <figcaption>{question.media.caption}</figcaption>
            </figure>
          ) : null}
          <div className="preview-options">
            {question.options.map((option) => (
              <div key={option.id}>
                <Circle size={16} /> {option.label}
              </div>
            ))}
            {question.type === 'TRUE_FALSE' ? (
              <>
                <div>
                  <Circle size={16} /> Đúng
                </div>
                <div>
                  <Circle size={16} /> Sai
                </div>
              </>
            ) : null}
            {question.type === 'SHORT_ANSWER' ? (
              <textarea disabled aria-label={`Câu trả lời ${index + 1}`} />
            ) : null}
          </div>
        </article>
      ))}
    </section>
  );
}
