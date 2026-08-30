import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const planPath = resolve(process.argv[2] ?? 'artifacts/phase-07/terraform/plan.json');
const reportPath = resolve(
  process.argv[3] ?? 'artifacts/phase-07/terraform/plan-policy-report.json',
);
const expectedEnvironment = process.env.EXPECTED_TERRAFORM_ENV?.trim();
const allowPublicCloudRunInvoker = process.env.ALLOW_PUBLIC_CLOUD_RUN_INVOKER === 'true';
const secretCanary = process.env.TF_SECRET_CANARY;
const immutableImagePattern =
  /^[a-z0-9-]+-docker\.pkg\.dev\/[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+@sha256:[a-f0-9]{64}$/;
const publicMembers = new Set(['allUsers', 'allAuthenticatedUsers']);
const stagingHealthUptimeAddress =
  'module.monitoring_contract.google_monitoring_uptime_check_config.health[0]';
const legacyStagingCanonicalHost = 'microlearning-staging-759791798260.asia-southeast1.run.app';
const currentStagingCanonicalHost = 'microlearning-staging-bu73wlfj5a-as.a.run.app';

if (!existsSync(planPath)) throw new Error(`Terraform plan JSON not found: ${planPath}`);

const rawPlan = readFileSync(planPath, 'utf8');
const plan = JSON.parse(rawPlan);
const violations = [];

function addViolation(code, address, detail) {
  violations.push({ code, address, detail });
}

function firstBlock(value) {
  return Array.isArray(value) ? value[0] : value;
}

function isStagingHealthUptimeCheck(config, expectedHost) {
  const httpCheck = firstBlock(config?.http_check);
  const monitoredResource = firstBlock(config?.monitored_resource);

  return (
    config?.display_name === 'microlearning-staging-health' &&
    httpCheck?.path === '/health' &&
    httpCheck?.port === 443 &&
    httpCheck?.use_ssl === true &&
    httpCheck?.validate_ssl === true &&
    monitoredResource?.type === 'uptime_url' &&
    monitoredResource?.labels?.host === expectedHost
  );
}

function isApprovedStagingHealthUptimeReplacement(resource, actions) {
  const before = resource.change?.before;
  const after = resource.change?.after;

  return (
    expectedEnvironment === 'staging' &&
    resource.type === 'google_monitoring_uptime_check_config' &&
    resource.address === stagingHealthUptimeAddress &&
    actions.length === 2 &&
    actions[0] === 'delete' &&
    actions[1] === 'create' &&
    isStagingHealthUptimeCheck(before, legacyStagingCanonicalHost) &&
    isStagingHealthUptimeCheck(after, currentStagingCanonicalHost)
  );
}

function visit(value, callback, path = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => visit(entry, callback, [...path, String(index)]));
    return;
  }
  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, entry]) => {
      callback(key, entry, [...path, key]);
      visit(entry, callback, [...path, key]);
    });
  }
}

if (secretCanary && rawPlan.includes(secretCanary)) {
  addViolation(
    'SECRET_CANARY_PRESENT',
    'plan',
    'A configured secret canary is present in plan JSON.',
  );
}

for (const resource of plan.resource_changes ?? []) {
  const address = resource.address ?? resource.type ?? 'unknown';
  const actions = resource.change?.actions ?? [];
  const after = resource.change?.after;
  const approvedStagingHealthUptimeReplacement = isApprovedStagingHealthUptimeReplacement(
    resource,
    actions,
  );
  const approvedPublicInvoker =
    allowPublicCloudRunInvoker &&
    expectedEnvironment === 'staging' &&
    resource.type === 'google_cloud_run_v2_service_iam_member' &&
    after?.role === 'roles/run.invoker' &&
    after?.member === 'allUsers' &&
    after?.name?.endsWith('microlearning-staging');

  if (actions.includes('delete') && !approvedStagingHealthUptimeReplacement) {
    addViolation('DESTRUCTIVE_CHANGE', address, `Plan actions are ${actions.join(',')}.`);
  }
  if (resource.type === 'google_service_account_key') {
    addViolation(
      'SERVICE_ACCOUNT_KEY',
      address,
      'Long-lived service-account key resources are forbidden.',
    );
  }
  if (resource.type === 'google_secret_manager_secret_version') {
    addViolation(
      'SECRET_VALUE_IN_TERRAFORM',
      address,
      'Terraform must not manage secret payload versions.',
    );
  }

  visit(after, (key, value, path) => {
    if (typeof value === 'string' && publicMembers.has(value) && !approvedPublicInvoker) {
      addViolation('PUBLIC_IAM_MEMBER', address, `Public IAM member at ${path.join('.')}.`);
    }
    if (
      typeof value === 'string' &&
      /(^|_)(image|image_ref)$/.test(key) &&
      value.includes('-docker.pkg.dev/') &&
      !immutableImagePattern.test(value)
    ) {
      addViolation(
        'MUTABLE_IMAGE_REFERENCE',
        address,
        `Mutable image reference at ${path.join('.')}.`,
      );
    }
    if (
      expectedEnvironment === 'staging' &&
      typeof value === 'string' &&
      [
        'account_id',
        'environment',
        'name',
        'resource_prefix',
        'secret_id',
        'service_name',
      ].includes(key) &&
      value.toLowerCase().includes('production')
    ) {
      addViolation('CROSS_ENVIRONMENT_MUTATION', address, `Production value at ${path.join('.')}.`);
    }
  });
}

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  planPath,
  expectedEnvironment: expectedEnvironment ?? null,
  allowPublicCloudRunInvoker,
  resourceChangeCount: (plan.resource_changes ?? []).length,
  violationCount: violations.length,
  status: violations.length === 0 ? 'PASS' : 'FAIL',
  violations,
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

if (violations.length > 0) {
  throw new Error(
    `Terraform plan policy failed with ${violations.length} violation(s). Report: ${reportPath}`,
  );
}

process.stdout.write(
  `${JSON.stringify({ event: 'terraform.plan.policy_passed', reportPath, resources: report.resourceChangeCount })}\n`,
);
