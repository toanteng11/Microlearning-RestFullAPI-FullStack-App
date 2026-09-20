import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const planPath = resolve(process.argv[2] ?? 'artifacts/phase-08/production-bootstrap/plan.json');
const reportPath = resolve(
  process.argv[3] ?? 'artifacts/phase-08/production-bootstrap/policy-report.json',
);

const allowedAddresses = new Set([
  'google_storage_bucket_iam_member.terraform_state_deployer',
  'module.iam.google_project_iam_member.deployer_project_roles["roles/iam.securityReviewer"]',
  'module.iam.google_project_iam_member.deployer_project_roles["roles/iam.serviceAccountViewer"]',
  'module.iam.google_project_iam_member.deployer_project_roles["roles/logging.configWriter"]',
  'module.iam.google_project_iam_member.deployer_project_roles["roles/monitoring.editor"]',
  'module.iam.google_project_iam_member.deployer_project_roles["roles/run.admin"]',
  'module.iam.google_project_iam_member.deployer_project_roles["roles/secretmanager.viewer"]',
  'module.iam.google_project_iam_member.deployer_project_roles["roles/serviceusage.serviceUsageViewer"]',
  'module.iam.google_service_account.this["ml-github-production"]',
  'module.iam.google_service_account.this["ml-runtime-production"]',
  'module.iam.google_service_account_iam_member.deployer_act_as["ml-runtime-production"]',
  'module.workload_identity.google_iam_workload_identity_pool.github',
  'module.workload_identity.google_iam_workload_identity_pool_provider.github',
  'module.workload_identity.google_service_account_iam_member.github_impersonation',
]);

const raw = readFileSync(planPath, 'utf8').replace(/^\uFEFF/u, '');
const plan = JSON.parse(raw);
const violations = [];
const counts = { create: 0, noOp: 0, update: 0, delete: 0, other: 0 };

if (!Array.isArray(plan.resource_changes)) {
  violations.push('Terraform plan must contain resource_changes.');
}

for (const resource of plan.resource_changes ?? []) {
  const actions = resource.change?.actions ?? [];
  const key = actions.join(',');

  if (!allowedAddresses.has(resource.address)) {
    violations.push(`Unexpected bootstrap resource: ${resource.address}`);
  }

  if (key === 'create') counts.create += 1;
  else if (key === 'no-op') counts.noOp += 1;
  else if (actions.includes('delete')) counts.delete += 1;
  else if (actions.includes('update')) counts.update += 1;
  else counts.other += 1;

  if (!['create', 'no-op'].includes(key)) {
    violations.push(`Bootstrap action must be create or no-op: ${resource.address} (${key})`);
  }
}

if (counts.create + counts.noOp !== allowedAddresses.size) {
  violations.push(
    `Bootstrap plan must account for exactly ${allowedAddresses.size} approved resources; observed ${counts.create + counts.noOp}.`,
  );
}

const secretPatterns = [
  /mongodb(?:\+srv)?:\/\//iu,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/u,
  /"(?:password|secretValue|token)"\s*:/iu,
];
for (const pattern of secretPatterns) {
  if (pattern.test(raw))
    violations.push(`Plan contains forbidden secret material: ${pattern.source}`);
}

const report = {
  schemaVersion: 1,
  phase: '08',
  recordType: 'PRODUCTION_BOOTSTRAP_PLAN_POLICY',
  status: violations.length === 0 ? 'PASS' : 'FAIL',
  expectedResourceCount: allowedAddresses.size,
  counts,
  planSha256: `sha256:${createHash('sha256').update(raw).digest('hex')}`,
  violations,
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

if (violations.length > 0) {
  throw new Error(
    `Phase 08 Production bootstrap plan policy failed with ${violations.length} violation(s).`,
  );
}

process.stdout.write(
  `${JSON.stringify({ event: 'phase-08.production_bootstrap.plan_passed', ...report })}\n`,
);
