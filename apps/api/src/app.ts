import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import type { Logger } from 'pino';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';

import { createOpenApiDocument } from './docs/openapi.js';
import { createPhaseTwoRouter } from './modules/phase-two.router.js';
import { createPhaseThreeRouter } from './modules/phase-three.router.js';
import { createPhaseFourRouter } from './modules/phase-four.router.js';
import { createPhaseFiveRouter } from './modules/phase-five.router.js';
import { createPhaseSixFoundation } from './modules/phase-six.foundation.js';
import { createPhaseSixRouter } from './modules/phase-six.router.js';
import { ClassroomOwnershipRepositoryReader } from './modules/classrooms/classroom-ownership.reader.js';
import { ClassroomRepository } from './modules/classrooms/classroom.repository.js';
import { ClassroomContentRepositoryReader } from './modules/content-governance/classroom-content.repository-reader.js';
import { createSystemRouter } from './modules/system/system.routes.js';
import type { RuntimeInfo, SystemDependencies } from './modules/system/system.types.js';
import type { AppConfig } from './shared/config/environment.js';
import { createErrorHandler } from './shared/middleware/error-handler.js';
import { notFoundHandler } from './shared/middleware/not-found.js';
import { requestIdMiddleware } from './shared/middleware/request-id.js';
import { registerStaticWeb } from './shared/runtime/static-web.js';

interface AppOptions {
  config: AppConfig;
  logger: Logger;
  runtimeInfo: RuntimeInfo;
  dependencies: SystemDependencies;
  webDistPath?: string;
}

export function createApp(options: AppOptions) {
  const app = express();
  const openApiDocument = createOpenApiDocument(options.runtimeInfo);

  app.disable('x-powered-by');
  app.set('trust proxy', options.config.trustProxyHops);
  app.use(requestIdMiddleware);
  app.use(
    pinoHttp({
      logger: options.logger,
      genReqId: (_request, response) => String(response.getHeader('x-request-id')),
      customProps: (_request, response) => ({ requestId: response.getHeader('x-request-id') }),
    }),
  );
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", 'data:'],
          frameAncestors: ["'none'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
      hsts: false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );
  const hsts = helmet.hsts();
  app.use((request, response, next) => {
    if (request.secure && ['staging', 'production'].includes(options.config.appEnvironment)) {
      hsts(request, response, next);
      return;
    }
    next();
  });
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || options.config.allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.json({
      success: true,
      data: {
        status: 'UP',
        service: 'microlearning-api',
        timestamp: new Date().toISOString(),
      },
    });
  });

  app.get('/ready', async (_request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    const mongodb = await options.dependencies.getDatabaseStatus().catch(() => 'DOWN' as const);
    const isReady = mongodb === 'UP' && (options.dependencies.isApplicationReady?.() ?? true);

    response.status(isReady ? 200 : 503).json({
      success: isReady,
      data: {
        status: isReady ? 'UP' : 'DOWN',
        dependencies: { mongodb },
        timestamp: new Date().toISOString(),
      },
    });
  });

  app.get('/api/v1/openapi.json', (_request, response) => {
    response.setHeader('Cache-Control', 'no-cache');
    response.json(openApiDocument);
  });
  app.get('/api-docs/openapi.json', (_request, response) => {
    response.setHeader('Cache-Control', 'no-cache');
    response.json(openApiDocument);
  });
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      customSiteTitle: 'Microlearning API Documentation',
      swaggerOptions: {
        persistAuthorization: false,
        displayRequestDuration: true,
      },
    }),
  );

  app.use('/api/v1', createSystemRouter(options.runtimeInfo, options.dependencies));
  const classrooms = new ClassroomRepository();
  const phaseSixFoundation = createPhaseSixFoundation(options.config);
  app.use(
    '/api/v1',
    createPhaseTwoRouter(options.config, new ClassroomOwnershipRepositoryReader(classrooms)),
  );
  app.use(
    '/api/v1',
    createPhaseThreeRouter(
      options.config,
      classrooms,
      phaseSixFoundation.reportingInvalidationWriter,
      new ClassroomContentRepositoryReader(),
    ),
  );
  app.use(
    '/api/v1',
    createPhaseFourRouter(
      options.config,
      classrooms,
      phaseSixFoundation.reportingInvalidationWriter,
    ),
  );
  app.use(
    '/api/v1',
    createPhaseFiveRouter(
      options.config,
      classrooms,
      phaseSixFoundation.reportingInvalidationWriter,
    ),
  );
  app.use('/api/v1', createPhaseSixRouter(options.config, classrooms, phaseSixFoundation));

  app.use('/api/v1', notFoundHandler);
  app.use('/api-docs', notFoundHandler);
  if (options.webDistPath) registerStaticWeb(app, options.webDistPath);
  app.use(notFoundHandler);
  app.use(createErrorHandler(options.logger, options.config.appEnvironment === 'development'));

  return app;
}
