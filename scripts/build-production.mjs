import { spawnSync } from 'node:child_process';

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('build-production.mjs must be run through an npm script');

function run(args, options = {}) {
  const result = spawnSync(process.execPath, [npmCli, ...args], {
    stdio: 'inherit',
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`npm ${args.join(' ')} failed with code ${result.status}`);
}

run(['run', 'build', '--workspace', '@microlearning/web'], {
  env: { ...process.env, VITE_API_BASE_URL: '' },
});
run(['run', 'verify:web-bundle']);
run(['run', 'build', '--workspace', '@microlearning/api']);
