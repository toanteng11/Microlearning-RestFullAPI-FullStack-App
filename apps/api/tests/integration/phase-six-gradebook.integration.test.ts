import { createHash, randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';

import mongoose from 'mongoose';
import pino from 'pino';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { AssignmentModel } from '../../src/modules/assignments/assignment.model.js';
import { AuthSessionModel } from '../../src/modules/sessions/auth-session.model.js';
import { ClassroomModel } from '../../src/modules/classrooms/classroom.model.js';
import { CourseModel } from '../../src/modules/courses/course.model.js';
import { EnrollmentModel } from '../../src/modules/enrollments/enrollment.model.js';
import { GradeModel } from '../../src/modules/grades/grade.model.js';
import { LearningProgressModel } from '../../src/modules/learning-progress/learning-progress.model.js';
import { CourseProgressSummaryModel } from '../../src/modules/reporting/course-progress-summary.model.js';
import { ReportingInvalidationModel } from '../../src/modules/reporting/reporting-invalidation.model.js';
import { SubmissionModel } from '../../src/modules/submissions/submission.model.js';
import { UserModel } from '../../src/modules/users/user.model.js';
import type { UserRole } from '../../src/modules/users/user.types.js';
import { AccessTokenService } from '../../src/shared/auth/access-token.js';
import { initializePhaseFourIndexes } from '../../src/shared/database/phase-four-indexes.js';
import { initializePhaseSixIndexes } from '../../src/shared/database/phase-six-indexes.js';
import { testConfig, testRuntimeInfo } from '../test-fixtures.js';

const integrationUri = process.env.MONGODB_INTEGRATION_URI;
if (!integrationUri) throw new Error('MONGODB_INTEGRATION_URI is required for Phase 06 tests');
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

async function identity(role: UserRole) {
  sequence += 1;
  const user = await UserModel.create({
    email: `${role.toLowerCase()}-gradebook-${sequence}@example.test`,
    fullName: `${role} Gradebook ${sequence}`,
    fullNameNormalized: `${role.toLowerCase()} gradebook ${sequence}`,
    passwordHash: 'synthetic-hash',
    role,
    status: 'ACTIVE',
    registrationSource: role === 'STUDENT' ? 'SELF_REGISTRATION' : 'TEACHER_INVITATION',
    studentCode: role === 'STUDENT' ? `GB${String(sequence).padStart(5, '0')}` : null,
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
  const teacher = await identity('TEACHER');
  const otherTeacher = await identity('TEACHER');
  const firstStudent = await identity('STUDENT');
  const secondStudent = await identity('STUDENT');
  const now = new Date();
  const classroom = await ClassroomModel.create({
    name: 'Gradebook Classroom',
    nameNormalized: 'gradebook classroom',
    ownerTeacherId: teacher.user._id,
    status: 'ACTIVE',
    enrollmentStatus: 'OPEN',
    allowClassCodeJoin: true,
    allowInviteLinkJoin: true,
  });
  await EnrollmentModel.insertMany(
    [firstStudent, secondStudent].map((student) => ({
      classroomId: classroom._id,
      studentId: student.user._id,
      status: 'ACTIVE',
      joinedBy: 'CLASS_CODE',
      joinedAt: now,
    })),
  );
  const course = await CourseModel.create({
    classroomId: classroom._id,
    ownerTeacherId: teacher.user._id,
    title: 'Gradebook Course',
    description: '',
    status: 'PUBLISHED',
    publishedAt: now,
    displayOrder: 0,
    createdBy: teacher.user._id,
    updatedBy: teacher.user._id,
  });
  const assignment = await AssignmentModel.create({
    classroomId: classroom._id,
    courseId: course._id,
    moduleId: null,
    title: 'REST Assignment',
    instruction: 'Submit the API exercise',
    maxScore: 20,
    isRequired: true,
    allowedSubmissionTypes: ['TEXT'],
    allowLateSubmission: true,
    allowUnsubmit: false,
    allowResubmit: true,
    availableFrom: null,
    dueDate: new Date(now.getTime() - 86_400_000),
    status: 'PUBLISHED',
    displayOrder: 0,
    contentRevision: 1,
    publishedRevision: 1,
    publishedAt: now,
    createdBy: teacher.user._id,
    updatedBy: teacher.user._id,
  });
  const submission = await SubmissionModel.create({
    assignmentId: assignment._id,
    studentId: firstStudent.user._id,
    classroomId: classroom._id,
    courseId: course._id,
    status: 'RETURNED',
    submissionType: 'TEXT',
    textAnswer: 'private submission body',
    links: [],
    markDone: false,
    revision: 3,
    submittedRevision: 1,
    submittedAt: now,
    isLate: true,
    effectiveDeadlineAtSubmit: assignment.dueDate,
    gradedAt: now,
    returnedAt: now,
  });
  await Promise.all([
    LearningProgressModel.create({
      studentId: firstStudent.user._id,
      classroomId: classroom._id,
      courseId: course._id,
      activityType: 'ASSIGNMENT',
      activityId: assignment._id,
      status: 'COMPLETED',
      startedAt: now,
      completedAt: now,
      lastActiveAt: now,
    }),
    GradeModel.create({
      studentId: firstStudent.user._id,
      classroomId: classroom._id,
      courseId: course._id,
      activityType: 'ASSIGNMENT',
      activityId: assignment._id,
      evidenceType: 'SUBMISSION',
      evidenceId: submission._id,
      evidenceRevision: submission.revision,
      score: 16,
      maxScore: 20,
      feedback: 'private feedback',
      status: 'RETURNED',
      revision: 1,
      gradedBy: teacher.user._id,
      gradedAt: now,
      returnedBy: teacher.user._id,
      returnedAt: now,
    }),
  ]);
  return { teacher, otherTeacher, firstStudent, course, assignment };
}

async function performanceFixture(studentCount = 100, activityCount = 50) {
  const teacher = await identity('TEACHER');
  const now = new Date();
  const classroom = await ClassroomModel.create({
    name: 'Gradebook Performance Classroom',
    nameNormalized: 'gradebook performance classroom',
    ownerTeacherId: teacher.user._id,
    status: 'ACTIVE',
    enrollmentStatus: 'OPEN',
    allowClassCodeJoin: true,
    allowInviteLinkJoin: true,
  });
  const course = await CourseModel.create({
    classroomId: classroom._id,
    ownerTeacherId: teacher.user._id,
    title: 'Gradebook Performance Course',
    description: '',
    status: 'PUBLISHED',
    publishedAt: now,
    displayOrder: 0,
    createdBy: teacher.user._id,
    updatedBy: teacher.user._id,
  });
  const students = await UserModel.insertMany(
    Array.from({ length: studentCount }, (_, index) => ({
      email: `gradebook-perf-student-${index}@example.test`,
      fullName: `Gradebook Performance Student ${String(index).padStart(3, '0')}`,
      fullNameNormalized: `gradebook performance student ${String(index).padStart(3, '0')}`,
      passwordHash: 'synthetic-hash',
      role: 'STUDENT',
      status: 'ACTIVE',
      registrationSource: 'SELF_REGISTRATION',
      studentCode: `GBP${String(index).padStart(5, '0')}`,
      activatedAt: now,
    })),
  );
  await Promise.all([
    EnrollmentModel.insertMany(
      students.map((student) => ({
        classroomId: classroom._id,
        studentId: student._id,
        status: 'ACTIVE',
        joinedBy: 'CLASS_CODE',
        joinedAt: now,
      })),
    ),
    AssignmentModel.insertMany(
      Array.from({ length: activityCount }, (_, index) => ({
        classroomId: classroom._id,
        courseId: course._id,
        moduleId: null,
        title: `Gradebook Performance Assignment ${String(index).padStart(2, '0')}`,
        instruction: 'Synthetic bounded Gradebook performance fixture',
        maxScore: 100,
        isRequired: true,
        allowedSubmissionTypes: ['TEXT'],
        allowLateSubmission: true,
        allowUnsubmit: false,
        allowResubmit: true,
        availableFrom: null,
        dueDate: new Date(now.getTime() + 86_400_000),
        status: 'PUBLISHED',
        displayOrder: index,
        contentRevision: 1,
        publishedRevision: 1,
        publishedAt: now,
        createdBy: teacher.user._id,
        updatedBy: teacher.user._id,
      })),
    ),
  ]);
  return { teacher, course };
}

describe('Phase 06 Gradebook API on MongoDB replica set', () => {
  beforeAll(async () => {
    await mongoose.connect(integrationUri, { serverSelectionTimeoutMS: 15_000 });
    await initializePhaseFourIndexes('test');
    await initializePhaseSixIndexes('test');
  });

  beforeEach(async () => {
    sequence = 0;
    await Promise.all([
      UserModel.deleteMany({}),
      AuthSessionModel.deleteMany({}),
      ClassroomModel.deleteMany({}),
      EnrollmentModel.deleteMany({}),
      CourseModel.deleteMany({}),
      AssignmentModel.deleteMany({}),
      SubmissionModel.deleteMany({}),
      GradeModel.deleteMany({}),
      LearningProgressModel.deleteMany({}),
      CourseProgressSummaryModel.deleteMany({}),
      ReportingInvalidationModel.deleteMany({}),
    ]);
  });

  afterAll(async () => mongoose.disconnect());

  it('returns the P06 bounded contract without private submission or feedback content', async () => {
    const data = await fixture();
    const response = await request(app)
      .get(`/api/v1/teacher/courses/${data.course._id}/gradebook?page=1&limit=20`)
      .set('Authorization', bearer(data.teacher.token))
      .expect(200);

    expect(response.headers['cache-control']).toBe('private, no-store');
    expect(response.body.data.reporting.definitionVersion).toBe('P06_GRADEBOOK_V1');
    expect(response.body.data.columns).toHaveLength(1);
    expect(response.body.data.rows).toHaveLength(2);
    expect(response.body.data.rows[0]).toMatchObject({
      student: { id: data.firstStudent.user._id.toString() },
      returnedGradeAverage: 80,
      cells: [
        {
          activityId: data.assignment._id.toString(),
          completionStatus: 'LATE',
          gradingStatus: 'RETURNED',
          displayStatus: 'RETURNED',
          score: 16,
          normalizedScore: 80,
        },
      ],
    });
    expect(JSON.stringify(response.body)).not.toMatch(/private submission body|private feedback/u);
  });

  it('blocks cross-Teacher access and rejects unbounded or unknown queries', async () => {
    const data = await fixture();
    await request(app)
      .get(`/api/v1/teacher/courses/${data.course._id}/gradebook`)
      .set('Authorization', bearer(data.otherTeacher.token))
      .expect(404);
    await request(app)
      .get(`/api/v1/teacher/courses/${data.course._id}/gradebook`)
      .set('Authorization', bearer(data.firstStudent.token))
      .expect(403);
    await request(app)
      .get(`/api/v1/teacher/courses/${data.course._id}/gradebook?activityLimit=51`)
      .set('Authorization', bearer(data.teacher.token))
      .expect(400);
    await request(app)
      .get(`/api/v1/teacher/courses/${data.course._id}/gradebook?displayStatus=RETURNED`)
      .set('Authorization', bearer(data.teacher.token))
      .expect(400);
  });

  it('keeps the bounded 100x50 Gradebook endpoint within the p95 target', async () => {
    const data = await performanceFixture();
    const path = `/api/v1/teacher/courses/${data.course._id}/gradebook?page=1&limit=50&activityLimit=50`;
    const authorization = bearer(data.teacher.token);

    await request(app).get(path).set('Authorization', authorization).expect(200);

    const samples: number[] = [];
    let lastResponse: request.Response | undefined;
    for (let iteration = 0; iteration < 10; iteration += 1) {
      const startedAt = performance.now();
      lastResponse = await request(app).get(path).set('Authorization', authorization).expect(200);
      samples.push(performance.now() - startedAt);
    }
    samples.sort((left, right) => left - right);
    const p95 = samples[Math.ceil(samples.length * 0.95) - 1]!;
    process.stdout.write(
      `${JSON.stringify({
        event: 'phase06.gradebook.performance',
        dataset: { students: 100, activities: 50, measuredRequests: samples.length },
        p95Milliseconds: Number(p95.toFixed(2)),
      })}\n`,
    );

    expect(lastResponse?.body.data.rows).toHaveLength(50);
    expect(lastResponse?.body.data.columns).toHaveLength(50);
    expect(lastResponse?.body.meta).toMatchObject({ limit: 50, totalItems: 100 });
    expect(p95).toBeLessThanOrEqual(1_500);
  }, 30_000);
});
