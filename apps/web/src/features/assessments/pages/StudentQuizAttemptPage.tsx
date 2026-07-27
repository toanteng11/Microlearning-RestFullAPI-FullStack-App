import { ArrowLeft, Clock3, Save, Send } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../../../shared/auth/auth-context';
import { requestErrorMessage } from '../../learning/learning-format';
import { useUnsavedChanges } from '../../learning/use-unsaved-changes';
import type { StudentQuizAttempt } from '../assessment.types';

interface EditableAnswer {
  selectedOptionIds: string[];
  textAnswer: string | null;
}

const INITIAL_NOW = Date.now();

export function StudentQuizAttemptPage() {
  const { attemptId = '' } = useParams();
  const { request } = useAuth();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<StudentQuizAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, EditableAnswer>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [now, setNow] = useState(INITIAL_NOW);
  const dirtyRef = useRef(false);
  useUnsavedChanges(dirtyRef);

  useEffect(() => {
    let active = true;
    void request<{ success: true; data: StudentQuizAttempt }>(
      `/students/quiz-attempts/${attemptId}`,
    )
      .then((response) => {
        if (!active) return;
        setAttempt(response.data);
        setAnswers(
          Object.fromEntries(
            response.data.answers.map((answer) => [
              answer.questionId,
              { selectedOptionIds: answer.selectedOptionIds, textAnswer: answer.textAnswer },
            ]),
          ),
        );
        dirtyRef.current = false;
      })
      .catch((requestError) => {
        if (active) setError(requestErrorMessage(requestError, 'Không thể tải lượt làm bài.'));
      });
    return () => {
      active = false;
    };
  }, [attemptId, request]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const secondsRemaining = useMemo(
    () =>
      attempt ? Math.max(0, Math.ceil((new Date(attempt.expiresAt).getTime() - now) / 1_000)) : 0,
    [attempt, now],
  );
  const hasTimeLimit = attempt?.quiz.timeLimitMinutes !== null;

  function answerFor(questionId: string): EditableAnswer {
    return answers[questionId] ?? { selectedOptionIds: [], textAnswer: null };
  }

  function changeChoice(questionId: string, optionId: string, multiple: boolean) {
    dirtyRef.current = true;
    setAnswers((current) => {
      const answer = current[questionId] ?? { selectedOptionIds: [], textAnswer: null };
      const selectedOptionIds = multiple
        ? answer.selectedOptionIds.includes(optionId)
          ? answer.selectedOptionIds.filter((id) => id !== optionId)
          : [...answer.selectedOptionIds, optionId]
        : [optionId];
      return { ...current, [questionId]: { selectedOptionIds, textAnswer: null } };
    });
    setNotice(null);
  }

  async function save(): Promise<StudentQuizAttempt | null> {
    if (!attempt) return null;
    setBusy(true);
    setError(null);
    try {
      const response = await request<{ success: true; data: StudentQuizAttempt }>(
        `/students/quiz-attempts/${attempt.id}/answers`,
        {
          method: 'PATCH',
          body: {
            answers: attempt.questions.map((question) => ({
              questionId: question.questionId,
              ...answerFor(question.questionId),
            })),
            expectedAttemptRevision: attempt.attemptRevision,
          },
        },
      );
      setAttempt(response.data);
      dirtyRef.current = false;
      setNotice('Đã lưu câu trả lời.');
      return response.data;
    } catch (requestError) {
      setError(
        requestErrorMessage(
          requestError,
          'Không thể lưu câu trả lời. Hãy tải lại trạng thái mới nhất.',
        ),
      );
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    const saved = await save();
    if (!saved) return;
    setBusy(true);
    try {
      await request(`/students/quiz-attempts/${saved.id}/submit`, {
        method: 'POST',
        body: { expectedAttemptRevision: saved.attemptRevision, confirmUnanswered: true },
      });
      navigate(`/student/quiz-attempts/${saved.id}/result`, { replace: true });
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể nộp bài kiểm tra.'));
    } finally {
      setBusy(false);
      setConfirmSubmit(false);
    }
  }

  if (error && !attempt) return <div className="list-state list-state--error">{error}</div>;
  if (!attempt)
    return (
      <div className="list-state">
        <div className="spinner" />
      </div>
    );
  if (attempt.status !== 'IN_PROGRESS') {
    return (
      <div className="list-state">
        <strong>Lượt làm đã kết thúc.</strong>
        <Link className="button-link" to={`/student/quiz-attempts/${attempt.id}/result`}>
          Xem trạng thái kết quả
        </Link>
      </div>
    );
  }

  return (
    <section className="page-section assessment-workspace">
      <Link className="back-link" to={`/student/quizzes/${attempt.quizId}`}>
        <ArrowLeft size={17} /> Thông tin bài kiểm tra
      </Link>
      <header className="quiz-player-header">
        <div>
          <p className="eyebrow">Lượt {attempt.attemptNumber}</p>
          <h1>{attempt.quiz.title}</h1>
        </div>
        <div className="quiz-timer" aria-live="polite">
          <Clock3 size={18} />
          {hasTimeLimit ? (
            <>
              {Math.floor(secondsRemaining / 60)}:{String(secondsRemaining % 60).padStart(2, '0')}
            </>
          ) : (
            'Không giới hạn'
          )}
        </div>
      </header>
      {notice ? <div className="notice notice--success">{notice}</div> : null}
      {error ? <div className="notice notice--error">{error}</div> : null}
      <div className="quiz-question-list">
        {attempt.questions.map((question, index) => {
          const answer = answerFor(question.questionId);
          return (
            <fieldset className="quiz-question" key={question.questionId}>
              <legend>
                <span>Câu {index + 1}</span>
                {question.prompt}
                <small>{question.points} điểm</small>
              </legend>
              {question.media?.kind === 'IMAGE_URL' ? (
                <img alt={question.media.altText ?? ''} src={question.media.url} />
              ) : null}
              {question.type === 'SHORT_ANSWER' ? (
                <textarea
                  maxLength={20_000}
                  onChange={(event) => {
                    dirtyRef.current = true;
                    setAnswers((current) => ({
                      ...current,
                      [question.questionId]: {
                        selectedOptionIds: [],
                        textAnswer: event.target.value,
                      },
                    }));
                  }}
                  rows={5}
                  value={answer.textAnswer ?? ''}
                />
              ) : (
                <div className="quiz-options">
                  {question.options.map((option) => (
                    <label key={option.id}>
                      <input
                        checked={answer.selectedOptionIds.includes(option.id)}
                        name={question.questionId}
                        onChange={() =>
                          changeChoice(
                            question.questionId,
                            option.id,
                            question.type === 'MULTIPLE_CHOICE',
                          )
                        }
                        type={question.type === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
          );
        })}
      </div>
      <footer className="assessment-action-bar">
        <span>
          {attempt.progress.answeredCount}/{attempt.progress.totalCount} câu đã lưu
        </span>
        <div className="inline-actions">
          <button
            className="secondary-button"
            disabled={busy || secondsRemaining === 0}
            onClick={() => void save()}
            type="button"
          >
            <Save size={17} /> Lưu bài
          </button>
          <button disabled={busy} onClick={() => setConfirmSubmit(true)} type="button">
            <Send size={17} /> Nộp bài
          </button>
        </div>
      </footer>
      {confirmSubmit ? (
        <div className="dialog-backdrop">
          <section aria-modal="true" className="reason-dialog" role="dialog">
            <header>
              <div>
                <h2>Nộp bài kiểm tra?</h2>
                <p>Sau khi nộp, câu trả lời của lượt này sẽ không thể sửa.</p>
              </div>
            </header>
            <div className="inline-actions reason-dialog__actions">
              <button
                className="secondary-button"
                disabled={busy}
                onClick={() => setConfirmSubmit(false)}
                type="button"
              >
                Tiếp tục làm
              </button>
              <button disabled={busy} onClick={() => void submit()} type="button">
                Xác nhận nộp
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
