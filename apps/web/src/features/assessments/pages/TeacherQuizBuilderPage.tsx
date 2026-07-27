import {
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  Undo2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ApiError } from '../../../shared/api/api-error';
import { useAuth } from '../../../shared/auth/auth-context';
import { requestErrorMessage } from '../../learning/learning-format';
import { ActivityStatusBadge } from '../components/ActivityStatusBadge';
import { QuestionEditor } from '../components/QuestionEditor';
import { QuizSettingsForm, type QuizSettingsValue } from '../components/QuizSettingsForm';
import { ReasonDialog } from '../components/ReasonDialog';
import { questionTypeLabels } from '../assessment-format';
import type {
  QuestionListEnvelope,
  QuestionMutationEnvelope,
  TeacherQuestion,
  TeacherQuiz,
} from '../assessment.types';

export function TeacherQuizBuilderPage() {
  const { quizId = '' } = useParams();
  const { request } = useAuth();
  const [quiz, setQuiz] = useState<TeacherQuiz | null>(null);
  const [questions, setQuestions] = useState<TeacherQuestion[]>([]);
  const [questionRevision, setQuestionRevision] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [editing, setEditing] = useState<TeacherQuestion | 'NEW' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [reasonAction, setReasonAction] = useState<
    | { type: 'QUIZ_STATUS'; status: TeacherQuiz['status'] }
    | { type: 'ARCHIVE_QUESTION'; question: TeacherQuestion }
    | null
  >(null);

  const load = useCallback(async () => {
    const [quizResponse, questionResponse] = await Promise.all([
      request<{ success: true; data: TeacherQuiz }>(`/teacher/quizzes/${quizId}`),
      request<QuestionListEnvelope>(`/teacher/quizzes/${quizId}/questions`),
    ]);
    setQuiz(quizResponse.data);
    setQuestions(questionResponse.data.items);
    setQuestionRevision(questionResponse.data.questionRevision);
    setMaxScore(questionResponse.data.maxScore);
    setConflict(false);
    setError(null);
  }, [quizId, request]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load().catch((requestError) => {
        setError(requestErrorMessage(requestError, 'Không thể tải trình soạn bài kiểm tra.'));
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function handleError(requestError: unknown, fallback: string) {
    setError(requestErrorMessage(requestError, fallback));
    setConflict(requestError instanceof ApiError && requestError.status === 409);
  }

  async function saveSettings(value: QuizSettingsValue) {
    if (!quiz) return;
    setBusy(true);
    setError(null);
    try {
      const response = await request<{ success: true; data: { quiz: TeacherQuiz } }>(
        `/teacher/quizzes/${quiz.id}`,
        { method: 'PATCH', body: { ...value, expectedContentRevision: quiz.contentRevision } },
      );
      setQuiz(response.data.quiz);
      setNotice('Đã lưu thiết lập bài kiểm tra.');
    } catch (requestError) {
      handleError(requestError, 'Không thể lưu thiết lập.');
    } finally {
      setBusy(false);
    }
  }

  async function saveQuestion(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const current = editing && editing !== 'NEW' ? editing : null;
      const response = await request<QuestionMutationEnvelope>(
        current ? `/teacher/questions/${current.id}` : `/teacher/quizzes/${quizId}/questions`,
        { method: current ? 'PATCH' : 'POST', body },
      );
      setQuestionRevision(response.data.questionRevision);
      setMaxScore(response.data.maxScore);
      await load();
      setEditing(null);
      setNotice(current ? 'Đã cập nhật câu hỏi.' : 'Đã thêm câu hỏi.');
    } catch (requestError) {
      handleError(requestError, 'Không thể lưu câu hỏi.');
    } finally {
      setBusy(false);
    }
  }

  async function archiveQuestion(question: TeacherQuestion, reason: string) {
    setBusy(true);
    setError(null);
    try {
      const response = await request<QuestionMutationEnvelope>(
        `/teacher/questions/${question.id}`,
        { method: 'DELETE', body: { reason, expectedQuestionRevision: questionRevision } },
      );
      setQuestionRevision(response.data.questionRevision);
      setMaxScore(response.data.maxScore);
      await load();
      setNotice('Đã lưu trữ câu hỏi.');
    } catch (requestError) {
      handleError(requestError, 'Không thể lưu trữ câu hỏi.');
    } finally {
      setBusy(false);
    }
  }

  async function moveQuestion(index: number, offset: -1 | 1) {
    const target = index + offset;
    if (target < 0 || target >= questions.length) return;
    const ordered = [...questions];
    [ordered[index], ordered[target]] = [ordered[target]!, ordered[index]!];
    setBusy(true);
    setError(null);
    try {
      const response = await request<{
        success: true;
        data: { items: TeacherQuestion[]; questionRevision: number; maxScore: number };
      }>(`/teacher/quizzes/${quizId}/questions/reorder`, {
        method: 'PATCH',
        body: {
          orderedQuestionIds: ordered.map((item) => item.id),
          expectedQuestionRevision: questionRevision,
        },
      });
      setQuestions(response.data.items);
      setQuestionRevision(response.data.questionRevision);
      setMaxScore(response.data.maxScore);
      setNotice('Đã cập nhật thứ tự câu hỏi.');
    } catch (requestError) {
      handleError(requestError, 'Không thể cập nhật thứ tự câu hỏi.');
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(status: TeacherQuiz['status'], reason: string) {
    if (!quiz) return;
    setBusy(true);
    setError(null);
    try {
      const response = await request<{ success: true; data: { quiz: TeacherQuiz } }>(
        `/teacher/quizzes/${quiz.id}/status`,
        {
          method: 'PATCH',
          body: {
            status,
            scheduledPublishAt: null,
            reason,
            expectedContentRevision: quiz.contentRevision,
            expectedQuestionRevision: questionRevision,
          },
        },
      );
      setQuiz(response.data.quiz);
      setNotice('Đã cập nhật trạng thái bài kiểm tra.');
    } catch (requestError) {
      handleError(requestError, 'Không thể cập nhật trạng thái.');
    } finally {
      setBusy(false);
    }
  }

  if (!quiz && !error)
    return (
      <div className="list-state">
        <div className="spinner" />
      </div>
    );
  if (!quiz) return <div className="list-state list-state--error">{error}</div>;
  const editable = quiz.status === 'DRAFT' || quiz.status === 'UNPUBLISHED';

  async function confirmReason(reason: string) {
    const action = reasonAction;
    if (!action) return;
    setReasonAction(null);
    if (action.type === 'ARCHIVE_QUESTION') {
      await archiveQuestion(action.question, reason);
      return;
    }
    await changeStatus(action.status, reason);
  }

  return (
    <section className="page-section">
      <Link className="back-link" to={`/teacher/courses/${quiz.courseId}/assessments`}>
        <ArrowLeft size={17} /> Bài kiểm tra
      </Link>
      <header className="page-header page-header--aligned">
        <div>
          <div className="assessment-title-line">
            <h1>{quiz.title}</h1>
            <ActivityStatusBadge status={quiz.status} />
          </div>
          <p>
            {questions.length} câu hỏi · {maxScore} điểm
          </p>
        </div>
        <div className="inline-actions">
          <Link
            className="button-link button-link--secondary"
            to={`/teacher/quizzes/${quiz.id}/preview`}
          >
            <Eye size={17} /> Xem trước
          </Link>
          {quiz.status === 'DRAFT' || quiz.status === 'UNPUBLISHED' ? (
            <button
              disabled={busy}
              onClick={() => setReasonAction({ type: 'QUIZ_STATUS', status: 'PUBLISHED' })}
            >
              <Send size={17} /> Xuất bản
            </button>
          ) : null}
          {quiz.status === 'PUBLISHED' ? (
            <button
              className="button-link button-link--secondary"
              disabled={busy}
              onClick={() => setReasonAction({ type: 'QUIZ_STATUS', status: 'UNPUBLISHED' })}
            >
              <Undo2 size={17} /> Thu hồi
            </button>
          ) : null}
          {quiz.status !== 'ARCHIVED' ? (
            <button
              className="icon-button"
              title="Lưu trữ bài kiểm tra"
              disabled={busy}
              onClick={() => setReasonAction({ type: 'QUIZ_STATUS', status: 'ARCHIVED' })}
            >
              <Archive size={18} />
            </button>
          ) : null}
        </div>
      </header>
      {notice ? <div className="notice notice--success">{notice}</div> : null}
      {error ? (
        <div className="notice notice--error">
          {error}
          {conflict ? (
            <button className="text-button" onClick={() => void load()}>
              <RefreshCw size={16} /> Tải bản mới nhất
            </button>
          ) : null}
        </div>
      ) : null}

      <section className="editor-section">
        <h2>Thiết lập</h2>
        <QuizSettingsForm
          key={`${quiz.id}-${quiz.contentRevision}`}
          quiz={quiz}
          busy={busy}
          disabled={!editable}
          submitLabel="Lưu thiết lập"
          onSubmit={saveSettings}
        />
      </section>
      <section className="editor-section">
        <div className="question-section-heading">
          <div>
            <h2>Câu hỏi</h2>
            <p>Revision {questionRevision}</p>
          </div>
          {editable && !editing ? (
            <button onClick={() => setEditing('NEW')}>
              <Plus size={17} /> Thêm câu hỏi
            </button>
          ) : null}
        </div>
        {editing ? (
          <QuestionEditor
            key={editing === 'NEW' ? 'new-question' : editing.id}
            question={editing === 'NEW' ? undefined : editing}
            questionRevision={questionRevision}
            busy={busy}
            onSave={saveQuestion}
            onCancel={() => setEditing(null)}
          />
        ) : null}
        {questions.length === 0 && !editing ? (
          <div className="list-state">Chưa có câu hỏi.</div>
        ) : null}
        <div className="question-list">
          {questions.map((question, index) => (
            <article className="question-row" key={question.id}>
              <div className="question-row__number">{index + 1}</div>
              <div className="question-row__body">
                <div>
                  <strong>{question.prompt}</strong>
                  <span>
                    {questionTypeLabels[question.type]} · {question.points} điểm
                  </span>
                </div>
                {question.options.length > 0 ? (
                  <ol>
                    {question.options.map((option) => (
                      <li key={option.id}>
                        {option.label}
                        {question.correctOptionIds.includes(option.id) ? <strong> ✓</strong> : null}
                      </li>
                    ))}
                  </ol>
                ) : null}
                {question.type === 'TRUE_FALSE' ? (
                  <p>Đáp án: {question.correctBoolean ? 'Đúng' : 'Sai'}</p>
                ) : null}
              </div>
              {editable ? (
                <div className="question-row__actions">
                  <button
                    className="icon-button"
                    title="Di chuyển lên"
                    disabled={busy || index === 0}
                    onClick={() => void moveQuestion(index, -1)}
                  >
                    <ArrowUp size={17} />
                  </button>
                  <button
                    className="icon-button"
                    title="Di chuyển xuống"
                    disabled={busy || index === questions.length - 1}
                    onClick={() => void moveQuestion(index, 1)}
                  >
                    <ArrowDown size={17} />
                  </button>
                  <button
                    className="icon-button"
                    title="Chỉnh sửa câu hỏi"
                    disabled={busy}
                    onClick={() => setEditing(question)}
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    className="icon-button"
                    title="Lưu trữ câu hỏi"
                    disabled={busy}
                    onClick={() => setReasonAction({ type: 'ARCHIVE_QUESTION', question })}
                  >
                    <Archive size={17} />
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
      {reasonAction ? (
        <ReasonDialog
          busy={busy}
          confirmLabel={
            reasonAction.type === 'ARCHIVE_QUESTION'
              ? 'Lưu trữ câu hỏi'
              : reasonAction.status === 'PUBLISHED'
                ? 'Xuất bản'
                : reasonAction.status === 'UNPUBLISHED'
                  ? 'Thu hồi'
                  : 'Lưu trữ bài kiểm tra'
          }
          description={
            reasonAction.type === 'ARCHIVE_QUESTION'
              ? 'Câu hỏi sẽ không còn xuất hiện trong bài kiểm tra.'
              : 'Lý do được lưu trong nhật ký kiểm toán của bài kiểm tra.'
          }
          title={
            reasonAction.type === 'ARCHIVE_QUESTION'
              ? 'Lưu trữ câu hỏi'
              : 'Xác nhận thay đổi trạng thái'
          }
          onCancel={() => setReasonAction(null)}
          onConfirm={confirmReason}
        />
      ) : null}
    </section>
  );
}
