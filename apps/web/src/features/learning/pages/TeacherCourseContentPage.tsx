import {
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  Pencil,
  Plus,
  Save,
  Send,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../../../shared/auth/auth-context';
import { displayLearningDate, requestErrorMessage } from '../learning-format';
import type { ContentStatus, TeacherCourse } from '../learning.types';
import { ContentStatusBadge } from '../components/LearningStatusBadge';

interface TeacherModule {
  id: string;
  courseId: string;
  title: string;
  description: string;
  status: Exclude<ContentStatus, 'SCHEDULED'>;
  displayOrder: number;
  updatedAt: string;
}

interface TeacherLesson {
  id: string;
  courseId: string;
  moduleId: string | null;
  title: string;
  estimatedMinutes: number;
  isRequired: boolean;
  status: ContentStatus;
  completionDeadline: string | null;
  displayOrder: number;
  updatedAt: string;
}

export function TeacherCourseContentPage() {
  const { courseId = '' } = useParams();
  const { request } = useAuth();
  const [course, setCourse] = useState<TeacherCourse | null>(null);
  const [modules, setModules] = useState<TeacherModule[]>([]);
  const [lessons, setLessons] = useState<TeacherLesson[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [editingModule, setEditingModule] = useState<TeacherModule | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      request<{ success: true; data: { course: TeacherCourse } }>(`/courses/${courseId}`),
      request<{ success: true; data: { items: TeacherModule[] } }>(`/courses/${courseId}/modules`),
      request<{ success: true; data: { items: TeacherLesson[] } }>(`/courses/${courseId}/lessons`),
    ])
      .then(([courseResponse, moduleResponse, lessonResponse]) => {
        if (!active) return;
        setCourse(courseResponse.data.course);
        setModules(moduleResponse.data.items);
        setLessons(lessonResponse.data.items);
        setError(null);
      })
      .catch((requestError) => {
        if (active) setError(requestErrorMessage(requestError, 'Không thể tải cấu trúc khóa học.'));
      });
    return () => {
      active = false;
    };
  }, [courseId, reloadKey, request]);

  async function createModule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setBusy(true);
    try {
      await request(`/courses/${courseId}/modules`, {
        method: 'POST',
        body: {
          title: String(values.get('title') ?? '').trim(),
          description: String(values.get('description') ?? '').trim(),
        },
      });
      form.reset();
      setNotice('Đã tạo Module.');
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể tạo Module.'));
    } finally {
      setBusy(false);
    }
  }

  async function updateModule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingModule) return;
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await request(`/modules/${editingModule.id}`, {
        method: 'PATCH',
        body: {
          title: String(values.get('title') ?? '').trim(),
          description: String(values.get('description') ?? '').trim(),
          expectedUpdatedAt: editingModule.updatedAt,
        },
      });
      setNotice('Đã cập nhật Module.');
      setEditingModule(null);
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể cập nhật Module.'));
    } finally {
      setBusy(false);
    }
  }

  async function changeModuleStatus(module: TeacherModule) {
    const targetStatus = module.status === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED';
    setBusy(true);
    setError(null);
    try {
      await request(`/modules/${module.id}/status`, {
        method: 'PATCH',
        body: { targetStatus, expectedUpdatedAt: module.updatedAt },
      });
      setNotice(targetStatus === 'PUBLISHED' ? 'Đã xuất bản Module.' : 'Đã thu hồi Module.');
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể đổi trạng thái Module.'));
    } finally {
      setBusy(false);
    }
  }

  async function archiveModule(module: TeacherModule) {
    const reason = window.prompt('Nhập lý do lưu trữ Module:')?.trim();
    if (!reason) return;
    setBusy(true);
    setError(null);
    try {
      await request(`/modules/${module.id}`, {
        method: 'DELETE',
        body: { reason, expectedUpdatedAt: module.updatedAt },
      });
      setNotice('Đã lưu trữ Module.');
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể lưu trữ Module.'));
    } finally {
      setBusy(false);
    }
  }

  async function moveModule(moduleId: string, offset: -1 | 1) {
    if (!course) return;
    const index = modules.findIndex((module) => module.id === moduleId);
    const targetIndex = index + offset;
    if (index < 0 || targetIndex < 0 || targetIndex >= modules.length) return;
    const ordered = [...modules];
    [ordered[index], ordered[targetIndex]] = [ordered[targetIndex]!, ordered[index]!];
    await reorderStructure(`/courses/${course.id}/modules/reorder`, {
      orderedModuleIds: ordered.map((module) => module.id),
      expectedStructureRevision: course.structureRevision,
    });
  }

  async function moveLesson(lessonId: string, moduleId: string | null, offset: -1 | 1) {
    if (!course) return;
    const siblings = lessons.filter((lesson) => lesson.moduleId === moduleId);
    const index = siblings.findIndex((lesson) => lesson.id === lessonId);
    const targetIndex = index + offset;
    if (index < 0 || targetIndex < 0 || targetIndex >= siblings.length) return;
    const orderedSiblings = [...siblings];
    [orderedSiblings[index], orderedSiblings[targetIndex]] = [
      orderedSiblings[targetIndex]!,
      orderedSiblings[index]!,
    ];
    const containers = [
      {
        moduleId: null,
        orderedLessonIds: (moduleId === null
          ? orderedSiblings
          : lessons.filter((item) => item.moduleId === null)
        ).map((item) => item.id),
      },
      ...modules.map((module) => ({
        moduleId: module.id,
        orderedLessonIds: (module.id === moduleId
          ? orderedSiblings
          : lessons.filter((item) => item.moduleId === module.id)
        ).map((item) => item.id),
      })),
    ];
    await reorderStructure(`/courses/${course.id}/lessons/reorder`, {
      containers,
      expectedStructureRevision: course.structureRevision,
    });
  }

  async function reorderStructure(path: string, body: unknown) {
    setBusy(true);
    setError(null);
    try {
      await request(path, { method: 'PATCH', body });
      setNotice('Đã cập nhật thứ tự nội dung.');
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setError(
        requestErrorMessage(
          requestError,
          'Cấu trúc đã thay đổi. Hãy tải lại dữ liệu mới nhất rồi thử lại.',
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  if (error && !course) return <div className="list-state list-state--error">{error}</div>;
  if (!course)
    return (
      <div className="list-state">
        <div className="spinner" />
      </div>
    );

  const rootLessons = lessons.filter((lesson) => lesson.moduleId === null);
  return (
    <section className="page-section">
      <Link className="back-link" to={`/teacher/courses/${courseId}`}>
        <ArrowLeft size={17} /> Course Dashboard
      </Link>
      <header className="page-header page-header--aligned">
        <div>
          <p className="eyebrow">Content manager</p>
          <h1>{course.title}</h1>
        </div>
        <Link className="button-link" to={`/teacher/courses/${courseId}/lessons/new`}>
          <Plus size={17} /> Tạo bài học
        </Link>
      </header>
      {notice ? <div className="notice notice--success">{notice}</div> : null}
      {error ? <div className="notice notice--error">{error}</div> : null}
      <section className="editor-band">
        <div>
          <h2>Tạo Module</h2>
          <p>Nhóm các bài học theo chủ đề ngắn.</p>
        </div>
        <form className="inline-module-form" onSubmit={(event) => void createModule(event)}>
          <label className="sr-only" htmlFor="module-title">
            Tên Module
          </label>
          <input
            id="module-title"
            name="title"
            minLength={2}
            maxLength={150}
            placeholder="Tên Module"
            required
          />
          <label className="sr-only" htmlFor="module-description">
            Mô tả Module
          </label>
          <input
            id="module-description"
            name="description"
            maxLength={2_000}
            placeholder="Mô tả ngắn"
          />
          <button type="submit" disabled={busy}>
            <Plus size={17} /> Thêm Module
          </button>
        </form>
      </section>
      {editingModule ? (
        <form className="module-edit-form" onSubmit={(event) => void updateModule(event)}>
          <div className="form-field">
            <label htmlFor="edit-module-title">Tên Module</label>
            <input
              id="edit-module-title"
              name="title"
              defaultValue={editingModule.title}
              minLength={2}
              maxLength={150}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="edit-module-description">Mô tả Module</label>
            <input
              id="edit-module-description"
              name="description"
              defaultValue={editingModule.description}
              maxLength={2_000}
            />
          </div>
          <div className="inline-actions">
            <button type="submit" disabled={busy}>
              <Save size={17} /> Lưu Module
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => setEditingModule(null)}
            >
              <X size={17} /> Hủy
            </button>
          </div>
        </form>
      ) : null}
      {modules.length === 0 && rootLessons.length === 0 ? (
        <div className="list-state">
          <BookOpen size={30} />
          <strong>Khóa học chưa có nội dung</strong>
        </div>
      ) : (
        <div className="structure-list">
          {rootLessons.length > 0 ? (
            <section className="structure-module">
              <h2>Bài học chung</h2>
              {rootLessons.map((lesson, index) => (
                <LessonAuthoringRow
                  key={lesson.id}
                  lesson={lesson}
                  index={index}
                  total={rootLessons.length}
                  busy={busy}
                  onMove={(offset) => void moveLesson(lesson.id, null, offset)}
                />
              ))}
            </section>
          ) : null}
          {modules.map((module) => (
            <section className="structure-module" key={module.id}>
              <header>
                <div>
                  <h2>{module.title}</h2>
                  <p>{module.description || 'Không có mô tả.'}</p>
                </div>
                <div className="structure-actions">
                  <ContentStatusBadge status={module.status} />
                  <div className="icon-actions">
                    <button
                      className="icon-button"
                      type="button"
                      title="Di chuyển Module lên"
                      aria-label={`Di chuyển ${module.title} lên`}
                      disabled={busy || modules.indexOf(module) === 0}
                      onClick={() => void moveModule(module.id, -1)}
                    >
                      <ArrowUp size={17} />
                    </button>
                    <button
                      className="icon-button"
                      type="button"
                      title="Di chuyển Module xuống"
                      aria-label={`Di chuyển ${module.title} xuống`}
                      disabled={busy || modules.indexOf(module) === modules.length - 1}
                      onClick={() => void moveModule(module.id, 1)}
                    >
                      <ArrowDown size={17} />
                    </button>
                    <button
                      className="icon-button"
                      type="button"
                      title="Sửa Module"
                      aria-label={`Sửa ${module.title}`}
                      disabled={busy || module.status === 'PUBLISHED'}
                      onClick={() => setEditingModule(module)}
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      className="icon-button"
                      type="button"
                      title={module.status === 'PUBLISHED' ? 'Thu hồi Module' : 'Xuất bản Module'}
                      aria-label={
                        module.status === 'PUBLISHED'
                          ? `Thu hồi ${module.title}`
                          : `Xuất bản ${module.title}`
                      }
                      disabled={busy}
                      onClick={() => void changeModuleStatus(module)}
                    >
                      <Send size={17} />
                    </button>
                    <button
                      className="icon-button icon-button--danger"
                      type="button"
                      title="Lưu trữ Module"
                      aria-label={`Lưu trữ ${module.title}`}
                      disabled={busy}
                      onClick={() => void archiveModule(module)}
                    >
                      <Archive size={17} />
                    </button>
                  </div>
                </div>
              </header>
              {(() => {
                const moduleLessons = lessons.filter((lesson) => lesson.moduleId === module.id);
                return moduleLessons.map((lesson, index) => (
                  <LessonAuthoringRow
                    key={lesson.id}
                    lesson={lesson}
                    index={index}
                    total={moduleLessons.length}
                    busy={busy}
                    onMove={(offset) => void moveLesson(lesson.id, module.id, offset)}
                  />
                ));
              })()}
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function LessonAuthoringRow({
  lesson,
  index,
  total,
  busy,
  onMove,
}: {
  lesson: TeacherLesson;
  index: number;
  total: number;
  busy: boolean;
  onMove: (offset: -1 | 1) => void;
}) {
  return (
    <article className="structure-lesson">
      <div>
        <Link to={`/teacher/lessons/${lesson.id}/edit`}>{lesson.title}</Link>
        <small>
          {lesson.estimatedMinutes} phút · Hạn {displayLearningDate(lesson.completionDeadline)}
        </small>
      </div>
      <div className="structure-actions">
        <ContentStatusBadge status={lesson.status} />
        <div className="icon-actions">
          <button
            className="icon-button"
            type="button"
            title="Di chuyển bài học lên"
            aria-label={`Di chuyển ${lesson.title} lên`}
            disabled={busy || index === 0}
            onClick={() => onMove(-1)}
          >
            <ArrowUp size={17} />
          </button>
          <button
            className="icon-button"
            type="button"
            title="Di chuyển bài học xuống"
            aria-label={`Di chuyển ${lesson.title} xuống`}
            disabled={busy || index === total - 1}
            onClick={() => onMove(1)}
          >
            <ArrowDown size={17} />
          </button>
        </div>
      </div>
    </article>
  );
}
