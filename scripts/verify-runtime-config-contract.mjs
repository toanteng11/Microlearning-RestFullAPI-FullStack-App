import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname.replace(/^\/(.:\/)/, '$1'));
const environmentSource = readFileSync(
  resolve(root, 'apps/api/src/shared/config/environment.ts'),
  'utf8',
);
const stagingSource = readFileSync(
  resolve(root, 'infrastructure/terraform/environments/staging/main.tf'),
  'utf8',
);
const secretModuleSource = readFileSync(
  resolve(root, 'infrastructure/terraform/modules/secret-containers/main.tf'),
  'utf8',
);
const secretVersionScript = readFileSync(resolve(root, 'scripts/add-secret-version.ps1'), 'utf8');

const explicitArrayPattern =
  /const phase(?:Four|Five|Six|Seven)ExplicitProductionFields = \[([\s\S]*?)\] as const;/gu;
const explicitFields = new Set();
for (const match of environmentSource.matchAll(explicitArrayPattern)) {
  for (const field of match[1].matchAll(/'([A-Z][A-Z0-9_]*)'/gu)) explicitFields.add(field[1]);
}

const missingMappings = [...explicitFields].filter(
  (field) => !new RegExp(`\\b${field}\\s*=`, 'u').test(stagingSource),
);
if (missingMappings.length > 0) {
  throw new Error(
    `Terraform Staging is missing explicit runtime fields: ${missingMappings.join(', ')}`,
  );
}

const requiredSecretIds = [
  'ml-staging-mongodb-uri',
  'ml-staging-access-token-secret',
  'ml-staging-auth-identity-pepper',
  'ml-staging-classroom-code-pepper',
  'ml-staging-seed-demo-password',
];
const missingSecrets = requiredSecretIds.filter((secretId) => !stagingSource.includes(secretId));
if (missingSecrets.length > 0) {
  throw new Error(`Terraform Staging is missing secret containers: ${missingSecrets.join(', ')}`);
}
if (stagingSource.match(/version\s*=\s*"latest"/u)) {
  throw new Error('Cloud Run secret references must not use latest.');
}
if (secretModuleSource.includes('google_secret_manager_secret_version')) {
  throw new Error('Terraform must not manage Secret Manager payload versions.');
}
if (
  !secretVersionScript.includes('Read-Host "Enter a new value for $SecretId" -AsSecureString') ||
  !secretVersionScript.includes('--data-file=-') ||
  secretVersionScript.includes('Set-Content')
) {
  throw new Error(
    'Secret version script must use secure prompt and stdin without temporary files.',
  );
}

process.stdout.write(
  `${JSON.stringify({
    event: 'runtime.config.contract_verified',
    explicitFieldCount: explicitFields.size,
    secretContainerCount: requiredSecretIds.length,
    secretPayloadsInTerraform: false,
    exactSecretVersionsRequired: true,
  })}\n`,
);
