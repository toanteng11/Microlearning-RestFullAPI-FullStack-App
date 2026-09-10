import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  assertValidPhase08Record,
  redactPhase08Report,
  validatePhase08Profile,
} from './phase-08-contract.mjs';

export const PHASE08_WORKSPACE_DIRECTORIES = Object.freeze([
  'identity',
  'system-test',
  'uat',
  'security-performance',
  'production-plan',
  'deployment',
  'observation',
  'handover',
  'exit',
]);

export function initializePhase08Workspace(profile, rootPathValue) {
  assertValidPhase08Record(profile, validatePhase08Profile);
  if (profile.status !== 'CONFIRMED') {
    throw new Error('Phase 08 workspace requires a CONFIRMED release profile.');
  }

  const rootPath = resolve(rootPathValue ?? profile.artifactRetention.root);
  const releasePath = resolve(rootPath, profile.releaseId);
  if (existsSync(releasePath)) {
    throw new Error(`Phase 08 release workspace already exists: ${releasePath}`);
  }

  mkdirSync(rootPath, { recursive: true });
  mkdirSync(releasePath);
  PHASE08_WORKSPACE_DIRECTORIES.forEach((directory) => mkdirSync(resolve(releasePath, directory)));

  const createdAtUtc = new Date().toISOString();
  const manifest = redactPhase08Report({
    schemaVersion: 1,
    phase: '08',
    recordType: 'EVIDENCE_WORKSPACE',
    releaseId: profile.releaseId,
    releaseProfile: profile.releaseProfile,
    evidenceId: 'P08-EV-003',
    createdAtUtc,
    root: releasePath,
    directories: PHASE08_WORKSPACE_DIRECTORIES,
    overwritePolicy: 'DENY',
    secretPolicy: 'REDACT_BEFORE_WRITE',
  });

  writeFileSync(
    resolve(releasePath, 'release-profile.json'),
    `${JSON.stringify(redactPhase08Report(profile), null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    resolve(releasePath, 'workspace-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );

  return { releasePath, manifest };
}
