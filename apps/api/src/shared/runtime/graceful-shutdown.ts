import type { Server } from 'node:http';

import type { Logger } from 'pino';

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
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
        await closeServer(options.server);
        await options.disconnect();
      })(),
      deadline,
    ]);
    options.logger.info({ event: 'application.shutdown_completed' }, 'Graceful shutdown completed');
  } catch (error) {
    options.server.closeAllConnections();
    options.logger.fatal(
      { err: error, event: 'application.shutdown_timeout' },
      'Graceful shutdown failed',
    );
    throw error;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
