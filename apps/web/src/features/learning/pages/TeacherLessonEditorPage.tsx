import {
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CalendarClock,
  Eye,
  Pencil,
  Plus,
  Save,
  Send,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../../../shared/auth/auth-context';
import { displayLearningDate, requestErrorMessage } from '../learning-format';
import type { ContentStatus, StudentLessonSummary } from '../learning.types';
import { UNSAVED_CHANGES_MESSAGE, useUnsavedChanges } from '../use-unsaved-changes';
import { ContentStatusBadge } from '../components/LearningStatusBadge';

interface TeacherLesson {
  id: string;
  courseId: string;
  moduleId: string | null;
  title: string;
  content: string;
  estimatedMinutes: number;
  isRequired: boolean;
  status: ContentStatus;
  effectiveStatus: ContentStatus;
  completionDeadline: string | null;
  deadlineRevision: number;
  flashcardRevision: number;
  updatedAt: string;
  allowedActions: string[];
}

interface TeacherFlashcard {
  id: string;
  frontText: string;
  backText: string;
  displayOrder: number;
  status: 'ACTIVE' | 'ARCHIVED';
  updatedAt: string;
}

interface DeadlineHistoryItem {
  id: string;
  fromDeadline: string | null;
  toDeadline: string | null;
  fromRevision: number;
  toRevision: number;
  reason: string | null;
  actorId: string;
  changedAt: string;
}

export function TeacherLessonEditorPage() {
  const { lessonId = '' } = useParams();
  const { request } = useAuth();
  const [lesson, setLesson] = useState<TeacherLesson | null>(null);
  const [cards, setCards] = useState<TeacherFlashcard[]>([]);
  const [deadlineHistory, setDeadlineHistory] = useState<DeadlineHistoryItem[]>([]);
  const [editingCard, setEditingCard] = useState<TeacherFlashcard | null>(null);
  const [preview, setPreview] = useState<StudentLessonSummary | null>(null);
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const lessonContentDirtyRef = useRef(false);
  useUnsavedChanges(lessonContentDirtyRef);

  function confirmDiscardLessonChanges() {
    if (!lessonContentDirtyRef.current) return true;
    if (!window.confirm(UNSAVED_CHANGES_MESSAGE)) return false;
    lessonContentDirtyRef.current = false;
    return true;
  }

  useEffect(() => {
    let active = true;
    void Promise.all([
      request<{ success: true; data: { lesson: TeacherLesson } }>(`/lessons/${lessonId}`),
      request<{ success: true; data: { items: TeacherFlashcard[] } }>(
        `/lessons/${lessonId}/flashcards`,
      ),
      request<{ success: true; data: { items: DeadlineHistoryItem[] } }>(
        `/teacher/lessons/${lessonId}/deadline-history?page=1&limit=20`,
      ),
    ])
      .then(([lessonResponse, cardsResponse, historyResponse]) => {
        if (!active) return;
        setLesson(lessonResponse.data.lesson);
        setCards(cardsResponse.data.items);
        setDeadlineHistory(historyResponse.data.items);
        setEditingCard(null);
        lessonContentDirtyRef.current = false;
        setError(null);
      })
      .catch((requestError) => {
        if (active) setError(requestErrorMessage(requestError, 'Không thể tải bài học.'));
      });
    return () => {
      active = false;
    };
  }, [lessonId, reloadKey, request]);

  async function updateLesson(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lesson) return;
    const values = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await request(`/lessons/${lesson.id}`, {
        method: 'PATCH',
        body: {
          title: String(values.get('title') ?? '').trim(),
          content: String(values.get('content') ?? '').trim(),
          estimatedMinutes: Number(values.get('estimatedMinutes')),
          isRequired: values.get('isRequired') === 'on',
          expectedUpdatedAt: lesson.updatedAt,
        },
      });
      lessonContentDirtyRef.current = false;
      setNotice('Đã lưu bài học.');
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể lưu bài học.'));
    } finally {
      setBusy(false);
    }
  }

  async function loadPreview() {
    if (!lesson) return;
    if (!confirmDiscardLessonChanges()) return;
    setTab('preview');
    setBusy(true);
    try {
      const response = await request<{ success: true; data: { lesson: StudentLessonSummary } }>(
        `/lessons/${lesson.id}/preview`,
        { method: 'POST' },
      );
      setPreview(response.data.lesson);
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể tải preview.'));
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(targetStatus: 'PUBLISHED' | 'UNPUBLISHED') {
    if (!lesson) return;
    if (!confirmDiscardLessonChanges()) return;
    setBusy(true);
    try {
      await request(`/lessons/${lesson.id}/status`, {
        method: 'PATCH',
        body: { targetStatus, expectedUpdatedAt: lesson.updatedAt },
      });
      setNotice(targetStatus === 'PUBLISHED' ? 'Đã xuất bản bài học.' : 'Đã thu hồi bài học.');
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể đổi trạng thái bài học.'));
    } finally {
      setBusy(false);
    }
  }

  async function changeDeadline(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lesson) return;
    if (!confirmDiscardLessonChanges()) return;
    const values = new FormData(event.currentTarget);
    const value = String(values.get('deadline') ?? '');
    setBusy(true);
    try {
      await request(`/teacher/lessons/${lesson.id}/deadline`, {
        method: 'PATCH',
        body: {
          completionDeadline: value ? new Date(value).toISOString() : null,
          reason: String(values.get('reason') ?? '').trim() || undefined,
          expectedDeadlineRevision: lesson.deadlineRevision,
        },
      });
      setNotice('Đã cập nhật deadline.');
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể cập nhật deadline.'));
    } finally {
      setBusy(false);
    }
  }

  async function addFlashcard(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lesson) return;
    if (!confirmDiscardLessonChanges()) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    setBusy(true);
    try {
      await request(`/lessons/${lesson.id}/flashcards`, {
        method: 'POST',
        body: {
          frontText: String(values.get('frontText') ?? '').trim(),
          backText: String(values.get('backText') ?? '').trim(),
        },
      });
      form.reset();
      setNotice('Đã thêm Flashcard.');
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể thêm Flashcard.'));
    } finally {
      setBusy(false);
    }
  }

  async function updateFlashcard(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingCard) return;
    if (!confirmDiscardLessonChanges()) return;
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await request(`/flashcards/${editingCard.id}`, {
        method: 'PATCH',
        body: {
          frontText: String(values.get('frontText') ?? '').trim(),
          backText: String(values.get('backText') ?? '').trim(),
          expectedUpdatedAt: editingCard.updatedAt,
        },
      });
      setNotice('Đã cập nhật Flashcard.');
      setEditingCard(null);
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể cập nhật Flashcard.'));
    } finally {
      setBusy(false);
    }
  }

  async function archiveFlashcard(card: TeacherFlashcard) {
    if (!confirmDiscardLessonChanges()) return;
    const reason = window.prompt('Nhập lý do lưu trữ Flashcard:')?.trim();
    if (!reason) return;
    setBusy(true);
    setError(null);
    try {
      await request(`/flashcards/${card.id}`, {
        method: 'DELETE',
        body: { reason, expectedUpdatedAt: card.updatedAt },
      });
      setNotice('Đã lưu trữ Flashcard.');
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể lưu trữ Flashcard.'));
    } finally {
      setBusy(false);
    }
  }

  async function moveFlashcard(cardId: string, offset: -1 | 1) {
    if (!lesson) return;
    if (!confirmDiscardLessonChanges()) return;
    const activeCards = cards.filter((card) => card.status === 'ACTIVE');
    const index = activeCards.findIndex((card) => card.id === cardId);
    const targetIndex = index + offset;
    if (index < 0 || targetIndex < 0 || targetIndex >= activeCards.length) return;
    const ordered = [...activeCards];
    [ordered[index], ordered[targetIndex]] = [ordered[targetIndex]!, ordered[index]!];
    setBusy(true);
    setError(null);
    try {
      await request(`/lessons/${lesson.id}/flashcards/reorder`, {
        method: 'PATCH',
        body: {
          orderedFlashcardIds: ordered.map((card) => card.id),
          expectedFlashcardRevision: lesson.flashcardRevision,
        },
      });
      setNotice('Đã cập nhật thứ tự Flashcard.');
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setError(
        requestErrorMessage(
          requestError,
          'Không thể sắp xếp Flashcard. Hãy tải lại dữ liệu mới nhất.',
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  if (error && !lesson) return <div className="list-state list-state--error">{error}</div>;
  if (!lesson)
    return (
      <div className="list-state">
        <div className="spinner" />
      </div>
    );
  const editable = lesson.allowedActions.includes('UPDATE');
  const activeCards = cards.filter((card) => card.status === 'ACTIVE');
  return (
    <section className="page-section">
      <Link className="back-link" to={`/teacher/courses/${lesson.courseId}/content`}>
        <ArrowLeft size={17} /> Cấu trúc khóa học
      </Link>
      <header className="page-header page-header--aligned">
        <div>
          <p className="eyebrow">Lesson Editor</p>
          <h1>{lesson.title}</h1>
        </div>
        <ContentStatusBadge status={lesson.effectiveStatus} />
      </header>
      <nav className="segmented-tabs" aria-label="Chế độ Lesson Editor">
        <button
          className={tab === 'edit' ? 'active' : ''}
          type="button"
          onClick={() => setTab('edit')}
        >
          <Save size={17} /> Chỉnh sửa
        </button>
        <button
          className={tab === 'preview' ? 'active' : ''}
          type="button"
          onClick={() => void loadPreview()}
        >
          <Eye size={17} /> Preview
        </button>
      </nav>
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
      {!editable ? (
        <div className="security-note">
          Bài học đang được xuất bản nên nội dung và Flashcard ở chế độ chỉ đọc. Thu hồi bài học
          trước khi chỉnh sửa.
        </div>
      ) : null}
      {tab === 'preview' ? (
        <section className="lesson-reading safe-rich-text">
          {preview ? (
            <div dangerouslySetInnerHTML={{ __html: preview.contentHtml }} />
          ) : (
            <div className="spinner" />
          )}
        </section>
      ) : (
        <div className="lesson-editor-layout">
          <form
            className="lesson-editor-form"
            key={lesson.updatedAt}
            onChange={() => {
              lessonContentDirtyRef.current = true;
            }}
            onSubmit={(event) => void updateLesson(event)}
          >
            <section className="editor-section">
              <h2>Nội dung</h2>
              <div className="form-field">
                <label htmlFor="edit-lesson-title">Tên bài học</label>
                <input
                  id="edit-lesson-title"
                  name="title"
                  defaultValue={lesson.title}
                  disabled={!editable}
                  required
                />
              </div>
              <div className="editor-grid">
                <div className="form-field">
                  <label htmlFor="edit-estimated-minutes">Thời lượng</label>
                  <input
                    id="edit-estimated-minutes"
                    name="estimatedMinutes"
                    type="number"
                    min={1}
                    max={60}
                    defaultValue={lesson.estimatedMinutes}
                    disabled={!editable}
                  />
                </div>
                <label className="toggle-row">
                  <input
                    type="checkbox"
                    name="isRequired"
                    defaultChecked={lesson.isRequired}
                    disabled={!editable}
                  />
                  <span>Bài học bắt buộc</span>
                </label>
              </div>
              <div className="form-field">
                <label htmlFor="edit-lesson-content">Markdown</label>
                <textarea
                  id="edit-lesson-content"
                  className="markdown-editor"
                  name="content"
                  defaultValue={lesson.content}
                  disabled={!editable}
                  required
                />
              </div>
              <button className="fit-button" type="submit" disabled={busy || !editable}>
                <Save size={17} /> Lưu nội dung
              </button>
            </section>
          </form>
          <aside className="lesson-tools">
            <section className="editor-section">
              <div className="panel-title">
                <CalendarClock size={20} />
                <h2>Deadline</h2>
              </div>
              <p>Hiện tại: {displayLearningDate(lesson.completionDeadline)}</p>
              <form onSubmit={(event) => void changeDeadline(event)}>
                <div className="form-field">
                  <label htmlFor="deadline-value">Deadline mới</label>
                  <input id="deadline-value" name="deadline" type="datetime-local" />
                </div>
                <div className="form-field">
                  <label htmlFor="deadline-reason">Lý do thay đổi</label>
                  <textarea
                    id="deadline-reason"
                    name="reason"
                    minLength={10}
                    maxLength={500}
                    required={['PUBLISHED', 'SCHEDULED'].includes(lesson.status)}
                  />
                </div>
                <button className="fit-button" type="submit" disabled={busy}>
                  <CalendarClock size={17} /> Cập nhật
                </button>
              </form>
              <div className="deadline-history" aria-label="Lịch sử deadline">
                <h3>Lịch sử thay đổi</h3>
                {deadlineHistory.length === 0 ? (
                  <p className="muted-text">Chưa có thay đổi deadline.</p>
                ) : (
                  <ol>
                    {deadlineHistory.map((item) => (
                      <li key={item.id}>
                        <div>
                          <strong>
                            Revision {item.fromRevision} → {item.toRevision}
                          </strong>
                          <small>{displayLearningDate(item.changedAt)}</small>
                        </div>
                        <p>
                          {displayLearningDate(item.fromDeadline)} →{' '}
                          {displayLearningDate(item.toDeadline)}
                        </p>
                        {item.reason ? <small>Lý do: {item.reason}</small> : null}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </section>
            <section className="editor-section">
              <h2>Lifecycle</h2>
              {['DRAFT', 'UNPUBLISHED'].includes(lesson.status) ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void changeStatus('PUBLISHED')}
                >
                  <Send size={17} /> Xuất bản
                </button>
              ) : null}
              {lesson.status === 'PUBLISHED' ? (
                <button
                  className="secondary-button"
                  type="button"
                  disabled={busy}
                  onClick={() => void changeStatus('UNPUBLISHED')}
                >
                  Thu hồi để chỉnh sửa
                </button>
              ) : null}
            </section>
          </aside>
          <section className="editor-section lesson-editor-layout__wide">
            <div className="section-heading">
              <h2>Flashcard</h2>
              <span>{activeCards.length}/100 thẻ</span>
            </div>
            {activeCards.length === 0 ? (
              <p className="muted-text">Chưa có Flashcard.</p>
            ) : (
              <div className="flashcard-editor-list">
                {activeCards.map((card, index) => (
                  <article key={card.id}>
                    <div className="flashcard-editor-copy">
                      <strong>
                        {index + 1}. {card.frontText}
                      </strong>
                      <p>{card.backText}</p>
                    </div>
                    <div className="icon-actions">
                      <button
                        className="icon-button"
                        type="button"
                        title="Di chuyển lên"
                        aria-label={`Di chuyển Flashcard ${index + 1} lên`}
                        disabled={busy || !editable || index === 0}
                        onClick={() => void moveFlashcard(card.id, -1)}
                      >
                        <ArrowUp size={17} />
                      </button>
                      <button
                        className="icon-button"
                        type="button"
                        title="Di chuyển xuống"
                        aria-label={`Di chuyển Flashcard ${index + 1} xuống`}
                        disabled={busy || !editable || index === activeCards.length - 1}
                        onClick={() => void moveFlashcard(card.id, 1)}
                      >
                        <ArrowDown size={17} />
                      </button>
                      <button
                        className="icon-button"
                        type="button"
                        title="Sửa Flashcard"
                        aria-label={`Sửa Flashcard ${index + 1}`}
                        disabled={busy || !editable}
                        onClick={() => setEditingCard(card)}
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        className="icon-button icon-button--danger"
                        type="button"
                        title="Lưu trữ Flashcard"
                        aria-label={`Lưu trữ Flashcard ${index + 1}`}
                        disabled={busy || !editable}
                        onClick={() => void archiveFlashcard(card)}
                      >
                        <Archive size={17} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
            {editingCard ? (
              <form
                className="flashcard-create-form flashcard-edit-form"
                onSubmit={(event) => void updateFlashcard(event)}
              >
                <div className="form-field">
                  <label htmlFor="edit-flashcard-front">Sửa mặt trước</label>
                  <textarea
                    id="edit-flashcard-front"
                    name="frontText"
                    defaultValue={editingCard.frontText}
                    maxLength={2_000}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="edit-flashcard-back">Sửa mặt sau</label>
                  <textarea
                    id="edit-flashcard-back"
                    name="backText"
                    defaultValue={editingCard.backText}
                    maxLength={5_000}
                    required
                  />
                </div>
                <div className="inline-actions">
                  <button type="submit" disabled={busy}>
                    <Save size={17} /> Lưu Flashcard
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => setEditingCard(null)}
                  >
                    <X size={17} /> Hủy
                  </button>
                </div>
              </form>
            ) : null}
            <form className="flashcard-create-form" onSubmit={(event) => void addFlashcard(event)}>
              <div className="form-field">
                <label htmlFor="flashcard-front">Mặt trước</label>
                <textarea
                  id="flashcard-front"
                  name="frontText"
                  maxLength={2_000}
                  disabled={!editable}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="flashcard-back">Mặt sau</label>
                <textarea
                  id="flashcard-back"
                  name="backText"
                  maxLength={5_000}
                  disabled={!editable}
                  required
                />
              </div>
              <button
                className="fit-button"
                type="submit"
                disabled={busy || !editable || activeCards.length >= 100}
              >
                <Plus size={17} /> Thêm Flashcard
              </button>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
