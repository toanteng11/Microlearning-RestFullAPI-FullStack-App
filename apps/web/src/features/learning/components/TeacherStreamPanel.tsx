import { Archive, ArrowLeft, ArrowRight, Bell, Check, Pencil, RefreshCw, Send } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useAuth } from '../../../shared/auth/auth-context';
import { displayLearningDate, requestErrorMessage } from '../learning-format';
import type { ContentStatus, ItemEnvelope, TeacherAnnouncement } from '../learning.types';
import { ContentStatusBadge } from './LearningStatusBadge';

export function TeacherStreamPanel({ classroomId }: { classroomId: string }) {
  const { request } = useAuth();
  const [result, setResult] = useState<ItemEnvelope<TeacherAnnouncement> | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<TeacherAnnouncement | null>(null);
  const [status, setStatus] = useState<ContentStatus | ''>('');
  const [page, setPage] = useState(1);
  const items = Array.isArray(result?.data?.items) ? result.data.items : [];

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({ page: String(page), limit: '10' });
    if (status) query.set('status', status);
    void request<ItemEnvelope<TeacherAnnouncement>>(
      `/classrooms/${classroomId}/announcements?${query.toString()}`,
    )
      .then((response) => {
        if (active) {
          if (response.meta.totalPages > 0 && page > response.meta.totalPages) {
            setPage(response.meta.totalPages);
            return;
          }
          setResult(response);
          setError(null);
        }
      })
      .catch((requestError) => {
        if (active) setError(requestErrorMessage(requestError, 'Không thể tải bảng tin.'));
      });
    return () => {
      active = false;
    };
  }, [classroomId, page, reloadKey, request, status]);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const content = String(new FormData(form).get('content') ?? '').trim();
    setBusyId('create');
    setError(null);
    try {
      await request(`/classrooms/${classroomId}/announcements`, {
        method: 'POST',
        body: { content },
      });
      form.reset();
      setNotice('Đã tạo thông báo nháp.');
      setStatus('DRAFT');
      setPage(1);
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể tạo thông báo.'));
    } finally {
      setBusyId(null);
    }
  }

  async function update(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const content = String(new FormData(event.currentTarget).get('content') ?? '').trim();
    setBusyId(editing.id);
    try {
      await request(`/announcements/${editing.id}`, {
        method: 'PATCH',
        body: { content, expectedUpdatedAt: editing.updatedAt },
      });
      setEditing(null);
      setNotice('Đã cập nhật thông báo.');
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể cập nhật thông báo.'));
    } finally {
      setBusyId(null);
    }
  }

  async function changeStatus(
    item: TeacherAnnouncement,
    targetStatus: 'PUBLISHED' | 'UNPUBLISHED',
  ) {
    setBusyId(item.id);
    setError(null);
    try {
      await request(`/announcements/${item.id}/status`, {
        method: 'PATCH',
        body: { targetStatus, expectedUpdatedAt: item.updatedAt },
      });
      setNotice(targetStatus === 'PUBLISHED' ? 'Đã xuất bản thông báo.' : 'Đã thu hồi thông báo.');
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể đổi trạng thái thông báo.'));
    } finally {
      setBusyId(null);
    }
  }

  async function archive(item: TeacherAnnouncement) {
    const reason = window.prompt('Nhập lý do lưu trữ thông báo:')?.trim();
    if (!reason) return;
    setBusyId(item.id);
    try {
      await request(`/announcements/${item.id}`, {
        method: 'DELETE',
        body: { reason, expectedUpdatedAt: item.updatedAt },
      });
      setNotice('Đã lưu trữ thông báo.');
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setError(requestErrorMessage(requestError, 'Không thể lưu trữ thông báo.'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="teacher-stream">
      <form className="announcement-composer" onSubmit={(event) => void create(event)}>
        <label htmlFor="announcement-content">Thông báo mới</label>
        <textarea
          id="announcement-content"
          name="content"
          minLength={1}
          maxLength={10_000}
          placeholder="Nội dung Markdown..."
          required
        />
        <button className="fit-button" type="submit" disabled={busyId !== null}>
          <Send size={17} /> Tạo bản nháp
        </button>
      </form>
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
      <div className="stream-toolbar">
        <label htmlFor="teacher-announcement-status">Trạng thái</label>
        <select
          id="teacher-announcement-status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as ContentStatus | '');
            setPage(1);
            setEditing(null);
          }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="DRAFT">Bản nháp</option>
          <option value="SCHEDULED">Đã lên lịch</option>
          <option value="PUBLISHED">Đã xuất bản</option>
          <option value="UNPUBLISHED">Đã thu hồi</option>
          <option value="ARCHIVED">Đã lưu trữ</option>
        </select>
        <span>{result?.meta.totalItems ?? 0} thông báo</span>
      </div>
      {!result ? (
        <div className="list-state">
          <div className="spinner" />
        </div>
      ) : null}
      {result && items.length === 0 ? (
        <div className="list-state">
          <Bell size={30} />
          <strong>Chưa có thông báo</strong>
        </div>
      ) : null}
      {editing ? (
        <form className="announcement-composer" onSubmit={(event) => void update(event)}>
          <label htmlFor="announcement-edit-content">Sửa thông báo</label>
          <textarea
            id="announcement-edit-content"
            name="content"
            defaultValue={editing.content}
            required
          />
          <div className="inline-actions">
            <button type="submit" disabled={busyId !== null}>
              <Check size={17} /> Lưu
            </button>
            <button className="secondary-button" type="button" onClick={() => setEditing(null)}>
              Hủy
            </button>
          </div>
        </form>
      ) : null}
      {items.length > 0 ? (
        <div className="stream-list">
          {items.map((item) => (
            <article className="stream-item" key={item.id}>
              <header>
                <div>
                  <ContentStatusBadge status={item.effectiveStatus} />
                  <time dateTime={item.updatedAt}>{displayLearningDate(item.updatedAt)}</time>
                </div>
                <div className="icon-actions">
                  {item.allowedActions.includes('UPDATE') ? (
                    <button
                      className="icon-button"
                      type="button"
                      title="Sửa thông báo"
                      aria-label="Sửa thông báo"
                      onClick={() => setEditing(item)}
                    >
                      <Pencil size={17} />
                    </button>
                  ) : null}
                  {['DRAFT', 'UNPUBLISHED'].includes(item.status) ? (
                    <button
                      className="icon-button"
                      type="button"
                      title="Xuất bản"
                      aria-label="Xuất bản thông báo"
                      disabled={busyId === item.id}
                      onClick={() => void changeStatus(item, 'PUBLISHED')}
                    >
                      <Send size={17} />
                    </button>
                  ) : null}
                  {item.status === 'PUBLISHED' ? (
                    <button
                      className="icon-button"
                      type="button"
                      title="Thu hồi"
                      aria-label="Thu hồi thông báo"
                      disabled={busyId === item.id}
                      onClick={() => void changeStatus(item, 'UNPUBLISHED')}
                    >
                      <RefreshCw size={17} />
                    </button>
                  ) : null}
                  {item.allowedActions.includes('ARCHIVE') ? (
                    <button
                      className="icon-button"
                      type="button"
                      title="Lưu trữ"
                      aria-label="Lưu trữ thông báo"
                      disabled={busyId === item.id}
                      onClick={() => void archive(item)}
                    >
                      <Archive size={17} />
                    </button>
                  ) : null}
                </div>
              </header>
              <div
                className="safe-rich-text"
                dangerouslySetInnerHTML={{ __html: item.contentHtml }}
              />
            </article>
          ))}
        </div>
      ) : null}
      {result && result.meta.totalPages > 1 ? (
        <div className="pagination">
          <button
            className="secondary-button"
            type="button"
            disabled={!result.meta.hasPreviousPage}
            aria-label="Trang thông báo trước"
            onClick={() => setPage((current) => current - 1)}
          >
            <ArrowLeft size={17} />
          </button>
          <span>
            Trang {result.meta.page} / {result.meta.totalPages}
          </span>
          <button
            className="secondary-button"
            type="button"
            disabled={!result.meta.hasNextPage}
            aria-label="Trang thông báo sau"
            onClick={() => setPage((current) => current + 1)}
          >
            <ArrowRight size={17} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
