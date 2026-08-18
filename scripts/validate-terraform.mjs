import { spawnSync } from 'node:child_process';

const roots = [
  'infrastructure/terraform/bootstrap',
  'infrastructure/terraform/environments/staging',
  'infrastructure/terraform/environments/production',
];

function run(command, args) {
  const result = spawnSync(command, args, {
    env: { ...process.env, TF_IN_AUTOMATION: 'true' },
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with code ${result.status}.`);
  }
}

run('terraform', ['fmt', '-check', '-recursive', 'infrastructure/terraform']);
for (const root of roots) {
  run('terraform', ['-chdir=' + root, 'init', '-backend=false', '-input=false']);
  run('terraform', ['-chdir=' + root, 'validate']);
}
run(process.execPath, ['scripts/test-terraform-policy.mjs']);
run(process.execPath, ['scripts/test-release-contract.mjs']);
run(process.execPath, ['scripts/test-cd-contract.mjs']);
run(process.execPath, ['scripts/verify-runtime-config-contract.mjs']);
run(process.execPath, ['scripts/scan-terraform-config.mjs']);

process.stdout.write(`${JSON.stringify({ event: 'terraform.validation.completed', roots })}\n`);
