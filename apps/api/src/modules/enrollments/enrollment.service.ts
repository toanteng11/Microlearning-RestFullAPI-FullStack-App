import { Types, type ClientSession } from 'mongoose';

import type { PhaseThreeAuditWriter } from '../audit/phase-three-audit.writer.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { ClassroomCredentialCrypto } from '../classroom-credentials/classroom-credential.crypto.js';
import type { ClassroomCredentialRepository } from '../classroom-credentials/classroom-credential.repository.js';
import {
  assertClassroomJoinAllowed,
  assertClassroomMutable,
  type ClassroomJoinMethod,
} from '../classrooms/classroom.domain.js';
import { toClassroomSummary, toEnrollmentSummary } from '../classrooms/classroom.dto.js';
import type { ClassroomRecord } from '../classrooms/classroom.model.js';
import type { ClassroomRepository } from '../classrooms/classroom.repository.js';
import type { EnrollmentPolicyRepository } from '../enrollment-policy/enrollment-policy.repository.js';
import type { EnrollmentPolicyValue } from '../enrollment-policy/system-setting.model.js';
import type { UserRepository } from '../users/user.repository.js';
import { isMongoDuplicateKeyError } from '../../shared/database/mongo-errors.js';
import { withMongoTransaction } from '../../shared/database/unit-of-work.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { RosterListQueryInput, RemoveStudentInput } from './enrollment.schemas.js';
import type { EnrollmentRecord } from './enrollment.model.js';
import type { EnrollmentRepository } from './enrollment.repository.js';

interface CredentialResolution {
  classroomId: Types.ObjectId;
  credentialId: Types.ObjectId;
}

function policyValue(policy: { value: EnrollmentPolicyValue } | null): EnrollmentPolicyValue {
  if (!policy) {
    throw new AppError(503, 'ENROLLMENT_POLICY_UNAVAILABLE', 'Enrollment policy is unavailable');
  }
  return policy.value;
}

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

function ensureStudent(actor: AuthenticatedUser): void {
  if (actor.role !== 'STUDENT') throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
}

function ensureTeacher(actor: AuthenticatedUser): void {
  if (actor.role !== 'TEACHER') throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
}

export class EnrollmentService {
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

  private async resolveCredential(
    method: ClassroomJoinMethod,
    credential: string,
    session?: ClientSession,
  ): Promise<CredentialResolution> {
    const now = this.now();
    if (method === 'CLASS_CODE') {
      const code = await this.credentials.findActiveClassCodeByDigest(
        this.crypto.digestCode(credential),
        session,
      );
      if (!code || (code.expiresAt && code.expiresAt.getTime() <= now.getTime())) {
        throw new AppError(422, 'INVALID_CLASS_CODE', 'Class Code is invalid');
      }
      return { classroomId: code.classroomId, credentialId: code._id };
    }

    const link = await this.credentials.findActiveInviteLinkByHash(
      this.crypto.hashInviteToken(credential),
      session,
    );
    if (!link || link.expiresAt.getTime() <= now.getTime()) {
      if (link) await this.credentials.expireInviteLink(link._id, link.updatedAt, now, session);
      throw new AppError(422, 'INVITE_LINK_INVALID', 'Invite Link is invalid');
    }
    return { classroomId: link.classroomId, credentialId: link._id };
  }

  async previewInvite(token: string) {
    const policy = policyValue(await this.policies.findEnrollmentPolicy());
    if (!policy.allowInviteLinkJoin) {
      throw new AppError(422, 'JOIN_METHOD_DISABLED', 'This join method is disabled');
    }
    const resolved = await this.resolveCredential('INVITE_LINK', token);
    const classroom = await this.classrooms.findById(resolved.classroomId);
    if (!classroom) throw new AppError(422, 'INVITE_LINK_INVALID', 'Invite Link is invalid');
    assertClassroomJoinAllowed(classroom, policy, 'INVITE_LINK');
    const teacher = await this.users.findById(classroom.ownerTeacherId.toString());
    if (!teacher || teacher.status !== 'ACTIVE' || teacher.role !== 'TEACHER') {
      throw new AppError(422, 'INVITE_LINK_INVALID', 'Invite Link is invalid');
    }
    const link = await this.credentials.findActiveInviteLinkByHash(
      this.crypto.hashInviteToken(token),
    );
    if (!link) throw new AppError(422, 'INVITE_LINK_INVALID', 'Invite Link is invalid');
    return {
      classroomName: classroom.name,
      subject: classroom.subject ?? null,
      teacher: { fullName: teacher.fullName },
      joinable: true,
      expiresAt: link.expiresAt.toISOString(),
    };
  }

  async joinByCode(actor: AuthenticatedUser, code: string, requestId: string) {
    return this.join(actor, 'CLASS_CODE', code, requestId);
  }

  async joinByToken(actor: AuthenticatedUser, token: string, requestId: string) {
    return this.join(actor, 'INVITE_LINK', token, requestId);
  }

  private async join(
    actor: AuthenticatedUser,
    method: ClassroomJoinMethod,
    credential: string,
    requestId: string,
  ) {
    ensureStudent(actor);
    const studentId = new Types.ObjectId(actor.id);

    try {
      return await withMongoTransaction(async (session) => {
        const policy = policyValue(await this.policies.findEnrollmentPolicy(session));
        const globalEnabled =
          method === 'CLASS_CODE' ? policy.allowClassCodeJoin : policy.allowInviteLinkJoin;
        if (!globalEnabled) {
          throw new AppError(422, 'JOIN_METHOD_DISABLED', 'This join method is disabled');
        }
        const resolved = await this.resolveCredential(method, credential, session);
        const classroom = await this.classrooms.findById(resolved.classroomId, session);
        if (!classroom) {
          throw new AppError(
            422,
            method === 'CLASS_CODE' ? 'INVALID_CLASS_CODE' : 'INVITE_LINK_INVALID',
            method === 'CLASS_CODE' ? 'Class Code is invalid' : 'Invite Link is invalid',
          );
        }
        assertClassroomJoinAllowed(classroom, policy, method);

        const existing = await this.enrollments.findMembership(classroom._id, studentId, session);
        if (existing) {
          if (existing.status !== 'ACTIVE') {
            throw new AppError(409, 'REJOIN_NOT_ALLOWED', 'This membership cannot rejoin');
          }
          return this.buildJoinResult(classroom, existing, true, session);
        }

        const joinedAt = this.now();
        const enrollment = await this.enrollments.create(
          {
            classroomId: classroom._id,
            studentId,
            joinedBy: method,
            joinedAt,
            sourceCredentialId: resolved.credentialId,
          },
          session,
        );
        await this.audits.append(
          {
            actorId: studentId,
            actorRole: actor.role,
            action: 'CLASSROOM_JOINED',
            resourceId: enrollment._id.toString(),
            requestId,
            metadata: {
              classroomId: classroom._id.toString(),
              enrollmentId: enrollment._id.toString(),
              studentId: studentId.toString(),
              credentialId: resolved.credentialId.toString(),
              joinedBy: method,
            },
          },
          session,
        );
        return this.buildJoinResult(classroom, enrollment, false, session);
      });
    } catch (error) {
      if (!isMongoDuplicateKeyError(error)) throw error;
      const resolved = await this.resolveCredential(method, credential);
      const [classroom, enrollment] = await Promise.all([
        this.classrooms.findById(resolved.classroomId),
        this.enrollments.findMembership(resolved.classroomId, studentId),
      ]);
      if (!classroom || !enrollment || enrollment.status !== 'ACTIVE') throw error;
      return this.buildJoinResult(classroom, enrollment, true);
    }
  }

  private async buildJoinResult(
    classroom: ClassroomRecord,
    enrollment: EnrollmentRecord,
    alreadyEnrolled: boolean,
    session?: ClientSession,
  ) {
    const owner = await this.users.findById(classroom.ownerTeacherId.toString(), session);
    if (!owner) throw new Error('Classroom owner no longer exists');
    return {
      created: !alreadyEnrolled,
      data: {
        classroom: toClassroomSummary(classroom, owner, enrollment),
        enrollment: toEnrollmentSummary(enrollment),
        alreadyEnrolled,
        nextAction: 'OPEN_CLASSROOM',
      },
    };
  }

  async listRoster(actor: AuthenticatedUser, classroomId: string, input: RosterListQueryInput) {
    ensureTeacher(actor);
    const id = new Types.ObjectId(classroomId);
    const classroom = await this.classrooms.findOwnedById(id, new Types.ObjectId(actor.id));
    if (!classroom) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Classroom was not found');
    const result = await this.enrollments.listRoster(id, input);
    return {
      data: result.items.map((row) => ({
        student: {
          id: row.student._id.toString(),
          fullName: row.student.fullName,
          email: row.student.email,
          studentCode: row.student.studentCode ?? null,
          status: row.student.status,
        },
        enrollment: toEnrollmentSummary(row.enrollment),
      })),
      pagination: pagination(input.page, input.limit, result.totalItems),
      filters: {
        keyword: input.keyword ?? null,
        enrollmentStatus: input.enrollmentStatus ?? 'ACTIVE',
        accountStatus: input.accountStatus ?? null,
      },
    };
  }

  async removeStudent(
    actor: AuthenticatedUser,
    classroomId: string,
    studentId: string,
    input: RemoveStudentInput,
    requestId: string,
  ) {
    ensureTeacher(actor);
    const classroomObjectId = new Types.ObjectId(classroomId);
    const studentObjectId = new Types.ObjectId(studentId);
    const actorId = new Types.ObjectId(actor.id);
    return withMongoTransaction(async (session) => {
      const classroom = await this.classrooms.findOwnedById(classroomObjectId, actorId, session);
      if (!classroom) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Classroom was not found');
      assertClassroomMutable(classroom);
      const current = await this.enrollments.findMembership(
        classroomObjectId,
        studentObjectId,
        session,
      );
      if (!current) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Enrollment was not found');
      if (current.status !== 'ACTIVE') {
        throw new AppError(409, 'INVALID_STATE_TRANSITION', 'Enrollment is not active');
      }
      const expected = new Date(input.expectedEnrollmentUpdatedAt);
      if (current.updatedAt.getTime() !== expected.getTime()) {
        throw new AppError(
          409,
          'CONCURRENT_MODIFICATION',
          'Enrollment was modified by another request',
        );
      }
      const removedAt = this.now();
      const removed = await this.enrollments.removeActiveCas(
        {
          classroomId: classroomObjectId,
          studentId: studentObjectId,
          expectedUpdatedAt: expected,
          removedAt,
          removedBy: actorId,
          removalReason: input.reason,
        },
        session,
      );
      if (!removed) {
        throw new AppError(
          409,
          'CONCURRENT_MODIFICATION',
          'Enrollment was modified by another request',
        );
      }
      const audit = await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'CLASSROOM_STUDENT_REMOVED',
          resourceId: removed._id.toString(),
          requestId,
          reason: input.reason,
          oldValue: { status: current.status, updatedAt: current.updatedAt.toISOString() },
          newValue: { status: removed.status, updatedAt: removed.updatedAt.toISOString() },
          metadata: {
            classroomId: classroomObjectId.toString(),
            enrollmentId: removed._id.toString(),
            studentId: studentObjectId.toString(),
          },
        },
        session,
      );
      return { enrollment: toEnrollmentSummary(removed), auditId: audit._id.toString() };
    });
  }
}
