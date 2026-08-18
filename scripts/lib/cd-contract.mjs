import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { validateReleaseManifest } from './release-contract.mjs';

const FULL_SHA = /^[a-f0-9]{40}$/u;
const RUN_ID = /^[1-9][0-9]*$/u;
const HTTPS_URL = /^https:\/\//u;

function requireString(value, field) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${field} must be a non-empty string.`);
  }
  return value;
}

function requireRunId(value, field) {
  const normalized = String(value ?? '');
  if (!RUN_ID.test(normalized)) throw new Error(`${field} must be a positive workflow run ID.`);
  return normalized;
}

export function validateTrustedWorkflowRun(
  run,
  { workflowName, repository, allowedEvents = ['push'], expectedCommit } = {},
) {
  if (!run || typeof run !== 'object' || Array.isArray(run)) {
    throw new Error('Workflow run record must be a JSON object.');
  }

  if (run.name !== workflowName) {
    throw new Error(`Workflow run must be ${workflowName}.`);
  }
  if (run.conclusion !== 'success' || run.status !== 'completed') {
    throw new Error('Workflow run must be completed successfully.');
  }
  if (!allowedEvents.includes(run.event)) {
    throw new Error(`Workflow run event ${String(run.event)} is not trusted.`);
  }
  if (run.head_branch !== 'main') throw new Error('Workflow run must originate from main.');

  const sourceRepository = run.head_repository?.full_name ?? run.repository?.full_name;
  if (sourceRepository !== repository) {
    throw new Error('Workflow run repository does not match the trusted repository.');
  }

  const commitSha = requireString(run.head_sha, 'workflowRun.head_sha');
  if (!FULL_SHA.test(commitSha)) throw new Error('Workflow run commit must be a full Git SHA.');
  if (expectedCommit && commitSha !== expectedCommit) {
    throw new Error('Workflow run commit does not match the expected release commit.');
  }

  const runUrl = requireString(run.html_url, 'workflowRun.html_url');
  if (!HTTPS_URL.test(runUrl)) throw new Error('Workflow run URL must use HTTPS.');

  return {
    schemaVersion: 1,
    workflowName,
    workflowEvent: run.event,
    repository,
    branch: 'main',
    ref: 'refs/heads/main',
    commitSha,
    runId: requireRunId(run.id, 'workflowRun.id'),
    runUrl,
    validatedAt: new Date().toISOString(),
  };
}

export function validateReleaseLineage(manifest, { repository, buildRunId, expectedCommit } = {}) {
  const errors = validateReleaseManifest(manifest);
  if (errors.length > 0) {
    throw new Error(`Release manifest is invalid:\n- ${errors.join('\n- ')}`);
  }
  if (manifest.evidenceScope !== 'REGISTRY_DIGEST') {
    throw new Error('Only REGISTRY_DIGEST release evidence can be deployed.');
  }
  if (!FULL_SHA.test(manifest.commitSha)) {
    throw new Error('Registry release commit must be a full Git SHA.');
  }
  if (expectedCommit && manifest.commitSha !== expectedCommit) {
    throw new Error('Release commit does not match the trusted workflow run.');
  }

  const provenance = manifest.provenance;
  if (!provenance || typeof provenance !== 'object' || Array.isArray(provenance)) {
    throw new Error('Registry release provenance is required.');
  }
  if (provenance.repository !== repository || provenance.trustedRef !== 'refs/heads/main') {
    throw new Error('Release provenance repository/ref is not trusted.');
  }
  if (provenance.sourceWorkflow !== 'Continuous Integration') {
    throw new Error('Release must originate from Continuous Integration.');
  }
  if (provenance.buildWorkflow !== 'Build And Publish') {
    throw new Error('Release must be emitted by Build And Publish.');
  }
  requireRunId(provenance.sourceRunId, 'provenance.sourceRunId');
  const normalizedBuildRunId = requireRunId(provenance.buildRunId, 'provenance.buildRunId');
  if (buildRunId && normalizedBuildRunId !== String(buildRunId)) {
    throw new Error('Release build run ID does not match the triggering workflow run.');
  }
  for (const field of ['sourceRunUrl', 'buildRunUrl']) {
    if (!HTTPS_URL.test(requireString(provenance[field], `provenance.${field}`))) {
      throw new Error(`provenance.${field} must use HTTPS.`);
    }
  }

  return manifest;
}

export function validateDeploymentRecord(
  record,
  { repository, deploymentRunId, expectedCommit, expectedDecision } = {},
) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new Error('Deployment record must be a JSON object.');
  }
  if (record.schemaVersion !== 1 || record.environment !== 'staging') {
    throw new Error('Deployment record must use schemaVersion 1 and staging environment.');
  }
  if (!['CANDIDATE', 'PASS', 'ROLLED_BACK'].includes(record.decision)) {
    throw new Error('Deployment decision is invalid.');
  }
  if (expectedDecision && record.decision !== expectedDecision) {
    throw new Error(`Deployment decision must be ${expectedDecision}.`);
  }
  if (!FULL_SHA.test(requireString(record.commitSha, 'deployment.commitSha'))) {
    throw new Error('Deployment commit must be a full Git SHA.');
  }
  if (expectedCommit && record.commitSha !== expectedCommit) {
    throw new Error('Deployment commit does not match the expected commit.');
  }
  if (record.repository !== repository) throw new Error('Deployment repository is not trusted.');
  requireRunId(record.sourceBuildRunId, 'deployment.sourceBuildRunId');
  const normalizedDeploymentRunId = requireRunId(
    record.deploymentWorkflowRunId,
    'deployment.deploymentWorkflowRunId',
  );
  if (deploymentRunId && normalizedDeploymentRunId !== String(deploymentRunId)) {
    throw new Error('Deployment workflow run ID does not match the triggering run.');
  }
  if (!HTTPS_URL.test(requireString(record.serviceUrl, 'deployment.serviceUrl'))) {
    throw new Error('Deployment service URL must use HTTPS.');
  }
  requireString(record.revision, 'deployment.revision');
  validateReleaseLineage(record.releaseManifest, {
    repository,
    buildRunId: record.sourceBuildRunId,
    expectedCommit: record.commitSha,
  });
  return record;
}

export function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

export const CD_PATTERNS = Object.freeze({ FULL_SHA, RUN_ID });
