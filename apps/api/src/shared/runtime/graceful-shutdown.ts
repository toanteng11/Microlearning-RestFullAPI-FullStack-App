import type { Server } from 'node:http';

import type { Logger } from 'pino';

function closeServer(server: Server, forceAfterMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const forceCloseTimer = setTimeout(() => server.closeAllConnections(), forceAfterMs);
    forceCloseTimer.unref();

    server.close((error) => {
      clearTimeout(forceCloseTimer);
      if (error) reject(error);
      else resolve();
    });
    // Stop idle keep-alive sockets from delaying termination after traffic has drained.
    server.closeIdleConnections();
  });
}

export async function shutdownRuntime(options: {
  server: Server;
  disconnect: () => Promise<void>;
  markNotReady: () => void;
  logger: Logger;
  signal: string;
  timeoutMs?: number;
}): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 8_000;
  const forceCloseAfterMs = Math.max(1, timeoutMs - Math.min(1_000, timeoutMs / 4));
  options.markNotReady();
  options.logger.info(
    { event: 'application.shutdown_started', signal: options.signal, timeoutMs },
    'Graceful shutdown started',
  );

  let timeout: NodeJS.Timeout | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => reject(new Error('Graceful shutdown timed out')), timeoutMs);
    timeout.unref();
  });

  try {
    await Promise.race([
      (async () => {
        await closeServer(options.server, forceCloseAfterMs);
        await options.disconnect();
      })(),
      deadline,
    ]);
    options.logger.info({ event: 'application.shutdown_completed' }, 'Graceful shutdown completed');
  } catch (error) {
    options.logger.fatal(
      { err: error, event: 'application.shutdown_timeout' },
      'Graceful shutdown failed',
    );
    throw error;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
