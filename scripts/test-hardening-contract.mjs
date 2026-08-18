import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];

function read(relativePath) {
  const path = join(root, relativePath);
  if (!existsSync(path)) {
    failures.push(`${relativePath} is missing.`);
    return '';
  }
  return readFileSync(path, 'utf8');
}

function requireText(text, pattern, message) {
  if (!pattern.test(text)) failures.push(message);
}

function allFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === '.terraform' || entry.name === '.git') return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? allFiles(path) : [path];
  });
}

const dockerfile = read('Dockerfile');
requireText(dockerfile, /^USER node$/mu, 'Production image must run as the non-root node user.');
requireText(dockerfile, /^HEALTHCHECK/mu, 'Production image must declare a health check.');
if (/npm run dev|COPY .*\.env|COPY .*\.git/iu.test(dockerfile)) {
  failures.push(
    'Production Dockerfile must not run development scripts or copy local secrets/source metadata.',
  );
}

const ci = read('.github/workflows/ci.yml');
requireText(ci, /Secret scan/iu, 'CI must contain the required Secret scan job.');
requireText(ci, /npm run check:ci/iu, 'CI must execute the repository check:ci gate.');
requireText(ci, /Production container/iu, 'CI must retain the production container gate.');

const promotion = read('.github/workflows/promote-production.yml');
requireText(promotion, /workflow_dispatch:/u, 'Production promotion must be manual-only.');
requireText(
  promotion,
  /environment:\s*production/u,
  'Production promotion must use the protected production environment.',
);
requireText(promotion, /PLAN_ONLY/u, 'Phase 07 production promotion must be plan-only.');
requireText(
  promotion,
  /PROMOTE_PRODUCTION/u,
  'Production promotion must require the explicit confirmation phrase.',
);
if (
  /terraform\s+apply/iu.test(promotion) ||
  /gcloud\s+run\s+services\s+update-traffic/iu.test(promotion)
) {
  failures.push(
    'Phase 07 promotion workflow must not execute a Production apply or traffic change.',
  );
}

const productionTerraform = read('infrastructure/terraform/environments/production/main.tf');
if ((productionTerraform.match(/provision\s*=\s*false/gu) ?? []).length < 3) {
  failures.push(
    'Production Terraform must keep Cloud Run, secret and monitoring provisioning disabled in Phase 07.',
  );
}

const terraformFiles = allFiles(join(root, 'infrastructure/terraform')).filter((path) =>
  /\.(tf|tfvars|hcl)$/u.test(path),
);
for (const path of terraformFiles) {
  const content = readFileSync(path, 'utf8');
  if (/google_service_account_key/iu.test(content))
    failures.push(`Service-account key resource found in ${path}.`);
}

const gitignore = read('.gitignore');
for (const entry of ['.env', 'artifacts/', '*.tfstate', 'gha-creds']) {
  if (!gitignore.includes(entry)) failures.push(`.gitignore must protect ${entry}.`);
}

const workflowFiles = allFiles(join(root, '.github/workflows'));
const unpinnedActions = workflowFiles.filter((path) => {
  const content = readFileSync(path, 'utf8');
  return /uses:\s*(actions|google-github-actions|hashicorp)\/[\w-]+@v(?!\d)/iu.test(content);
});
if (unpinnedActions.length)
  failures.push(`Workflow actions must be pinned to immutable SHAs: ${unpinnedActions.join(', ')}`);

read('scripts/scan-e2e-artifacts.mjs');
read('scripts/scan-terraform-config.mjs');
const handoff = read('docs/implementation/phase-07/phase-08-handoff.md');
requireText(handoff, /NO_GO/iu, 'Phase 08 handoff must preserve the Production NO_GO conditions.');

if (failures.length) {
  throw new Error(`Hardening contract failed:\n- ${failures.join('\n- ')}`);
}

process.stdout.write(
  `${JSON.stringify({ event: 'phase-07.hardening.contract', status: 'PASS' })}\n`,
);
