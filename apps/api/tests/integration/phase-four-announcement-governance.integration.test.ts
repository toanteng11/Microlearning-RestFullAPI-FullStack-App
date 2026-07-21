import { createHash, randomUUID } from 'node:crypto';

import mongoose from 'mongoose';
import pino from 'pino';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../../src/app.js';
import { AnnouncementModel } from '../../src/modules/announcements/announcement.model.js';
import { PhaseFourAuditWriter } from '../../src/modules/audit/phase-four-audit.writer.js';
import { AuditLogModel } from '../../src/modules/audit/audit-log.model.js';
import { ClassroomModel } from '../../src/modules/classrooms/classroom.model.js';
import { CourseModel } from '../../src/modules/courses/course.model.js';
import { EnrollmentModel } from '../../src/modules/enrollments/enrollment.model.js';
import { LearningProgressModel } from '../../src/modules/learning-progress/learning-progress.model.js';
import { LessonModel } from '../../src/modules/lessons/lesson.model.js';
import { CourseModuleModel } from '../../src/modules/modules/module.model.js';
import { AuthSessionModel } from '../../src/modules/sessions/auth-session.model.js';
import { UserModel } from '../../src/modules/users/user.model.js';
import type { UserRole } from '../../src/modules/users/user.types.js';
import { AccessTokenService } from '../../src/shared/auth/access-token.js';
import { initializePhaseFourIndexes } from '../../src/shared/database/phase-four-indexes.js';
import { testConfig, testRuntimeInfo } from '../test-fixtures.js';

const integrationUri = process.env.MONGODB_INTEGRATION_URI;
if (!integrationUri) throw new Error('MONGODB_INTEGRATION_URI is required for Phase 04 tests');

const config = { ...testConfig, mongodbUri: integrationUri };
const app = createApp({
  config,
  logger: pino({ level: 'silent' }),
  runtimeInfo: testRuntimeInfo,
  dependencies: { getDatabaseStatus: async () => 'UP' },
});
const tokenService = new AccessTokenService({
  secret: config.accessTokenSecret,
  issuer: config.accessTokenIssuer,
  audience: config.accessTokenAudience,
  ttlSeconds: config.accessTokenTtlSeconds,
});

let sequence = 0;

async function identity(role: UserRole, label: string) {
  sequence += 1;
  const user = await UserModel.create({
    email: `${label.toLowerCase().replaceAll(' ', '.')}-${sequence}@example.test`,
    fullName: label,
    fullNameNormalized: label.toLowerCase(),
    passwordHash: 'synthetic-hash-not-used-for-login',
    role,
    status: 'ACTIVE',
    registrationSource:
      role === 'STUDENT'
        ? 'SELF_REGISTRATION'
        : role === 'TEACHER'
          ? 'TEACHER_INVITATION'
          : 'ADMIN_BOOTSTRAP',
    studentCode: role === 'STUDENT' ? `P04AG${String(sequence).padStart(4, '0')}` : null,
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
  return { user, token: await tokenService.sign(user._id.toString(), familyId) };
}

function bearer(token: string) {
  return `Bearer ${token}`;
}

async function fixture() {
  const teacher = await identity('TEACHER', 'Teacher Owner');
  const foreignTeacher = await identity('TEACHER', 'Teacher Foreign');
  const student = await identity('STUDENT', 'Student Active');
  const removedStudent = await identity('STUDENT', 'Student Removed');
  const admin = await identity('ADMIN', 'Admin Governance');
  const classroom = await ClassroomModel.create({
    name: 'Announcement Classroom',
    nameNormalized: 'announcement classroom',
    description: 'Classroom governance metadata',
    ownerTeacherId: teacher.user._id,
    status: 'ACTIVE',
    enrollmentStatus: 'OPEN',
    allowClassCodeJoin: true,
    allowInviteLinkJoin: true,
  });
  await EnrollmentModel.insertMany([
    {
      classroomId: classroom._id,
      studentId: student.user._id,
      status: 'ACTIVE',
      joinedBy: 'CLASS_CODE',
      joinedAt: new Date(),
    },
    {
      classroomId: classroom._id,
      studentId: removedStudent.user._id,
      status: 'REMOVED',
      joinedBy: 'INVITE_LINK',
      joinedAt: new Date(),
      removedAt: new Date(),
      removedBy: teacher.user._id,
      removalReason: 'No longer enrolled',
    },
  ]);
  return { teacher, foreignTeacher, student, removedStudent, admin, classroom };
}

describe('Phase 04 Announcement and content governance on MongoDB replica set', () => {
  beforeAll(async () => {
    await mongoose.connect(integrationUri, { serverSelectionTimeoutMS: 15_000 });
    await initializePhaseFourIndexes('test');
  });

  beforeEach(async () => {
    vi.restoreAllMocks();
    sequence = 0;
    await Promise.all([
      UserModel.deleteMany({}),
      AuthSessionModel.deleteMany({}),
      ClassroomModel.deleteMany({}),
      EnrollmentModel.deleteMany({}),
      CourseModel.deleteMany({}),
      CourseModuleModel.deleteMany({}),
      LessonModel.deleteMany({}),
      LearningProgressModel.deleteMany({}),
      AnnouncementModel.deleteMany({}),
      AuditLogModel.deleteMany({}),
    ]);
  });

  afterAll(async () => mongoose.disconnect());

  it('runs the owned Announcement lifecycle and exposes only sanitized visible Stream data', async () => {
    const data = await fixture();
    const created = await request(app)
      .post(`/api/v1/classrooms/${data.classroom._id}/announcements`)
      .set('Authorization', bearer(data.teacher.token))
      .send({ content: '# Notice\n\n<script>alert(1)</script>Complete **Lesson 1**.' })
      .expect(201);

    expect(created.body.data.announcement).toMatchObject({ status: 'DRAFT' });
    expect(created.body.data.announcement.contentHtml).not.toContain('<script>');
    const announcementId = created.body.data.announcement.id as string;

    const hiddenDraft = await request(app)
      .get(`/api/v1/classrooms/${data.classroom._id}/announcements`)
      .set('Authorization', bearer(data.student.token))
      .expect(200);
    expect(hiddenDraft.body.data.items).toEqual([]);

    const updated = await request(app)
      .patch(`/api/v1/announcements/${announcementId}`)
      .set('Authorization', bearer(data.teacher.token))
      .send({
        content: 'Updated **public** notice. <img src=x onerror=alert(1)>',
        expectedUpdatedAt: created.body.data.announcement.updatedAt,
      })
      .expect(200);
    const published = await request(app)
      .patch(`/api/v1/announcements/${announcementId}/status`)
      .set('Authorization', bearer(data.teacher.token))
      .send({
        targetStatus: 'PUBLISHED',
        expectedUpdatedAt: updated.body.data.announcement.updatedAt,
      })
      .expect(200);
    expect(published.body.data.announcement.status).toBe('PUBLISHED');

    const stream = await request(app)
      .get(`/api/v1/classrooms/${data.classroom._id}/announcements`)
      .set('Authorization', bearer(data.student.token))
      .expect(200);
    expect(stream.body.data.items).toHaveLength(1);
    expect(stream.body.data.items[0].contentHtml).toContain('<strong>public</strong>');
    expect(stream.body.data.items[0].contentHtml).not.toContain('onerror');
    expect(stream.body.data.items[0]).not.toHaveProperty('content');
    expect(stream.body.data.items[0]).not.toHaveProperty('status');
    expect(stream.body.data.items[0]).not.toHaveProperty('allowedActions');

    const unpublished = await request(app)
      .patch(`/api/v1/announcements/${announcementId}/status`)
      .set('Authorization', bearer(data.teacher.token))
      .send({
        targetStatus: 'UNPUBLISHED',
        expectedUpdatedAt: published.body.data.announcement.updatedAt,
      })
      .expect(200);
    const hiddenAfterUnpublish = await request(app)
      .get(`/api/v1/classrooms/${data.classroom._id}/announcements`)
      .set('Authorization', bearer(data.student.token))
      .expect(200);
    expect(hiddenAfterUnpublish.body.data.items).toEqual([]);

    await request(app)
      .delete(`/api/v1/announcements/${announcementId}`)
      .set('Authorization', bearer(data.teacher.token))
      .send({
        reason: 'Notice is no longer applicable',
        expectedUpdatedAt: unpublished.body.data.announcement.updatedAt,
      })
      .expect(204);

    const actions = await AuditLogModel.find({ resourceId: announcementId })
      .sort({ createdAt: 1 })
      .lean();
    expect(actions.map((item) => item.action)).toEqual([
      'ANNOUNCEMENT_CREATED',
      'ANNOUNCEMENT_UPDATED',
      'ANNOUNCEMENT_STATUS_CHANGED',
      'ANNOUNCEMENT_STATUS_CHANGED',
      'ANNOUNCEMENT_ARCHIVED',
    ]);
    expect(JSON.stringify(actions)).not.toContain('Updated **public** notice');
  });

  it('honors scheduled visibility, stable pagination and role or enrollment boundaries', async () => {
    const data = await fixture();
    const create = async (content: string) =>
      request(app)
        .post(`/api/v1/classrooms/${data.classroom._id}/announcements`)
        .set('Authorization', bearer(data.teacher.token))
        .send({ content })
        .expect(201);

    const first = await create('Scheduled first notice');
    const second = await create('Published second notice');
    const future = new Date(Date.now() + 3_600_000).toISOString();
    await request(app)
      .patch(`/api/v1/announcements/${first.body.data.announcement.id}/status`)
      .set('Authorization', bearer(data.teacher.token))
      .send({
        targetStatus: 'SCHEDULED',
        scheduledPublishAt: future,
        expectedUpdatedAt: first.body.data.announcement.updatedAt,
      })
      .expect(200);
    await request(app)
      .patch(`/api/v1/announcements/${second.body.data.announcement.id}/status`)
      .set('Authorization', bearer(data.teacher.token))
      .send({
        targetStatus: 'PUBLISHED',
        expectedUpdatedAt: second.body.data.announcement.updatedAt,
      })
      .expect(200);

    const beforeSchedule = await request(app)
      .get(`/api/v1/classrooms/${data.classroom._id}/announcements?limit=1`)
      .set('Authorization', bearer(data.student.token))
      .expect(200);
    expect(beforeSchedule.body.meta.totalItems).toBe(1);

    await AnnouncementModel.updateOne(
      { _id: first.body.data.announcement.id },
      { $set: { scheduledPublishAt: new Date(Date.now() - 60_000) } },
      { timestamps: false },
    );
    const afterSchedule = await request(app)
      .get(`/api/v1/classrooms/${data.classroom._id}/announcements?page=1&limit=1`)
      .set('Authorization', bearer(data.student.token))
      .expect(200);
    expect(afterSchedule.body.meta).toMatchObject({ totalItems: 2, totalPages: 2, page: 1 });
    expect(afterSchedule.body.data.items).toHaveLength(1);

    await request(app)
      .get(`/api/v1/classrooms/${data.classroom._id}/announcements?status=PUBLISHED`)
      .set('Authorization', bearer(data.student.token))
      .expect(422);
    await request(app)
      .post(`/api/v1/classrooms/${data.classroom._id}/announcements`)
      .set('Authorization', bearer(data.foreignTeacher.token))
      .send({ content: 'Unauthorized notice' })
      .expect(404);
    await request(app)
      .get(`/api/v1/classrooms/${data.classroom._id}/announcements`)
      .set('Authorization', bearer(data.removedStudent.token))
      .expect(404);
    await request(app)
      .post(`/api/v1/classrooms/${data.classroom._id}/announcements`)
      .set('Authorization', bearer(data.admin.token))
      .send({ content: 'Admin must not author Classroom content' })
      .expect(403);
  });

  it('returns Admin governance counts and metadata without learning content or Student progress', async () => {
    const data = await fixture();
    const course = await CourseModel.create({
      classroomId: data.classroom._id,
      ownerTeacherId: data.teacher.user._id,
      title: 'Governed REST Course',
      description: 'Sensitive authoring description must stay private',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      displayOrder: 0,
      createdBy: data.teacher.user._id,
      updatedBy: data.teacher.user._id,
    });
    const courseModule = await CourseModuleModel.create({
      courseId: course._id,
      title: 'Governed Module',
      description: 'Module authoring body',
      status: 'PUBLISHED',
      displayOrder: 0,
      createdBy: data.teacher.user._id,
      updatedBy: data.teacher.user._id,
    });
    const lesson = await LessonModel.create({
      courseId: course._id,
      moduleId: courseModule._id,
      title: 'Governed Lesson',
      content: 'Private lesson body must never appear in governance responses',
      estimatedMinutes: 10,
      isRequired: true,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      publishedRevision: 1,
      completionDeadline: new Date(Date.now() + 86_400_000),
      displayOrder: 0,
      createdBy: data.teacher.user._id,
      updatedBy: data.teacher.user._id,
    });
    await LearningProgressModel.create({
      studentId: data.student.user._id,
      courseId: course._id,
      classroomId: data.classroom._id,
      activityType: 'LESSON',
      activityId: lesson._id,
      status: 'IN_PROGRESS',
      startedAt: new Date(),
      lastActiveAt: new Date(),
    });
    await AnnouncementModel.create({
      classroomId: data.classroom._id,
      teacherId: data.teacher.user._id,
      content: 'Private draft announcement body',
      status: 'DRAFT',
      createdBy: data.teacher.user._id,
      updatedBy: data.teacher.user._id,
    });

    const courses = await request(app)
      .get(`/api/v1/admin/courses?search=Governed&ownerTeacherId=${data.teacher.user._id}`)
      .set('Authorization', bearer(data.admin.token))
      .expect(200);
    expect(courses.body.data.items).toHaveLength(1);
    expect(courses.body.data.items[0]).toMatchObject({ moduleCount: 1, lessonCount: 1 });
    expect(courses.headers['cache-control']).toContain('no-store');
    const serializedCourses = JSON.stringify(courses.body);
    expect(serializedCourses).not.toContain('Sensitive authoring description');
    expect(serializedCourses).not.toContain('Private lesson body');
    expect(serializedCourses).not.toContain(data.student.user.email);

    const courseDetail = await request(app)
      .get(`/api/v1/admin/courses/${course._id}`)
      .set('Authorization', bearer(data.admin.token))
      .expect(200);
    expect(courseDetail.body.data.course).toMatchObject({ moduleCount: 1, lessonCount: 1 });
    expect(courseDetail.body.data.course).not.toHaveProperty('description');
    expect(courseDetail.body.data.course).not.toHaveProperty('content');

    const classrooms = await request(app)
      .get('/api/v1/admin/classrooms')
      .set('Authorization', bearer(data.admin.token))
      .expect(200);
    expect(classrooms.body.data[0].contentCount).toBe(1);
    const classroomDetail = await request(app)
      .get(`/api/v1/admin/classrooms/${data.classroom._id}`)
      .set('Authorization', bearer(data.admin.token))
      .expect(200);
    expect(classroomDetail.body.data.classroom.contentSummary).toMatchObject({
      courseCount: 1,
      lessonCount: 1,
      announcementCount: 1,
    });

    await request(app)
      .get('/api/v1/admin/courses')
      .set('Authorization', bearer(data.teacher.token))
      .expect(403);
    await request(app)
      .get(`/api/v1/admin/courses/${course._id}`)
      .set('Authorization', bearer(data.student.token))
      .expect(403);
  });

  it('rolls back Announcement creation when its mandatory AuditLog cannot be written', async () => {
    const data = await fixture();
    vi.spyOn(PhaseFourAuditWriter.prototype, 'append').mockRejectedValueOnce(
      new Error('synthetic audit failure'),
    );

    await request(app)
      .post(`/api/v1/classrooms/${data.classroom._id}/announcements`)
      .set('Authorization', bearer(data.teacher.token))
      .send({ content: 'This record must roll back with the failed audit' })
      .expect(500);

    expect(await AnnouncementModel.countDocuments({ classroomId: data.classroom._id })).toBe(0);
    expect(await AuditLogModel.countDocuments({ action: 'ANNOUNCEMENT_CREATED' })).toBe(0);
  });
});
