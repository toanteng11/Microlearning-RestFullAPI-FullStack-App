export interface BootstrapArguments {
  email: string;
  fullName: string;
  passwordStdin: boolean;
}

export function parseBootstrapArguments(arguments_: string[]): BootstrapArguments {
  if (arguments_.length > 0 && !arguments_[0]?.startsWith('--')) {
    if (arguments_.length > 2) {
      throw new Error('Bootstrap accepts only positional email and optional full name');
    }
    return {
      email: arguments_[0] ?? '',
      fullName: arguments_[1] ?? 'System Super Admin',
      passwordStdin: false,
    };
  }

  let email = '';
  let fullName = 'System Super Admin';
  let passwordStdin = false;

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === '--password-stdin') {
      passwordStdin = true;
      continue;
    }
    if (argument === '--email' || argument === '--full-name') {
      const value = arguments_[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`${argument} requires a value`);
      if (argument === '--email') email = value;
      else fullName = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown or forbidden argument: ${argument}`);
  }

  if (!email) throw new Error('--email is required');
  return { email, fullName, passwordStdin };
}

export function parseSeedArguments(arguments_: string[]): { passwordStdin: boolean } {
  if (arguments_.length === 0) return { passwordStdin: false };
  if (arguments_.length === 1 && arguments_[0] === '--password-stdin') {
    return { passwordStdin: true };
  }
  throw new Error(`Unknown or forbidden argument: ${arguments_.join(' ')}`);
}
