import pino, { type Logger } from 'pino';

export function createLogger(level: string): Logger {
  return pino({
    level,
    base: {
      service: 'microlearning-api',
    },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'password',
        '*.password',
        '*.token',
        '*.secret',
      ],
      censor: '[REDACTED]',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}
