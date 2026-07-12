import { useCallback, useEffect, useState } from 'react';

import { getSystemStatus, type HealthData, type VersionData } from '../../shared/api/system-api';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; health: HealthData; version: VersionData };

export function SystemStatusPage() {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [requestKey, setRequestKey] = useState(0);

  const retry = useCallback(() => {
    setLoadState({ status: 'loading' });
    setRequestKey((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    getSystemStatus(controller.signal)
      .then(({ health, version }) => setLoadState({ status: 'success', health, version }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : 'Không thể kết nối API';
        setLoadState({ status: 'error', message });
      });

    return () => controller.abort();
  }, [requestKey]);

  return (
    <main className="status-page">
      <header className="status-header">
        <div>
          <p className="eyebrow">MICROLEARNING PLATFORM</p>
          <h1>System Foundation</h1>
          <p className="subtitle">Kiểm tra kết nối giữa React Web và RESTful API.</p>
        </div>
        <span className="phase-label">Phase 01</span>
      </header>

      <section className="status-content" aria-live="polite">
        {loadState.status === 'loading' && (
          <div className="loading-state">
            <span className="spinner" aria-hidden="true" />
            <p>Đang kiểm tra hệ thống...</p>
          </div>
        )}

        {loadState.status === 'error' && (
          <div className="message-panel" role="alert">
            <p className="status-dot status-dot--down">Không thể kết nối</p>
            <h2>API chưa sẵn sàng</h2>
            <p>{loadState.message}</p>
            <button type="button" onClick={retry}>
              Thử lại
            </button>
          </div>
        )}

        {loadState.status === 'success' && (
          <div className="status-grid">
            <article className="status-item">
              <span>API status</span>
              <strong className="status-dot status-dot--up">{loadState.health.status}</strong>
            </article>
            <article className="status-item">
              <span>Service</span>
              <strong>{loadState.health.service}</strong>
            </article>
            <article className="status-item">
              <span>Version</span>
              <strong>{loadState.version.version}</strong>
            </article>
            <article className="status-item">
              <span>Environment</span>
              <strong>{loadState.version.environment}</strong>
            </article>
            <article className="status-item status-item--wide">
              <span>Commit</span>
              <strong>{loadState.version.commitSha}</strong>
            </article>
            <article className="status-item status-item--wide">
              <span>Last check</span>
              <strong>{new Date(loadState.health.timestamp).toLocaleString('vi-VN')}</strong>
            </article>
          </div>
        )}
      </section>

      <footer className="status-footer">
        Swagger API documentation: <code>/api-docs</code>
      </footer>
    </main>
  );
}
