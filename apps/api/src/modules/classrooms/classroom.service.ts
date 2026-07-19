import { Types, type ClientSession } from 'mongoose';

import { ClassroomCredentialCrypto } from '../classroom-credentials/classroom-credential.crypto.js';
import type { ClassroomCredentialRepository } from '../classroom-credentials/classroom-credential.repository.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { PhaseThreeAuditWriter } from '../audit/phase-three-audit.writer.js';
import type { EnrollmentPolicyRepository } from '../enrollment-policy/enrollment-policy.repository.js';
import type { EnrollmentPolicyValue } from '../enrollment-policy/system-setting.model.js';
import type { EnrollmentRepository } from '../enrollments/enrollment.repository.js';
import type { UserRepository } from '../users/user.repository.js';
import { isMongoDuplicateKeyError } from '../../shared/database/mongo-errors.js';
import { withMongoTransaction } from '../../shared/database/unit-of-work.js';
import { AppError } from '../../shared/errors/app-error.js';
import { assertClassroomMutable, getEffectiveClassroomSettings } from './classroom.domain.js';
import {
  toClassroomDetail,
  toClassroomStateAuditValue,
  toClassroomSummary,
  toEnrollmentSummary,
} from './classroom.dto.js';
import type { ClassroomRecord } from './classroom.model.js';
import type { ClassroomRepository } from './classroom.repository.js';
import type {
  ArchiveClassroomInput,
  ClassroomListQueryInput,
  CreateClassroomInput,
  StudentClassroomListQueryInput,
  UpdateClassroomInput,
  UpdateClassroomSettingsInput,
} from './classroom.schemas.js';

const MAX_CODE_GENERATION_ATTEMPTS = 5;

function pagination(page: number, limit: number, totalItems: number) {
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && totalPages > 0,
  };
}

function assertTeacher(actor: AuthenticatedUser): void {
  if (actor.role !== 'TEACHER') {
    throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
  }
}

function asObjectId(value: string): Types.ObjectId {
  return new Types.ObjectId(value);
}

function policyValueOrThrow(
  policy: { value: EnrollmentPolicyValue } | null,
): EnrollmentPolicyValue {
  if (!policy) {
    throw new AppError(503, 'ENROLLMENT_POLICY_UNAVAILABLE', 'Enrollment policy is unavailable');
  }
  return policy.value;
}

function assertExpectedUpdatedAt(actual: Date, expected: string): Date {
  const parsed = new Date(expected);
  if (actual.getTime() !== parsed.getTime()) {
    throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Classroom was modified by another request');
  }
  return parsed;
}

export class ClassroomService {
  constructor(
    private readonly classrooms: ClassroomRepository,
    private readonly enrollments: EnrollmentRepository,
    private readonly credentials: ClassroomCredentialRepository,
    private readonly policies: EnrollmentPolicyRepository,
    private readonly users: UserRepository,
    private readonly audits: PhaseThreeAuditWriter,
    private readonly crypto: ClassroomCredentialCrypto,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async getPolicy(session?: ClientSession): Promise<EnrollmentPolicyValue> {
    return policyValueOrThrow(await this.policies.findEnrollmentPolicy(session));
  }

  private async requireOwner(
    actor: AuthenticatedUser,
    classroomId: Types.ObjectId,
    session?: ClientSession,
  ) {
    assertTeacher(actor);
    const classroom = await this.classrooms.findOwnedById(
      classroomId,
      asObjectId(actor.id),
      session,
    );
    if (!classroom) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Classroom was not found');
    return classroom;
  }

  async create(actor: AuthenticatedUser, input: CreateClassroomInput, requestId: string) {
    assertTeacher(actor);
    const actorId = asObjectId(actor.id);

    for (let attempt = 1; attempt <= MAX_CODE_GENERATION_ATTEMPTS; attempt += 1) {
      const generatedCode = this.crypto.generateCode();
      try {
        return await withMongoTransaction(async (session) => {
          const policy = await this.getPolicy(session);
          const classroom = await this.classrooms.create(
            {
              ...input,
              ownerTeacherId: actorId,
              status: 'ACTIVE',
              enrollmentStatus: 'OPEN',
              allowClassCodeJoin: true,
              allowInviteLinkJoin: true,
            },
            session,
          );

          let classCode: string | null = null;
          if (policy.allowClassCodeJoin) {
            const createdAt = this.now();
            await this.credentials.createClassCode(
              {
                classroomId: classroom._id,
                codeDigest: generatedCode.digest,
                maskedCode: generatedCode.masked,
                generatedBy: actorId,
                generatedAt: createdAt,
              },
              session,
            );
            classCode = generatedCode.raw;
          }

          const audit = await this.audits.append(
            {
              actorId,
              actorRole: actor.role,
              action: 'CLASSROOM_CREATED',
              resourceId: classroom._id.toString(),
              requestId,
              newValue: toClassroomStateAuditValue(classroom),
            },
            session,
          );
          const owner = await this.users.findById(actor.id, session);
          if (!owner) throw new Error('Authenticated Classroom owner no longer exists');
          return {
            classroom: toClassroomDetail(actor, classroom, owner, policy),
            classCode,
            auditId: audit._id.toString(),
          };
        });
      } catch (error) {
        if (attempt < MAX_CODE_GENERATION_ATTEMPTS && isMongoDuplicateKeyError(error)) continue;
        throw error;
      }
    }

    throw new AppError(503, 'CREDENTIAL_GENERATION_FAILED', 'Unable to generate a Class Code');
  }

  async list(
    actor: AuthenticatedUser,
    input: ClassroomListQueryInput | StudentClassroomListQueryInput,
  ) {
    if (actor.role === 'TEACHER') {
      const query = input as ClassroomListQueryInput;
      const [result, owner] = await Promise.all([
        this.classrooms.listOwned(asObjectId(actor.id), query),
        this.users.findById(actor.id),
      ]);
      if (!owner) throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required');
      return {
        data: result.items.map((classroom) => toClassroomSummary(classroom, owner)),
        pagination: pagination(result.page, result.limit, result.totalItems),
        filters: {
          keyword: query.keyword ?? null,
          status: query.status ?? null,
          enrollmentStatus: query.enrollmentStatus ?? null,
        },
      };
    }

    if (actor.role === 'STUDENT') {
      const query = input as StudentClassroomListQueryInput;
      const result = await this.enrollments.listStudentClassrooms(asObjectId(actor.id), query);
      return {
        data: result.items.map((row) => {
          const classroom = row.classroom as unknown as ClassroomRecord;
          const enrollment = row.enrollment;
          return {
            ...toClassroomSummary(classroom, row.owner),
            membership: toEnrollmentSummary(enrollment),
          };
        }),
        pagination: pagination(result.page, result.limit, result.totalItems),
        filters: { keyword: query.keyword ?? null, status: query.status ?? null },
      };
    }

    throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
  }

  async getDetail(actor: AuthenticatedUser, classroomId: string) {
    const id = asObjectId(classroomId);
    const classroom = await this.classrooms.findById(id);
    if (!classroom) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Classroom was not found');

    let membership = null;
    if (actor.role === 'TEACHER') {
      if (classroom.ownerTeacherId.toString() !== actor.id) {
        throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Classroom was not found');
      }
    } else if (actor.role === 'STUDENT') {
      membership = await this.enrollments.findActiveMembership(id, asObjectId(actor.id));
      if (!membership) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Classroom was not found');
    } else {
      throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
    }

    const [owner, policy] = await Promise.all([
      this.users.findById(classroom.ownerTeacherId.toString()),
      this.getPolicy(),
    ]);
    if (!owner) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Classroom owner was not found');
    return toClassroomDetail(actor, classroom, owner, policy, membership);
  }

  async update(
    actor: AuthenticatedUser,
    classroomId: string,
    input: UpdateClassroomInput,
    requestId: string,
  ) {
    const id = asObjectId(classroomId);
    return withMongoTransaction(async (session) => {
      const current = await this.requireOwner(actor, id, session);
      assertClassroomMutable(current);
      const { expectedUpdatedAt: expectedTimestamp, ...patch } = input;
      const expectedUpdatedAt = assertExpectedUpdatedAt(current.updatedAt, expectedTimestamp);
      const updated = await this.classrooms.updateOwnedCas(
        { classroomId: id, ownerTeacherId: asObjectId(actor.id), expectedUpdatedAt, patch },
        session,
      );
      if (!updated) {
        throw new AppError(
          409,
          'CONCURRENT_MODIFICATION',
          'Classroom was modified by another request',
        );
      }
      const audit = await this.audits.append(
        {
          actorId: asObjectId(actor.id),
          actorRole: actor.role,
          action: 'CLASSROOM_UPDATED',
          resourceId: id.toString(),
          requestId,
          oldValue: toClassroomStateAuditValue(current),
          newValue: toClassroomStateAuditValue(updated),
        },
        session,
      );
      const [owner, policy] = await Promise.all([
        this.users.findById(actor.id, session),
        this.getPolicy(session),
      ]);
      if (!owner) throw new Error('Authenticated Classroom owner no longer exists');
      return {
        classroom: toClassroomDetail(actor, updated, owner, policy),
        auditId: audit._id.toString(),
      };
    });
  }

  async updateSettings(
    actor: AuthenticatedUser,
    classroomId: string,
    input: UpdateClassroomSettingsInput,
    requestId: string,
  ) {
    const id = asObjectId(classroomId);
    return withMongoTransaction(async (session) => {
      const current = await this.requireOwner(actor, id, session);
      assertClassroomMutable(current);
      const { expectedUpdatedAt: expectedTimestamp, ...patch } = input;
      const expectedUpdatedAt = assertExpectedUpdatedAt(current.updatedAt, expectedTimestamp);
      const updated = await this.classrooms.updateOwnedCas(
        { classroomId: id, ownerTeacherId: asObjectId(actor.id), expectedUpdatedAt, patch },
        session,
      );
      if (!updated) {
        throw new AppError(
          409,
          'CONCURRENT_MODIFICATION',
          'Classroom was modified by another request',
        );
      }
      const policy = await this.getPolicy(session);
      const audit = await this.audits.append(
        {
          actorId: asObjectId(actor.id),
          actorRole: actor.role,
          action: 'CLASSROOM_UPDATED',
          resourceId: id.toString(),
          requestId,
          oldValue: toClassroomStateAuditValue(current),
          newValue: toClassroomStateAuditValue(updated),
        },
        session,
      );
      return {
        configuredSettings: {
          enrollmentStatus: updated.enrollmentStatus,
          allowClassCodeJoin: updated.allowClassCodeJoin,
          allowInviteLinkJoin: updated.allowInviteLinkJoin,
        },
        effectiveSettings: getEffectiveClassroomSettings(updated, policy),
        updatedAt: updated.updatedAt.toISOString(),
        auditId: audit._id.toString(),
      };
    });
  }

  async archive(
    actor: AuthenticatedUser,
    classroomId: string,
    input: ArchiveClassroomInput,
    requestId: string,
  ): Promise<void> {
    const id = asObjectId(classroomId);
    await withMongoTransaction(async (session) => {
      const current = await this.requireOwner(actor, id, session);
      if (current.status !== 'ACTIVE') {
        throw new AppError(
          409,
          'INVALID_STATE_TRANSITION',
          'Only an active Classroom can be archived',
        );
      }
      const expectedUpdatedAt = assertExpectedUpdatedAt(current.updatedAt, input.expectedUpdatedAt);
      const archived = await this.classrooms.archiveOwnedCas(
        {
          classroomId: id,
          ownerTeacherId: asObjectId(actor.id),
          expectedUpdatedAt,
          archivedAt: this.now(),
          archivedBy: asObjectId(actor.id),
        },
        session,
      );
      if (!archived) {
        throw new AppError(
          409,
          'CONCURRENT_MODIFICATION',
          'Classroom was modified by another request',
        );
      }
      await this.audits.append(
        {
          actorId: asObjectId(actor.id),
          actorRole: actor.role,
          action: 'CLASSROOM_ARCHIVED',
          resourceId: id.toString(),
          requestId,
          reason: input.reason,
          oldValue: { status: current.status, updatedAt: current.updatedAt.toISOString() },
          newValue: { status: archived.status, updatedAt: archived.updatedAt.toISOString() },
          metadata: { classroomId: id.toString() },
        },
        session,
      );
      return true;
    });
  }

  async listGovernance(input: ClassroomListQueryInput & { ownerTeacherId?: string }) {
    const query = {
      ...input,
      ownerTeacherId: input.ownerTeacherId ? asObjectId(input.ownerTeacherId) : undefined,
    };
    const result = await this.classrooms.listGovernance(query);
    return {
      data: result.items.map((row) => ({
        ...toClassroomSummary(row.classroom, row.owner),
        memberCount: row.memberCount,
      })),
      pagination: pagination(input.page, input.limit, result.totalItems),
      filters: {
        keyword: input.keyword ?? null,
        status: input.status ?? null,
        enrollmentStatus: input.enrollmentStatus ?? null,
        ownerTeacherId: input.ownerTeacherId ?? null,
      },
    };
  }

  async getGovernanceDetail(classroomId: string) {
    const row = await this.classrooms.findGovernanceById(asObjectId(classroomId));
    if (!row) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Classroom was not found');
    return {
      ...toClassroomSummary(row.classroom, row.owner),
      configuredSettings: {
        enrollmentStatus: row.classroom.enrollmentStatus,
        allowClassCodeJoin: row.classroom.allowClassCodeJoin,
        allowInviteLinkJoin: row.classroom.allowInviteLinkJoin,
      },
      memberCount: row.memberCount,
    };
  }
}
