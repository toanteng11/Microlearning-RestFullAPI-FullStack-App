import { createHash, randomUUID } from 'node:crypto';

import mongoose from 'mongoose';
import pino from 'pino';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { AuditLogModel } from '../../src/modules/audit/audit-log.model.js';
import { AuthSessionModel } from '../../src/modules/sessions/auth-session.model.js';
import { ClassroomModel } from '../../src/modules/classrooms/classroom.model.js';
import { CourseModel } from '../../src/modules/courses/course.model.js';
import { EnrollmentModel } from '../../src/modules/enrollments/enrollment.model.js';
import { LessonModel } from '../../src/modules/lessons/lesson.model.js';
import { CourseModuleModel } from '../../src/modules/modules/module.model.js';
import { UserModel } from '../../src/modules/users/user.model.js';
import type { UserRole } from '../../src/modules/users/user.types.js';
import { AccessTokenService } from '../../src/shared/auth/access-token.js';
import { initializePhaseFourIndexes } from '../../src/shared/database/phase-four-indexes.js';
import { testConfig, testRuntimeInfo } from '../test-fixtures.js';

const integrationUri = process.env.MONGODB_INTEGRATION_URI;
if (!integrationUri) {
  throw new Error('MONGODB_INTEGRATION_URI is required for Phase 04 Course/Module API tests');
}

const config = { ...testConfig, mongodbUri: integrationUri };
const app = createApp({
  config,
  logger: pino({ level: 'silent' }),
  runtimeInfo: testRuntimeInfo,
  dependencies: { getDatabaseStatus: async () => 'UP' },
});
const tokens = new AccessTokenService({
  secret: config.accessTokenSecret,
  issuer: config.accessTokenIssuer,
  audience: config.accessTokenAudience,
  ttlSeconds: config.accessTokenTtlSeconds,
});

let identitySequence = 0;

async function createIdentity(role: UserRole) {
  identitySequence += 1;
  const suffix = `${role.toLowerCase()}-p04-${identitySequence}`;
  const user = await UserModel.create({
    email: `${suffix}@example.test`,
    fullName: `${role} Phase Four ${identitySequence}`,
    fullNameNormalized: `${role.toLowerCase()} phase four ${identitySequence}`,
    passwordHash: 'synthetic-hash-not-used-for-login',
    role,
    status: 'ACTIVE',
    registrationSource:
      role === 'STUDENT'
        ? 'SELF_REGISTRATION'
        : role === 'TEACHER'
          ? 'TEACHER_INVITATION'
          : 'ADMIN_BOOTSTRAP',
    studentCode: role === 'STUDENT' ? `P04ST${String(identitySequence).padStart(4, '0')}` : null,
    activatedAt: new Date(),
  });
  const familyId = randomUUID();
  await AuthSessionModel.create({
    userId: user._id,
    familyId,
    tokenHash: createHash('sha256').update(randomUUID()).digest('hex'),
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + 300_000),
  });
  return { user, accessToken: await tokens.sign(user._id.toString(), familyId) };
}

function bearer(accessToken: string) {
  return `Bearer ${accessToken}`;
}

async function createClassroom(ownerTeacherId: mongoose.Types.ObjectId) {
  return ClassroomModel.create({
    name: 'Phase 04 Backend Classroom',
    nameNormalized: 'phase 04 backend classroom',
    description: 'Course and Module integration fixture',
    ownerTeacherId,
    status: 'ACTIVE',
    enrollmentStatus: 'OPEN',
    allowClassCodeJoin: true,
    allowInviteLinkJoin: true,
  });
}

async function createCourse(
  accessToken: string,
  classroomId: string,
  title = 'Backend Fundamentals',
) {
  return request(app)
    .post('/api/v1/courses')
    .set('Authorization', bearer(accessToken))
    .send({ classroomId, title, description: 'Short REST API lessons' })
    .expect(201);
}

async function createModule(accessToken: string, courseId: string, title: string) {
  return request(app)
    .post(`/api/v1/courses/${courseId}/modules`)
    .set('Authorization', bearer(accessToken))
    .send({ title, description: `${title} description` })
    .expect(201);
}

describe('Phase 04 Course and Module API on MongoDB replica set', () => {
  beforeAll(async () => {
    await mongoose.connect(integrationUri, { serverSelectionTimeoutMS: 15_000 });
    await Promise.all([
      UserModel.syncIndexes(),
      AuthSessionModel.syncIndexes(),
      AuditLogModel.syncIndexes(),
      ClassroomModel.syncIndexes(),
      EnrollmentModel.syncIndexes(),
    ]);
    await initializePhaseFourIndexes('test');
  });

  beforeEach(async () => {
    identitySequence = 0;
    await Promise.all([
      UserModel.deleteMany({}),
      AuthSessionModel.deleteMany({}),
      AuditLogModel.deleteMany({}),
      ClassroomModel.deleteMany({}),
      EnrollmentModel.deleteMany({}),
      CourseModel.deleteMany({}),
      CourseModuleModel.deleteMany({}),
      LessonModel.deleteMany({}),
    ]);
  });

  afterAll(async () => mongoose.disconnect());

  it('creates, lists and updates a Course with ownership, CAS and mass-assignment controls', async () => {
    const teacher = await createIdentity('TEACHER');
    const otherTeacher = await createIdentity('TEACHER');
    const student = await createIdentity('STUDENT');
    const admin = await createIdentity('ADMIN');
    const classroom = await createClassroom(teacher.user._id);
    await EnrollmentModel.create({
      classroomId: classroom._id,
      studentId: student.user._id,
      status: 'ACTIVE',
      joinedBy: 'CLASS_CODE',
      joinedAt: new Date(),
    });

    const created = await createCourse(teacher.accessToken, classroom._id.toString());
    expect(created.body.data.course).toMatchObject({
      title: 'Backend Fundamentals',
      status: 'DRAFT',
      structureRevision: 0,
    });
    const courseId = created.body.data.course.id as string;

    const teacherList = await request(app)
      .get(`/api/v1/courses?classroomId=${classroom._id}&search=fundamentals`)
      .set('Authorization', bearer(teacher.accessToken))
      .expect(200);
    expect(teacherList.body.data.items).toHaveLength(1);
    expect(teacherList.body.meta).toMatchObject({ totalItems: 1, totalPages: 1 });

    const studentList = await request(app)
      .get(`/api/v1/courses?classroomId=${classroom._id}`)
      .set('Authorization', bearer(student.accessToken))
      .expect(200);
    expect(studentList.body.data.items).toHaveLength(0);

    await request(app)
      .get(`/api/v1/courses?classroomId=${classroom._id}`)
      .set('Authorization', bearer(otherTeacher.accessToken))
      .expect(404);
    await request(app)
      .post('/api/v1/courses')
      .set('Authorization', bearer(student.accessToken))
      .send({ classroomId: classroom._id, title: 'Forbidden Student Course' })
      .expect(403);
    await request(app)
      .post('/api/v1/courses')
      .set('Authorization', bearer(admin.accessToken))
      .send({ classroomId: classroom._id, title: 'Forbidden Admin Course' })
      .expect(403);
    await request(app)
      .post('/api/v1/courses')
      .set('Authorization', bearer(teacher.accessToken))
      .send({
        classroomId: classroom._id,
        title: 'Injected Course',
        status: 'PUBLISHED',
        ownerTeacherId: otherTeacher.user._id,
        structureRevision: 99,
      })
      .expect(422);

    const updated = await request(app)
      .patch(`/api/v1/courses/${courseId}`)
      .set('Authorization', bearer(teacher.accessToken))
      .send({
        title: 'Backend Fundamentals Updated',
        expectedUpdatedAt: created.body.data.course.updatedAt,
      })
      .expect(200);
    expect(updated.body.data.course.title).toBe('Backend Fundamentals Updated');

    await request(app)
      .patch(`/api/v1/courses/${courseId}`)
      .set('Authorization', bearer(teacher.accessToken))
      .send({ title: 'Stale Update', expectedUpdatedAt: created.body.data.course.updatedAt })
      .expect(409);
    await request(app)
      .patch(`/api/v1/courses/${courseId}`)
      .set('Authorization', bearer(otherTeacher.accessToken))
      .send({ title: 'Foreign Update', expectedUpdatedAt: updated.body.data.course.updatedAt })
      .expect(404);

    expect(await AuditLogModel.countDocuments({ resourceType: 'Course' })).toBe(2);
  });

  it('enforces publish prerequisites and exposes only the Student Course projection', async () => {
    const teacher = await createIdentity('TEACHER');
    const student = await createIdentity('STUDENT');
    const classroom = await createClassroom(teacher.user._id);
    const enrollment = await EnrollmentModel.create({
      classroomId: classroom._id,
      studentId: student.user._id,
      status: 'ACTIVE',
      joinedBy: 'CLASS_CODE',
      joinedAt: new Date(),
    });
    const created = await createCourse(teacher.accessToken, classroom._id.toString());
    const courseId = created.body.data.course.id as string;

    const missingPrerequisite = await request(app)
      .patch(`/api/v1/courses/${courseId}/status`)
      .set('Authorization', bearer(teacher.accessToken))
      .send({
        targetStatus: 'PUBLISHED',
        expectedUpdatedAt: created.body.data.course.updatedAt,
      })
      .expect(409);
    expect(missingPrerequisite.body.error.code).toBe('COURSE_PUBLISH_PREREQUISITE_FAILED');

    const createdModule = await createModule(teacher.accessToken, courseId, 'REST Basics');
    const publishedModule = await request(app)
      .patch(`/api/v1/modules/${createdModule.body.data.module.id}/status`)
      .set('Authorization', bearer(teacher.accessToken))
      .send({
        targetStatus: 'PUBLISHED',
        expectedUpdatedAt: createdModule.body.data.module.updatedAt,
      })
      .expect(200);
    expect(publishedModule.body.data.module.status).toBe('PUBLISHED');

    await LessonModel.create({
      courseId,
      moduleId: createdModule.body.data.module.id,
      title: 'REST resource naming',
      content: 'Use nouns for resource paths.',
      estimatedMinutes: 8,
      isRequired: true,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      publishedRevision: 1,
      completionDeadline: new Date(Date.now() + 86_400_000),
      displayOrder: 0,
      createdBy: teacher.user._id,
      updatedBy: teacher.user._id,
    });
    const current = await request(app)
      .get(`/api/v1/courses/${courseId}`)
      .set('Authorization', bearer(teacher.accessToken))
      .expect(200);
    const scheduled = await request(app)
      .patch(`/api/v1/courses/${courseId}/status`)
      .set('Authorization', bearer(teacher.accessToken))
      .send({
        targetStatus: 'SCHEDULED',
        scheduledPublishAt: new Date(Date.now() + 60_000).toISOString(),
        expectedUpdatedAt: current.body.data.course.updatedAt,
      })
      .expect(200);
    expect(scheduled.body.data.course).toMatchObject({
      status: 'SCHEDULED',
      effectiveStatus: 'SCHEDULED',
    });
    const hiddenBeforeSchedule = await request(app)
      .get(`/api/v1/courses?classroomId=${classroom._id}`)
      .set('Authorization', bearer(student.accessToken))
      .expect(200);
    expect(hiddenBeforeSchedule.body.data.items).toHaveLength(0);

    const cancelled = await request(app)
      .patch(`/api/v1/courses/${courseId}/status`)
      .set('Authorization', bearer(teacher.accessToken))
      .send({ targetStatus: 'DRAFT', expectedUpdatedAt: scheduled.body.data.course.updatedAt })
      .expect(200);
    const published = await request(app)
      .patch(`/api/v1/courses/${courseId}/status`)
      .set('Authorization', bearer(teacher.accessToken))
      .send({ targetStatus: 'PUBLISHED', expectedUpdatedAt: cancelled.body.data.course.updatedAt })
      .expect(200);
    expect(published.body.data.course.status).toBe('PUBLISHED');

    const studentList = await request(app)
      .get(`/api/v1/courses?classroomId=${classroom._id}`)
      .set('Authorization', bearer(student.accessToken))
      .expect(200);
    expect(studentList.body.data.items).toHaveLength(1);
    expect(studentList.body.data.items[0]).toMatchObject({
      id: courseId,
      title: 'Backend Fundamentals',
    });
    expect(studentList.body.data.items[0]).not.toHaveProperty('status');
    expect(studentList.body.data.items[0]).not.toHaveProperty('structureRevision');
    expect(studentList.body.data.items[0]).not.toHaveProperty('updatedBy');

    await createModule(teacher.accessToken, courseId, 'Teacher Draft Module');
    const studentModules = await request(app)
      .get(`/api/v1/courses/${courseId}/modules`)
      .set('Authorization', bearer(student.accessToken))
      .expect(200);
    expect(studentModules.body.data.items).toHaveLength(1);
    expect(studentModules.body.data.items[0]).toMatchObject({
      id: createdModule.body.data.module.id,
      title: 'REST Basics',
    });
    expect(studentModules.body.data.items[0]).not.toHaveProperty('status');

    await EnrollmentModel.findByIdAndUpdate(enrollment._id, { status: 'REMOVED' });
    await request(app)
      .get(`/api/v1/courses?classroomId=${classroom._id}`)
      .set('Authorization', bearer(student.accessToken))
      .expect(404);
  });

  it('reorders the exact active Module set atomically and rejects stale concurrent writes', async () => {
    const teacher = await createIdentity('TEACHER');
    const classroom = await createClassroom(teacher.user._id);
    const created = await createCourse(teacher.accessToken, classroom._id.toString());
    const courseId = created.body.data.course.id as string;
    const first = await createModule(teacher.accessToken, courseId, 'Module A');
    const second = await createModule(teacher.accessToken, courseId, 'Module B');
    const third = await createModule(teacher.accessToken, courseId, 'Module C');
    const ids = [first, second, third].map((response) => response.body.data.module.id as string);
    const before = await CourseModel.findById(courseId).lean();
    expect(before?.structureRevision).toBe(3);

    const mismatch = await request(app)
      .patch(`/api/v1/courses/${courseId}/modules/reorder`)
      .set('Authorization', bearer(teacher.accessToken))
      .send({ orderedModuleIds: [ids[0], ids[0], ids[2]], expectedStructureRevision: 3 })
      .expect(422);
    expect(mismatch.body.error.code).toBe('ORDER_SET_MISMATCH');

    const responses = await Promise.all([
      request(app)
        .patch(`/api/v1/courses/${courseId}/modules/reorder`)
        .set('Authorization', bearer(teacher.accessToken))
        .send({ orderedModuleIds: [ids[2], ids[1], ids[0]], expectedStructureRevision: 3 }),
      request(app)
        .patch(`/api/v1/courses/${courseId}/modules/reorder`)
        .set('Authorization', bearer(teacher.accessToken))
        .send({ orderedModuleIds: [ids[1], ids[0], ids[2]], expectedStructureRevision: 3 }),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);

    const course = await CourseModel.findById(courseId).lean();
    const modules = await CourseModuleModel.find({ courseId, status: { $ne: 'ARCHIVED' } })
      .sort({ displayOrder: 1, _id: 1 })
      .lean();
    const winningIds = responses
      .find((response) => response.status === 200)
      ?.body.data.items.map((module: { id: string }) => module.id);
    expect(course?.structureRevision).toBe(4);
    expect(modules.map((module) => module.displayOrder)).toEqual([0, 1, 2]);
    expect(modules.map((module) => module._id.toString())).toEqual(winningIds);
    expect(await AuditLogModel.countDocuments({ action: 'MODULES_REORDERED' })).toBe(1);
  });

  it('soft archives Course and Module while preserving child Lessons and audit history', async () => {
    const teacher = await createIdentity('TEACHER');
    const classroom = await createClassroom(teacher.user._id);
    const created = await createCourse(teacher.accessToken, classroom._id.toString());
    const courseId = created.body.data.course.id as string;
    const createdModule = await createModule(teacher.accessToken, courseId, 'Module With Lesson');
    const moduleId = createdModule.body.data.module.id as string;
    const lesson = await LessonModel.create({
      courseId,
      moduleId,
      title: 'Preserved Lesson',
      content: 'This Lesson must remain after parent archive.',
      estimatedMinutes: 5,
      displayOrder: 0,
      createdBy: teacher.user._id,
      updatedBy: teacher.user._id,
    });

    await request(app)
      .delete(`/api/v1/modules/${moduleId}`)
      .set('Authorization', bearer(teacher.accessToken))
      .send({ expectedUpdatedAt: createdModule.body.data.module.updatedAt })
      .expect(422);
    await request(app)
      .delete(`/api/v1/modules/${moduleId}`)
      .set('Authorization', bearer(teacher.accessToken))
      .send({
        reason: 'Module structure has been replaced',
        expectedUpdatedAt: createdModule.body.data.module.updatedAt,
      })
      .expect(204);
    expect(await LessonModel.exists({ _id: lesson._id })).toBeTruthy();
    expect(await CourseModuleModel.findById(moduleId).lean()).toMatchObject({ status: 'ARCHIVED' });
    expect(await CourseModel.findById(courseId).lean()).toMatchObject({ structureRevision: 2 });

    const currentCourse = await request(app)
      .get(`/api/v1/courses/${courseId}`)
      .set('Authorization', bearer(teacher.accessToken))
      .expect(200);
    await request(app)
      .delete(`/api/v1/courses/${courseId}`)
      .set('Authorization', bearer(teacher.accessToken))
      .send({
        reason: 'Course retired after curriculum review',
        expectedUpdatedAt: currentCourse.body.data.course.updatedAt,
      })
      .expect(204);
    expect(await CourseModel.findById(courseId).lean()).toMatchObject({ status: 'ARCHIVED' });
    expect(await CourseModuleModel.exists({ _id: moduleId })).toBeTruthy();
    expect(await LessonModel.exists({ _id: lesson._id })).toBeTruthy();
    expect(
      await AuditLogModel.countDocuments({
        action: { $in: ['MODULE_ARCHIVED', 'COURSE_ARCHIVED'] },
      }),
    ).toBe(2);
  });
});
