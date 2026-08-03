import { ArrowLeft, Check, RefreshCw, Send } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ApiError } from '../../../shared/api/api-error';
import { useAuth } from '../../../shared/auth/auth-context';
import { requestErrorMessage } from '../../learning/learning-format';
import { invalidateOwnedCourseReporting } from '../../reporting/reporting-invalidation';
import type { TeacherAttemptReview } from '../assessment.types';
import { ActivityStatusBadge } from '../components/ActivityStatusBadge';

interface ReviewDraft {
  awardedPoints: string;
  feedback: string;
}

export function TeacherQuizAttemptReviewPage() {
  const { attemptId = '' } = useParams();
  const { request, user } = useAuth();
  const queryClient = useQueryClient();
  const [attempt, setAttempt] = useState<TeacherAttemptReview | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ReviewDraft>>({});
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);

  const applyAttempt = useCallback((value: TeacherAttemptReview) => {
    setAttempt(value);
    setDrafts(
      Object.fromEntries(
        value.questions
          .filter((question) => question.type === 'SHORT_ANSWER')
          .map((question) => [
            question.questionId,
            {
              awardedPoints: String(question.review?.awardedPoints ?? 0),
              feedback: question.review?.feedback ?? '',
            },
          ]),
      ),
    );
  }, []);

  const load = useCallback(async () => {
    const response = await request<{ success: true; data: TeacherAttemptReview }>(
      `/teacher/quiz-attempts/${attemptId}`,
    );
    applyAttempt(response.data);
    setConflict(false);
    setError(null);
  }, [applyAttempt, attemptId, request]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load().catch((requestError) => {
        setError(requestErrorMessage(requestError, 'Không thể tải bài làm để review.'));
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const shortQuestions = useMemo(
    () => attempt?.questions.filter((question) => question.type === 'SHORT_ANSWER') ?? [],
    [attempt],
  );
  const reviewPayload = shortQuestions.map((question) => ({
    questionId: question.questionId,
    awardedPoints: Number(drafts[question.questionId]?.awardedPoints ?? 0),
    feedback: drafts[question.questionId]?.feedback.trim() || null,
  }));
  const invalidReview = reviewPayload.some((answer, index) => {
    const maximum = shortQuestions[index]?.points ?? 0;
    return (
      !Number.isInteger(answer.awardedPoints) ||
      answer.awardedPoints < 0 ||
      answer.awardedPoints > maximum
    );
  });

  async function mutate(
    path: string,
    method: 'PUT' | 'POST',
    body: Record<string, unknown>,
    successMessage: string,
  ) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await request<{ success: true; data: TeacherAttemptReview }>(path, {
        method,
        body,
      });
      applyAttempt(response.data);
      setConflict(false);
      setNotice(successMessage);
      await invalidateOwnedCourseReporting(queryClient, user?.id, response.data.courseId);
    } catch (requestError) {
      setConflict(requestError instanceof ApiError && requestError.status === 409);
      setError(requestErrorMessage(requestError, 'Không thể cập nhật kết quả bài kiểm tra.'));
    } finally {
      setBusy(false);
    }
  }

  if (!attempt && !error)
    return (
      <div className="list-state">
        <div className="spinner" />
      </div>
    );

  return (
    <section className="page-section assessment-workspace">
      <Link
        className="back-link"
        to={attempt ? `/teacher/quizzes/${attempt.quizId}/results` : '..'}
      >
        <ArrowLeft size={17} /> Danh sách kết quả
      </Link>
      <header className="page-header page-header--aligned">
        <div>
          <p className="eyebrow">Manual review</p>
          <h1>{attempt?.title ?? 'Review bài kiểm tra'}</h1>
          {attempt ? (
            <p>
              Lượt {attempt.attemptNumber} · Điểm hiện tại {attempt.totalScore}/{attempt.maxScore}
            </p>
          ) : null}
        </div>
        {attempt ? <ActivityStatusBadge status={attempt.status} /> : null}
      </header>

      {error ? <div className="notice notice--error">{error}</div> : null}
      {notice ? (
        <div className="notice notice--success" role="status">
          <Check size={17} /> {notice}
        </div>
      ) : null}
      {conflict ? (
        <button className="secondary-button" type="button" onClick={() => void load()}>
          <RefreshCw size={17} /> Tải revision mới nhất
        </button>
      ) : null}

      {attempt ? (
        <>
          <div className="assessment-facts assessment-facts--compact">
            <div>
              <strong>{attempt.objectiveScore}</strong>
              <span>Điểm tự động</span>
            </div>
            <div>
              <strong>{attempt.manualScore}</strong>
              <span>Điểm review</span>
            </div>
            <div>
              <strong>{attempt.reviewRevision}</strong>
              <span>Revision</span>
            </div>
          </div>

          <div className="review-question-list">
            {attempt.questions.map((question, index) => (
              <section className="review-question" key={question.questionId}>
                <div className="review-question__heading">
                  <h2>Câu {index + 1}</h2>
                  <span>{question.points} điểm</span>
                </div>
                <p>{question.prompt}</p>
                <div className="review-answer">
                  <strong>Câu trả lời</strong>
                  <p>
                    {question.answer?.textAnswer ||
                      question.answer?.selectedOptionIds.join(', ') ||
                      'Không có câu trả lời'}
                  </p>
                </div>
                {question.rubric ? (
                  <p className="field-help">
                    <strong>Rubric:</strong> {question.rubric}
                  </p>
                ) : null}
                {question.type === 'SHORT_ANSWER' ? (
                  <div className="review-fields">
                    <label className="form-field">
                      <span>Điểm được chấm</span>
                      <input
                        type="number"
                        min="0"
                        max={question.points}
                        step="1"
                        value={drafts[question.questionId]?.awardedPoints ?? '0'}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [question.questionId]: {
                              awardedPoints: event.target.value,
                              feedback: current[question.questionId]?.feedback ?? '',
                            },
                          }))
                        }
                      />
                    </label>
                    <label className="form-field">
                      <span>Nhận xét cho câu trả lời</span>
                      <textarea
                        rows={3}
                        value={drafts[question.questionId]?.feedback ?? ''}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [question.questionId]: {
                              awardedPoints: current[question.questionId]?.awardedPoints ?? '0',
                              feedback: event.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                  </div>
                ) : null}
              </section>
            ))}
          </div>

          {['GRADED', 'RESULT_RELEASED'].includes(attempt.status) ? (
            <label className="form-field review-reason">
              <span>Lý do chấm lại</span>
              <textarea
                rows={2}
                minLength={10}
                maxLength={500}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Nhập ít nhất 10 ký tự để lưu vết thay đổi"
              />
              <small>{reason.trim().length}/500</small>
            </label>
          ) : null}

          <div className="assessment-action-bar">
            {attempt.status === 'NEEDS_REVIEW' ? (
              <>
                <button
                  className="secondary-button"
                  type="button"
                  disabled={busy || invalidReview}
                  onClick={() =>
                    void mutate(
                      `/teacher/quiz-attempts/${attempt.id}/review`,
                      'PUT',
                      {
                        answers: reviewPayload,
                        expectedReviewRevision: attempt.reviewRevision,
                      },
                      'Đã lưu review.',
                    )
                  }
                >
                  <Check size={17} /> Lưu review
                </button>
                <button
                  className="primary-button"
                  type="button"
                  disabled={busy || invalidReview || attempt.reviewRevision < 1}
                  onClick={() =>
                    void mutate(
                      `/teacher/quiz-attempts/${attempt.id}/review/finalize`,
                      'POST',
                      {
                        expectedReviewRevision: attempt.reviewRevision,
                        reason: null,
                      },
                      'Đã hoàn tất review và cập nhật kết quả.',
                    )
                  }
                >
                  <Send size={17} /> Hoàn tất review
                </button>
              </>
            ) : null}
            {['SUBMITTED', 'TIMED_OUT', 'GRADED'].includes(attempt.status) &&
            shortQuestions.length === 0 ? (
              <button
                className="primary-button"
                type="button"
                disabled={busy}
                onClick={() =>
                  void mutate(
                    `/teacher/quiz-attempts/${attempt.id}/release`,
                    'POST',
                    { expectedReviewRevision: attempt.reviewRevision },
                    'Đã phát hành kết quả.',
                  )
                }
              >
                <Send size={17} /> Phát hành kết quả
              </button>
            ) : null}
            {['GRADED', 'RESULT_RELEASED'].includes(attempt.status) && shortQuestions.length > 0 ? (
              <button
                className="primary-button"
                type="button"
                disabled={busy || invalidReview || reason.trim().length < 10}
                onClick={() =>
                  void mutate(
                    `/teacher/quiz-attempts/${attempt.id}/regrade`,
                    'POST',
                    {
                      answers: reviewPayload,
                      reason: reason.trim(),
                      expectedReviewRevision: attempt.reviewRevision,
                    },
                    'Đã chấm lại và lưu lịch sử.',
                  )
                }
              >
                <RefreshCw size={17} /> Chấm lại
              </button>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
