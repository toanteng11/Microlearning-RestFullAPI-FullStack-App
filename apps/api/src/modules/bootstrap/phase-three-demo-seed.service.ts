import { randomBytes } from 'node:crypto';

import { Types } from 'mongoose';

import type { AppConfig } from '../../shared/config/environment.js';
import { AppError } from '../../shared/errors/app-error.js';
import { ClassCodeModel } from '../classroom-credentials/class-code.model.js';
import { ClassroomInviteLinkModel } from '../classroom-credentials/classroom-invite-link.model.js';
import { ClassroomModel } from '../classrooms/classroom.model.js';
import { EnrollmentPolicyRepository } from '../enrollment-policy/enrollment-policy.repository.js';
import { EnrollmentModel } from '../enrollments/enrollment.model.js';

interface SeedUserReference {
  id: string;
  email: string;
}

const IDS = {
  classroomOpen: new Types.ObjectId('640000000000000000000001'),
  classroomClosed: new Types.ObjectId('640000000000000000000002'),
  classroomArchived: new Types.ObjectId('640000000000000000000003'),
  classCode: new Types.ObjectId('640000000000000000000011'),
  inviteLink: new Types.ObjectId('640000000000000000000012'),
  enrollmentActiveCode: new Types.ObjectId('640000000000000000000021'),
  enrollmentRemoved: new Types.ObjectId('640000000000000000000022'),
  enrollmentActiveInvite: new Types.ObjectId('640000000000000000000023'),
} as const;

function requireUser(users: readonly SeedUserReference[], email: string): Types.ObjectId {
  const user = users.find((item) => item.email === email);
  if (!user || !Types.ObjectId.isValid(user.id)) {
    throw new AppError(409, 'DEMO_SEED_USER_MISSING', `Required demo identity ${email} is missing`);
  }
  return new Types.ObjectId(user.id);
}

export class PhaseThreeDemoSeedService {
  constructor(
    private readonly environment: AppConfig['appEnvironment'],
    private readonly enrollmentPolicies = new EnrollmentPolicyRepository(),
  ) {}

  async execute(users: readonly SeedUserReference[], now = new Date()) {
    if (this.environment === 'production') {
      throw new AppError(403, 'DEMO_SEED_DISABLED', 'Demo seed is disabled in production');
    }

    const teacherA = requireUser(users, 'teacher.active@example.test');
    const teacherB = requireUser(users, 'teacher.active.2@example.test');
    const studentA = requireUser(users, 'student.active@example.test');
    const studentB = requireUser(users, 'student.active.2@example.test');
    const studentC = requireUser(users, 'student.active.3@example.test');
    const archivedAt = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const classroomResult = await ClassroomModel.bulkWrite([
      {
        updateOne: {
          filter: { _id: IDS.classroomOpen },
          update: {
            $setOnInsert: {
              name: 'Microlearning API Foundations',
              nameNormalized: 'microlearning api foundations',
              description: 'Synthetic ACTIVE and OPEN Classroom for Phase 03 verification.',
              subject: 'Backend Engineering',
              section: 'P03-A',
              ownerTeacherId: teacherA,
              status: 'ACTIVE',
              enrollmentStatus: 'OPEN',
              allowClassCodeJoin: true,
              allowInviteLinkJoin: true,
            },
          },
          upsert: true,
        },
      },
      {
        updateOne: {
          filter: { _id: IDS.classroomClosed },
          update: {
            $setOnInsert: {
              name: 'Secure REST API Design',
              nameNormalized: 'secure rest api design',
              description: 'Synthetic ACTIVE and CLOSED Classroom for policy verification.',
              subject: 'API Security',
              section: 'P03-B',
              ownerTeacherId: teacherA,
              status: 'ACTIVE',
              enrollmentStatus: 'CLOSED',
              allowClassCodeJoin: true,
              allowInviteLinkJoin: true,
            },
          },
          upsert: true,
        },
      },
      {
        updateOne: {
          filter: { _id: IDS.classroomArchived },
          update: {
            $setOnInsert: {
              name: 'Archived Microlearning Cohort',
              nameNormalized: 'archived microlearning cohort',
              description: 'Synthetic ARCHIVED Classroom for read-only verification.',
              subject: 'Platform Operations',
              section: 'P03-C',
              ownerTeacherId: teacherB,
              status: 'ARCHIVED',
              enrollmentStatus: 'CLOSED',
              allowClassCodeJoin: false,
              allowInviteLinkJoin: false,
              archivedAt,
              archivedBy: teacherB,
            },
          },
          upsert: true,
        },
      },
    ]);

    const classCodeResult = await ClassCodeModel.bulkWrite([
      {
        updateOne: {
          filter: { _id: IDS.classCode },
          update: {
            $setOnInsert: {
              classroomId: IDS.classroomOpen,
              codeDigest: randomBytes(32).toString('hex'),
              maskedCode: '****-9RTP',
              status: 'ACTIVE',
              generatedBy: teacherA,
              generatedAt: now,
            },
          },
          upsert: true,
        },
      },
    ]);

    const inviteResult = await ClassroomInviteLinkModel.bulkWrite([
      {
        updateOne: {
          filter: { _id: IDS.inviteLink },
          update: {
            $setOnInsert: {
              classroomId: IDS.classroomClosed,
              tokenHash: randomBytes(32).toString('hex'),
              status: 'ACTIVE',
              createdBy: teacherA,
              expiresAt: new Date('2099-12-31T23:59:59.000Z'),
            },
          },
          upsert: true,
        },
      },
    ]);

    const enrollmentResult = await EnrollmentModel.bulkWrite([
      {
        updateOne: {
          filter: { _id: IDS.enrollmentActiveCode },
          update: {
            $setOnInsert: {
              classroomId: IDS.classroomOpen,
              studentId: studentA,
              status: 'ACTIVE',
              joinedBy: 'CLASS_CODE',
              joinedAt: now,
              sourceCredentialId: IDS.classCode,
            },
          },
          upsert: true,
        },
      },
      {
        updateOne: {
          filter: { _id: IDS.enrollmentRemoved },
          update: {
            $setOnInsert: {
              classroomId: IDS.classroomOpen,
              studentId: studentB,
              status: 'REMOVED',
              joinedBy: 'CLASS_CODE',
              joinedAt: archivedAt,
              sourceCredentialId: IDS.classCode,
              removedAt: now,
              removedBy: teacherA,
              removalReason: 'Synthetic removal state for Phase 03 verification.',
            },
          },
          upsert: true,
        },
      },
      {
        updateOne: {
          filter: { _id: IDS.enrollmentActiveInvite },
          update: {
            $setOnInsert: {
              classroomId: IDS.classroomClosed,
              studentId: studentC,
              status: 'ACTIVE',
              joinedBy: 'INVITE_LINK',
              joinedAt: now,
              sourceCredentialId: IDS.inviteLink,
            },
          },
          upsert: true,
        },
      },
    ]);

    await this.enrollmentPolicies.ensureEnrollmentPolicy(30, now);

    const attempted = 8;
    const createdCount =
      classroomResult.upsertedCount +
      classCodeResult.upsertedCount +
      inviteResult.upsertedCount +
      enrollmentResult.upsertedCount;

    return {
      createdCount,
      reusedCount: attempted - createdCount,
      resources: {
        classrooms: [IDS.classroomOpen, IDS.classroomClosed, IDS.classroomArchived].map((id) =>
          id.toString(),
        ),
        enrollments: [
          IDS.enrollmentActiveCode,
          IDS.enrollmentRemoved,
          IDS.enrollmentActiveInvite,
        ].map((id) => id.toString()),
        credentialRecordCount: 2,
        enrollmentPolicy: 'ENABLED',
      },
    };
  }
}
