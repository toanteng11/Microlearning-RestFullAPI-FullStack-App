import { readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

import { readJson } from './lib/phase-08-cli.mjs';
import { releaseIdentityFrom, sha256File } from './lib/phase-08-system-test.mjs';

const [identityPath, evidenceRootValue, outputPathValue] = process.argv.slice(2);
if (!identityPath || !evidenceRootValue || !outputPathValue) {
  throw new Error(
    'Usage: node scripts/create-phase-08-scan-summary.mjs <identity.json> <evidence-root> <output.json>',
  );
}

const identity = releaseIdentityFrom(readJson(identityPath, 'Phase 08 release identity').value);
const evidenceRoot = resolve(evidenceRootValue);
const outputPath = resolve(outputPathValue);
const files = [];

function collect(path) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) collect(child);
    else if (child !== outputPath && statSync(child).size > 0) {
      files.push({
        path: relative(evidenceRoot, child).replaceAll('\\', '/'),
        sha256: sha256File(child),
      });
    }
  }
}

collect(evidenceRoot);
const retentionDays = Number.parseInt(process.env.PHASE08_RETENTION_DAYS ?? '90', 10);
if (!Number.isInteger(retentionDays) || retentionDays <= 0) {
  throw new Error('PHASE08_RETENTION_DAYS must be a positive integer.');
}
const recordedAtUtc = new Date();
const expiresAtUtc = new Date(recordedAtUtc.getTime() + retentionDays * 86_400_000);
const checkInputs = [
  ['production-dependency-audit', 'npm run audit:production', 'PHASE08_DEPENDENCY_STATUS'],
  ['terraform-format', 'npm run terraform:fmt:check', 'PHASE08_TERRAFORM_FORMAT_STATUS'],
  ['terraform-security', 'npm run terraform:security', 'PHASE08_TERRAFORM_SECURITY_STATUS'],
  ['artifact-redaction', 'npm run e2e:artifacts:scan', 'PHASE08_REDACTION_STATUS'],
];
const checks = checkInputs.map(([name, command, environmentKey]) => {
  const status = process.env[environmentKey] ?? 'FAIL';
  if (!['PASS', 'FAIL'].includes(status)) {
    throw new Error(`${environmentKey} must equal PASS or FAIL.`);
  }
  return { name, command, status };
});
const report = {
  schemaVersion: 1,
  phase: '08',
  recordType: 'ARTIFACT_IAC_DEPENDENCY_SCAN',
  releaseId: identity.releaseId,
  actor: process.env.PHASE08_ACTOR ?? 'Phase 08 System Test workflow',
  recordedAtUtc: recordedAtUtc.toISOString(),
  retentionDays,
  expiresAtUtc: expiresAtUtc.toISOString(),
  redactionReviewed: true,
  checks,
  files,
  status: checks.every((check) => check.status === 'PASS') ? 'PASS' : 'FAIL',
};
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
process.stdout.write(
  `${JSON.stringify({ event: 'phase-08.scan_summary.created', files: files.length, status: report.status })}\n`,
);
if (report.status !== 'PASS') process.exitCode = 1;
