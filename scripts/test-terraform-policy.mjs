import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(new URL('..', import.meta.url).pathname.replace(/^\/(.:\/)/, '$1'));
const checker = resolve(root, 'scripts/check-terraform-plan.mjs');
const temp = mkdtempSync(join(tmpdir(), 'microlearning-terraform-policy-'));
const digestRef =
  'asia-southeast1-docker.pkg.dev/microlearning-platform-502716/microlearning/microlearning-app@sha256:' +
  'a'.repeat(64);
const publicInvokerAddress =
  'module.cloud_run_service.google_cloud_run_v2_service_iam_member.public_invoker[0]';

function resource(type, actions, after = {}, address = `test.${type}`, before = null) {
  return { address, mode: 'managed', type, change: { actions, before, after } };
}

function stagingHealthUptimeCheck(host) {
  return {
    display_name: 'microlearning-staging-health',
    http_check: [{ path: '/health', port: 443, use_ssl: true, validate_ssl: true }],
    monitored_resource: [{ type: 'uptime_url', labels: { host } }],
  };
}

function execute(name, resources, expectedStatus, options = {}) {
  const planPath = join(temp, `${name}.json`);
  const reportPath = join(temp, `${name}.report.json`);
  const plan = { format_version: '1.2', resource_changes: resources };
  if (options.canary) plan.canary = options.canary;
  writeFileSync(planPath, JSON.stringify(plan));
  const result = spawnSync(process.execPath, [checker, planPath, reportPath], {
    encoding: 'utf8',
    env: {
      ...process.env,
      EXPECTED_TERRAFORM_ENV: options.environment ?? 'staging',
      TF_SECRET_CANARY: options.canary ?? '',
      ALLOW_PUBLIC_CLOUD_RUN_INVOKER: options.allowPublicInvoker ? 'true' : 'false',
    },
  });
  if (result.status !== expectedStatus) {
    throw new Error(
      `${name} returned ${result.status}; expected ${expectedStatus}.\n${result.stdout}\n${result.stderr}`,
    );
  }
}

try {
  execute(
    'safe-digest',
    [resource('google_cloud_run_v2_service', ['create'], { image: digestRef })],
    0,
  );
  execute('destroy', [resource('google_cloud_run_v2_service', ['delete'], {})], 1);
  execute('replace', [resource('google_service_account', ['delete', 'create'], {})], 1);
  execute(
    'approved-staging-health-uptime-host-replacement',
    [
      resource(
        'google_monitoring_uptime_check_config',
        ['delete', 'create'],
        stagingHealthUptimeCheck('microlearning-staging-bu73wlfj5a-as.a.run.app'),
        'module.monitoring_contract.google_monitoring_uptime_check_config.health[0]',
        stagingHealthUptimeCheck('microlearning-staging-759791798260.asia-southeast1.run.app'),
      ),
    ],
    0,
  );
  execute(
    'unapproved-staging-health-uptime-host-replacement',
    [
      resource(
        'google_monitoring_uptime_check_config',
        ['delete', 'create'],
        stagingHealthUptimeCheck('microlearning-staging-bu73wlfj5a-as.a.run.app'),
        'module.monitoring_contract.google_monitoring_uptime_check_config.health[0]',
        stagingHealthUptimeCheck('unexpected-host.example.com'),
      ),
    ],
    1,
  );
  execute(
    'public-iam',
    [resource('google_project_iam_member', ['create'], { member: 'allUsers' })],
    1,
  );
  execute(
    'approved-cloud-run-public-invoker',
    [
      resource(
        'google_cloud_run_v2_service_iam_member',
        ['create'],
        {
          name: 'microlearning-staging',
          role: 'roles/run.invoker',
          member: 'allUsers',
        },
        publicInvokerAddress,
      ),
    ],
    0,
    { allowPublicInvoker: true },
  );
  execute(
    'approved-production-cloud-run-public-invoker',
    [
      resource(
        'google_cloud_run_v2_service_iam_member',
        ['create'],
        {
          name: 'projects/microlearning-platform-502716/locations/asia-southeast1/services/microlearning-production',
          role: 'roles/run.invoker',
          member: 'allUsers',
        },
        publicInvokerAddress,
      ),
    ],
    0,
    { environment: 'production', allowPublicInvoker: true },
  );
  execute(
    'approved-cloud-run-public-invoker-with-computed-name',
    [
      resource(
        'google_cloud_run_v2_service_iam_member',
        ['create'],
        {
          name: null,
          role: 'roles/run.invoker',
          member: 'allUsers',
        },
        publicInvokerAddress,
      ),
    ],
    0,
    { allowPublicInvoker: true },
  );
  execute(
    'production-public-invoker-without-approval',
    [
      resource('google_cloud_run_v2_service_iam_member', ['create'], {
        name: 'microlearning-production',
        role: 'roles/run.invoker',
        member: 'allUsers',
      }),
    ],
    1,
    { environment: 'production' },
  );
  execute(
    'wrong-service-public-invoker',
    [
      resource(
        'google_cloud_run_v2_service_iam_member',
        ['create'],
        {
          name: 'unexpected-service',
          role: 'roles/run.invoker',
          member: 'allUsers',
        },
        publicInvokerAddress,
      ),
    ],
    1,
    { allowPublicInvoker: true },
  );
  execute(
    'wrong-address-public-invoker',
    [
      resource(
        'google_cloud_run_v2_service_iam_member',
        ['create'],
        {
          name: 'microlearning-staging',
          role: 'roles/run.invoker',
          member: 'allUsers',
        },
        'module.untrusted.google_cloud_run_v2_service_iam_member.public_invoker[0]',
      ),
    ],
    1,
    { allowPublicInvoker: true },
  );
  execute('service-account-key', [resource('google_service_account_key', ['create'], {})], 1);
  execute(
    'secret-version',
    [resource('google_secret_manager_secret_version', ['create'], { secret_data: 'redacted' })],
    1,
  );
  execute(
    'workload-identity-provider-update',
    [
      resource('google_iam_workload_identity_pool_provider', ['update'], {
        attribute_condition: "assertion.repository == 'owner/repository'",
      }),
    ],
    1,
  );
  execute(
    'workload-identity-pool-create',
    [resource('google_iam_workload_identity_pool', ['create'], {})],
    1,
  );
  execute(
    'workload-identity-provider-no-op',
    [resource('google_iam_workload_identity_pool_provider', ['no-op'], {})],
    0,
  );
  execute(
    'mutable-image',
    [
      resource('google_cloud_run_v2_service', ['update'], {
        image:
          'asia-southeast1-docker.pkg.dev/microlearning-platform-502716/microlearning/microlearning-app:latest',
      }),
    ],
    1,
  );
  execute(
    'cross-environment',
    [
      resource('google_cloud_run_v2_service', ['create'], {
        service_name: 'microlearning-production',
      }),
    ],
    1,
  );
  execute(
    'production-cross-environment',
    [
      resource('google_secret_manager_secret', ['create'], {
        secret_id: 'ml-staging-mongodb-uri',
      }),
    ],
    1,
    { environment: 'production' },
  );
  execute('secret-canary', [], 1, { canary: 'PHASE_07_STATE_CANARY_DO_NOT_STORE' });
} finally {
  rmSync(temp, { recursive: true, force: true });
}

process.stdout.write(`${JSON.stringify({ event: 'terraform.policy.tests_passed' })}\n`);
