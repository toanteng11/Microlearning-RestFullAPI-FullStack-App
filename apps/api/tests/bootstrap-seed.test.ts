import { Readable } from 'node:stream';

import { Types, type HydratedDocument } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuditLogRepository } from '../src/modules/audit/audit-log.repository.js';
import { AdminBootstrapService } from '../src/modules/bootstrap/admin-bootstrap.service.js';
import { DEMO_IDENTITIES, DemoSeedService } from '../src/modules/bootstrap/demo-seed.service.js';
import type { SystemGuardRepository } from '../src/modules/system-guards/system-guard.repository.js';
import type { UserRepository } from '../src/modules/users/user.repository.js';
import type { UserRecord } from '../src/modules/users/user.types.js';
import { parseBootstrapArguments, parseSeedArguments } from '../src/scripts/cli-arguments.js';
import {
  assertNoPasswordArgument,
  readPasswordFromStream,
} from '../src/scripts/secure-password-input.js';

vi.mock('../src/shared/database/unit-of-work.js', () => ({
  withMongoTransaction: async <T>(operation: (session: never) => Promise<T>) =>
    operation({} as never),
}));

function user(overrides: Partial<UserRecord> = {}): HydratedDocument<UserRecord> {
  return {
    _id: new Types.ObjectId(),
    email: 'superadmin.active@example.test',
    fullName: 'Demo Super Admin Active',
    fullNameNormalized: 'demo super admin active',
    passwordHash: 'hashed',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    registrationSource: 'ADMIN_BOOTSTRAP',
    createdAt: new Date('2026-07-17T10:00:00.000Z'),
    updatedAt: new Date('2026-07-17T10:00:00.000Z'),
    ...overrides,
  } as HydratedDocument<UserRecord>;
}

describe('AdminBootstrapService', () => {
  const users = {
    findByEmail: vi.fn(),
    findActiveSuperAdmin: vi.fn(),
    create: vi.fn(),
  };
  const audits = { append: vi.fn() };
  const guards = {
    ensureSuperAdminGovernance: vi.fn(),
    touchSuperAdminGovernance: vi.fn(),
  };
  const input = {
    email: '  SUPERADMIN.ACTIVE@example.test ',
    fullName: 'Demo Super Admin Active',
    password: 'SyntheticPassword123!',
    requestId: 'bootstrap:test',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    users.findByEmail.mockResolvedValue(null);
    users.findActiveSuperAdmin.mockResolvedValue(null);
    audits.append.mockResolvedValue({ _id: new Types.ObjectId() });
  });

  function service(enabled = true) {
    return new AdminBootstrapService(
      enabled,
      users as unknown as UserRepository,
      audits as unknown as AuditLogRepository,
      guards as unknown as SystemGuardRepository,
    );
  }

  it('fails closed when bootstrap is not explicitly enabled', async () => {
    await expect(service(false).execute(input)).rejects.toMatchObject({
      code: 'BOOTSTRAP_DISABLED',
    });
    expect(users.create).not.toHaveBeenCalled();
  });

  it('creates and audits exactly one active Super Admin without returning credentials', async () => {
    const created = user();
    users.create.mockResolvedValue(created);
    const result = await service().execute(input);

    expect(guards.ensureSuperAdminGovernance).toHaveBeenCalledOnce();
    expect(guards.touchSuperAdminGovernance).toHaveBeenCalledOnce();
    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'superadmin.active@example.test',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        registrationSource: 'ADMIN_BOOTSTRAP',
        passwordHash: expect.stringMatching(/^\$argon2id\$/u),
      }),
      expect.anything(),
    );
    expect(audits.append).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: null,
        action: 'SUPER_ADMIN_BOOTSTRAPPED',
        resourceId: created._id.toString(),
      }),
      expect.anything(),
    );
    expect(result).toMatchObject({
      created: true,
      user: { role: 'SUPER_ADMIN', status: 'ACTIVE' },
    });
    expect(JSON.stringify(result)).not.toMatch(/password|hash/iu);
    expect(JSON.stringify(audits.append.mock.calls)).not.toContain(input.password);
  });

  it('is idempotent for the same active Super Admin and rejects conflicting identities', async () => {
    const existing = user();
    users.findByEmail.mockResolvedValueOnce(existing);
    await expect(service().execute(input)).resolves.toMatchObject({
      created: false,
      user: { email: existing.email },
      auditId: null,
    });
    expect(users.create).not.toHaveBeenCalled();

    users.findByEmail.mockResolvedValueOnce(user({ role: 'ADMIN' }));
    await expect(service().execute(input)).rejects.toMatchObject({
      code: 'BOOTSTRAP_IDENTITY_CONFLICT',
    });

    users.findByEmail.mockResolvedValueOnce(null);
    users.findActiveSuperAdmin.mockResolvedValueOnce(
      user({ email: 'different.superadmin@example.test' }),
    );
    await expect(service().execute(input)).rejects.toMatchObject({
      code: 'ACTIVE_SUPER_ADMIN_EXISTS',
    });
  });
});

describe('DemoSeedService', () => {
  const users = { findByEmail: vi.fn(), create: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    users.findByEmail.mockResolvedValue(null);
    users.create.mockImplementation((input: Partial<UserRecord>) =>
      Promise.resolve(user({ ...input, _id: new Types.ObjectId() })),
    );
  });

  it('is disabled in Production', async () => {
    const service = new DemoSeedService('production', users as unknown as UserRepository);
    await expect(service.execute('SyntheticPassword123!')).rejects.toMatchObject({
      code: 'DEMO_SEED_DISABLED',
    });
  });

  it('creates the fixed synthetic role/status matrix and can be replayed safely', async () => {
    const service = new DemoSeedService('test', users as unknown as UserRepository);
    const first = await service.execute('SyntheticPassword123!');
    expect(first).toMatchObject({ createdCount: DEMO_IDENTITIES.length, reusedCount: 0 });
    expect(users.create).toHaveBeenCalledTimes(DEMO_IDENTITIES.length);
    expect(first.users.map((item) => `${item.role}:${item.status}`)).toEqual([
      'STUDENT:ACTIVE',
      'STUDENT:ACTIVE',
      'STUDENT:ACTIVE',
      'STUDENT:ACTIVE',
      'STUDENT:BLOCKED',
      'TEACHER:ACTIVE',
      'TEACHER:ACTIVE',
      'TEACHER:BLOCKED',
      'ADMIN:ACTIVE',
      'SUPER_ADMIN:ACTIVE',
    ]);
    expect(JSON.stringify(first)).not.toMatch(/password|hash/iu);

    users.create.mockClear();
    users.findByEmail.mockImplementation((email: string) => {
      const identity = DEMO_IDENTITIES.find((item) => item.email === email);
      return Promise.resolve(identity ? user(identity) : null);
    });
    const replay = await service.execute('SyntheticPassword123!');
    expect(replay).toMatchObject({ createdCount: 0, reusedCount: DEMO_IDENTITIES.length });
    expect(users.create).not.toHaveBeenCalled();
  });

  it('does not overwrite an incompatible existing demo identity', async () => {
    users.findByEmail.mockResolvedValueOnce(user({ role: 'ADMIN' }));
    const service = new DemoSeedService('development', users as unknown as UserRepository);
    await expect(service.execute('SyntheticPassword123!')).rejects.toMatchObject({
      code: 'DEMO_SEED_IDENTITY_CONFLICT',
    });
  });
});

describe('secure CLI input contract', () => {
  it('accepts only non-secret arguments and reads password from stdin without trimming spaces', async () => {
    expect(
      parseBootstrapArguments([
        '--email',
        'admin@example.test',
        '--full-name',
        'Admin Example',
        '--password-stdin',
      ]),
    ).toEqual({
      email: 'admin@example.test',
      fullName: 'Admin Example',
      passwordStdin: true,
    });
    expect(parseSeedArguments(['--password-stdin'])).toEqual({ passwordStdin: true });
    expect(parseBootstrapArguments(['admin@example.test', 'Positional Admin'])).toEqual({
      email: 'admin@example.test',
      fullName: 'Positional Admin',
      passwordStdin: false,
    });
    await expect(
      readPasswordFromStream(Readable.from([' SyntheticPassword123! \r\n'])),
    ).resolves.toBe(' SyntheticPassword123! ');
  });

  it('rejects password and unknown command arguments', () => {
    expect(() => assertNoPasswordArgument(['--password=SyntheticPassword123!'])).toThrow(
      'Password command arguments are forbidden',
    );
    expect(() => parseBootstrapArguments(['--email'])).toThrow('--email requires a value');
    expect(() =>
      parseBootstrapArguments(['admin@example.test', 'Admin', 'forbidden-password-position']),
    ).toThrow('only positional email and optional full name');
    expect(() => parseSeedArguments(['--force'])).toThrow('Unknown or forbidden argument');
  });
});
