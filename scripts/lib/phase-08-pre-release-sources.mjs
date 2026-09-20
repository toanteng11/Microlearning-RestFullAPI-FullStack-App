import {
  assertValidPhase08Record,
  validatePhase08Identity,
  validatePhase08SystemTest,
  validatePhase08Uat,
} from './phase-08-contract.mjs';
import { assertValidPhase08ProductionReadiness } from './phase-08-production-readiness.mjs';

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizedIdentity(record) {
  const identity = record?.releaseIdentity ?? record;
  return {
    releaseId: identity?.releaseId,
    commitSha: identity?.commitSha,
    imageDigest: identity?.imageDigest,
    stagingRevision: identity?.stagingRevision,
    stagingUrl: identity?.stagingUrl,
    productionRevision: identity?.productionRevision,
    productionUrl: identity?.productionUrl,
  };
}

function assertSameIdentity(expected, actual, label) {
  const expectedIdentity = JSON.stringify(normalizedIdentity(expected));
  const actualIdentity = JSON.stringify(normalizedIdentity(actual));
  if (expectedIdentity !== actualIdentity) {
    throw new Error(`${label} releaseIdentity does not match the locked candidate.`);
  }
}

function assertValidPlanOnlyRecord(record, releaseIdentity) {
  if (!isObject(record)) {
    throw new Error('Production Terraform PLAN_ONLY record must be a JSON object.');
  }
  if (record.schemaVersion !== 1 || record.phase !== '08') {
    throw new Error(
      'Production Terraform PLAN_ONLY record must be a Phase 08 schemaVersion 1 record.',
    );
  }
  if (record.recordType !== 'PRODUCTION_TERRAFORM_READINESS' || record.status !== 'PASS') {
    throw new Error('Production Terraform PLAN_ONLY record must have PASS readiness status.');
  }
  if (record.applyMode !== 'PLAN_ONLY' || record.productionApplyExecuted !== false) {
    throw new Error('Production Terraform source must be PLAN_ONLY and must not apply Production.');
  }
  assertSameIdentity(releaseIdentity, record, 'Production Terraform PLAN_ONLY source');

  const terraform = record.terraform;
  if (!isObject(terraform)) {
    throw new Error('Production Terraform PLAN_ONLY record must contain terraform metadata.');
  }
  for (const field of ['formatStatus', 'validateStatus', 'planStatus', 'policyStatus']) {
    if (terraform[field] !== 'PASS') {
      throw new Error(`Production Terraform ${field} must be PASS.`);
    }
  }
  if (!/^sha256:[a-f0-9]{64}$/u.test(terraform.planHash ?? '')) {
    throw new Error('Production Terraform PLAN_ONLY record must contain a SHA-256 plan hash.');
  }
  if (terraform.backendPrefix !== 'phase-08/production') {
    throw new Error(
      'Production Terraform PLAN_ONLY record must use the isolated Production backend.',
    );
  }
  if (terraform.imageRef !== releaseIdentity.imageDigest) {
    throw new Error('Production Terraform PLAN_ONLY image must match the locked candidate digest.');
  }
}

export function verifyPhase08PreReleaseSources({
  releaseIdentity,
  systemTest,
  uat,
  productionReadiness,
  productionTerraformReadiness,
}) {
  assertValidPhase08Record(releaseIdentity, (record) =>
    validatePhase08Identity(record, { actual: true }),
  );
  assertValidPhase08Record(systemTest, validatePhase08SystemTest);
  assertValidPhase08Record(uat, validatePhase08Uat);
  assertValidPhase08ProductionReadiness(productionReadiness);

  const lockedIdentity = normalizedIdentity(releaseIdentity);
  assertSameIdentity(lockedIdentity, systemTest, 'System Test');
  assertSameIdentity(lockedIdentity, uat, 'UAT');
  assertSameIdentity(lockedIdentity, productionReadiness, 'Production readiness');
  assertValidPlanOnlyRecord(productionTerraformReadiness, lockedIdentity);

  if (productionReadiness.terraform.planHash !== productionTerraformReadiness.terraform.planHash) {
    throw new Error(
      'Production readiness planHash does not match the protected PLAN_ONLY artifact.',
    );
  }

  return {
    schemaVersion: 1,
    phase: '08',
    recordType: 'G5_SOURCE_VERIFICATION',
    status: 'PASS',
    releaseIdentity: lockedIdentity,
    sources: {
      systemTest: 'PASS',
      uat: 'PASS',
      productionReadiness: 'PASS',
      productionTerraformPlanOnly: 'PASS',
      planHash: productionTerraformReadiness.terraform.planHash,
    },
  };
}
