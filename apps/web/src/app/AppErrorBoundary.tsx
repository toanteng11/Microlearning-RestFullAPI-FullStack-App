import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application render failed', { error, componentStack: info.componentStack });
  }

  override render() {
    if (this.state.hasError) {
      return (
        <main className="centered-page">
          <section className="message-panel" role="alert">
            <p className="eyebrow">SYSTEM ERROR</p>
            <h1>Không thể hiển thị trang</h1>
            <p>Ứng dụng đã gặp lỗi không mong đợi. Vui lòng tải lại trang.</p>
            <button type="button" onClick={() => window.location.reload()}>
              Tải lại
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
