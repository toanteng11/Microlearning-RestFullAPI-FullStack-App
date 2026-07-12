import type { DatabaseStatus } from '../../shared/database/mongodb.js';

export interface RuntimeInfo {
  appName: string;
  version: string;
  environment: string;
  commitSha: string;
  buildTime: string;
}

export interface SystemDependencies {
  getDatabaseStatus: () => DatabaseStatus;
}
