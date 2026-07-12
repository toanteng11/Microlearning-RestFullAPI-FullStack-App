import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import type { Logger } from 'pino';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';

import { createOpenApiDocument } from './docs/openapi.js';
import { createSystemRouter } from './modules/system/system.routes.js';
import type { RuntimeInfo, SystemDependencies } from './modules/system/system.types.js';
import type { AppConfig } from './shared/config/environment.js';
import { createErrorHandler } from './shared/middleware/error-handler.js';
import { notFoundHandler } from './shared/middleware/not-found.js';
import { requestIdMiddleware } from './shared/middleware/request-id.js';

interface AppOptions {
  config: AppConfig;
  logger: Logger;
  runtimeInfo: RuntimeInfo;
  dependencies: SystemDependencies;
}

export function createApp(options: AppOptions) {
  const app = express();
  const openApiDocument = createOpenApiDocument(options.runtimeInfo);

  app.disable('x-powered-by');
  app.use(requestIdMiddleware);
  app.use(
    pinoHttp({
      logger: options.logger,
      genReqId: (_request, response) => String(response.getHeader('x-request-id')),
      customProps: (_request, response) => ({ requestId: response.getHeader('x-request-id') }),
    }),
  );
  app.use(helmet());
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
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_request, response) => {
    response.json({
      success: true,
      data: {
        status: 'UP',
        service: 'microlearning-api',
        timestamp: new Date().toISOString(),
      },
    });
  });

  app.get('/ready', (_request, response) => {
    const mongodb = options.dependencies.getDatabaseStatus();
    const isReady = mongodb === 'UP';

    response.status(isReady ? 200 : 503).json({
      success: isReady,
      data: {
        status: isReady ? 'UP' : 'DOWN',
        dependencies: { mongodb },
        timestamp: new Date().toISOString(),
      },
    });
  });

  app.get('/api/v1/openapi.json', (_request, response) => response.json(openApiDocument));
  app.get('/api-docs/openapi.json', (_request, response) => response.json(openApiDocument));
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

  app.use(notFoundHandler);
  app.use(createErrorHandler(options.logger, options.config.appEnvironment === 'development'));

  return app;
}
