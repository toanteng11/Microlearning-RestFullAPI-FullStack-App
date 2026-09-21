import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const planPath = resolve(
  process.argv[2] ?? 'artifacts/phase-08/production-secret-bootstrap/plan.json',
);
const reportPath = resolve(
  process.argv[3] ?? 'artifacts/phase-08/production-secret-bootstrap/policy-report.json',
);

const project = 'microlearning-platform-502716';
const runtimeAccount = `ml-runtime-production@${project}.iam.gserviceaccount.com`;
const secretIds = [
  'ml-production-access-token-secret',
  'ml-production-auth-identity-pepper',
  'ml-production-classroom-code-pepper',
  'ml-production-mongodb-uri',
];

const prerequisiteAddresses = new Set([
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

const secretAddresses = new Set(
  secretIds.flatMap((secretId) => [
    `module.secret_contract.google_secret_manager_secret.this["${secretId}"]`,
    `module.secret_contract.google_secret_manager_secret_iam_member.accessor["${secretId}|serviceAccount:${runtimeAccount}"]`,
  ]),
);
const approvedAddresses = new Set([...prerequisiteAddresses, ...secretAddresses]);

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

  if (!approvedAddresses.has(resource.address)) {
    violations.push(`Unexpected secret-bootstrap resource: ${resource.address}`);
  }
  if (prerequisiteAddresses.has(resource.address) && key !== 'no-op') {
    violations.push(`Prerequisite bootstrap resource must be no-op: ${resource.address} (${key})`);
  }
  if (secretAddresses.has(resource.address) && !['create', 'no-op'].includes(key)) {
    violations.push(
      `Secret-bootstrap action must be create or no-op: ${resource.address} (${key})`,
    );
  }

  if (key === 'create') counts.create += 1;
  else if (key === 'no-op') counts.noOp += 1;
  else if (actions.includes('delete')) counts.delete += 1;
  else if (actions.includes('update')) counts.update += 1;
  else counts.other += 1;
}

if (counts.create + counts.noOp !== approvedAddresses.size) {
  violations.push(
    `Secret-bootstrap plan must account for exactly ${approvedAddresses.size} approved resources; observed ${counts.create + counts.noOp}.`,
  );
}
if (counts.create > secretAddresses.size) {
  violations.push(`Secret-bootstrap plan may create at most ${secretAddresses.size} resources.`);
}

const expectedVariables = {
  bootstrap_secret_containers: true,
  provision_service: false,
  provision_secret_containers: false,
  provision_monitoring: false,
};
for (const [name, expected] of Object.entries(expectedVariables)) {
  const actual = plan.variables?.[name]?.value;
  if (actual !== expected && actual !== String(expected)) {
    violations.push(`Terraform variable ${name} must equal ${expected}.`);
  }
}

const secretPatterns = [
  /mongodb(?:\+srv)?:\/\//iu,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/u,
  /"(?:password|secretValue|token)"\s*:/iu,
];
for (const pattern of secretPatterns) {
  if (pattern.test(raw)) {
    violations.push(`Plan contains forbidden secret material: ${pattern.source}`);
  }
}

const report = {
  schemaVersion: 1,
  phase: '08',
  recordType: 'PRODUCTION_SECRET_BOOTSTRAP_PLAN_POLICY',
  status: violations.length === 0 ? 'PASS' : 'FAIL',
  expectedPrerequisiteNoOpCount: prerequisiteAddresses.size,
  expectedSecretResourceCount: secretAddresses.size,
  expectedResourceCount: approvedAddresses.size,
  counts,
  planSha256: `sha256:${createHash('sha256').update(raw).digest('hex')}`,
  violations,
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

if (violations.length > 0) {
  throw new Error(
    `Phase 08 Production secret-bootstrap plan policy failed with ${violations.length} violation(s).`,
  );
}

process.stdout.write(
  `${JSON.stringify({ event: 'phase-08.production_secret_bootstrap.plan_passed', ...report })}\n`,
);
