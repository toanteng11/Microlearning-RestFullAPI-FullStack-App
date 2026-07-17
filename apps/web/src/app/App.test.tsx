import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';
import { router } from './router';

const successfulResponses = [
  {
    success: true,
    data: {
      status: 'UP',
      service: 'microlearning-api',
      timestamp: '2026-07-13T00:00:00.000Z',
    },
  },
  {
    success: true,
    data: {
      appName: 'Microlearning Classroom LMS API',
      version: '0.1.0',
      environment: 'test',
      commitSha: 'test-sha',
      buildTime: '2026-07-13T00:00:00.000Z',
    },
  },
];

describe('App routing', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify(successfulResponses[0]), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(successfulResponses[1]), { status: 200 }),
        ),
    );
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await router.navigate('/system-status');
  });

  it('renders the system status route through the application shell', async () => {
    await act(() => router.navigate('/system-status'));
    render(<App />);

    expect(await screen.findByText('microlearning-api')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'System Foundation' })).toBeInTheDocument();
  });

  it('renders the 404 route and delegates the back action to the router', async () => {
    await act(() => router.navigate('/missing-page'));
    const navigateSpy = vi.spyOn(router, 'navigate');
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Không tìm thấy trang' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Quay lại' }));
    expect(navigateSpy).toHaveBeenCalledWith(-1);
  });
});
