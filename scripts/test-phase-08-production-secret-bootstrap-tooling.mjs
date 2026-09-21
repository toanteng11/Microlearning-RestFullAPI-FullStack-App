import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const temp = mkdtempSync(join(tmpdir(), 'phase-08-production-secret-bootstrap-'));
const checker = resolve('scripts/check-phase-08-production-secret-bootstrap-plan.mjs');
const project = 'microlearning-platform-502716';
const runtimeAccount = `ml-runtime-production@${project}.iam.gserviceaccount.com`;
const prerequisite = [
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
const secretIds = [
  'ml-production-access-token-secret',
  'ml-production-auth-identity-pepper',
  'ml-production-classroom-code-pepper',
  'ml-production-mongodb-uri',
];
const secretResources = secretIds.flatMap((secretId) => [
  `module.secret_contract.google_secret_manager_secret.this["${secretId}"]`,
  `module.secret_contract.google_secret_manager_secret_iam_member.accessor["${secretId}|serviceAccount:${runtimeAccount}"]`,
]);

const variables = {
  bootstrap_secret_containers: { value: 'true' },
  provision_service: { value: 'false' },
  provision_secret_containers: { value: 'false' },
  provision_monitoring: { value: 'false' },
};
const validPlan = {
  format_version: '1.2',
  variables,
  resource_changes: [
    ...prerequisite.map((address) => ({
      address,
      change: { actions: ['no-op'], before: {}, after: {} },
    })),
    ...secretResources.map((address) => ({
      address,
      change: { actions: ['create'], before: null, after: {} },
    })),
  ],
};

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

runCase('valid-create', validPlan, 'PASS');
runCase(
  'valid-no-op',
  {
    ...validPlan,
    resource_changes: validPlan.resource_changes.map((resource) => ({
      ...resource,
      change: { actions: ['no-op'], before: {}, after: {} },
    })),
  },
  'PASS',
);
runCase(
  'missing-prerequisite',
  { ...validPlan, resource_changes: validPlan.resource_changes.slice(1) },
  'FAIL',
  'exactly 22 approved resources',
);
runCase(
  'prerequisite-create',
  {
    ...validPlan,
    resource_changes: validPlan.resource_changes.map((resource, index) =>
      index === 0
        ? { ...resource, change: { actions: ['create'], before: null, after: {} } }
        : resource,
    ),
  },
  'FAIL',
  'Prerequisite bootstrap resource must be no-op',
);
runCase(
  'unexpected-service',
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
  'Unexpected secret-bootstrap resource',
);
runCase(
  'destructive-secret',
  {
    ...validPlan,
    resource_changes: validPlan.resource_changes.map((resource, index) =>
      index === prerequisite.length
        ? { ...resource, change: { actions: ['delete'], before: {}, after: null } }
        : resource,
    ),
  },
  'FAIL',
  'Secret-bootstrap action must be create or no-op',
);
runCase(
  'service-flag-enabled',
  {
    ...validPlan,
    variables: { ...variables, provision_service: { value: 'true' } },
  },
  'FAIL',
  'provision_service must equal false',
);
runCase(
  'secret-material',
  { ...validPlan, variables: { ...variables, database: { value: 'mongodb+srv://forbidden' } } },
  'FAIL',
  'forbidden secret material',
);

const runner = readFileSync('scripts/invoke-phase-08-production-secret-bootstrap.ps1', 'utf8');
assert.match(runner, /APPLY_PHASE_08_PRODUCTION_SECRET_CONTAINERS/u);
assert.match(runner, /provision_service=false/u);
assert.match(runner, /provision_secret_containers=false/u);
assert.match(runner, /bootstrap_secret_containers=true/u);
assert.match(runner, /provision_monitoring=false/u);
assert.match(runner, /branch -ne 'main'/u);
assert.match(runner, /HEAD to equal the fetched origin\/main/u);
assert.match(runner, /Get-NativeText -Command git -Arguments/u);
assert.match(runner, /secretVersionsCreated = \$false/u);
assert.match(runner, /secretValuesRead = \$false/u);
assert.doesNotMatch(runner, /secrets versions add/u);
assert.doesNotMatch(runner, /secrets versions access/u);

process.stdout.write(
  `${JSON.stringify({ event: 'phase-08.production_secret_bootstrap_tooling.tests_passed', cases: 8 })}\n`,
);
