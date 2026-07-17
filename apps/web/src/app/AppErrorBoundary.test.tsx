import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { AppErrorBoundary } from './AppErrorBoundary';

function BrokenChild(): ReactNode {
  throw new Error('Intentional render failure');
}

describe('AppErrorBoundary', () => {
  it('renders children while the application is healthy', () => {
    render(
      <AppErrorBoundary>
        <p>Healthy content</p>
      </AppErrorBoundary>,
    );

    expect(screen.getByText('Healthy content')).toBeInTheDocument();
  });

  it('shows a recoverable fallback when a child throws', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <AppErrorBoundary>
        <BrokenChild />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Không thể hiển thị trang' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tải lại' })).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalled();
  });
});
