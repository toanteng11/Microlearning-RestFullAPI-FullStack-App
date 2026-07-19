import { Types } from 'mongoose';

import type { PhaseThreeAuditWriter } from '../audit/phase-three-audit.writer.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { withMongoTransaction } from '../../shared/database/unit-of-work.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { EnrollmentPolicyRepository } from './enrollment-policy.repository.js';
import type { UpdateEnrollmentPolicyInput } from './enrollment-policy.schemas.js';
import { ENROLLMENT_POLICY_KEY, type EnrollmentPolicyValue } from './system-setting.model.js';

function toPolicyResponse(policy: {
  value: EnrollmentPolicyValue;
  revision: number;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    allowClassCodeJoin: policy.value.allowClassCodeJoin,
    allowInviteLinkJoin: policy.value.allowInviteLinkJoin,
    defaultInviteLinkLifetimeDays: policy.value.defaultInviteLinkLifetimeDays,
    revision: policy.revision,
    updatedBy: policy.updatedBy?.toString() ?? null,
    createdAt: policy.createdAt.toISOString(),
    updatedAt: policy.updatedAt.toISOString(),
  };
}

function toPolicyAuditValue(value: EnrollmentPolicyValue, revision: number) {
  return {
    allowClassCodeJoin: value.allowClassCodeJoin,
    allowInviteLinkJoin: value.allowInviteLinkJoin,
    defaultInviteLinkLifetimeDays: value.defaultInviteLinkLifetimeDays,
    revision,
  };
}

export class EnrollmentPolicyService {
  constructor(
    private readonly policies: EnrollmentPolicyRepository,
    private readonly audits: PhaseThreeAuditWriter,
  ) {}

  async get() {
    const policy = await this.policies.findEnrollmentPolicy();
    if (!policy) {
      throw new AppError(503, 'ENROLLMENT_POLICY_UNAVAILABLE', 'Enrollment policy is unavailable');
    }
    return toPolicyResponse(policy);
  }

  async update(actor: AuthenticatedUser, input: UpdateEnrollmentPolicyInput, requestId: string) {
    return withMongoTransaction(async (session) => {
      const current = await this.policies.findEnrollmentPolicy(session);
      if (!current) {
        throw new AppError(
          503,
          'ENROLLMENT_POLICY_UNAVAILABLE',
          'Enrollment policy is unavailable',
        );
      }
      if (current.revision !== input.expectedRevision) {
        throw new AppError(
          409,
          'CONCURRENT_MODIFICATION',
          'Enrollment policy was modified by another request',
        );
      }

      const value: EnrollmentPolicyValue = {
        allowClassCodeJoin: input.allowClassCodeJoin,
        allowInviteLinkJoin: input.allowInviteLinkJoin,
        defaultInviteLinkLifetimeDays: input.defaultInviteLinkLifetimeDays,
      };
      const updated = await this.policies.updateEnrollmentPolicyCas(
        {
          value,
          expectedRevision: input.expectedRevision,
          updatedBy: new Types.ObjectId(actor.id),
        },
        session,
      );
      if (!updated) {
        throw new AppError(
          409,
          'CONCURRENT_MODIFICATION',
          'Enrollment policy was modified by another request',
        );
      }

      const audit = await this.audits.append(
        {
          actorId: new Types.ObjectId(actor.id),
          actorRole: actor.role,
          action: 'ENROLLMENT_POLICY_UPDATED',
          resourceId: ENROLLMENT_POLICY_KEY,
          requestId,
          reason: input.reason,
          oldValue: toPolicyAuditValue(current.value, current.revision),
          newValue: toPolicyAuditValue(updated.value, updated.revision),
        },
        session,
      );
      return { policy: toPolicyResponse(updated), auditId: audit._id.toString() };
    });
  }
}
