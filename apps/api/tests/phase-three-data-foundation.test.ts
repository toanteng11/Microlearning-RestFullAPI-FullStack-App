import { describe, expect, it } from 'vitest';

import { buildPhaseThreeAuditInput } from '../src/modules/audit/phase-three-audit.writer.js';
import { ClassCodeModel } from '../src/modules/classroom-credentials/class-code.model.js';
import {
  CLASS_CODE_ALPHABET,
  ClassroomCredentialCrypto,
  buildClassroomInviteLink,
  digestClassCode,
  formatClassCode,
  hashClassroomInviteToken,
  maskClassCode,
  normalizeClassCode,
} from '../src/modules/classroom-credentials/classroom-credential.crypto.js';
import { ClassroomInviteLinkModel } from '../src/modules/classroom-credentials/classroom-invite-link.model.js';
import {
  joinClassroomByCodeSchema,
  regenerateInviteLinkSchema,
} from '../src/modules/classroom-credentials/classroom-credential.schemas.js';
import { ClassroomModel } from '../src/modules/classrooms/classroom.model.js';
import {
  classroomListQuerySchema,
  createClassroomSchema,
  updateClassroomSettingsSchema,
} from '../src/modules/classrooms/classroom.schemas.js';
import { SystemSettingModel } from '../src/modules/enrollment-policy/system-setting.model.js';
import { updateEnrollmentPolicySchema } from '../src/modules/enrollment-policy/enrollment-policy.schemas.js';
import { EnrollmentModel } from '../src/modules/enrollments/enrollment.model.js';
import {
  classroomStudentIdSchema,
  removeStudentSchema,
  rosterListQuerySchema,
} from '../src/modules/enrollments/enrollment.schemas.js';
import { getCapabilities, hasPermission } from '../src/shared/auth/permissions.js';
import { createStableSort } from '../src/shared/validation/list-query.js';

describe('Phase 03 runtime and data foundation', () => {
  it('publishes role capabilities without granting Teacher or Admin cross-scope authority', () => {
    expect(getCapabilities('STUDENT')).toEqual(
      expect.arrayContaining(['classroom.join', 'classroom.view_enrolled']),
    );
    expect(getCapabilities('TEACHER')).toEqual(
      expect.arrayContaining([
        'classroom.create',
        'classroom.manage_join',
        'classroom.view_roster',
      ]),
    );
    expect(getCapabilities('ADMIN')).toEqual(
      expect.arrayContaining([
        'classroom.governance.view',
        'enrollment_policy.view',
        'enrollment_policy.update',
      ]),
    );
    expect(hasPermission('TEACHER', 'classroom.governance.view')).toBe(false);
    expect(hasPermission('ADMIN', 'classroom.ownership.transfer')).toBe(false);
    expect(hasPermission('SUPER_ADMIN', 'classroom.ownership.transfer')).toBe(true);
  });

  it('generates deterministic test credentials while persisting only one-way material', () => {
    const randomSource = (size: number) => Uint8Array.from({ length: size }, (_, index) => index);
    const crypto = new ClassroomCredentialCrypto({
      codePepper: 'synthetic-classroom-code-pepper-for-tests',
      codeLength: 8,
      inviteTokenBytes: 32,
      randomSource,
    });

    const code = crypto.generateCode();
    expect(code.raw).toBe('ABCD-EFGH');
    expect(code.masked).toBe('****-EFGH');
    expect(code.digest).toMatch(/^[a-f\d]{64}$/u);
    expect(crypto.digestCode(' abcd - efgh ')).toBe(code.digest);
    expect(CLASS_CODE_ALPHABET).toHaveLength(32);

    const invitation = crypto.generateInviteToken();
    expect(Buffer.from(invitation.raw, 'base64url')).toHaveLength(32);
    expect(invitation.hash).toBe(hashClassroomInviteToken(invitation.raw));
    expect(invitation.hash).toMatch(/^[a-f\d]{64}$/u);
    expect(buildClassroomInviteLink('https://microlearning.example.test', invitation.raw)).toBe(
      `https://microlearning.example.test/join/invite#token=${invitation.raw}`,
    );

    expect(normalizeClassCode('abcd efgh')).toBe('ABCDEFGH');
    expect(formatClassCode('ABCDEFGH')).toBe('ABCD-EFGH');
    expect(maskClassCode('ABCDEFGH')).toBe('****-EFGH');
    expect(digestClassCode('ABCD-EFGH', 'pepper')).toBe(digestClassCode('abcdefgh', 'pepper'));
    expect(() => normalizeClassCode('ABCI-EFGH')).toThrow('format is invalid');
  });

  it('defines no raw credential fields and hides digest/hash paths by default', () => {
    expect(Object.keys(ClassroomModel.schema.paths)).not.toContain('classCode');
    expect(Object.keys(EnrollmentModel.schema.paths)).not.toContain('code');
    expect(Object.keys(ClassCodeModel.schema.paths)).not.toEqual(
      expect.arrayContaining(['code', 'rawCode']),
    );
    expect(Object.keys(ClassroomInviteLinkModel.schema.paths)).not.toEqual(
      expect.arrayContaining(['token', 'inviteLink']),
    );
    expect(ClassCodeModel.schema.path('codeDigest').options.select).toBe(false);
    expect(ClassroomInviteLinkModel.schema.path('tokenHash').options.select).toBe(false);
    expect(SystemSettingModel.schema.path('key')).toBeDefined();
  });

  it('enforces strict schemas, normalized code, bounded lists, and stable tie-break sorting', () => {
    expect(joinClassroomByCodeSchema.parse({ code: ' abcd-efgh ' })).toEqual({
      code: 'ABCDEFGH',
    });
    expect(() =>
      createClassroomSchema.parse({ name: 'Valid', ownerTeacherId: 'forbidden' }),
    ).toThrow();
    expect(() =>
      updateClassroomSettingsSchema.parse({
        expectedUpdatedAt: '2026-07-19T08:00:00.000Z',
        studentInteractionMode: 'COMMENT',
      }),
    ).toThrow();
    expect(() =>
      regenerateInviteLinkSchema.parse({
        expectedCredentialUpdatedAt: '2026-07-19T08:00:00.000Z',
        reason: 'Rotate credential safely',
        expiresInDays: 91,
      }),
    ).toThrow();

    const query = classroomListQuerySchema.parse({ limit: '100', keyword: '  Node  ' });
    expect(query).toMatchObject({
      page: 1,
      limit: 100,
      keyword: 'Node',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });
    expect(() => classroomListQuerySchema.parse({ limit: 101 })).toThrow();
    expect(() => classroomListQuerySchema.parse({ sortBy: 'memberCount' })).toThrow();
    expect(createStableSort('updatedAt', 'desc')).toEqual({ updatedAt: -1, _id: -1 });

    expect(rosterListQuerySchema.parse({ accountStatus: 'ACTIVE' })).toMatchObject({
      page: 1,
      limit: 20,
      accountStatus: 'ACTIVE',
      sortBy: 'joinedAt',
    });
    expect(() => rosterListQuerySchema.parse({ accountStatus: 'UNKNOWN' })).toThrow();
    expect(
      removeStudentSchema.parse({
        reason: 'Student changed Classroom',
        expectedEnrollmentUpdatedAt: '2026-07-19T08:00:00.000Z',
      }),
    ).toMatchObject({ reason: 'Student changed Classroom' });
    expect(() =>
      classroomStudentIdSchema.parse({ classroomId: 'invalid', studentId: 'invalid' }),
    ).toThrow();
    expect(
      updateEnrollmentPolicySchema.parse({
        allowClassCodeJoin: true,
        allowInviteLinkJoin: false,
        defaultInviteLinkLifetimeDays: 30,
        expectedRevision: 1,
        reason: 'Disable link joins during maintenance',
      }),
    ).toMatchObject({ expectedRevision: 1 });
    expect(() =>
      updateEnrollmentPolicySchema.parse({
        allowClassCodeJoin: true,
        allowInviteLinkJoin: true,
        defaultInviteLinkLifetimeDays: 30,
        expectedRevision: 1,
        reason: 'Valid reason',
        updatedBy: 'forbidden-client-field',
      }),
    ).toThrow();
  });

  it('allowlists audit payload fields and removes credential material', () => {
    const audit = buildPhaseThreeAuditInput({
      actorRole: 'TEACHER',
      action: 'CLASS_CODE_REGENERATED',
      resourceId: 'credential-id',
      requestId: 'request-id',
      oldValue: { status: 'ACTIVE', codeDigest: 'must-not-survive' },
      newValue: { status: 'REGENERATED', tokenHash: 'must-not-survive' },
      metadata: {
        classroomId: 'classroom-id',
        maskedCode: '****-EFGH',
        code: 'ABCD-EFGH',
        token: 'must-not-survive',
      },
      token: 'must-not-survive-top-level',
    } as Parameters<typeof buildPhaseThreeAuditInput>[0] & { token: string });

    expect(audit.resourceType).toBe('ClassCode');
    expect(audit.oldValue).toBeNull();
    expect(audit.newValue).toBeNull();
    expect(audit.metadata).toEqual({ classroomId: 'classroom-id', maskedCode: '****-EFGH' });
    expect(audit).not.toHaveProperty('token');

    const joined = buildPhaseThreeAuditInput({
      actorRole: 'STUDENT',
      action: 'CLASSROOM_JOINED',
      resourceId: 'enrollment-id',
      requestId: 'request-id',
      metadata: {
        classroomId: 'classroom-id',
        studentId: 'student-id',
        enrollmentId: 'enrollment-id',
        maskedCode: 'not-approved-for-this-event',
      },
    });
    expect(joined.metadata).toEqual({
      classroomId: 'classroom-id',
      studentId: 'student-id',
      enrollmentId: 'enrollment-id',
    });
  });
});
