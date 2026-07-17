import type { Readable } from 'node:stream';

export interface PasswordCliOptions {
  passwordStdin: boolean;
}

export function assertNoPasswordArgument(arguments_: string[]): void {
  if (arguments_.some((value) => value === '--password' || value.startsWith('--password='))) {
    throw new Error(
      'Password command arguments are forbidden; use hidden prompt or --password-stdin',
    );
  }
}

export async function readPasswordFromStream(stream: Readable): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  }
  return Buffer.concat(chunks)
    .toString('utf8')
    .replace(/[\r\n]+$/u, '');
}

function readHiddenPassword(): Promise<string> {
  const input = process.stdin;
  if (!input.isTTY || typeof input.setRawMode !== 'function') {
    throw new Error('A TTY is required for hidden prompt; use --password-stdin instead');
  }

  return new Promise((resolve, reject) => {
    let password = '';
    const previousEncoding = input.readableEncoding;
    const finish = (error?: Error) => {
      input.setRawMode(false);
      input.pause();
      input.removeListener('data', onData);
      process.stdout.write('\n');
      if (previousEncoding) input.setEncoding(previousEncoding);
      if (error) reject(error);
      else resolve(password);
    };
    const onData = (chunk: Buffer | string) => {
      const value = chunk.toString();
      for (const character of value) {
        if (character === '\u0003') {
          finish(new Error('Password input cancelled'));
          return;
        }
        if (character === '\r' || character === '\n') {
          finish();
          return;
        }
        if (character === '\u007f' || character === '\b') {
          password = password.slice(0, -1);
          continue;
        }
        if (character >= ' ') password += character;
      }
    };

    process.stdout.write('Password: ');
    input.setEncoding('utf8');
    input.setRawMode(true);
    input.resume();
    input.on('data', onData);
  });
}

export function readSecurePassword(options: PasswordCliOptions): Promise<string> {
  return options.passwordStdin ? readPasswordFromStream(process.stdin) : readHiddenPassword();
}
