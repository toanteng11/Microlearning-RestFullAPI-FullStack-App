import { Router } from 'express';

import type { RuntimeInfo, SystemDependencies } from './system.types.js';

export function createSystemRouter(runtimeInfo: RuntimeInfo, dependencies: SystemDependencies) {
  const router = Router();

  router.get('/system/version', (_request, response) => {
    response.json({
      success: true,
      data: {
        appName: runtimeInfo.appName,
        version: runtimeInfo.version,
        environment: runtimeInfo.environment,
        commitSha: runtimeInfo.commitSha,
        buildTime: runtimeInfo.buildTime,
      },
    });
  });

  router.get('/system/health', async (_request, response) => {
    const mongodb = await dependencies.getDatabaseStatus();
    const status = mongodb === 'UP' ? 'UP' : 'DEGRADED';

    response.status(status === 'UP' ? 200 : 503).json({
      success: status === 'UP',
      data: {
        status,
        service: 'microlearning-api',
        dependencies: { mongodb },
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
    });
  });

  return router;
}
