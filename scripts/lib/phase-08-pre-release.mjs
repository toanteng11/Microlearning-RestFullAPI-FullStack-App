import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  PHASE08_CRITERIA,
  PHASE08_EVIDENCE,
  PHASE08_PRE_RELEASE_CRITERIA,
  PHASE08_PRE_RELEASE_EVIDENCE,
  assertValidPhase08Record,
  redactPhase08Report,
  validatePhase08Acceptance,
  validatePhase08Decision,
  validatePhase08Identity,
  validatePhase08SystemTest,
  validatePhase08Uat,
} from './phase-08-contract.mjs';
import { assertValidPhase08ProductionReadiness } from './phase-08-production-readiness.mjs';

const CRITERION_EVIDENCE = Object.freeze({
  'P08-AC-001': ['P08-EV-001'],
  'P08-AC-002': ['P08-EV-002', 'P08-EV-005'],
  'P08-AC-003': ['P08-EV-010', 'P08-EV-015', 'P08-EV-016'],
  'P08-AC-004': ['P08-EV-020', 'P08-EV-025'],
  'P08-AC-005': ['P08-EV-026'],
  'P08-AC-006': ['P08-EV-004', 'P08-EV-007'],
  'P08-AC-007': ['P08-EV-006'],
  'P08-AC-008': ['P08-EV-006'],
  'P08-AC-009': ['P08-EV-008'],
  'P08-AC-010': ['P08-EV-004', 'P08-EV-007'],
});

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function normalizedIdentity(record) {
  const identity = record?.releaseIdentity ?? record;
  return {
    releaseId: identity?.releaseId,
    commitSha: identity?.commitSha,
    imageDigest: identity?.imageDigest,
    stagingRevision: identity?.stagingRevision,
    stagingUrl: identity?.stagingUrl,
    productionRevision: identity?.productionRevision ?? 'NOT_RUN',
    productionUrl: identity?.productionUrl ?? 'NOT_RUN',
  };
}

export function sha256Record(value) {
  return `sha256:${createHash('sha256').update(stableJson(value)).digest('hex')}`;
}

function assertSameIdentity(expected, actual, label) {
  if (stableJson(normalizedIdentity(expected)) !== stableJson(normalizedIdentity(actual))) {
    throw new Error(`${label} releaseIdentity does not match the locked candidate.`);
  }
}

function sameValue(left, right) {
  return stableJson(left) === stableJson(right);
}

function validateEvidenceIndex(evidenceIndex, releaseId) {
  if (!Array.isArray(evidenceIndex)) {
    throw new Error('evidenceIndex must be an array.');
  }
  const ids = new Set();
  for (const evidence of evidenceIndex) {
    if (!PHASE08_PRE_RELEASE_EVIDENCE.includes(evidence?.id)) {
      throw new Error(`Unexpected pre-release evidence ID: ${evidence?.id ?? '<missing>'}.`);
    }
    if (ids.has(evidence.id)) throw new Error(`Duplicate evidence ID: ${evidence.id}.`);
    ids.add(evidence.id);
    if (evidence.status !== 'PASS') {
      throw new Error(`${evidence.id} must be PASS before G5.`);
    }
    if (typeof evidence.artifact !== 'string' || !evidence.artifact.includes(releaseId)) {
      throw new Error(`${evidence.id} artifact must be scoped to release ${releaseId}.`);
    }
  }
  const missing = PHASE08_PRE_RELEASE_EVIDENCE.filter((id) => !ids.has(id));
  if (missing.length > 0) throw new Error(`Missing pre-release evidence: ${missing.join(', ')}.`);
}

export function createPhase08PreReleasePackage({
  releaseIdentity,
  systemTest,
  uat,
  productionReadiness,
  evidenceIndex,
  decisionRequest,
}) {
  assertValidPhase08Record(releaseIdentity, (record) =>
    validatePhase08Identity(record, { actual: true }),
  );
  assertValidPhase08Record(systemTest, validatePhase08SystemTest);
  assertValidPhase08Record(uat, validatePhase08Uat);
  assertValidPhase08ProductionReadiness(productionReadiness);

  assertSameIdentity(
    releaseIdentity.releaseIdentity ?? releaseIdentity,
    systemTest.releaseIdentity,
    'System Test',
  );
  assertSameIdentity(
    releaseIdentity.releaseIdentity ?? releaseIdentity,
    uat.releaseIdentity,
    'UAT',
  );
  assertSameIdentity(
    releaseIdentity.releaseIdentity ?? releaseIdentity,
    productionReadiness.releaseIdentity,
    'Production readiness',
  );

  if (
    systemTest.status !== 'PASS' ||
    uat.status !== 'PASS' ||
    productionReadiness.status !== 'PASS'
  ) {
    throw new Error('G5 requires PASS System Test, UAT and Production readiness records.');
  }

  const identity = normalizedIdentity(releaseIdentity);
  validateEvidenceIndex(evidenceIndex, identity.releaseId);
  const evidenceById = new Map(evidenceIndex.map((entry) => [entry.id, entry]));
  const evidence = PHASE08_EVIDENCE.map((id) =>
    evidenceById.has(id) ? structuredClone(evidenceById.get(id)) : { id, status: 'PENDING' },
  );

  const acceptance = redactPhase08Report({
    schemaVersion: 1,
    phase: '08',
    acceptanceStage: 'PRE_RELEASE',
    status: 'PASS',
    releaseId: identity.releaseId,
    actor: decisionRequest.actor,
    recordedAtUtc: decisionRequest.recordedAtUtc,
    redactionReviewed: true,
    releaseIdentity: structuredClone(identity),
    acceptanceCriteria: PHASE08_CRITERIA.map((id) =>
      PHASE08_PRE_RELEASE_CRITERIA.includes(id)
        ? { id, status: 'PASS', evidenceIds: CRITERION_EVIDENCE[id] }
        : { id, status: 'PENDING' },
    ),
    evidence,
  });
  assertValidPhase08Record(acceptance, validatePhase08Acceptance);

  const acceptanceRecordSha256 = sha256Record(acceptance);
  const decision = redactPhase08Report({
    schemaVersion: 1,
    phase: '08',
    releaseId: identity.releaseId,
    actor: decisionRequest.actor,
    recordedAtUtc: decisionRequest.recordedAtUtc,
    redactionReviewed: true,
    decision: decisionRequest.decision,
    decisionId: decisionRequest.decisionId,
    rationale: decisionRequest.rationale,
    decidedAtUtc: decisionRequest.decidedAtUtc,
    releaseIdentity: structuredClone(identity),
    systemTestStatus: systemTest.status,
    uatStatus: uat.status,
    preReleaseAcceptanceStatus: acceptance.status,
    criticalDefects: systemTest.criticalDefects + uat.criticalDefects,
    highDefects: systemTest.highDefects + uat.highDefects,
    recommendations: structuredClone(decisionRequest.recommendations),
    governance: structuredClone(decisionRequest.governance),
    evidenceIds: ['P08-EV-030'],
    conditions: structuredClone(decisionRequest.conditions ?? []),
    productionApplyMode: 'PLAN_ONLY',
    approvedDeploymentWindow: structuredClone(decisionRequest.approvedDeploymentWindow),
    acceptanceRecordSha256,
  });
  assertValidPhase08Record(decision, validatePhase08Decision);

  const decisionRecordSha256 = sha256Record(decision);
  const lock = {
    schemaVersion: 1,
    phase: '08',
    recordType: 'G5_DECISION_LOCK',
    releaseId: identity.releaseId,
    decisionId: decision.decisionId,
    decision: decision.decision,
    releaseIdentity: structuredClone(identity),
    acceptanceRecordSha256,
    decisionRecordSha256,
    approvedDeploymentWindow: structuredClone(decision.approvedDeploymentWindow),
    productionApplyMode: 'PLAN_ONLY',
    immutable: true,
    recordedAtUtc: decision.recordedAtUtc,
    actor: decision.actor,
    redactionReviewed: true,
    evidenceIds: ['P08-EV-030'],
  };

  return { acceptance, decision, lock };
}

export function writePhase08PreReleasePackage(outputDirectory, records) {
  const target = resolve(outputDirectory);
  if (existsSync(target)) {
    throw new Error(`Refusing to overwrite immutable G5 directory: ${target}`);
  }
  mkdirSync(target, { recursive: true });
  const files = {
    'pre-release-acceptance.json': records.acceptance,
    'go-no-go-decision.json': records.decision,
    'g5-decision-lock.json': records.lock,
  };
  for (const [name, record] of Object.entries(files)) {
    writeFileSync(resolve(target, name), `${JSON.stringify(record, null, 2)}\n`, 'utf8');
  }
  return target;
}

export function validatePhase08PreReleasePackage({ acceptance, decision, lock }) {
  const errors = [
    ...validatePhase08Acceptance(acceptance).map((error) => `acceptance: ${error}`),
    ...validatePhase08Decision(decision).map((error) => `decision: ${error}`),
  ];
  if (lock === null || typeof lock !== 'object' || Array.isArray(lock)) {
    return [...errors, 'lock must be an object.'];
  }
  if (lock.schemaVersion !== 1) errors.push('lock.schemaVersion must equal 1.');
  if (lock.phase !== '08') errors.push('lock.phase must equal 08.');
  if (lock.recordType !== 'G5_DECISION_LOCK') {
    errors.push('lock.recordType must equal G5_DECISION_LOCK.');
  }
  if (lock.immutable !== true) errors.push('lock.immutable must be true.');
  if (lock.productionApplyMode !== 'PLAN_ONLY') {
    errors.push('lock.productionApplyMode must be PLAN_ONLY.');
  }
  if (lock.redactionReviewed !== true) errors.push('lock.redactionReviewed must be true.');
  if (!sameValue(acceptance?.releaseIdentity, decision?.releaseIdentity)) {
    errors.push('acceptance and decision releaseIdentity must match.');
  }
  if (!sameValue(decision?.releaseIdentity, lock.releaseIdentity)) {
    errors.push('decision and lock releaseIdentity must match.');
  }
  if (lock.releaseId !== decision?.releaseId || lock.decisionId !== decision?.decisionId) {
    errors.push('lock releaseId and decisionId must match the decision.');
  }
  if (lock.decision !== decision?.decision) errors.push('lock decision must match the decision.');
  if (!sameValue(lock.approvedDeploymentWindow, decision?.approvedDeploymentWindow)) {
    errors.push('lock approvedDeploymentWindow must match the decision.');
  }
  const acceptanceHash = sha256Record(acceptance);
  const decisionHash = sha256Record(decision);
  if (decision?.acceptanceRecordSha256 !== acceptanceHash) {
    errors.push('decision acceptanceRecordSha256 does not match the acceptance record.');
  }
  if (lock.acceptanceRecordSha256 !== acceptanceHash) {
    errors.push('lock acceptanceRecordSha256 does not match the acceptance record.');
  }
  if (lock.decisionRecordSha256 !== decisionHash) {
    errors.push('lock decisionRecordSha256 does not match the decision record.');
  }
  if (!Array.isArray(lock.evidenceIds) || lock.evidenceIds.join(',') !== 'P08-EV-030') {
    errors.push('lock.evidenceIds must contain only P08-EV-030.');
  }
  return errors;
}

export function assertValidPhase08PreReleasePackage(records) {
  const errors = validatePhase08PreReleasePackage(records);
  if (errors.length > 0) {
    throw new Error(`Phase 08 G5 package validation failed:\n- ${errors.join('\n- ')}`);
  }
  return records;
}

export const PHASE08_PRE_RELEASE_MAPPING = CRITERION_EVIDENCE;
