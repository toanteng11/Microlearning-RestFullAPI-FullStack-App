import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../../../shared/auth/auth-context';
import { displayLearningDate, requestErrorMessage } from '../learning-format';
import type { LearningProgress, StudentLessonPlayerEnvelope } from '../learning.types';
import { FlashcardViewer } from '../components/FlashcardViewer';
import { ProgressStatusBadge } from '../components/LearningStatusBadge';

export function StudentLessonPlayerPage() {
  const { lessonId = '' } = useParams();
  const { request } = useAuth();
  const [result, setResult] = useState<StudentLessonPlayerEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void request<StudentLessonPlayerEnvelope>(`/lessons/${lessonId}`)
      .then((response) => {
        if (active) {
          setResult(response);
          setError(null);
        }
      })
      .catch((requestError) => {
        if (active) setError(requestErrorMessage(requestError, 'Không thể tải bài học.'));
      });
    return () => {
      active = false;
    };
  }, [lessonId, request]);

  async function mutate(action: 'start' | 'complete') {
    if (!result) return;
    setBusy(true);
    setError(null);
    try {
      const response = await request<{
        success: true;
        data: { progress: LearningProgress; newlyStarted?: boolean; newlyCompleted?: boolean };
      }>(`/lessons/${lessonId}/${action}`, { method: 'POST' });
      setResult({
        ...result,
        data: {
          ...result.data,
          lesson: { ...result.data.lesson, progress: response.data.progress },
        },
      });
      setNotice(action === 'start' ? 'Đã bắt đầu bài học.' : 'Đã hoàn thành bài học.');
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể cập nhật tiến độ.'));
    } finally {
      setBusy(false);
    }
  }

  if (error && !result) return <div className="list-state list-state--error">{error}</div>;
  if (!result || result.data.lesson.id !== lessonId)
    return (
      <div className="list-state">
        <div className="spinner" />
        <p>Đang tải bài học...</p>
      </div>
    );
  const { lesson, navigation } = result.data;
  const completed = lesson.progress.status === 'COMPLETED';

  return (
    <article className="lesson-player">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        {navigation.breadcrumb.map((item, index) => (
          <span key={`${item.url}-${index}`}>
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {index === navigation.breadcrumb.length - 1 ? (
              <span aria-current="page">{item.label}</span>
            ) : (
              <Link to={item.url}>{item.label}</Link>
            )}
          </span>
        ))}
      </nav>
      <header className="lesson-player__header">
        <div>
          <p className="eyebrow">Bài học</p>
          <h1>{lesson.title}</h1>
          <div className="lesson-meta">
            <span>
              <Clock3 size={16} /> {lesson.estimatedMinutes} phút
            </span>
            <span>Hạn {displayLearningDate(lesson.completionDeadline)}</span>
            <ProgressStatusBadge status={lesson.progress.derivedStatus} />
          </div>
        </div>
      </header>
      {notice ? (
        <div className="notice notice--success" role="status">
          {notice}
        </div>
      ) : null}
      {error ? (
        <div className="notice notice--error" role="alert">
          {error}
        </div>
      ) : null}
      <div
        className="lesson-reading safe-rich-text"
        dangerouslySetInnerHTML={{ __html: lesson.contentHtml }}
      />
      <FlashcardViewer cards={lesson.flashcards} />
      <footer className="lesson-player__footer">
        <Link className="button-link button-link--secondary" to={navigation.back.url}>
          <ArrowLeft size={17} /> Quay lại khóa học
        </Link>
        <div className="lesson-navigation">
          {navigation.previous ? (
            <Link className="button-link button-link--secondary" to={navigation.previous.url}>
              <ArrowLeft size={17} /> Bài trước
            </Link>
          ) : (
            <span className="button-placeholder" />
          )}
          {lesson.progress.status === null ? (
            <button type="button" disabled={busy} onClick={() => void mutate('start')}>
              <Play size={17} /> Bắt đầu
            </button>
          ) : (
            <button
              type="button"
              disabled={busy || completed}
              onClick={() => void mutate('complete')}
            >
              <CheckCircle2 size={17} /> {completed ? 'Đã hoàn thành' : 'Hoàn thành'}
            </button>
          )}
          {navigation.next ? (
            <Link className="button-link" to={navigation.next.url}>
              Bài tiếp <ArrowRight size={17} />
            </Link>
          ) : (
            <span className="button-placeholder" />
          )}
        </div>
      </footer>
    </article>
  );
}
