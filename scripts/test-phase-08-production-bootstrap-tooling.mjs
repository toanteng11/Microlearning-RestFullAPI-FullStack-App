import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const temp = mkdtempSync(join(tmpdir(), 'phase-08-production-bootstrap-'));
const checker = resolve('scripts/check-phase-08-production-bootstrap-plan.mjs');
const allowed = [
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
];

function runCase(name, plan, expectedStatus, expectedMessage = '') {
  const planPath = join(temp, `${name}.json`);
  const reportPath = join(temp, `${name}-report.json`);
  writeFileSync(planPath, JSON.stringify(plan), 'utf8');
  const result = spawnSync(process.execPath, [checker, planPath, reportPath], { encoding: 'utf8' });
  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  assert.equal(report.status, expectedStatus, `${name}: ${result.stderr}`);
  if (expectedStatus === 'PASS') assert.equal(result.status, 0, result.stderr);
  else {
    assert.notEqual(result.status, 0);
    assert.ok(report.violations.some((violation) => violation.includes(expectedMessage)));
  }
}

const validPlan = {
  format_version: '1.2',
  resource_changes: allowed.map((address) => ({
    address,
    change: { actions: ['create'], before: null, after: {} },
  })),
};

runCase('valid', validPlan, 'PASS');
runCase(
  'unexpected-cloud-run',
  {
    ...validPlan,
    resource_changes: [
      ...validPlan.resource_changes.slice(0, -1),
      {
        address: 'module.cloud_run_service.google_cloud_run_v2_service.this[0]',
        change: { actions: ['create'], before: null, after: {} },
      },
    ],
  },
  'FAIL',
  'Unexpected bootstrap resource',
);
runCase(
  'destructive-change',
  {
    ...validPlan,
    resource_changes: validPlan.resource_changes.map((resource, index) =>
      index === 0
        ? { ...resource, change: { actions: ['delete'], before: {}, after: null } }
        : resource,
    ),
  },
  'FAIL',
  'must be create or no-op',
);
runCase(
  'secret-material',
  { ...validPlan, variables: { database: { value: 'mongodb+srv://forbidden.invalid' } } },
  'FAIL',
  'forbidden secret material',
);

const runner = readFileSync('scripts/invoke-phase-08-production-bootstrap.ps1', 'utf8');
assert.match(runner, /APPLY_PHASE_08_PRODUCTION_BOOTSTRAP/u);
assert.match(runner, /provision_service=false/u);
assert.match(runner, /provision_secret_containers=false/u);
assert.match(runner, /provision_monitoring=false/u);
assert.match(runner, /branch -ne 'main'/u);
assert.match(runner, /HEAD to equal the fetched origin\/main/u);
assert.match(runner, /GCP_WORKLOAD_IDENTITY_PROVIDER_PRODUCTION/u);
assert.match(runner, /secretValuesRead = \$false/u);
assert.doesNotMatch(runner, /secrets versions access/u);

process.stdout.write(
  `${JSON.stringify({ event: 'phase-08.production_bootstrap_tooling.tests_passed', cases: 7 })}\n`,
);
