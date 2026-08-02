import { describe, expect, it, vi } from 'vitest';

import { AdminReportingService } from '../src/modules/reporting/admin-reporting.service.js';
import type { AuthenticatedUser } from '../src/modules/auth/auth.types.js';
import type { ReportingAuditReader } from '../src/modules/reporting/reporting-audit.reader.js';
import {
  buildReportingViewAuditInput,
  type ReportingAuditSink,
} from '../src/modules/reporting/reporting-audit.writer.js';
import type { ReportingGovernanceReader } from '../src/modules/reporting/reporting-governance.reader.js';
import { protectSensitiveAggregate } from '../src/modules/reporting/reporting-privacy.policy.js';
import type { ReportingGovernanceCounts } from '../src/modules/reporting/reporting.types.js';

const fixedNow = new Date('2026-07-30T08:00:00.000Z');
const admin: AuthenticatedUser = {
  id: '507f1f77bcf86cd799439011',
  role: 'ADMIN',
  status: 'ACTIVE',
  familyId: 'family-admin',
  capabilities: ['report.view_governance', 'report.audit_view'],
};
const superAdmin: AuthenticatedUser = { ...admin, role: 'SUPER_ADMIN' };
const teacher: AuthenticatedUser = { ...admin, role: 'TEACHER' };

function counts(): ReportingGovernanceCounts {
  return {
    userCounts: {
      STUDENT: { PENDING: 1, ACTIVE: 4, INACTIVE: 0, BLOCKED: 1, DELETED: 0 },
      TEACHER: { PENDING: 1, ACTIVE: 2, INACTIVE: 0, BLOCKED: 0, DELETED: 0 },
      ADMIN: { PENDING: 0, ACTIVE: 1, INACTIVE: 0, BLOCKED: 0, DELETED: 0 },
      SUPER_ADMIN: { PENDING: 0, ACTIVE: 1, INACTIVE: 0, BLOCKED: 0, DELETED: 0 },
    },
    registrationSourceCounts: {
      SELF_REGISTRATION: 6,
      TEACHER_INVITATION: 3,
      ADMIN_BOOTSTRAP: 2,
    },
    invitationCounts: { PENDING: 2, ACCEPTED: 3, EXPIRED: 1, REVOKED: 0 },
    classroomCounts: { ACTIVE: 2, LOCKED: 1, ARCHIVED: 0 },
    courseCounts: { DRAFT: 1, SCHEDULED: 0, PUBLISHED: 2, UNPUBLISHED: 0, ARCHIVED: 0 },
    enrollmentCounts: { ACTIVE: 6, REMOVED: 1, LEFT: 0, BLOCKED: 0 },
  };
}

function dependencies(overrides?: { enabled?: boolean }) {
  const governance: ReportingGovernanceReader = {
    readCounts: vi.fn().mockResolvedValue(counts()),
    getSourceWatermark: vi.fn().mockResolvedValue(new Date('2026-07-30T07:00:00.000Z')),
  };
  const audits: ReportingAuditReader = {
    listSafe: vi.fn().mockResolvedValue({
      items: [
        {
          id: '507f1f77bcf86cd799439099',
          actorId: admin.id,
          actorRole: 'ADMIN',
          action: 'USER_STATUS_CHANGED',
          resourceType: 'User',
          resourceId: '507f1f77bcf86cd799439012',
          requestId: 'request-1',
          createdAt: new Date('2026-07-30T07:30:00.000Z'),
        },
      ],
      totalItems: 1,
    }),
  };
  const auditWriter: ReportingAuditSink = {
    appendReportView: vi.fn().mockResolvedValue(undefined),
  };
  const service = new AdminReportingService(
    governance,
    audits,
    auditWriter,
    {
      enabled: overrides?.enabled ?? true,
      timezone: 'Asia/Ho_Chi_Minh',
      staleAfterSeconds: 300,
      maxDateRangeDays: 365,
    },
    () => new Date(fixedNow),
  );
  return { service, governance, audits, auditWriter };
}

describe('Phase 06 Admin Reporting service', () => {
  it('returns complete role/status/source keys and safe recent audit metadata', async () => {
    const { service, governance, audits, auditWriter } = dependencies();
    const result = await service.dashboard(admin, {
      timezone: 'Asia/Ho_Chi_Minh',
      recentLimit: 10,
    });

    expect(result.users.STUDENT).toEqual({
      total: 6,
      PENDING: 1,
      ACTIVE: 4,
      INACTIVE: 0,
      BLOCKED: 1,
      DELETED: 0,
    });
    expect(result.users.SUPER_ADMIN.total).toBe(1);
    expect(result.registrationSources).toEqual({
      SELF_REGISTRATION: 6,
      TEACHER_INVITATION: 3,
      ADMIN_BOOTSTRAP: 2,
    });
    expect(result.activeEnrollmentCount).toBe(6);
    expect(result.recentGovernanceEvents[0]).toEqual(
      expect.objectContaining({ createdAt: '2026-07-30T07:30:00.000Z' }),
    );
    expect(result.reporting).toMatchObject({
      definitionVersion: 'P06_ADMIN_GOVERNANCE_V1',
      dataState: 'READY',
      sourceMetricVersion: null,
      descriptorVersion: null,
    });
    expect(governance.readCounts).toHaveBeenCalledWith({ asOf: fixedNow });
    expect(audits.listSafe).toHaveBeenCalledWith({ page: 1, limit: 10, sortOrder: 'desc' });
    expect(auditWriter.appendReportView).not.toHaveBeenCalled();
  });

  it('normalizes a date-only governance range and writes allowlisted audit metadata', async () => {
    const { service, governance, auditWriter } = dependencies();
    const result = await service.governanceReport(
      superAdmin,
      {
        from: '2026-07-01',
        to: '2026-07-02',
        timezone: 'Asia/Ho_Chi_Minh',
        role: 'STUDENT',
        userStatus: 'ACTIVE',
      },
      'request-governance',
    );

    expect(governance.readCounts).toHaveBeenCalledWith(
      expect.objectContaining({
        from: new Date('2026-06-30T17:00:00.000Z'),
        to: new Date('2026-07-01T17:00:00.000Z'),
        role: 'STUDENT',
        userStatus: 'ACTIVE',
      }),
    );
    expect(result.reporting.filters).toMatchObject({
      from: '2026-06-30T17:00:00.000Z',
      to: '2026-07-01T17:00:00.000Z',
    });
    expect(auditWriter.appendReportView).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: superAdmin,
        reportId: 'RPT-ADM-GOVERNANCE',
        filterFields: expect.arrayContaining(['from', 'to', 'timezone', 'role', 'userStatus']),
        dateRangeDays: 1,
      }),
    );
    const command = vi.mocked(auditWriter.appendReportView).mock.calls[0]![0];
    const safeAudit = buildReportingViewAuditInput(command);
    expect(safeAudit.metadata).toEqual(
      expect.objectContaining({
        filterFields: expect.arrayContaining(['from', 'to', 'timezone', 'role', 'userStatus']),
      }),
    );
    expect(JSON.stringify(safeAudit.metadata)).not.toMatch(/Asia\/Ho_Chi_Minh|STUDENT|ACTIVE/u);
    expect(safeAudit.oldValue).toBeNull();
    expect(safeAudit.newValue).toBeNull();
  });

  it('uses the same bounded filters for audit items and count metadata', async () => {
    const { service, audits, auditWriter } = dependencies();
    const result = await service.auditLogs(
      admin,
      {
        page: 2,
        limit: 20,
        actorRole: 'ADMIN',
        action: 'USER_STATUS_CHANGED',
        sortOrder: 'desc',
      },
      'request-audit',
    );

    expect(audits.listSafe).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        limit: 20,
        actorRole: 'ADMIN',
        action: 'USER_STATUS_CHANGED',
        from: new Date('2026-06-30T08:00:00.000Z'),
        to: fixedNow,
      }),
    );
    expect(result.meta).toMatchObject({ page: 2, limit: 20, totalItems: 1 });
    expect(result.data.items[0]).not.toHaveProperty('metadata');
    expect(result.data.items[0]).not.toHaveProperty('oldValue');
    expect(auditWriter.appendReportView).toHaveBeenCalledWith(
      expect.objectContaining({ reportId: 'RPT-ADM-AUDIT', page: 2, limit: 20, rowCount: 1 }),
    );
  });

  it('rejects non-Admin roles, disabled reporting and over-limit date ranges', async () => {
    await expect(
      dependencies().service.dashboard(teacher, { recentLimit: 10 }),
    ).rejects.toMatchObject({ statusCode: 403, code: 'ACCESS_DENIED' });
    await expect(
      dependencies({ enabled: false }).service.dashboard(admin, { recentLimit: 10 }),
    ).rejects.toMatchObject({ statusCode: 503, code: 'REPORTING_DISABLED' });
    await expect(
      dependencies().service.governanceReport(
        admin,
        {
          from: '2025-01-01T00:00:00.000Z',
          to: '2026-07-01T00:00:00.000Z',
        },
        'request-over-limit',
      ),
    ).rejects.toMatchObject({ statusCode: 422, code: 'REPORT_LIMIT_EXCEEDED' });
  });

  it('applies the same small-group policy regardless of Admin privilege', () => {
    for (const actor of [admin, superAdmin]) {
      expect(actor.role).toMatch(/ADMIN/u);
      expect(protectSensitiveAggregate(4, 82.5, 5)).toEqual({
        value: null,
        dataState: 'SUPPRESSED',
        dataSuppressed: true,
        suppressionReason: 'SMALL_GROUP',
      });
      expect(protectSensitiveAggregate(5, 82.5, 5)).toEqual({
        value: 82.5,
        dataState: 'READY',
        dataSuppressed: false,
        suppressionReason: null,
      });
    }
  });
});
