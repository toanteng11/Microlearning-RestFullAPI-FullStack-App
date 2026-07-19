import { createHash, createHmac, randomBytes } from 'node:crypto';

export const CLASS_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CLASS_CODE_LENGTH = 8;

type RandomBytesSource = (size: number) => Uint8Array;

function assertCodeLength(length: number): void {
  if (length !== CLASS_CODE_LENGTH) {
    throw new Error(`Class Code length must be exactly ${CLASS_CODE_LENGTH}`);
  }
}

export function normalizeClassCode(value: string, length = CLASS_CODE_LENGTH): string {
  assertCodeLength(length);
  const normalized = value
    .normalize('NFKC')
    .toUpperCase()
    .replace(/[\s-]+/gu, '');
  const pattern = new RegExp(`^[${CLASS_CODE_ALPHABET}]{${length}}$`, 'u');
  if (!pattern.test(normalized)) {
    throw new Error('Class Code format is invalid');
  }
  return normalized;
}

export function formatClassCode(value: string): string {
  const normalized = normalizeClassCode(value);
  return `${normalized.slice(0, 4)}-${normalized.slice(4)}`;
}

export function maskClassCode(value: string): string {
  const normalized = normalizeClassCode(value);
  return `****-${normalized.slice(-4)}`;
}

export function generateClassCode(
  length = CLASS_CODE_LENGTH,
  randomSource: RandomBytesSource = randomBytes,
): string {
  assertCodeLength(length);
  const bytes = randomSource(length);
  if (bytes.length !== length) throw new Error('Random source returned an invalid byte count');

  let normalized = '';
  for (const byte of bytes) normalized += CLASS_CODE_ALPHABET[byte & 31];
  return formatClassCode(normalized);
}

export function digestClassCode(value: string, pepper: string, length = CLASS_CODE_LENGTH): string {
  const normalized = normalizeClassCode(value, length);
  return createHmac('sha256', pepper).update(normalized, 'utf8').digest('hex');
}

export function generateClassroomInviteToken(
  byteLength = 32,
  randomSource: RandomBytesSource = randomBytes,
): string {
  if (!Number.isInteger(byteLength) || byteLength < 32 || byteLength > 64) {
    throw new Error('Classroom Invite Token byte length must be between 32 and 64');
  }
  const bytes = randomSource(byteLength);
  if (bytes.length !== byteLength) throw new Error('Random source returned an invalid byte count');
  return Buffer.from(bytes).toString('base64url');
}

export function hashClassroomInviteToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function buildClassroomInviteLink(publicWebUrl: string, token: string): string {
  if (token.length === 0) throw new Error('Classroom Invite Token is required');
  const origin = new URL(publicWebUrl);
  if (!['http:', 'https:'].includes(origin.protocol)) {
    throw new Error('Public Web URL must use http:// or https://');
  }
  return `${origin.origin}/join/invite#token=${encodeURIComponent(token)}`;
}

export interface GeneratedClassCode {
  raw: string;
  digest: string;
  masked: string;
}

export interface GeneratedInviteToken {
  raw: string;
  hash: string;
}

export class ClassroomCredentialCrypto {
  constructor(
    private readonly config: {
      codePepper: string;
      codeLength: number;
      inviteTokenBytes: number;
      randomSource?: RandomBytesSource;
    },
  ) {
    assertCodeLength(config.codeLength);
  }

  generateCode(): GeneratedClassCode {
    const raw = generateClassCode(this.config.codeLength, this.config.randomSource);
    return {
      raw,
      digest: digestClassCode(raw, this.config.codePepper, this.config.codeLength),
      masked: maskClassCode(raw),
    };
  }

  digestCode(value: string): string {
    return digestClassCode(value, this.config.codePepper, this.config.codeLength);
  }

  generateInviteToken(): GeneratedInviteToken {
    const raw = generateClassroomInviteToken(
      this.config.inviteTokenBytes,
      this.config.randomSource,
    );
    return { raw, hash: hashClassroomInviteToken(raw) };
  }

  hashInviteToken(token: string): string {
    return hashClassroomInviteToken(token);
  }
}
