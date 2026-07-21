import { Types } from 'mongoose';
import { describe, expect, it, vi } from 'vitest';

import { buildPhaseFourAuditInput } from '../src/modules/audit/phase-four-audit.writer.js';
import { CourseScopeRepositoryAdapter } from '../src/modules/courses/course-scope.adapter.js';
import { hasValidCoursePublishCandidate } from '../src/modules/courses/course.domain.js';
import { toStudentCourseDto, toTeacherCourseDto } from '../src/modules/courses/course.dto.js';
import type {
  CourseProjection,
  CourseRepository,
} from '../src/modules/courses/course.repository.js';
import {
  changeCourseStatusSchema,
  createCourseSchema,
  updateCourseSchema,
} from '../src/modules/courses/course.schemas.js';
import type { ClassroomScopeReader } from '../src/modules/learning-content/classroom-scope.reader.js';
import { reorderModulesSchema } from '../src/modules/modules/module.schemas.js';

const now = new Date('2026-07-20T08:00:00.000Z');

function courseFixture(patch: Partial<CourseProjection> = {}): CourseProjection {
  const actorId = new Types.ObjectId();
  return {
    _id: new Types.ObjectId(),
    classroomId: new Types.ObjectId(),
    ownerTeacherId: actorId,
    title: 'Backend Fundamentals',
    description: 'REST API course',
    status: 'DRAFT',
    scheduledPublishAt: null,
    publishedAt: null,
    unpublishedAt: null,
    archivedAt: null,
    displayOrder: 0,
    structureRevision: 0,
    schemaVersion: 1,
    createdBy: actorId,
    updatedBy: actorId,
    createdAt: now,
    updatedAt: now,
    ...patch,
  };
}

describe('Phase 04 Course and Module request contracts', () => {
  it('normalizes mutable fields and rejects mass assignment', () => {
    expect(
      createCourseSchema.parse({
        classroomId: new Types.ObjectId().toString(),
        title: '  Backend   Fundamentals  ',
        description: '  Short lessons  ',
      }),
    ).toMatchObject({ title: 'Backend Fundamentals', description: 'Short lessons' });

    expect(
      createCourseSchema.safeParse({
        classroomId: new Types.ObjectId().toString(),
        title: 'Backend Fundamentals',
        status: 'PUBLISHED',
        ownerTeacherId: new Types.ObjectId().toString(),
      }).success,
    ).toBe(false);
    expect(updateCourseSchema.safeParse({ expectedUpdatedAt: now.toISOString() }).success).toBe(
      false,
    );
  });

  it('requires schedule time only for SCHEDULED and keeps reorder validation bounded', () => {
    expect(
      changeCourseStatusSchema.safeParse({
        targetStatus: 'SCHEDULED',
        expectedUpdatedAt: now.toISOString(),
      }).success,
    ).toBe(false);
    expect(
      changeCourseStatusSchema.safeParse({
        targetStatus: 'PUBLISHED',
        scheduledPublishAt: new Date(now.getTime() + 60_000).toISOString(),
        expectedUpdatedAt: now.toISOString(),
      }).success,
    ).toBe(false);
    expect(
      reorderModulesSchema.safeParse({
        orderedModuleIds: [new Types.ObjectId().toString()],
        expectedStructureRevision: 2,
      }).success,
    ).toBe(true);
  });
});

describe('Phase 04 Course publish and projection policies', () => {
  it('accepts only a required visible Lesson with a future deadline', () => {
    const moduleId = new Types.ObjectId();
    const lesson = {
      _id: new Types.ObjectId(),
      moduleId,
      status: 'PUBLISHED' as const,
      scheduledPublishAt: null,
      completionDeadline: new Date(now.getTime() + 60_000),
    };
    expect(
      hasValidCoursePublishCandidate([lesson], new Map([[moduleId.toString(), 'PUBLISHED']]), now),
    ).toBe(true);
    expect(
      hasValidCoursePublishCandidate([lesson], new Map([[moduleId.toString(), 'DRAFT']]), now),
    ).toBe(false);
    expect(
      hasValidCoursePublishCandidate(
        [{ ...lesson, moduleId: null, completionDeadline: now }],
        new Map(),
        now,
      ),
    ).toBe(false);
  });

  it('keeps Student DTO free of authoring, audit and revision fields', () => {
    const course = courseFixture({ status: 'PUBLISHED', publishedAt: now });
    const student = toStudentCourseDto(course);
    const teacher = toTeacherCourseDto(
      course,
      {
        id: course.ownerTeacherId.toString(),
        role: 'TEACHER',
        status: 'ACTIVE',
        familyId: 'family',
        capabilities: [],
      },
      now,
    );
    expect(student).toMatchObject({ title: course.title, publishedAt: now.toISOString() });
    expect(student).not.toHaveProperty('status');
    expect(student).not.toHaveProperty('structureRevision');
    expect(student).not.toHaveProperty('updatedBy');
    expect(teacher).toMatchObject({ status: 'PUBLISHED', effectiveStatus: 'PUBLISHED' });
  });
});

describe('Phase 04 scoped access and audit redaction', () => {
  it('resolves current Classroom ownership and effective Student visibility', async () => {
    const course = courseFixture({ status: 'SCHEDULED', scheduledPublishAt: now });
    const courses = { findById: vi.fn(async () => course) } as unknown as CourseRepository;
    const classrooms = {
      getTeacherOwnedScope: vi.fn(async () => ({
        classroomId: course.classroomId.toString(),
        ownerTeacherId: course.ownerTeacherId.toString(),
        status: 'ACTIVE' as const,
      })),
      getStudentEnrollmentScope: vi.fn(async () => ({
        classroomId: course.classroomId.toString(),
        enrollmentId: new Types.ObjectId().toString(),
        classroomStatus: 'ACTIVE' as const,
        enrollmentStatus: 'ACTIVE' as const,
      })),
    } satisfies ClassroomScopeReader;
    const adapter = new CourseScopeRepositoryAdapter(courses, classrooms, () => now);

    await expect(
      adapter.requireTeacherManage(course.ownerTeacherId.toString(), course._id.toString()),
    ).resolves.toMatchObject({ classroomStatus: 'ACTIVE', effectiveStatus: 'PUBLISHED' });
    await expect(
      adapter.requireStudentView(new Types.ObjectId().toString(), course._id.toString()),
    ).resolves.toMatchObject({ effectiveStatus: 'PUBLISHED' });
  });

  it('allowlists audit state and metadata without storing descriptions or ordered IDs', () => {
    const audit = buildPhaseFourAuditInput({
      actorId: new Types.ObjectId(),
      actorRole: 'TEACHER',
      action: 'MODULES_REORDERED',
      resourceId: new Types.ObjectId().toString(),
      requestId: 'request-phase-four',
      oldValue: { structureRevision: 1, description: 'private body' },
      newValue: { structureRevision: 2, orderedModuleIds: ['secret-shape'] },
      metadata: { courseId: 'course-id', moduleCount: 2, rawBody: 'not-allowed' },
    });

    expect(audit.oldValue).toEqual({ structureRevision: 1 });
    expect(audit.newValue).toEqual({ structureRevision: 2 });
    expect(audit.metadata).toEqual({ courseId: 'course-id', moduleCount: 2 });
    expect(JSON.stringify(audit)).not.toContain('private body');
    expect(JSON.stringify(audit)).not.toContain('secret-shape');
  });
});
