import { Types, type HydratedDocument } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuditLogRepository } from '../src/modules/audit/audit-log.repository.js';
import type { AuthenticatedUser } from '../src/modules/auth/auth.types.js';
import type { TeacherInvitationRecord } from '../src/modules/teacher-invitations/teacher-invitation.model.js';
import type { TeacherInvitationRepository } from '../src/modules/teacher-invitations/teacher-invitation.repository.js';
import { TeacherInvitationService } from '../src/modules/teacher-invitations/teacher-invitation.service.js';
import type { UserRepository } from '../src/modules/users/user.repository.js';
import type { UserRecord } from '../src/modules/users/user.types.js';
import { getCapabilities } from '../src/shared/auth/permissions.js';
import { hashOpaqueToken } from '../src/shared/auth/opaque-token.js';

vi.mock('../src/shared/database/unit-of-work.js', () => ({
  withMongoTransaction: async <T>(operation: (session: never) => Promise<T>) =>
    operation({} as never),
}));

const now = new Date('2026-07-17T10:00:00.000Z');
const actorId = new Types.ObjectId();

const admin: AuthenticatedUser = {
  id: actorId.toString(),
  role: 'ADMIN',
  status: 'ACTIVE',
  familyId: 'family-invitation-test',
  capabilities: getCapabilities('ADMIN'),
};

function invitation(
  overrides: Partial<TeacherInvitationRecord> = {},
): HydratedDocument<TeacherInvitationRecord> {
  return {
    _id: new Types.ObjectId(),
    email: 'teacher@example.test',
    tokenHash: hashOpaqueToken('synthetic-token-value-with-forty-plus-characters'),
    role: 'TEACHER',
    status: 'PENDING',
    deliveryMethod: 'MANUAL_COPY',
    invitedBy: actorId,
    expiresAt: new Date('2026-07-24T10:00:00.000Z'),
    acceptedBy: null,
    acceptedAt: null,
    revokedAt: null,
    revokedBy: null,
    revokeReason: null,
    copyCount: 0,
    lastCopiedAt: null,
    channelHint: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as HydratedDocument<TeacherInvitationRecord>;
}

function teacher(overrides: Partial<UserRecord> = {}): HydratedDocument<UserRecord> {
  return {
    _id: new Types.ObjectId(),
    email: 'teacher@example.test',
    fullName: 'Teacher Example',
    fullNameNormalized: 'teacher example',
    passwordHash: 'hashed',
    role: 'TEACHER',
    status: 'ACTIVE',
    registrationSource: 'TEACHER_INVITATION',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as HydratedDocument<UserRecord>;
}

describe('TeacherInvitationService', () => {
  const invitations = {
    expirePendingForEmail: vi.fn(),
    findPendingByEmail: vi.fn(),
    create: vi.fn(),
    expirePastDue: vi.fn(),
    list: vi.fn(),
    expirePastDueById: vi.fn(),
    expirePastDueByTokenHash: vi.fn(),
    findById: vi.fn(),
    findByTokenHash: vi.fn(),
    recordCopy: vi.fn(),
    revoke: vi.fn(),
    accept: vi.fn(),
  };
  const users = { findByEmail: vi.fn(), create: vi.fn() };
  const audits = { append: vi.fn(), findIdempotent: vi.fn() };
  const service = new TeacherInvitationService(
    { publicWebUrl: 'https://microlearning.example', teacherInvitationTtlDays: 7 },
    invitations as unknown as TeacherInvitationRepository,
    users as unknown as UserRepository,
    audits as unknown as AuditLogRepository,
    () => now,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    invitations.expirePendingForEmail.mockResolvedValue(0);
    invitations.expirePastDue.mockResolvedValue(0);
    invitations.expirePastDueById.mockResolvedValue(undefined);
    invitations.expirePastDueByTokenHash.mockResolvedValue(undefined);
    invitations.findPendingByEmail.mockResolvedValue(null);
    users.findByEmail.mockResolvedValue(null);
    audits.append.mockResolvedValue({ _id: new Types.ObjectId(), createdAt: now });
    audits.findIdempotent.mockResolvedValue(null);
  });

  it('creates a normalized invitation and returns the raw link only in the create result', async () => {
    const created = invitation();
    invitations.create.mockResolvedValue(created);
    const result = await service.create(
      admin,
      { email: '  TEACHER@example.test  ', expiresInDays: 2 },
      'request-create',
    );

    expect(invitations.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'teacher@example.test',
        expiresAt: new Date('2026-07-19T10:00:00.000Z'),
        tokenHash: expect.stringMatching(/^[a-f\d]{64}$/u),
      }),
      expect.anything(),
    );
    expect(result.invitationLink).toMatch(
      /^https:\/\/microlearning\.example\/teacher\/invite\?token=/u,
    );
    expect(result).not.toHaveProperty('tokenHash');
    expect(audits.append).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'TEACHER_INVITATION_CREATED' }),
      expect.anything(),
    );
  });

  it('rejects an active Teacher, another existing account, pending invitation, and duplicate race', async () => {
    users.findByEmail.mockResolvedValueOnce(teacher());
    await expect(
      service.create(admin, { email: 'teacher@example.test' }, 'active'),
    ).rejects.toMatchObject({ code: 'TEACHER_ALREADY_ACTIVE' });

    users.findByEmail.mockResolvedValueOnce(teacher({ role: 'STUDENT' }));
    await expect(
      service.create(admin, { email: 'teacher@example.test' }, 'student'),
    ).rejects.toMatchObject({ code: 'DUPLICATE_RESOURCE' });

    users.findByEmail.mockResolvedValueOnce(null);
    invitations.findPendingByEmail.mockResolvedValueOnce(invitation());
    await expect(
      service.create(admin, { email: 'teacher@example.test' }, 'pending'),
    ).rejects.toMatchObject({ code: 'INVITATION_ALREADY_PENDING' });

    users.findByEmail.mockResolvedValueOnce(null);
    invitations.findPendingByEmail.mockResolvedValueOnce(null);
    invitations.create.mockRejectedValueOnce({ code: 11_000 });
    await expect(
      service.create(admin, { email: 'teacher@example.test' }, 'race'),
    ).rejects.toMatchObject({ code: 'INVITATION_ALREADY_PENDING' });
  });

  it('lists and reads safe invitation summaries with expiry reconciliation', async () => {
    invitations.list.mockResolvedValue({ items: [invitation()], totalItems: 21 });
    const result = await service.list({
      page: 2,
      limit: 20,
      email: 'Teacher',
      status: 'PENDING',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    expect(invitations.list).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'teacher', status: 'PENDING' }),
    );
    expect(result.pagination).toMatchObject({ totalPages: 2, hasPreviousPage: true });
    expect(JSON.stringify(result)).not.toContain('tokenHash');

    const current = invitation();
    invitations.findById.mockResolvedValueOnce(current);
    await expect(service.getDetail(current._id.toString())).resolves.toMatchObject({
      id: current._id.toString(),
    });
    invitations.findById.mockResolvedValueOnce(null);
    await expect(service.getDetail(current._id.toString())).rejects.toMatchObject({
      code: 'RESOURCE_NOT_FOUND',
    });
  });

  it('records a copy event once and returns the prior idempotent result on replay', async () => {
    const previousAudit = { _id: new Types.ObjectId(), createdAt: now };
    audits.findIdempotent.mockResolvedValueOnce(previousAudit);
    const replay = await service.recordCopy(
      admin,
      invitation()._id.toString(),
      { eventId: '019c5cb4-0b51-7000-8000-000000000001' },
      'copy-replay',
    );
    expect(replay.copyEventId).toBe(previousAudit._id.toString());
    expect(invitations.recordCopy).not.toHaveBeenCalled();

    audits.findIdempotent.mockResolvedValue(null);
    invitations.recordCopy.mockResolvedValue(invitation({ copyCount: 1 }));
    const first = await service.recordCopy(
      admin,
      invitation()._id.toString(),
      { eventId: '019c5cb4-0b51-7000-8000-000000000002', channelHint: 'ZALO' },
      'copy-first',
    );
    expect(first.copyEventId).toEqual(expect.any(String));
    expect(audits.append).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'TEACHER_INVITATION_COPIED',
        idempotencyKey: '019c5cb4-0b51-7000-8000-000000000002',
      }),
      expect.anything(),
    );
  });

  it('revokes pending invitations and maps invalid states', async () => {
    const pending = invitation();
    const revoked = invitation({ _id: pending._id, status: 'REVOKED', revokedAt: now });
    invitations.revoke.mockResolvedValueOnce(revoked);
    const result = await service.revoke(
      admin,
      pending._id.toString(),
      'Wrong recipient',
      'request-revoke',
    );
    expect(result.invitation.status).toBe('REVOKED');
    expect(audits.append).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'TEACHER_INVITATION_REVOKED' }),
      expect.anything(),
    );

    invitations.revoke.mockResolvedValueOnce(null);
    invitations.findById.mockResolvedValueOnce(revoked);
    await expect(
      service.revoke(admin, pending._id.toString(), 'Repeat revoke', 'repeat'),
    ).rejects.toMatchObject({ code: 'INVITATION_REVOKED' });
  });

  it('previews only pending tokens and maps all terminal states', async () => {
    const rawToken = 'synthetic-token-value-with-forty-plus-characters';
    invitations.findByTokenHash.mockResolvedValueOnce(invitation());
    await expect(service.preview(rawToken)).resolves.toMatchObject({
      email: 'teacher@example.test',
      status: 'PENDING',
    });

    invitations.findByTokenHash.mockResolvedValueOnce(null);
    await expect(service.preview(rawToken)).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });
    for (const [status, code] of [
      ['EXPIRED', 'INVITATION_EXPIRED'],
      ['REVOKED', 'INVITATION_REVOKED'],
      ['ACCEPTED', 'INVITATION_ALREADY_ACCEPTED'],
    ] as const) {
      invitations.findByTokenHash.mockResolvedValueOnce(invitation({ status }));
      await expect(service.preview(rawToken)).rejects.toMatchObject({ code });
    }
  });

  it('accepts a valid invitation and rejects password, email, and state violations', async () => {
    const rawToken = 'synthetic-token-value-with-forty-plus-characters';
    const input = {
      token: rawToken,
      fullName: 'Teacher Example',
      email: 'teacher@example.test',
      password: 'StrongPassword123!',
      confirmPassword: 'StrongPassword123!',
    };
    await expect(
      service.accept({ ...input, confirmPassword: 'DifferentPassword123!' }, 'password'),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });

    const pending = invitation();
    const createdTeacher = teacher();
    invitations.findByTokenHash.mockResolvedValueOnce(pending);
    users.create.mockResolvedValueOnce(createdTeacher);
    invitations.accept.mockResolvedValueOnce(
      invitation({ _id: pending._id, status: 'ACCEPTED', acceptedBy: createdTeacher._id }),
    );
    const result = await service.accept(input, 'accept');
    expect(result).toMatchObject({
      user: { role: 'TEACHER', status: 'ACTIVE' },
      nextAction: 'LOGIN',
    });
    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'TEACHER',
        status: 'ACTIVE',
        registrationSource: 'TEACHER_INVITATION',
        passwordHash: expect.stringMatching(/^\$argon2id\$/u),
      }),
      expect.anything(),
    );

    invitations.findByTokenHash.mockResolvedValueOnce(pending);
    await expect(
      service.accept({ ...input, email: 'wrong@example.test' }, 'mismatch'),
    ).rejects.toMatchObject({ code: 'INVITATION_EMAIL_MISMATCH' });

    invitations.findByTokenHash.mockResolvedValueOnce(invitation({ status: 'ACCEPTED' }));
    await expect(service.accept(input, 'accepted')).rejects.toMatchObject({
      code: 'INVITATION_ALREADY_ACCEPTED',
    });
  });

  it('maps an accept duplicate-key race to the final invitation state', async () => {
    const input = {
      token: 'synthetic-token-value-with-forty-plus-characters',
      fullName: 'Teacher Example',
      email: 'teacher@example.test',
      password: 'StrongPassword123!',
      confirmPassword: 'StrongPassword123!',
    };
    invitations.findByTokenHash
      .mockResolvedValueOnce(invitation())
      .mockResolvedValueOnce(invitation({ status: 'ACCEPTED' }));
    users.create.mockRejectedValueOnce({ code: 11_000 });

    await expect(service.accept(input, 'concurrent-accept')).rejects.toMatchObject({
      code: 'INVITATION_ALREADY_ACCEPTED',
    });
  });
});
