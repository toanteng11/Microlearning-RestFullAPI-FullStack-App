import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { Types } from 'mongoose';
import { describe, expect, it, vi } from 'vitest';

import { PhaseThreeClassroomScopeAdapter } from '../src/modules/classrooms/classroom-scope.adapter.js';
import type { ClassroomRepository } from '../src/modules/classrooms/classroom.repository.js';
import type { EnrollmentRepository } from '../src/modules/enrollments/enrollment.repository.js';
import {
  LEARNING_ACTIVITY_DESCRIPTOR_VERSION,
  type LearningActivityReader,
} from '../src/modules/learning-content/learning-activity.reader.js';
import {
  LEARNING_PROGRESS_METRIC_VERSION,
  type LearningProgressReader,
} from '../src/modules/learning-content/learning-progress.reader.js';
import { createPhaseFourFoundation } from '../src/modules/phase-four.foundation.js';
import { PERMISSIONS, getCapabilities, hasPermission } from '../src/shared/auth/permissions.js';

type ClassroomScopeDataSource = Pick<ClassroomRepository, 'findById' | 'findOwnedById'>;
type EnrollmentScopeDataSource = Pick<
  EnrollmentRepository,
  'findActiveMembership' | 'findActiveMemberships'
>;

function createScopeHarness() {
  const classroomId = new Types.ObjectId();
  const firstTeacherId = new Types.ObjectId();
  const secondTeacherId = new Types.ObjectId();
  const studentId = new Types.ObjectId();
  const enrollmentId = new Types.ObjectId();
  let currentOwnerId = firstTeacherId;
  let activeEnrollment = true;

  const findById = vi.fn(async (id: Types.ObjectId) =>
    id.equals(classroomId)
      ? { _id: classroomId, ownerTeacherId: currentOwnerId, status: 'ACTIVE' as const }
      : null,
  );
  const findOwnedById = vi.fn(async (id: Types.ObjectId, ownerId: Types.ObjectId) =>
    id.equals(classroomId) && ownerId.equals(currentOwnerId)
      ? { _id: classroomId, ownerTeacherId: currentOwnerId, status: 'ACTIVE' as const }
      : null,
  );
  const findActiveMembership = vi.fn(async (scopeId: Types.ObjectId, actorId: Types.ObjectId) =>
    activeEnrollment && scopeId.equals(classroomId) && actorId.equals(studentId)
      ? { _id: enrollmentId, classroomId, status: 'ACTIVE' as const }
      : null,
  );
  const findActiveMemberships = vi.fn(
    async (actorId: Types.ObjectId, classroomIds: readonly Types.ObjectId[]) =>
      activeEnrollment &&
      actorId.equals(studentId) &&
      classroomIds.some((id) => id.equals(classroomId))
        ? [{ _id: enrollmentId, classroomId, status: 'ACTIVE' as const }]
        : [],
  );

  const classrooms = { findById, findOwnedById } as unknown as ClassroomScopeDataSource;
  const enrollments = {
    findActiveMembership,
    findActiveMemberships,
  } as unknown as EnrollmentScopeDataSource;

  return {
    classroomId,
    firstTeacherId,
    secondTeacherId,
    studentId,
    enrollmentId,
    classrooms,
    enrollments,
    transferOwnership: () => {
      currentOwnerId = secondTeacherId;
    },
    removeEnrollment: () => {
      activeEnrollment = false;
    },
  };
}

describe('Phase 04 permissions and handoff contracts', () => {
  it('publishes the approved allow/deny matrix for all roles', () => {
    const studentPermissions = ['learning.complete_own', 'learning.view_enrolled'] as const;
    const teacherPermissions = [
      'announcement.manage_owned',
      'content.reorder_owned',
      'course.archive_owned',
      'course.create',
      'course.progress_view_owned',
      'course.publish_owned',
      'course.update_owned',
      'course.view_owned',
      'lesson.deadline_manage_owned',
      'lesson.manage_owned',
    ] as const;

    expect(getCapabilities('STUDENT')).toEqual(expect.arrayContaining([...studentPermissions]));
    expect(getCapabilities('TEACHER')).toEqual(expect.arrayContaining([...teacherPermissions]));
    expect(hasPermission('ADMIN', 'content.governance_view')).toBe(true);
    expect(hasPermission('ADMIN', 'course.create')).toBe(false);
    expect(hasPermission('TEACHER', 'learning.complete_own')).toBe(false);
    expect(hasPermission('STUDENT', 'lesson.manage_owned')).toBe(false);
    expect(getCapabilities('SUPER_ADMIN')).toEqual([...PERMISSIONS].sort());
  });

  it('provides versioned activity and progress reader contracts for later phases', async () => {
    const activityReader: LearningActivityReader = {
      descriptorVersion: LEARNING_ACTIVITY_DESCRIPTOR_VERSION,
      listByCourseIds: async () => new Map(),
    };
    const progressReader: LearningProgressReader = {
      metricVersion: LEARNING_PROGRESS_METRIC_VERSION,
      listStudentProgress: async () => new Map(),
      countCompletedByActivityIds: async () => new Map(),
    };

    expect(activityReader.descriptorVersion).toBe('P04_ACTIVITY_DESCRIPTOR_V1');
    expect(progressReader.metricVersion).toBe('P04_LESSON_COMPLETION_V1');
    await expect(activityReader.listByCourseIds([], new Date(0))).resolves.toEqual(new Map());
    await expect(progressReader.listStudentProgress('student', [])).resolves.toEqual(new Map());
  });

  it('keeps the learning-content boundary free from cross-domain Mongoose model imports', () => {
    const moduleDirectory = fileURLToPath(
      new URL('../src/modules/learning-content/', import.meta.url),
    );
    const source = readdirSync(moduleDirectory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
      .map((entry) => readFileSync(`${moduleDirectory}/${entry.name}`, 'utf8'))
      .join('\n');

    expect(source).not.toMatch(/from ['"][^'"]+\.model\.js['"]/u);
    expect(source).not.toContain("from 'mongoose'");
  });
});

describe('Phase 03 scope adapter for Phase 04', () => {
  it('always reflects current Classroom ownership', async () => {
    const harness = createScopeHarness();
    const adapter = new PhaseThreeClassroomScopeAdapter(harness.classrooms, harness.enrollments);

    await expect(
      adapter.getTeacherOwnedScope(
        harness.firstTeacherId.toString(),
        harness.classroomId.toString(),
      ),
    ).resolves.toMatchObject({ ownerTeacherId: harness.firstTeacherId.toString() });

    harness.transferOwnership();
    await expect(
      adapter.getTeacherOwnedScope(
        harness.firstTeacherId.toString(),
        harness.classroomId.toString(),
      ),
    ).rejects.toMatchObject({ statusCode: 404, code: 'RESOURCE_NOT_FOUND' });
    await expect(
      adapter.getTeacherOwnedScope(
        harness.secondTeacherId.toString(),
        harness.classroomId.toString(),
      ),
    ).resolves.toMatchObject({ ownerTeacherId: harness.secondTeacherId.toString() });
  });

  it('returns active Student scope and refuses a removed Enrollment', async () => {
    const harness = createScopeHarness();
    const adapter = new PhaseThreeClassroomScopeAdapter(harness.classrooms, harness.enrollments);

    await expect(
      adapter.getStudentEnrollmentScope(
        harness.studentId.toString(),
        harness.classroomId.toString(),
      ),
    ).resolves.toEqual({
      classroomId: harness.classroomId.toString(),
      enrollmentId: harness.enrollmentId.toString(),
      classroomStatus: 'ACTIVE',
      enrollmentStatus: 'ACTIVE',
    });

    harness.removeEnrollment();
    await expect(
      adapter.getStudentEnrollmentScope(
        harness.studentId.toString(),
        harness.classroomId.toString(),
      ),
    ).rejects.toMatchObject({ statusCode: 404, code: 'RESOURCE_NOT_FOUND' });
  });

  it('batches active Enrollment access and rejects malformed scoped identifiers', async () => {
    const harness = createScopeHarness();
    const adapter = new PhaseThreeClassroomScopeAdapter(harness.classrooms, harness.enrollments);

    const scopes = await adapter.getActiveEnrollmentScopes(harness.studentId.toString(), [
      harness.classroomId.toString(),
      harness.classroomId.toString(),
      new Types.ObjectId().toString(),
    ]);
    expect(scopes.get(harness.classroomId.toString())).toEqual({
      classroomId: harness.classroomId.toString(),
      enrollmentId: harness.enrollmentId.toString(),
      enrollmentStatus: 'ACTIVE',
    });
    expect(scopes.size).toBe(1);

    await expect(adapter.getTeacherOwnedScope('invalid-id', 'also-invalid')).rejects.toMatchObject({
      statusCode: 404,
      code: 'RESOURCE_NOT_FOUND',
    });
  });

  it('composes one explicit adapter for both P04 ports', () => {
    const harness = createScopeHarness();
    const foundation = createPhaseFourFoundation(
      harness.classrooms as unknown as ClassroomRepository,
      harness.enrollments as unknown as EnrollmentRepository,
    );
    expect(foundation.classroomScopeReader).toBe(foundation.enrollmentAccessReader);
    expect(Object.isFrozen(foundation)).toBe(true);
  });
});
