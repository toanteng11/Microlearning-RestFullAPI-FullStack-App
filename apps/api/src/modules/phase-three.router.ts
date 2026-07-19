import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';

import { createAuthenticateMiddleware, requirePermission } from '../shared/auth/authenticate.js';
import type { AppConfig } from '../shared/config/environment.js';
import { AppError } from '../shared/errors/app-error.js';
import { parseWithSchema } from '../shared/validation/parse.js';
import { AuditLogRepository } from './audit/audit-log.repository.js';
import { PhaseThreeAuditWriter } from './audit/phase-three-audit.writer.js';
import { AuthLoginStateRepository } from './auth/auth-login-state.repository.js';
import { AuthService } from './auth/auth.service.js';
import { ClassroomCredentialCrypto } from './classroom-credentials/classroom-credential.crypto.js';
import { ClassroomCredentialRepository } from './classroom-credentials/classroom-credential.repository.js';
import {
  classroomCredentialParamsSchema,
  createInviteLinkSchema,
  disableCredentialSchema,
  joinClassroomByCodeSchema,
  joinClassroomByTokenSchema,
  previewClassroomInviteSchema,
  regenerateClassCodeSchema,
  regenerateInviteLinkSchema,
} from './classroom-credentials/classroom-credential.schemas.js';
import { ClassroomCredentialService } from './classroom-credentials/classroom-credential.service.js';
import { ClassroomRepository } from './classrooms/classroom.repository.js';
import {
  adminClassroomListQuerySchema,
  archiveClassroomSchema,
  classroomIdSchema,
  classroomListQuerySchema,
  createClassroomSchema,
  studentClassroomListQuerySchema,
  updateClassroomSchema,
  updateClassroomSettingsSchema,
} from './classrooms/classroom.schemas.js';
import { ClassroomService } from './classrooms/classroom.service.js';
import { EnrollmentPolicyRepository } from './enrollment-policy/enrollment-policy.repository.js';
import { updateEnrollmentPolicySchema } from './enrollment-policy/enrollment-policy.schemas.js';
import { EnrollmentPolicyService } from './enrollment-policy/enrollment-policy.service.js';
import { EnrollmentRepository } from './enrollments/enrollment.repository.js';
import {
  classroomStudentIdSchema,
  removeStudentSchema,
  rosterListQuerySchema,
} from './enrollments/enrollment.schemas.js';
import { EnrollmentService } from './enrollments/enrollment.service.js';
import { AuthSessionRepository } from './sessions/auth-session.repository.js';
import { UserRepository } from './users/user.repository.js';

function requestIdFrom(response: {
  getHeader(name: string): number | string | string[] | undefined;
}) {
  return String(response.getHeader('x-request-id') ?? 'unknown');
}

function createLimiter(windowSeconds: number, max: number) {
  return rateLimit({
    windowMs: windowSeconds * 1000,
    limit: max,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_request, _response, next) =>
      next(new AppError(429, 'RATE_LIMITED', 'Too many requests. Try again later')),
  });
}

function createIdentityLimiter(windowSeconds: number, max: number) {
  return rateLimit({
    windowMs: windowSeconds * 1000,
    limit: max,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: (request) => request.auth?.id ?? 'unauthenticated',
    handler: (_request, _response, next) =>
      next(new AppError(429, 'RATE_LIMITED', 'Too many requests. Try again later')),
  });
}

export function createPhaseThreeRouter(config: AppConfig, classrooms = new ClassroomRepository()) {
  const router = Router();
  const users = new UserRepository();
  const sessions = new AuthSessionRepository();
  const authService = new AuthService(config, users, sessions, new AuthLoginStateRepository());
  const authenticate = createAuthenticateMiddleware(
    authService.accessTokenService,
    users,
    sessions,
  );
  const enrollments = new EnrollmentRepository();
  const credentials = new ClassroomCredentialRepository();
  const policies = new EnrollmentPolicyRepository();
  const audits = new PhaseThreeAuditWriter(new AuditLogRepository());
  const crypto = new ClassroomCredentialCrypto({
    codePepper: config.classroomCodePepper,
    codeLength: config.classroomCodeLength,
    inviteTokenBytes: config.classroomInviteTokenBytes,
  });
  const classroomService = new ClassroomService(
    classrooms,
    enrollments,
    credentials,
    policies,
    users,
    audits,
    crypto,
  );
  const credentialService = new ClassroomCredentialService(
    classrooms,
    credentials,
    policies,
    audits,
    crypto,
    config.publicWebUrl,
    config.classroomInviteDefaultTtlDays,
  );
  const enrollmentService = new EnrollmentService(
    classrooms,
    enrollments,
    credentials,
    policies,
    users,
    audits,
    crypto,
  );
  const policyService = new EnrollmentPolicyService(policies, audits);

  const previewLimiter = createLimiter(
    config.classroomRateLimits.joinWindowSeconds,
    config.classroomRateLimits.previewIpMax,
  );
  const joinIpLimiter = createLimiter(
    config.classroomRateLimits.joinWindowSeconds,
    config.classroomRateLimits.joinIpMax,
  );
  const joinIdentityLimiter = createIdentityLimiter(
    config.classroomRateLimits.joinWindowSeconds,
    config.classroomRateLimits.joinIdentityMax,
  );

  router.post('/classrooms/invite-links/preview', previewLimiter, async (request, response) => {
    const { token } = parseWithSchema(previewClassroomInviteSchema, request.body);
    const preview = await enrollmentService.previewInvite(token);
    response.setHeader('Cache-Control', 'no-store');
    response.json({ success: true, data: preview });
  });

  router.use(['/classrooms', '/admin'], authenticate);

  router.post(
    '/classrooms/join-by-code',
    requirePermission('classroom.join'),
    joinIpLimiter,
    joinIdentityLimiter,
    async (request, response) => {
      const { code } = parseWithSchema(joinClassroomByCodeSchema, request.body);
      const result = await enrollmentService.joinByCode(
        request.auth!,
        code,
        requestIdFrom(response),
      );
      response.setHeader('Cache-Control', 'no-store');
      response.status(result.created ? 201 : 200).json({ success: true, data: result.data });
    },
  );

  router.post(
    '/classrooms/join-by-token',
    requirePermission('classroom.join'),
    joinIpLimiter,
    joinIdentityLimiter,
    async (request, response) => {
      const { token } = parseWithSchema(joinClassroomByTokenSchema, request.body);
      const result = await enrollmentService.joinByToken(
        request.auth!,
        token,
        requestIdFrom(response),
      );
      response.setHeader('Cache-Control', 'no-store');
      response.status(result.created ? 201 : 200).json({ success: true, data: result.data });
    },
  );

  router.get('/classrooms', async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    if (request.auth!.role === 'STUDENT') {
      const input = parseWithSchema(studentClassroomListQuerySchema, request.query);
      response.json({ success: true, ...(await classroomService.list(request.auth!, input)) });
      return;
    }
    const input = parseWithSchema(classroomListQuerySchema, request.query);
    response.json({ success: true, ...(await classroomService.list(request.auth!, input)) });
  });

  router.post('/classrooms', requirePermission('classroom.create'), async (request, response) => {
    const input = parseWithSchema(createClassroomSchema, request.body);
    const result = await classroomService.create(request.auth!, input, requestIdFrom(response));
    response.setHeader('Cache-Control', 'no-store');
    response.status(201).json({ success: true, data: result });
  });

  router.get(
    '/classrooms/:classroomId/students',
    requirePermission('classroom.view_roster'),
    async (request, response) => {
      const { classroomId } = parseWithSchema(classroomIdSchema, request.params);
      const input = parseWithSchema(rosterListQuerySchema, request.query);
      response.json({
        success: true,
        ...(await enrollmentService.listRoster(request.auth!, classroomId, input)),
      });
    },
  );

  router.post(
    '/classrooms/:classroomId/students/:studentId/remove',
    requirePermission('classroom.remove_student'),
    async (request, response) => {
      const { classroomId, studentId } = parseWithSchema(classroomStudentIdSchema, request.params);
      const input = parseWithSchema(removeStudentSchema, request.body);
      const result = await enrollmentService.removeStudent(
        request.auth!,
        classroomId,
        studentId,
        input,
        requestIdFrom(response),
      );
      response.json({ success: true, data: result });
    },
  );

  router.get(
    '/classrooms/:classroomId/class-code',
    requirePermission('classroom.manage_join'),
    async (request, response) => {
      const { classroomId } = parseWithSchema(classroomCredentialParamsSchema, request.params);
      const credential = await credentialService.getClassCode(request.auth!, classroomId);
      response.setHeader('Cache-Control', 'no-store');
      response.json({ success: true, data: { credential } });
    },
  );

  router.post(
    '/classrooms/:classroomId/class-code/regenerate',
    requirePermission('classroom.manage_join'),
    async (request, response) => {
      const { classroomId } = parseWithSchema(classroomCredentialParamsSchema, request.params);
      const input = parseWithSchema(regenerateClassCodeSchema, request.body);
      const result = await credentialService.regenerateClassCode(
        request.auth!,
        classroomId,
        input,
        requestIdFrom(response),
      );
      response.setHeader('Cache-Control', 'no-store');
      response.json({ success: true, data: result });
    },
  );

  router.post(
    '/classrooms/:classroomId/class-code/disable',
    requirePermission('classroom.manage_join'),
    async (request, response) => {
      const { classroomId } = parseWithSchema(classroomCredentialParamsSchema, request.params);
      const input = parseWithSchema(disableCredentialSchema, request.body);
      const result = await credentialService.disableClassCode(
        request.auth!,
        classroomId,
        input,
        requestIdFrom(response),
      );
      response.setHeader('Cache-Control', 'no-store');
      response.json({ success: true, data: result });
    },
  );

  router.get(
    '/classrooms/:classroomId/invite-links',
    requirePermission('classroom.manage_join'),
    async (request, response) => {
      const { classroomId } = parseWithSchema(classroomCredentialParamsSchema, request.params);
      const items = await credentialService.listInviteLinks(request.auth!, classroomId);
      response.setHeader('Cache-Control', 'no-store');
      response.json({ success: true, data: items });
    },
  );

  router.post(
    '/classrooms/:classroomId/invite-links',
    requirePermission('classroom.manage_join'),
    async (request, response) => {
      const { classroomId } = parseWithSchema(classroomCredentialParamsSchema, request.params);
      const input = parseWithSchema(createInviteLinkSchema, request.body);
      const result = await credentialService.createInviteLink(
        request.auth!,
        classroomId,
        input,
        requestIdFrom(response),
      );
      response.setHeader('Cache-Control', 'no-store');
      response.status(201).json({ success: true, data: result });
    },
  );

  router.post(
    '/classrooms/:classroomId/invite-links/:linkId/regenerate',
    requirePermission('classroom.manage_join'),
    async (request, response) => {
      const { classroomId, linkId } = parseWithSchema(
        classroomCredentialParamsSchema,
        request.params,
      );
      if (!linkId) throw new AppError(422, 'VALIDATION_ERROR', 'Invite Link ID is required');
      const input = parseWithSchema(regenerateInviteLinkSchema, request.body);
      const result = await credentialService.regenerateInviteLink(
        request.auth!,
        classroomId,
        linkId,
        input,
        requestIdFrom(response),
      );
      response.setHeader('Cache-Control', 'no-store');
      response.json({ success: true, data: result });
    },
  );

  router.post(
    '/classrooms/:classroomId/invite-links/:linkId/disable',
    requirePermission('classroom.manage_join'),
    async (request, response) => {
      const { classroomId, linkId } = parseWithSchema(
        classroomCredentialParamsSchema,
        request.params,
      );
      if (!linkId) throw new AppError(422, 'VALIDATION_ERROR', 'Invite Link ID is required');
      const input = parseWithSchema(disableCredentialSchema, request.body);
      const result = await credentialService.disableInviteLink(
        request.auth!,
        classroomId,
        linkId,
        input,
        requestIdFrom(response),
      );
      response.setHeader('Cache-Control', 'no-store');
      response.json({ success: true, data: result });
    },
  );

  router.patch(
    '/classrooms/:classroomId/settings',
    requirePermission('classroom.update_owned'),
    async (request, response) => {
      const { classroomId } = parseWithSchema(classroomIdSchema, request.params);
      const input = parseWithSchema(updateClassroomSettingsSchema, request.body);
      const result = await classroomService.updateSettings(
        request.auth!,
        classroomId,
        input,
        requestIdFrom(response),
      );
      response.json({ success: true, data: result });
    },
  );

  router.get('/classrooms/:classroomId', async (request, response) => {
    const { classroomId } = parseWithSchema(classroomIdSchema, request.params);
    response.setHeader('Cache-Control', 'no-store');
    response.json({
      success: true,
      data: { classroom: await classroomService.getDetail(request.auth!, classroomId) },
    });
  });

  router.patch(
    '/classrooms/:classroomId',
    requirePermission('classroom.update_owned'),
    async (request, response) => {
      const { classroomId } = parseWithSchema(classroomIdSchema, request.params);
      const input = parseWithSchema(updateClassroomSchema, request.body);
      const result = await classroomService.update(
        request.auth!,
        classroomId,
        input,
        requestIdFrom(response),
      );
      response.json({ success: true, data: result });
    },
  );

  router.delete(
    '/classrooms/:classroomId',
    requirePermission('classroom.archive_owned'),
    async (request, response) => {
      const { classroomId } = parseWithSchema(classroomIdSchema, request.params);
      const input = parseWithSchema(archiveClassroomSchema, request.body);
      await classroomService.archive(request.auth!, classroomId, input, requestIdFrom(response));
      response.status(204).end();
    },
  );

  router.get(
    '/admin/settings/enrollment-policy',
    requirePermission('enrollment_policy.view'),
    async (_request, response) => {
      response.json({ success: true, data: { policy: await policyService.get() } });
    },
  );

  router.patch(
    '/admin/settings/enrollment-policy',
    requirePermission('enrollment_policy.update'),
    async (request, response) => {
      const input = parseWithSchema(updateEnrollmentPolicySchema, request.body);
      const result = await policyService.update(request.auth!, input, requestIdFrom(response));
      response.json({ success: true, data: result });
    },
  );

  router.get(
    '/admin/classrooms',
    requirePermission('classroom.governance.view'),
    async (request, response) => {
      const input = parseWithSchema(adminClassroomListQuerySchema, request.query);
      response.json({ success: true, ...(await classroomService.listGovernance(input)) });
    },
  );

  router.get(
    '/admin/classrooms/:classroomId',
    requirePermission('classroom.governance.view'),
    async (request, response) => {
      const { classroomId } = parseWithSchema(classroomIdSchema, request.params);
      response.json({
        success: true,
        data: { classroom: await classroomService.getGovernanceDetail(classroomId) },
      });
    },
  );

  return router;
}
