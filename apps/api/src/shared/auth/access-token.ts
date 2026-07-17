import { randomUUID } from 'node:crypto';

import { jwtVerify, SignJWT } from 'jose';

export interface AccessTokenPayload {
  userId: string;
  familyId: string;
  tokenId: string;
}

interface AccessTokenOptions {
  secret: string;
  issuer: string;
  audience: string;
  ttlSeconds: number;
  now?: () => Date;
  createTokenId?: () => string;
}

export class AccessTokenService {
  private readonly secret: Uint8Array;
  private readonly now: () => Date;
  private readonly createTokenId: () => string;

  constructor(private readonly options: AccessTokenOptions) {
    this.secret = new TextEncoder().encode(options.secret);
    this.now = options.now ?? (() => new Date());
    this.createTokenId = options.createTokenId ?? randomUUID;
  }

  async sign(userId: string, familyId: string): Promise<string> {
    const issuedAt = Math.floor(this.now().getTime() / 1000);

    return new SignJWT({ familyId })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(userId)
      .setJti(this.createTokenId())
      .setIssuer(this.options.issuer)
      .setAudience(this.options.audience)
      .setIssuedAt(issuedAt)
      .setExpirationTime(issuedAt + this.options.ttlSeconds)
      .sign(this.secret);
  }

  async verify(token: string): Promise<AccessTokenPayload> {
    const { payload } = await jwtVerify(token, this.secret, {
      issuer: this.options.issuer,
      audience: this.options.audience,
      algorithms: ['HS256'],
      currentDate: this.now(),
    });

    if (!payload.sub || !payload.jti || typeof payload.familyId !== 'string') {
      throw new Error('Access token is missing required claims');
    }

    return {
      userId: payload.sub,
      familyId: payload.familyId,
      tokenId: payload.jti,
    };
  }
}
