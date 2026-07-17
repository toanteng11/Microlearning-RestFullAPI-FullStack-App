import { Types, type HydratedDocument } from 'mongoose';

import type { AppConfig } from '../../shared/config/environment.js';
import { isMongoDuplicateKeyError } from '../../shared/database/mongo-errors.js';
import { withMongoTransaction } from '../../shared/database/unit-of-work.js';
import { AppError } from '../../shared/errors/app-error.js';
import {
  normalizeEmail,
  normalizeFullName,
  normalizeFullNameForSearch,
} from '../../shared/identity/normalization.js';
import { generateOpaqueToken, hashOpaqueToken } from '../../shared/auth/opaque-token.js';
import { hashPassword } from '../../shared/auth/password.js';
import type { AuditLogRepository } from '../audit/audit-log.repository.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { UserRepository } from '../users/user.repository.js';
import { toUserSummary } from '../users/user.types.js';
import type { TeacherInvitationRecord } from './teacher-invitation.model.js';
import type { TeacherInvitationRepository } from './teacher-invitation.repository.js';
import type {
  AcceptTeacherInvitationInput,
  CreateTeacherInvitationInput,
  RecordCopyEventInput,
  TeacherInvitationListInput,
} from './teacher-invitation.schemas.js';

type InvitationDocument = HydratedDocument<TeacherInvitationRecord>;

function toSummary(invitation: InvitationDocument) {
  return {
    id: invitation._id.toString(),
    email: invitation.email,
    status: invitation.status,
    deliveryMethod: invitation.deliveryMethod,
    invitedBy: invitation.invitedBy.toString(),
    expiresAt: invitation.expiresAt.toISOString(),
    acceptedAt: invitation.acceptedAt?.toISOString() ?? null,
    revokedAt: invitation.revokedAt?.toISOString() ?? null,
    copyCount: invitation.copyCount,
    lastCopiedAt: invitation.lastCopiedAt?.toISOString() ?? null,
    channelHint: invitation.channelHint ?? null,
    createdAt: invitation.createdAt.toISOString(),
    updatedAt: invitation.updatedAt.toISOString(),
  };
}

function stateError(invitation: InvitationDocument): AppError {
  switch (invitation.status) {
    case 'EXPIRED':
      return new AppError(409, 'INVITATION_EXPIRED', 'Teacher invitation has expired');
    case 'REVOKED':
      return new AppError(409, 'INVITATION_REVOKED', 'Teacher invitation was revoked');
    case 'ACCEPTED':
      return new AppError(409, 'INVITATION_ALREADY_ACCEPTED', 'Teacher invitation was accepted');
    case 'PENDING':
      return new AppError(409, 'INVALID_STATE_TRANSITION', 'Teacher invitation cannot be changed');
  }
}

export class TeacherInvitationService {
  constructor(
    private readonly config: Pick<AppConfig, 'publicWebUrl' | 'teacherInvitationTtlDays'>,
    private readonly invitations: TeacherInvitationRepository,
    private readonly users: UserRepository,
    private readonly audits: AuditLogRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async create(actor: AuthenticatedUser, input: CreateTeacherInvitationInput, requestId: string) {
    const email = normalizeEmail(input.email);
    const rawToken = generateOpaqueToken();
    const tokenHash = hashOpaqueToken(rawToken);
    const createdAt = this.now();
    const expiresInDays = input.expiresInDays ?? this.config.teacherInvitationTtlDays;
    const expiresAt = new Date(createdAt.getTime() + expiresInDays * 86_400_000);

    try {
      const invitation = await withMongoTransaction(async (session) => {
        await this.invitations.expirePendingForEmail(email, createdAt, session);
        const existingUser = await this.users.findByEmail(email, session);
        if (existingUser) {
          if (existingUser.role === 'TEACHER' && existingUser.status === 'ACTIVE') {
            throw new AppError(409, 'TEACHER_ALREADY_ACTIVE', 'Teacher account is already active');
          }
          throw new AppError(409, 'DUPLICATE_RESOURCE', 'An account already uses this email');
        }
        if (await this.invitations.findPendingByEmail(email, session)) {
          throw new AppError(
            409,
            'INVITATION_ALREADY_PENDING',
            'A pending Teacher invitation already exists',
          );
        }
        const created = await this.invitations.create(
          {
            email,
            tokenHash,
            invitedBy: new Types.ObjectId(actor.id),
            expiresAt,
          },
          session,
        );
        await this.audits.append(
          {
            actorId: new Types.ObjectId(actor.id),
            actorRole: actor.role,
            action: 'TEACHER_INVITATION_CREATED',
            resourceType: 'TEACHER_INVITATION',
            resourceId: created._id.toString(),
            requestId,
            metadata: { email, expiresAt: expiresAt.toISOString() },
          },
          session,
        );
        return created;
      });
      const invitationUrl = new URL('/teacher/invite', this.config.publicWebUrl);
      invitationUrl.searchParams.set('token', rawToken);
      return { ...toSummary(invitation), invitationLink: invitationUrl.toString() };
    } catch (error) {
      if (isMongoDuplicateKeyError(error)) {
        throw new AppError(
          409,
          'INVITATION_ALREADY_PENDING',
          'A pending Teacher invitation already exists',
        );
      }
      throw error;
    }
  }

  async list(input: TeacherInvitationListInput) {
    await this.invitations.expirePastDue(this.now());
    const query = {
      ...input,
      email: input.email ? input.email.normalize('NFKC').trim().toLowerCase() : undefined,
    };
    const { items, totalItems } = await this.invitations.list(query);
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / input.limit);
    return {
      data: items.map(toSummary),
      pagination: {
        page: input.page,
        limit: input.limit,
        totalItems,
        totalPages,
        hasNextPage: input.page < totalPages,
        hasPreviousPage: input.page > 1 && totalPages > 0,
      },
      filters: { email: input.email ?? null, status: input.status ?? null },
    };
  }

  async getDetail(invitationId: string) {
    await this.invitations.expirePastDueById(invitationId, this.now());
    const invitation = await this.invitations.findById(invitationId);
    if (!invitation) {
      throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Teacher invitation was not found');
    }
    return toSummary(invitation);
  }

  async recordCopy(
    actor: AuthenticatedUser,
    invitationId: string,
    input: RecordCopyEventInput,
    requestId: string,
  ) {
    const actorId = new Types.ObjectId(actor.id);
    const existing = await this.audits.findIdempotent(
      actorId,
      'TEACHER_INVITATION_COPIED',
      input.eventId,
    );
    if (existing) {
      return { copyEventId: existing._id.toString(), recordedAt: existing.createdAt.toISOString() };
    }
    const copiedAt = this.now();
    await this.invitations.expirePastDueById(invitationId, copiedAt);
    try {
      return await withMongoTransaction(async (session) => {
        const duplicate = await this.audits.findIdempotent(
          actorId,
          'TEACHER_INVITATION_COPIED',
          input.eventId,
          session,
        );
        if (duplicate) {
          return {
            copyEventId: duplicate._id.toString(),
            recordedAt: duplicate.createdAt.toISOString(),
          };
        }
        const invitation = await this.invitations.recordCopy(
          invitationId,
          copiedAt,
          input.channelHint,
          session,
        );
        if (!invitation) {
          const current = await this.invitations.findById(invitationId, session);
          if (!current) {
            throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Teacher invitation was not found');
          }
          throw stateError(current);
        }
        const audit = await this.audits.append(
          {
            actorId,
            actorRole: actor.role,
            action: 'TEACHER_INVITATION_COPIED',
            resourceType: 'TEACHER_INVITATION',
            resourceId: invitationId,
            requestId,
            idempotencyKey: input.eventId,
            metadata: input.channelHint ? { channelHint: input.channelHint } : null,
          },
          session,
        );
        return { copyEventId: audit._id.toString(), recordedAt: audit.createdAt.toISOString() };
      });
    } catch (error) {
      if (isMongoDuplicateKeyError(error)) {
        const duplicate = await this.audits.findIdempotent(
          actorId,
          'TEACHER_INVITATION_COPIED',
          input.eventId,
        );
        if (duplicate) {
          return {
            copyEventId: duplicate._id.toString(),
            recordedAt: duplicate.createdAt.toISOString(),
          };
        }
      }
      throw error;
    }
  }

  async revoke(actor: AuthenticatedUser, invitationId: string, reason: string, requestId: string) {
    const revokedAt = this.now();
    await this.invitations.expirePastDueById(invitationId, revokedAt);
    return withMongoTransaction(async (session) => {
      const actorId = new Types.ObjectId(actor.id);
      const invitation = await this.invitations.revoke(
        invitationId,
        actorId,
        reason,
        revokedAt,
        session,
      );
      if (!invitation) {
        const current = await this.invitations.findById(invitationId, session);
        if (!current) {
          throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Teacher invitation was not found');
        }
        throw stateError(current);
      }
      const audit = await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'TEACHER_INVITATION_REVOKED',
          resourceType: 'TEACHER_INVITATION',
          resourceId: invitationId,
          requestId,
          reason,
          oldValue: { status: 'PENDING' },
          newValue: { status: 'REVOKED' },
        },
        session,
      );
      return { invitation: toSummary(invitation), auditId: audit._id.toString() };
    });
  }

  async preview(rawToken: string) {
    const tokenHash = hashOpaqueToken(rawToken);
    await this.invitations.expirePastDueByTokenHash(tokenHash, this.now());
    const invitation = await this.invitations.findByTokenHash(tokenHash);
    if (!invitation) {
      throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Teacher invitation was not found');
    }
    if (invitation.status !== 'PENDING') throw stateError(invitation);
    return {
      email: invitation.email,
      expiresAt: invitation.expiresAt.toISOString(),
      status: invitation.status,
      deliveryMethod: invitation.deliveryMethod,
    };
  }

  async accept(input: AcceptTeacherInvitationInput, requestId: string) {
    if (input.password !== input.confirmPassword) {
      throw new AppError(422, 'VALIDATION_ERROR', 'Password confirmation does not match', [
        {
          field: 'confirmPassword',
          code: 'PASSWORD_MISMATCH',
          message: 'Password confirmation does not match',
        },
      ]);
    }
    const email = normalizeEmail(input.email);
    const fullName = normalizeFullName(input.fullName);
    const passwordHash = await hashPassword(input.password);
    const tokenHash = hashOpaqueToken(input.token);
    const acceptedAt = this.now();
    await this.invitations.expirePastDueByTokenHash(tokenHash, acceptedAt);

    try {
      return await withMongoTransaction(async (session) => {
        const invitation = await this.invitations.findByTokenHash(tokenHash, session);
        if (!invitation) {
          throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Teacher invitation was not found');
        }
        if (invitation.status !== 'PENDING') throw stateError(invitation);
        if (invitation.email !== email) {
          throw new AppError(
            422,
            'INVITATION_EMAIL_MISMATCH',
            'Activation email does not match the invitation',
          );
        }
        if (await this.users.findByEmail(email, session)) {
          throw new AppError(409, 'DUPLICATE_RESOURCE', 'An account already uses this email');
        }
        const teacher = await this.users.create(
          {
            email,
            fullName,
            fullNameNormalized: normalizeFullNameForSearch(fullName),
            passwordHash,
            role: 'TEACHER',
            status: 'ACTIVE',
            registrationSource: 'TEACHER_INVITATION',
            invitedBy: invitation.invitedBy,
            activatedAt: acceptedAt,
          },
          session,
        );
        const accepted = await this.invitations.accept(
          invitation._id,
          teacher._id,
          acceptedAt,
          session,
        );
        if (!accepted) {
          throw new AppError(
            409,
            'CONCURRENT_MODIFICATION',
            'Teacher invitation was changed by another request',
          );
        }
        await this.audits.append(
          {
            actorId: teacher._id,
            actorRole: 'TEACHER',
            action: 'TEACHER_INVITATION_ACCEPTED',
            resourceType: 'TEACHER_INVITATION',
            resourceId: invitation._id.toString(),
            requestId,
            metadata: { teacherId: teacher._id.toString(), acceptedAt: acceptedAt.toISOString() },
          },
          session,
        );
        return { user: toUserSummary(teacher), nextAction: 'LOGIN' as const };
      });
    } catch (error) {
      if (isMongoDuplicateKeyError(error)) {
        const current = await this.invitations.findByTokenHash(tokenHash);
        if (current && current.status !== 'PENDING') throw stateError(current);
        throw new AppError(409, 'DUPLICATE_RESOURCE', 'An account already uses this email');
      }
      throw error;
    }
  }
}
