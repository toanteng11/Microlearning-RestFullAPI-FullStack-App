import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';

import { requirePermission } from '../../shared/auth/authenticate.js';
import type { AppConfig } from '../../shared/config/environment.js';
import { AppError } from '../../shared/errors/app-error.js';
import { parseWithSchema } from '../../shared/validation/parse.js';
import {
  acceptTeacherInvitationSchema,
  createTeacherInvitationSchema,
  previewTeacherInvitationSchema,
  recordCopyEventSchema,
  revokeTeacherInvitationSchema,
  teacherInvitationIdSchema,
  teacherInvitationListQuerySchema,
} from './teacher-invitation.schemas.js';
import type { TeacherInvitationService } from './teacher-invitation.service.js';

function requestIdFrom(response: {
  getHeader(name: string): number | string | string[] | undefined;
}) {
  return String(response.getHeader('x-request-id') ?? 'unknown');
}

function rateLimitError() {
  return new AppError(429, 'RATE_LIMITED', 'Too many requests. Try again later');
}

export function createTeacherInvitationAdminRouter(
  config: AppConfig,
  service: TeacherInvitationService,
) {
  const router = Router();
  const createLimiter = rateLimit({
    windowMs: config.rateLimits.adminInvitationWindowSeconds * 1000,
    limit: config.rateLimits.adminInvitationMax,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: (request) => request.auth!.id,
    handler: (_request, _response, next) => next(rateLimitError()),
  });

  router.post(
    '/',
    requirePermission('teacher_invitation.create'),
    createLimiter,
    async (request, response) => {
      const input = parseWithSchema(createTeacherInvitationSchema, request.body);
      const invitation = await service.create(request.auth!, input, requestIdFrom(response));
      response.setHeader('Cache-Control', 'no-store');
      response.status(201).json({ success: true, data: { invitation } });
    },
  );

  router.get('/', requirePermission('teacher_invitation.view'), async (request, response) => {
    const input = parseWithSchema(teacherInvitationListQuerySchema, request.query);
    const result = await service.list(input);
    response.json({ success: true, ...result });
  });

  router.get(
    '/:invitationId',
    requirePermission('teacher_invitation.view'),
    async (request, response) => {
      const { invitationId } = parseWithSchema(teacherInvitationIdSchema, request.params);
      const invitation = await service.getDetail(invitationId);
      response.json({ success: true, data: { invitation } });
    },
  );

  router.post(
    '/:invitationId/copy-events',
    requirePermission('teacher_invitation.copy_link'),
    async (request, response) => {
      const { invitationId } = parseWithSchema(teacherInvitationIdSchema, request.params);
      const input = parseWithSchema(recordCopyEventSchema, request.body);
      const result = await service.recordCopy(
        request.auth!,
        invitationId,
        input,
        requestIdFrom(response),
      );
      response.status(201).json({ success: true, data: result });
    },
  );

  router.post(
    '/:invitationId/revoke',
    requirePermission('teacher_invitation.revoke'),
    async (request, response) => {
      const { invitationId } = parseWithSchema(teacherInvitationIdSchema, request.params);
      const { reason } = parseWithSchema(revokeTeacherInvitationSchema, request.body);
      const result = await service.revoke(
        request.auth!,
        invitationId,
        reason,
        requestIdFrom(response),
      );
      response.json({ success: true, data: result });
    },
  );

  return router;
}

export function createTeacherInvitationPublicRouter(
  config: AppConfig,
  service: TeacherInvitationService,
) {
  const router = Router();
  const publicLimiter = rateLimit({
    windowMs: config.rateLimits.windowSeconds * 1000,
    limit: config.rateLimits.publicInvitationMax,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_request, _response, next) => next(rateLimitError()),
  });

  router.post('/preview', publicLimiter, async (request, response) => {
    const { token } = parseWithSchema(previewTeacherInvitationSchema, request.body);
    const invitation = await service.preview(token);
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.json({ success: true, data: { invitation } });
  });

  router.post('/accept', publicLimiter, async (request, response) => {
    const input = parseWithSchema(acceptTeacherInvitationSchema, request.body);
    const result = await service.accept(input, requestIdFrom(response));
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.status(201).json({ success: true, data: result });
  });

  return router;
}
