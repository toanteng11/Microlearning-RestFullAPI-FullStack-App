import mongoose, { type Model, Types } from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { ClassCodeModel } from '../../src/modules/classroom-credentials/class-code.model.js';
import {
  digestClassCode,
  hashClassroomInviteToken,
} from '../../src/modules/classroom-credentials/classroom-credential.crypto.js';
import { ClassroomInviteLinkModel } from '../../src/modules/classroom-credentials/classroom-invite-link.model.js';
import { DemoSeedService } from '../../src/modules/bootstrap/demo-seed.service.js';
import { PhaseThreeDemoSeedService } from '../../src/modules/bootstrap/phase-three-demo-seed.service.js';
import { ClassroomModel } from '../../src/modules/classrooms/classroom.model.js';
import { ClassroomRepository } from '../../src/modules/classrooms/classroom.repository.js';
import { EnrollmentPolicyRepository } from '../../src/modules/enrollment-policy/enrollment-policy.repository.js';
import { SystemSettingModel } from '../../src/modules/enrollment-policy/system-setting.model.js';
import { EnrollmentModel } from '../../src/modules/enrollments/enrollment.model.js';
import { UserModel } from '../../src/modules/users/user.model.js';
import { UserRepository } from '../../src/modules/users/user.repository.js';
import { initializePhaseThreeIndexes } from '../../src/shared/database/phase-three-indexes.js';

const integrationUri = process.env.MONGODB_INTEGRATION_URI;
if (!integrationUri)
  throw new Error('MONGODB_INTEGRATION_URI is required for Phase 03 integration');

const models: Model<never>[] = [
  ClassroomModel as unknown as Model<never>,
  EnrollmentModel as unknown as Model<never>,
  ClassCodeModel as unknown as Model<never>,
  ClassroomInviteLinkModel as unknown as Model<never>,
  SystemSettingModel as unknown as Model<never>,
  UserModel as unknown as Model<never>,
];

async function indexByName(model: Model<never>, name: string) {
  const indexes = await model.collection.indexes();
  const index = indexes.find((candidate) => candidate.name === name);
  expect(index, `${model.collection.collectionName}.${name}`).toBeDefined();
  return index!;
}

describe('Phase 03 data foundation on MongoDB replica set', () => {
  beforeAll(async () => {
    await mongoose.connect(integrationUri, { serverSelectionTimeoutMS: 15_000 });
    await UserModel.syncIndexes();
    await initializePhaseThreeIndexes('test');
  });

  beforeEach(async () => {
    await Promise.all(models.map((model) => model.deleteMany({})));
  });

  afterAll(async () => mongoose.disconnect());

  it('creates every exact named index and preserves credential history without TTL deletion', async () => {
    const expectedNames = new Map<Model<never>, string[]>([
      [
        ClassroomModel as unknown as Model<never>,
        [
          'ix_classrooms_owner_status_updated',
          'ix_classrooms_status_created',
          'ix_classrooms_owner_name',
          'ix_classrooms_name_status',
        ],
      ],
      [
        EnrollmentModel as unknown as Model<never>,
        [
          'uq_enrollments_classroom_student',
          'ix_enrollments_classroom_status_joined',
          'ix_enrollments_student_status_updated',
          'ix_enrollments_student_classroom_status',
        ],
      ],
      [
        ClassCodeModel as unknown as Model<never>,
        [
          'uq_class_codes_digest',
          'uq_class_codes_active_classroom',
          'ix_class_codes_classroom_created',
        ],
      ],
      [
        ClassroomInviteLinkModel as unknown as Model<never>,
        [
          'uq_classroom_invite_links_hash',
          'uq_classroom_invite_links_active_classroom',
          'ix_classroom_invite_links_expiry',
          'ix_classroom_invite_links_classroom_created',
        ],
      ],
      [SystemSettingModel as unknown as Model<never>, ['uq_system_settings_key']],
    ]);

    for (const [model, names] of expectedNames) {
      const actualNames = (await model.collection.indexes()).map((index) => index.name);
      expect(actualNames).toEqual(expect.arrayContaining(names));
    }

    expect(
      (
        await indexByName(
          ClassCodeModel as unknown as Model<never>,
          'uq_class_codes_active_classroom',
        )
      ).partialFilterExpression,
    ).toEqual({ status: 'ACTIVE' });
    expect(
      (
        await indexByName(
          ClassroomInviteLinkModel as unknown as Model<never>,
          'uq_classroom_invite_links_active_classroom',
        )
      ).partialFilterExpression,
    ).toEqual({ status: 'ACTIVE' });
    expect(
      (
        await indexByName(
          ClassroomInviteLinkModel as unknown as Model<never>,
          'ix_classroom_invite_links_expiry',
        )
      ).expireAfterSeconds,
    ).toBeUndefined();
  });

  it('enforces one membership and one active credential of each type per Classroom', async () => {
    const classroomId = new Types.ObjectId();
    const studentId = new Types.ObjectId();
    const actorId = new Types.ObjectId();

    await EnrollmentModel.create({
      classroomId,
      studentId,
      joinedBy: 'CLASS_CODE',
      joinedAt: new Date(),
    });
    await expect(
      EnrollmentModel.create({
        classroomId,
        studentId,
        joinedBy: 'INVITE_LINK',
        joinedAt: new Date(),
      }),
    ).rejects.toMatchObject({ code: 11000 });

    const firstDigest = digestClassCode('ABCD-EFGH', 'integration-classroom-pepper');
    await ClassCodeModel.create({
      classroomId,
      codeDigest: firstDigest,
      maskedCode: '****-EFGH',
      status: 'ACTIVE',
      generatedBy: actorId,
      generatedAt: new Date(),
    });
    await expect(
      ClassCodeModel.create({
        classroomId,
        codeDigest: digestClassCode('JKLM-NPQR', 'integration-classroom-pepper'),
        maskedCode: '****-NPQR',
        status: 'ACTIVE',
        generatedBy: actorId,
        generatedAt: new Date(),
      }),
    ).rejects.toMatchObject({ code: 11000 });
    await ClassCodeModel.create({
      classroomId,
      codeDigest: digestClassCode('STUV-WXYZ', 'integration-classroom-pepper'),
      maskedCode: '****-WXYZ',
      status: 'DISABLED',
      generatedBy: actorId,
      generatedAt: new Date(),
    });

    await ClassroomInviteLinkModel.create({
      classroomId,
      tokenHash: hashClassroomInviteToken('first-integration-invite-token'),
      status: 'ACTIVE',
      createdBy: actorId,
      expiresAt: new Date(Date.now() + 86_400_000),
    });
    await expect(
      ClassroomInviteLinkModel.create({
        classroomId,
        tokenHash: hashClassroomInviteToken('second-integration-invite-token'),
        status: 'ACTIVE',
        createdBy: actorId,
        expiresAt: new Date(Date.now() + 86_400_000),
      }),
    ).rejects.toMatchObject({ code: 11000 });
    await ClassroomInviteLinkModel.create({
      classroomId,
      tokenHash: hashClassroomInviteToken('historical-integration-invite-token'),
      status: 'REGENERATED',
      createdBy: actorId,
      expiresAt: new Date(Date.now() + 86_400_000),
    });
  });

  it('normalizes Classroom names, provides stable owned search, and hides credential material', async () => {
    const ownerTeacherId = new Types.ObjectId();
    await ClassroomModel.create([
      { name: '  Node   Fundamentals ', ownerTeacherId },
      { name: 'Node Advanced', ownerTeacherId },
      { name: 'Java Foundations', ownerTeacherId },
    ]);

    const page = await new ClassroomRepository().listOwned(ownerTeacherId, {
      page: 1,
      limit: 20,
      keyword: 'node',
      sortBy: 'name',
      sortOrder: 'asc',
    });
    expect(page.items.map((item) => item.name)).toEqual(['Node Advanced', 'Node Fundamentals']);
    expect(page.totalItems).toBe(2);

    const classroomId = page.items[0]!._id;
    await ClassCodeModel.create({
      classroomId,
      codeDigest: digestClassCode('ABCD-EFGH', 'integration-classroom-pepper'),
      maskedCode: '****-EFGH',
      status: 'ACTIVE',
      generatedBy: ownerTeacherId,
      generatedAt: new Date(),
    });
    await ClassroomInviteLinkModel.create({
      classroomId,
      tokenHash: hashClassroomInviteToken('hidden-integration-invite-token'),
      status: 'ACTIVE',
      createdBy: ownerTeacherId,
      expiresAt: new Date(Date.now() + 86_400_000),
    });

    expect(await ClassCodeModel.findOne({ classroomId }).lean().exec()).not.toHaveProperty(
      'codeDigest',
    );
    expect(
      await ClassroomInviteLinkModel.findOne({ classroomId }).lean().exec(),
    ).not.toHaveProperty('tokenHash');
  });

  it('bootstraps Enrollment Policy idempotently without overwriting configured values', async () => {
    const repository = new EnrollmentPolicyRepository();
    const initialNow = new Date('2026-07-19T08:00:00.000Z');
    const initial = await repository.ensureEnrollmentPolicy(30, initialNow);
    expect(initial?.toObject()).toMatchObject({
      key: 'ENROLLMENT_POLICY',
      revision: 1,
      value: {
        allowClassCodeJoin: true,
        allowInviteLinkJoin: true,
        defaultInviteLinkLifetimeDays: 30,
      },
    });

    await SystemSettingModel.updateOne(
      { key: 'ENROLLMENT_POLICY' },
      {
        $set: {
          value: {
            allowClassCodeJoin: false,
            allowInviteLinkJoin: true,
            defaultInviteLinkLifetimeDays: 14,
          },
          revision: 7,
        },
      },
    ).exec();

    const beforeSecondBootstrap = await repository.findEnrollmentPolicy();
    await repository.ensureEnrollmentPolicy(60, new Date('2026-07-20T08:00:00.000Z'));
    const configured = await repository.findEnrollmentPolicy();
    expect(configured?.toObject()).toMatchObject({
      revision: 7,
      value: {
        allowClassCodeJoin: false,
        allowInviteLinkJoin: true,
        defaultInviteLinkLifetimeDays: 14,
      },
    });
    expect(configured?.updatedAt.toISOString()).toBe(
      beforeSecondBootstrap?.updatedAt.toISOString(),
    );
    expect(await SystemSettingModel.countDocuments({ key: 'ENROLLMENT_POLICY' })).toBe(1);
  });

  it('seeds the complete synthetic Phase 03 fixture twice without exposing credentials', async () => {
    const users = await new DemoSeedService('test', new UserRepository()).execute(
      'SyntheticPassword123!',
    );
    const service = new PhaseThreeDemoSeedService('test');
    const now = new Date('2026-07-19T08:00:00.000Z');

    const first = await service.execute(users.users, now);
    const replay = await service.execute(users.users, now);

    expect(first).toMatchObject({ createdCount: 8, reusedCount: 0 });
    expect(replay).toMatchObject({ createdCount: 0, reusedCount: 8 });
    expect(await ClassroomModel.countDocuments()).toBe(3);
    expect(await EnrollmentModel.countDocuments()).toBe(3);
    expect(await ClassCodeModel.countDocuments()).toBe(1);
    expect(await ClassroomInviteLinkModel.countDocuments()).toBe(1);
    expect(await SystemSettingModel.countDocuments({ key: 'ENROLLMENT_POLICY' })).toBe(1);
    expect(await UserModel.countDocuments({ role: 'TEACHER', status: 'ACTIVE' })).toBe(2);
    expect(await UserModel.countDocuments({ role: 'STUDENT', status: 'ACTIVE' })).toBe(4);
    expect(JSON.stringify({ first, replay })).not.toMatch(
      /codeDigest|tokenHash|rawCode|rawToken/iu,
    );
  });

  it('fails production compatibility verification when a required index is missing', async () => {
    await ClassCodeModel.collection.dropIndex('ix_class_codes_classroom_created');
    await expect(initializePhaseThreeIndexes('production')).rejects.toThrow(
      'Phase 03 index compatibility check failed',
    );
    await ClassCodeModel.createIndexes();
    await expect(initializePhaseThreeIndexes('production')).resolves.toBeUndefined();
  });
});
