import type { ClientSession } from 'mongoose';

import { AuditLogRepository, type AuditInput } from './audit-log.repository.js';

export const PHASE_THREE_AUDIT_ACTIONS = [
  'CLASSROOM_CREATED',
  'CLASSROOM_UPDATED',
  'CLASSROOM_ARCHIVED',
  'CLASS_CODE_REGENERATED',
  'CLASS_CODE_DISABLED',
  'INVITE_LINK_CREATED',
  'INVITE_LINK_REGENERATED',
  'INVITE_LINK_DISABLED',
  'CLASSROOM_JOINED',
  'CLASSROOM_STUDENT_REMOVED',
  'ENROLLMENT_POLICY_UPDATED',
  'CLASSROOM_OWNERSHIP_TRANSFERRED',
] as const;

export type PhaseThreeAuditAction = (typeof PHASE_THREE_AUDIT_ACTIONS)[number];

const RESOURCE_TYPE_BY_ACTION: Record<PhaseThreeAuditAction, string> = {
  CLASSROOM_CREATED: 'Classroom',
  CLASSROOM_UPDATED: 'Classroom',
  CLASSROOM_ARCHIVED: 'Classroom',
  CLASS_CODE_REGENERATED: 'ClassCode',
  CLASS_CODE_DISABLED: 'ClassCode',
  INVITE_LINK_CREATED: 'ClassroomInviteLink',
  INVITE_LINK_REGENERATED: 'ClassroomInviteLink',
  INVITE_LINK_DISABLED: 'ClassroomInviteLink',
  CLASSROOM_JOINED: 'Enrollment',
  CLASSROOM_STUDENT_REMOVED: 'Enrollment',
  ENROLLMENT_POLICY_UPDATED: 'SystemSetting',
  CLASSROOM_OWNERSHIP_TRANSFERRED: 'Classroom',
};

interface AuditFieldPolicy {
  oldValue: ReadonlySet<string>;
  newValue: ReadonlySet<string>;
  metadata: ReadonlySet<string>;
}

const EMPTY_FIELDS = new Set<string>();
const CLASSROOM_STATE_FIELDS = new Set([
  'allowClassCodeJoin',
  'allowInviteLinkJoin',
  'enrollmentStatus',
  'name',
  'ownerTeacherId',
  'section',
  'status',
  'subject',
  'updatedAt',
]);
const CREDENTIAL_METADATA_FIELDS = new Set([
  'classroomId',
  'credentialId',
  'expiresAt',
  'maskedCode',
  'previousCredentialId',
  'replacementCredentialId',
]);
const ENROLLMENT_METADATA_FIELDS = new Set([
  'classroomId',
  'credentialId',
  'enrollmentId',
  'joinedBy',
  'studentId',
]);
const POLICY_STATE_FIELDS = new Set([
  'allowClassCodeJoin',
  'allowInviteLinkJoin',
  'defaultInviteLinkLifetimeDays',
  'revision',
]);
const OWNERSHIP_STATE_FIELDS = new Set(['ownerTeacherId', 'updatedAt']);

const FIELD_POLICY_BY_ACTION: Record<PhaseThreeAuditAction, AuditFieldPolicy> = {
  CLASSROOM_CREATED: {
    oldValue: EMPTY_FIELDS,
    newValue: CLASSROOM_STATE_FIELDS,
    metadata: EMPTY_FIELDS,
  },
  CLASSROOM_UPDATED: {
    oldValue: CLASSROOM_STATE_FIELDS,
    newValue: CLASSROOM_STATE_FIELDS,
    metadata: EMPTY_FIELDS,
  },
  CLASSROOM_ARCHIVED: {
    oldValue: new Set(['status', 'updatedAt']),
    newValue: new Set(['status', 'updatedAt']),
    metadata: new Set(['classroomId']),
  },
  CLASS_CODE_REGENERATED: {
    oldValue: EMPTY_FIELDS,
    newValue: EMPTY_FIELDS,
    metadata: CREDENTIAL_METADATA_FIELDS,
  },
  CLASS_CODE_DISABLED: {
    oldValue: EMPTY_FIELDS,
    newValue: EMPTY_FIELDS,
    metadata: CREDENTIAL_METADATA_FIELDS,
  },
  INVITE_LINK_CREATED: {
    oldValue: EMPTY_FIELDS,
    newValue: EMPTY_FIELDS,
    metadata: CREDENTIAL_METADATA_FIELDS,
  },
  INVITE_LINK_REGENERATED: {
    oldValue: EMPTY_FIELDS,
    newValue: EMPTY_FIELDS,
    metadata: CREDENTIAL_METADATA_FIELDS,
  },
  INVITE_LINK_DISABLED: {
    oldValue: EMPTY_FIELDS,
    newValue: EMPTY_FIELDS,
    metadata: CREDENTIAL_METADATA_FIELDS,
  },
  CLASSROOM_JOINED: {
    oldValue: EMPTY_FIELDS,
    newValue: EMPTY_FIELDS,
    metadata: ENROLLMENT_METADATA_FIELDS,
  },
  CLASSROOM_STUDENT_REMOVED: {
    oldValue: new Set(['status', 'updatedAt']),
    newValue: new Set(['status', 'updatedAt']),
    metadata: ENROLLMENT_METADATA_FIELDS,
  },
  ENROLLMENT_POLICY_UPDATED: {
    oldValue: POLICY_STATE_FIELDS,
    newValue: POLICY_STATE_FIELDS,
    metadata: EMPTY_FIELDS,
  },
  CLASSROOM_OWNERSHIP_TRANSFERRED: {
    oldValue: OWNERSHIP_STATE_FIELDS,
    newValue: OWNERSHIP_STATE_FIELDS,
    metadata: new Set(['classroomId', 'newOwnerTeacherId', 'previousOwnerTeacherId']),
  },
};

function pickFields(
  value: Record<string, unknown> | null | undefined,
  allowlist: ReadonlySet<string>,
): Record<string, unknown> | null {
  if (!value) return null;
  const entries = Object.entries(value).filter(([key]) => allowlist.has(key));
  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

export type PhaseThreeAuditCommand = Omit<
  AuditInput,
  'action' | 'resourceType' | 'oldValue' | 'newValue' | 'metadata'
> & {
  action: PhaseThreeAuditAction;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
};

export function buildPhaseThreeAuditInput(command: PhaseThreeAuditCommand): AuditInput {
  const policy = FIELD_POLICY_BY_ACTION[command.action];
  if (!policy) throw new Error('Unsupported Phase 03 audit action');

  const audit: AuditInput = {
    actorRole: command.actorRole,
    action: command.action,
    resourceType: RESOURCE_TYPE_BY_ACTION[command.action],
    resourceId: command.resourceId,
    requestId: command.requestId,
    oldValue: pickFields(command.oldValue, policy.oldValue),
    newValue: pickFields(command.newValue, policy.newValue),
    metadata: pickFields(command.metadata, policy.metadata),
  };

  if (command.actorId !== undefined) audit.actorId = command.actorId;
  if (command.reason !== undefined) audit.reason = command.reason;
  if (command.idempotencyKey !== undefined) audit.idempotencyKey = command.idempotencyKey;
  return audit;
}

export class PhaseThreeAuditWriter {
  constructor(private readonly audits = new AuditLogRepository()) {}

  async append(command: PhaseThreeAuditCommand, session?: ClientSession) {
    return this.audits.append(buildPhaseThreeAuditInput(command), session);
  }
}
