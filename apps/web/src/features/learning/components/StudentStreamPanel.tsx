import { ArrowLeft, ArrowRight, Bell, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useAuth } from '../../../shared/auth/auth-context';
import { displayLearningDate, requestErrorMessage } from '../learning-format';
import type { ItemEnvelope, StudentAnnouncement } from '../learning.types';

export function StudentStreamPanel({ classroomId }: { classroomId: string }) {
  const { request } = useAuth();
  const [result, setResult] = useState<ItemEnvelope<StudentAnnouncement> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [page, setPage] = useState(1);
  const items = Array.isArray(result?.data?.items) ? result.data.items : [];

  useEffect(() => {
    let active = true;
    void request<ItemEnvelope<StudentAnnouncement>>(
      `/classrooms/${classroomId}/announcements?page=${page}&limit=20`,
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
  }, [classroomId, page, reloadKey, request]);

  if (error) {
    return (
      <div className="list-state list-state--error" role="alert">
        <p>{error}</p>
        <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
          <RefreshCw size={17} /> Thử lại
        </button>
      </div>
    );
  }
  if (!result)
    return (
      <div className="list-state">
        <div className="spinner" />
        <p>Đang tải bảng tin...</p>
      </div>
    );
  if (items.length === 0) {
    return (
      <div className="list-state">
        <Bell size={30} />
        <strong>Chưa có thông báo</strong>
      </div>
    );
  }
  return (
    <>
      <div className="stream-list">
        {items.map((announcement) => (
          <article className="stream-item" key={announcement.id}>
            <time dateTime={announcement.publishedAt ?? undefined}>
              {displayLearningDate(announcement.publishedAt)}
            </time>
            <div
              className="safe-rich-text"
              dangerouslySetInnerHTML={{ __html: announcement.contentHtml }}
            />
          </article>
        ))}
      </div>
      {result.meta.totalPages > 1 ? (
        <div className="pagination">
          <button
            className="secondary-button"
            type="button"
            disabled={!result.meta.hasPreviousPage}
            aria-label="Trang bảng tin trước"
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
            aria-label="Trang bảng tin sau"
            onClick={() => setPage((current) => current + 1)}
          >
            <ArrowRight size={17} />
          </button>
        </div>
      ) : null}
    </>
  );
}
