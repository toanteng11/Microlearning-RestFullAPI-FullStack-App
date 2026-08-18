import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const options = process.argv.slice(2).reduce(
  (result, argument) => {
    const separator = argument.indexOf('=');
    const key = separator >= 0 ? argument.slice(0, separator) : argument;
    const value = separator >= 0 ? argument.slice(separator + 1) : '';
    if (key === '--account') result.accounts.push(value);
    else result[key.replace(/^--/, '')] = value;
    return result;
  },
  { accounts: [] },
);

const project = options.project;
const deployer = options.deployer;
const runtime = options.runtime;
const outputPath = resolve(
  options.output ?? 'artifacts/phase-07/identity/identity-diagnostic.json',
);
const gcloud = process.platform === 'win32' ? 'gcloud.cmd' : 'gcloud';

if (!project || !deployer || !runtime || options.accounts.length === 0) {
  throw new Error(
    'Usage: node scripts/verify-gcp-identity.mjs --project=<id> --deployer=<email> --runtime=<email> --account=<email> [--account=<email>] [--output=<path>]',
  );
}

function gcloudJson(args) {
  const result = spawnSync(gcloud, [...args, '--format=json'], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    shell: process.platform === 'win32',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || `gcloud ${args.join(' ')} failed.`);
  return JSON.parse(result.stdout || 'null');
}

const projectDescription = gcloudJson(['projects', 'describe', project]);
const projectPolicy = gcloudJson(['projects', 'get-iam-policy', project]);
const accountResults = options.accounts.map((email) => {
  const keys = gcloudJson(['iam', 'service-accounts', 'keys', 'list', '--iam-account', email]);
  const userManagedKeys = (keys ?? []).filter((key) => key.keyType === 'USER_MANAGED');
  return { email, userManagedKeyCount: userManagedKeys.length };
});

const rolesFor = (email) =>
  (projectPolicy.bindings ?? [])
    .filter((binding) => (binding.members ?? []).includes(`serviceAccount:${email}`))
    .map((binding) => binding.role)
    .sort();
const deployerRoles = rolesFor(deployer);
const runtimeRoles = rolesFor(runtime);
const forbiddenDeployerRoles = deployerRoles.filter((role) =>
  [
    'roles/editor',
    'roles/owner',
    'roles/secretmanager.admin',
    'roles/secretmanager.secretAccessor',
    'roles/secretmanager.secretVersionAdder',
  ].includes(role),
);
const forbiddenRuntimeRoles = runtimeRoles.filter(
  (role) =>
    role.startsWith('roles/artifactregistry.') ||
    role.startsWith('roles/iam.') ||
    role === 'roles/run.admin' ||
    role === 'roles/run.developer',
);
const violations = [];

for (const account of accountResults) {
  if (account.userManagedKeyCount > 0) {
    violations.push(`${account.email} has ${account.userManagedKeyCount} user-managed key(s).`);
  }
}
if (forbiddenDeployerRoles.length > 0) {
  violations.push(`Deployer has forbidden broad roles: ${forbiddenDeployerRoles.join(', ')}.`);
}
if (forbiddenRuntimeRoles.length > 0) {
  violations.push(`Runtime has deployment/IAM roles: ${forbiddenRuntimeRoles.join(', ')}.`);
}

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  project: {
    projectId: projectDescription.projectId,
    projectNumber: String(projectDescription.projectNumber),
    lifecycleState: projectDescription.lifecycleState,
  },
  accounts: accountResults,
  roleSummary: {
    deployer: { email: deployer, roles: deployerRoles },
    runtime: { email: runtime, roles: runtimeRoles },
  },
  status: violations.length === 0 ? 'PASS' : 'FAIL',
  violations,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

if (violations.length > 0) {
  throw new Error(`GCP identity diagnostics failed. Report: ${outputPath}`);
}

process.stdout.write(
  `${JSON.stringify({ event: 'gcp.identity.diagnostic_passed', outputPath, accounts: accountResults.length })}\n`,
);
