import { createServer } from 'node:http';

import pino from 'pino';
import { describe, expect, it, vi } from 'vitest';

import { shutdownRuntime } from '../src/shared/runtime/graceful-shutdown.js';

describe('shutdownRuntime', () => {
  it('marks readiness down before closing HTTP and MongoDB', async () => {
    const events: string[] = [];
    const server = createServer((_request, response) => response.end('ok'));
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

    await shutdownRuntime({
      server,
      disconnect: async () => {
        events.push('mongodb.closed');
      },
      markNotReady: () => events.push('readiness.down'),
      logger: pino({ level: 'silent' }),
      signal: 'SIGTERM',
      timeoutMs: 1_000,
    });

    expect(events).toEqual(['readiness.down', 'mongodb.closed']);
    expect(server.listening).toBe(false);
  });

  it('fails within the configured shutdown budget', async () => {
    const server = createServer();
    const closeSpy = vi.spyOn(server, 'close').mockImplementation(() => server);
    const closeAllSpy = vi.spyOn(server, 'closeAllConnections');

    await expect(
      shutdownRuntime({
        server,
        disconnect: async () => undefined,
        markNotReady: () => undefined,
        logger: pino({ level: 'silent' }),
        signal: 'SIGTERM',
        timeoutMs: 5,
      }),
    ).rejects.toThrow('Graceful shutdown timed out');

    expect(closeSpy).toHaveBeenCalledOnce();
    expect(closeAllSpy).toHaveBeenCalledOnce();
  });
});
