import { Types, type ClientSession } from 'mongoose';

import type { PhaseThreeAuditWriter } from '../audit/phase-three-audit.writer.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import {
  assertClassroomJoinAllowed,
  assertClassroomMutable,
} from '../classrooms/classroom.domain.js';
import type { ClassroomRepository } from '../classrooms/classroom.repository.js';
import type { EnrollmentPolicyRepository } from '../enrollment-policy/enrollment-policy.repository.js';
import type { EnrollmentPolicyValue } from '../enrollment-policy/system-setting.model.js';
import { isMongoDuplicateKeyError } from '../../shared/database/mongo-errors.js';
import { withMongoTransaction } from '../../shared/database/unit-of-work.js';
import { AppError } from '../../shared/errors/app-error.js';
import {
  buildClassroomInviteLink,
  type ClassroomCredentialCrypto,
} from './classroom-credential.crypto.js';
import type { ClassroomCredentialRepository } from './classroom-credential.repository.js';
import type {
  CreateInviteLinkInput,
  DisableCredentialInput,
  RegenerateClassCodeInput,
  RegenerateInviteLinkInput,
} from './classroom-credential.schemas.js';
import type { ClassCodeRecord } from './class-code.model.js';
import type { ClassroomInviteLinkRecord } from './classroom-invite-link.model.js';

const MAX_GENERATION_ATTEMPTS = 5;

function iso(value?: Date | null): string | null {
  return value?.toISOString() ?? null;
}

function toClassCodeMetadata(code: ClassCodeRecord) {
  return {
    id: code._id.toString(),
    status: code.status,
    maskedCode: code.maskedCode,
    generatedAt: code.generatedAt.toISOString(),
    expiresAt: iso(code.expiresAt),
    createdAt: code.createdAt.toISOString(),
    updatedAt: code.updatedAt.toISOString(),
  };
}

function toInviteMetadata(link: ClassroomInviteLinkRecord) {
  return {
    id: link._id.toString(),
    status: link.status,
    expiresAt: link.expiresAt.toISOString(),
    createdAt: link.createdAt.toISOString(),
    updatedAt: link.updatedAt.toISOString(),
  };
}

function expectedTimestamp(actual: Date, expected: string): Date {
  const parsed = new Date(expected);
  if (actual.getTime() !== parsed.getTime()) {
    throw new AppError(
      409,
      'CONCURRENT_MODIFICATION',
      'Credential was modified by another request',
    );
  }
  return parsed;
}

function policyValue(policy: { value: EnrollmentPolicyValue } | null): EnrollmentPolicyValue {
  if (!policy) {
    throw new AppError(503, 'ENROLLMENT_POLICY_UNAVAILABLE', 'Enrollment policy is unavailable');
  }
  return policy.value;
}

export class ClassroomCredentialService {
  constructor(
    private readonly classrooms: ClassroomRepository,
    private readonly credentials: ClassroomCredentialRepository,
    private readonly policies: EnrollmentPolicyRepository,
    private readonly audits: PhaseThreeAuditWriter,
    private readonly crypto: ClassroomCredentialCrypto,
    private readonly publicWebUrl: string,
    private readonly defaultInviteLinkLifetimeDays: number,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async requireOwner(
    actor: AuthenticatedUser,
    classroomId: Types.ObjectId,
    session?: ClientSession,
  ) {
    if (actor.role !== 'TEACHER') throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
    const classroom = await this.classrooms.findOwnedById(
      classroomId,
      new Types.ObjectId(actor.id),
      session,
    );
    if (!classroom) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Classroom was not found');
    return classroom;
  }

  private async getPolicy(session?: ClientSession) {
    return policyValue(await this.policies.findEnrollmentPolicy(session));
  }

  async getClassCode(actor: AuthenticatedUser, classroomId: string) {
    const id = new Types.ObjectId(classroomId);
    await this.requireOwner(actor, id);
    const code = await this.credentials.findLatestClassCode(id);
    return code ? toClassCodeMetadata(code) : null;
  }

  async regenerateClassCode(
    actor: AuthenticatedUser,
    classroomId: string,
    input: RegenerateClassCodeInput,
    requestId: string,
  ) {
    const id = new Types.ObjectId(classroomId);
    const actorId = new Types.ObjectId(actor.id);

    for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt += 1) {
      const generated = this.crypto.generateCode();
      const replacementId = new Types.ObjectId();
      try {
        return await withMongoTransaction(async (session) => {
          const classroom = await this.requireOwner(actor, id, session);
          assertClassroomMutable(classroom);
          const policy = await this.getPolicy(session);
          assertClassroomJoinAllowed(classroom, policy, 'CLASS_CODE');
          const current = await this.credentials.findActiveClassCode(id, session);
          if (!current)
            throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Active Class Code was not found');
          const expectedUpdatedAt = expectedTimestamp(
            current.updatedAt,
            input.expectedCredentialUpdatedAt,
          );
          const changedAt = this.now();
          const replaced = await this.credentials.replaceActiveClassCode(
            {
              credentialId: current._id,
              classroomId: id,
              expectedUpdatedAt,
              replacementCredentialId: replacementId,
              changedAt,
              changedBy: actorId,
            },
            session,
          );
          if (!replaced) {
            throw new AppError(
              409,
              'CONCURRENT_MODIFICATION',
              'Credential was modified by another request',
            );
          }
          const created = await this.credentials.createClassCode(
            {
              _id: replacementId,
              classroomId: id,
              codeDigest: generated.digest,
              maskedCode: generated.masked,
              generatedBy: actorId,
              generatedAt: changedAt,
            },
            session,
          );
          const audit = await this.audits.append(
            {
              actorId,
              actorRole: actor.role,
              action: 'CLASS_CODE_REGENERATED',
              resourceId: created._id.toString(),
              requestId,
              reason: input.reason,
              metadata: {
                classroomId: id.toString(),
                previousCredentialId: current._id.toString(),
                replacementCredentialId: created._id.toString(),
                maskedCode: created.maskedCode,
              },
            },
            session,
          );
          return {
            credential: toClassCodeMetadata(created),
            classCode: generated.raw,
            auditId: audit._id.toString(),
          };
        });
      } catch (error) {
        if (attempt < MAX_GENERATION_ATTEMPTS && isMongoDuplicateKeyError(error)) continue;
        throw error;
      }
    }
    throw new AppError(503, 'CREDENTIAL_GENERATION_FAILED', 'Unable to generate a Class Code');
  }

  async disableClassCode(
    actor: AuthenticatedUser,
    classroomId: string,
    input: DisableCredentialInput,
    requestId: string,
  ) {
    const id = new Types.ObjectId(classroomId);
    const actorId = new Types.ObjectId(actor.id);
    return withMongoTransaction(async (session) => {
      const classroom = await this.requireOwner(actor, id, session);
      assertClassroomMutable(classroom);
      const current = await this.credentials.findActiveClassCode(id, session);
      if (!current) {
        const latest = await this.credentials.findLatestClassCode(id, session);
        if (latest?.status === 'DISABLED') {
          return { credential: toClassCodeMetadata(latest), auditId: null, alreadyDisabled: true };
        }
        throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Active Class Code was not found');
      }
      const changedAt = this.now();
      const disabled = await this.credentials.disableActiveClassCode(
        {
          credentialId: current._id,
          classroomId: id,
          expectedUpdatedAt: expectedTimestamp(
            current.updatedAt,
            input.expectedCredentialUpdatedAt,
          ),
          changedAt,
          changedBy: actorId,
        },
        session,
      );
      if (!disabled) {
        throw new AppError(
          409,
          'CONCURRENT_MODIFICATION',
          'Credential was modified by another request',
        );
      }
      const audit = await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'CLASS_CODE_DISABLED',
          resourceId: disabled._id.toString(),
          requestId,
          reason: input.reason,
          metadata: {
            classroomId: id.toString(),
            credentialId: disabled._id.toString(),
            maskedCode: disabled.maskedCode,
          },
        },
        session,
      );
      return {
        credential: toClassCodeMetadata(disabled),
        auditId: audit._id.toString(),
        alreadyDisabled: false,
      };
    });
  }

  async listInviteLinks(actor: AuthenticatedUser, classroomId: string) {
    const id = new Types.ObjectId(classroomId);
    await this.requireOwner(actor, id);
    const now = this.now();
    const current = await this.credentials.findActiveInviteLink(id);
    if (current && current.expiresAt.getTime() <= now.getTime()) {
      await this.credentials.expireInviteLink(current._id, current.updatedAt, now);
    }
    return (await this.credentials.listInviteLinks(id)).map(toInviteMetadata);
  }

  async createInviteLink(
    actor: AuthenticatedUser,
    classroomId: string,
    input: CreateInviteLinkInput,
    requestId: string,
  ) {
    return this.issueInviteLink(actor, classroomId, input.expiresInDays, requestId, null);
  }

  async regenerateInviteLink(
    actor: AuthenticatedUser,
    classroomId: string,
    linkId: string,
    input: RegenerateInviteLinkInput,
    requestId: string,
  ) {
    return this.issueInviteLink(actor, classroomId, input.expiresInDays, requestId, {
      linkId: new Types.ObjectId(linkId),
      expectedUpdatedAt: input.expectedCredentialUpdatedAt,
      reason: input.reason,
    });
  }

  private async issueInviteLink(
    actor: AuthenticatedUser,
    classroomId: string,
    expiresInDays: number | undefined,
    requestId: string,
    replacement: { linkId: Types.ObjectId; expectedUpdatedAt: string; reason: string } | null,
  ) {
    const id = new Types.ObjectId(classroomId);
    const actorId = new Types.ObjectId(actor.id);
    for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt += 1) {
      const generated = this.crypto.generateInviteToken();
      const replacementId = new Types.ObjectId();
      try {
        return await withMongoTransaction(async (session) => {
          const classroom = await this.requireOwner(actor, id, session);
          assertClassroomMutable(classroom);
          const policy = await this.getPolicy(session);
          assertClassroomJoinAllowed(classroom, policy, 'INVITE_LINK');
          const now = this.now();
          const active = await this.credentials.findActiveInviteLink(id, session);
          if (active && active.expiresAt.getTime() <= now.getTime()) {
            await this.credentials.expireInviteLink(active._id, active.updatedAt, now, session);
          } else if (!replacement && active) {
            throw new AppError(
              409,
              'INVALID_STATE_TRANSITION',
              'An active Invite Link already exists',
            );
          }

          let previousCredentialId: string | null = null;
          if (replacement) {
            const current = await this.credentials.findInviteLinkById(
              id,
              replacement.linkId,
              session,
            );
            if (!current || current.status !== 'ACTIVE') {
              throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Active Invite Link was not found');
            }
            const replaced = await this.credentials.replaceActiveInviteLink(
              {
                credentialId: current._id,
                classroomId: id,
                expectedUpdatedAt: expectedTimestamp(
                  current.updatedAt,
                  replacement.expectedUpdatedAt,
                ),
                replacementCredentialId: replacementId,
                changedAt: now,
                changedBy: actorId,
              },
              session,
            );
            if (!replaced) {
              throw new AppError(
                409,
                'CONCURRENT_MODIFICATION',
                'Credential was modified by another request',
              );
            }
            previousCredentialId = current._id.toString();
          }

          const lifetimeDays =
            expiresInDays ??
            policy.defaultInviteLinkLifetimeDays ??
            this.defaultInviteLinkLifetimeDays;
          const expiresAt = new Date(now.getTime() + lifetimeDays * 86_400_000);
          const created = await this.credentials.createInviteLink(
            {
              _id: replacementId,
              classroomId: id,
              tokenHash: generated.hash,
              createdBy: actorId,
              expiresAt,
            },
            session,
          );
          const action = replacement ? 'INVITE_LINK_REGENERATED' : 'INVITE_LINK_CREATED';
          const audit = await this.audits.append(
            {
              actorId,
              actorRole: actor.role,
              action,
              resourceId: created._id.toString(),
              requestId,
              reason: replacement?.reason,
              metadata: {
                classroomId: id.toString(),
                credentialId: created._id.toString(),
                previousCredentialId,
                replacementCredentialId: created._id.toString(),
                expiresAt: expiresAt.toISOString(),
              },
            },
            session,
          );
          return {
            credential: toInviteMetadata(created),
            inviteLink: buildClassroomInviteLink(this.publicWebUrl, generated.raw),
            auditId: audit._id.toString(),
          };
        });
      } catch (error) {
        if (attempt < MAX_GENERATION_ATTEMPTS && isMongoDuplicateKeyError(error)) continue;
        throw error;
      }
    }
    throw new AppError(503, 'CREDENTIAL_GENERATION_FAILED', 'Unable to generate an Invite Link');
  }

  async disableInviteLink(
    actor: AuthenticatedUser,
    classroomId: string,
    linkId: string,
    input: DisableCredentialInput,
    requestId: string,
  ) {
    const id = new Types.ObjectId(classroomId);
    const credentialId = new Types.ObjectId(linkId);
    const actorId = new Types.ObjectId(actor.id);
    return withMongoTransaction(async (session) => {
      const classroom = await this.requireOwner(actor, id, session);
      assertClassroomMutable(classroom);
      const current = await this.credentials.findInviteLinkById(id, credentialId, session);
      if (!current) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Invite Link was not found');
      if (current.status === 'DISABLED') {
        return { credential: toInviteMetadata(current), auditId: null, alreadyDisabled: true };
      }
      if (current.status !== 'ACTIVE') {
        throw new AppError(409, 'INVALID_STATE_TRANSITION', 'Invite Link is not active');
      }
      const disabled = await this.credentials.disableActiveInviteLink(
        {
          credentialId,
          classroomId: id,
          expectedUpdatedAt: expectedTimestamp(
            current.updatedAt,
            input.expectedCredentialUpdatedAt,
          ),
          changedAt: this.now(),
          changedBy: actorId,
        },
        session,
      );
      if (!disabled) {
        throw new AppError(
          409,
          'CONCURRENT_MODIFICATION',
          'Credential was modified by another request',
        );
      }
      const audit = await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'INVITE_LINK_DISABLED',
          resourceId: disabled._id.toString(),
          requestId,
          reason: input.reason,
          metadata: { classroomId: id.toString(), credentialId: disabled._id.toString() },
        },
        session,
      );
      return {
        credential: toInviteMetadata(disabled),
        auditId: audit._id.toString(),
        alreadyDisabled: false,
      };
    });
  }
}
