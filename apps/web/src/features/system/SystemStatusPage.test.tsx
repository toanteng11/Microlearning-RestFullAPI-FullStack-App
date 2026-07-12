import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SystemStatusPage } from './SystemStatusPage';

const successfulResponses = [
  {
    success: true,
    data: {
      status: 'UP',
      service: 'microlearning-api',
      timestamp: '2026-07-12T10:00:00.000Z',
    },
  },
  {
    success: true,
    data: {
      appName: 'Microlearning Classroom LMS API',
      version: '0.1.0',
      environment: 'test',
      commitSha: 'test-sha',
      buildTime: '2026-07-12T10:00:00.000Z',
    },
  },
];

describe('SystemStatusPage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows API and version information when both requests succeed', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(successfulResponses[0]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(successfulResponses[1]), { status: 200 }));

    vi.stubGlobal('fetch', fetchMock);
    render(<SystemStatusPage />);

    expect(await screen.findByText('microlearning-api')).toBeInTheDocument();
    expect(screen.getByText('0.1.0')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('shows a recoverable error state when the API is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network unavailable')));
    render(<SystemStatusPage />);

    expect(await screen.findByText('API chưa sẵn sàng')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
  });
});
