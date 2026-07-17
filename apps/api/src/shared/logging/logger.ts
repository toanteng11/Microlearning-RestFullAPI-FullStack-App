import pino, { type DestinationStream, type Logger, type LoggerOptions } from 'pino';

const SENSITIVE_QUERY_PARAMETERS = new Set([
  'access_token',
  'authorization',
  'invitationtoken',
  'password',
  'refresh_token',
  'secret',
  'token',
]);

export function sanitizeRequestUrl(value: string | undefined): string | undefined {
  if (!value || !value.includes('?')) return value;

  try {
    const parsed = new URL(value, 'http://microlearning.local');
    for (const key of [...parsed.searchParams.keys()]) {
      if (SENSITIVE_QUERY_PARAMETERS.has(key.toLowerCase())) {
        parsed.searchParams.set(key, '[REDACTED]');
      }
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return value.replace(
      /([?&](?:access_token|authorization|invitationtoken|password|refresh_token|secret|token)=)[^&#]*/giu,
      '$1[REDACTED]',
    );
  }
}

export function createLogger(level: string, destination?: DestinationStream): Logger {
  const options: LoggerOptions = {
    level,
    base: {
      service: 'microlearning-api',
    },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers["set-cookie"]',
        'res.headers["set-cookie"]',
        'headers.authorization',
        'headers.cookie',
        'headers["set-cookie"]',
        'body.accessToken',
        'body.confirmPassword',
        'body.password',
        'body.refreshToken',
        'body.secret',
        'body.token',
        'req.body.accessToken',
        'req.body.confirmPassword',
        'req.body.password',
        'req.body.refreshToken',
        'req.body.secret',
        'req.body.token',
        'accessToken',
        'confirmPassword',
        'password',
        'refreshToken',
        'token',
        '*.password',
        '*.confirmPassword',
        '*.accessToken',
        '*.refreshToken',
        '*.token',
        '*.secret',
      ],
      censor: '[REDACTED]',
    },
    serializers: {
      req(request) {
        const serialized = pino.stdSerializers.req(request);
        return { ...serialized, url: sanitizeRequestUrl(serialized.url) };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  return destination ? pino(options, destination) : pino(options);
}
