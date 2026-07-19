import pino, { type DestinationStream, type Logger, type LoggerOptions } from 'pino';

const SENSITIVE_QUERY_PARAMETERS = new Set([
  'access_token',
  'authorization',
  'classcode',
  'code',
  'invite_token',
  'invitationtoken',
  'invitetoken',
  'password',
  'refresh_token',
  'secret',
  'token',
]);

export function sanitizeRequestUrl(value: string | undefined): string | undefined {
  if (!value || (!value.includes('?') && !value.includes('#'))) return value;

  try {
    const parsed = new URL(value, 'http://microlearning.local');
    for (const key of [...parsed.searchParams.keys()]) {
      if (SENSITIVE_QUERY_PARAMETERS.has(key.toLowerCase())) {
        parsed.searchParams.set(key, '[REDACTED]');
      }
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash ? '#[REDACTED]' : ''}`;
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
        'body.classCode',
        'body.code',
        'body.codeDigest',
        'body.confirmPassword',
        'body.password',
        'body.refreshToken',
        'body.secret',
        'body.token',
        'body.tokenHash',
        'body.inviteToken',
        'req.body.accessToken',
        'req.body.classCode',
        'req.body.code',
        'req.body.codeDigest',
        'req.body.confirmPassword',
        'req.body.password',
        'req.body.refreshToken',
        'req.body.secret',
        'req.body.token',
        'req.body.tokenHash',
        'req.body.inviteToken',
        'accessToken',
        'classCode',
        'code',
        'codeDigest',
        'confirmPassword',
        'password',
        'refreshToken',
        'token',
        'tokenHash',
        'inviteToken',
        '*.password',
        '*.confirmPassword',
        '*.accessToken',
        '*.refreshToken',
        '*.token',
        '*.classCode',
        '*.code',
        '*.codeDigest',
        '*.inviteToken',
        '*.tokenHash',
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
